/**
 * Video Link Protection Utilities
 * 
 * Implements security measures to protect video streaming URLs from unauthorized access:
 * 1. Referrer checking - Ensures requests come from your domain
 * 2. Token-based authentication - Generates time-limited signed tokens
 * 3. IP-based rate limiting - Prevents abuse from single IPs
 */

import { createHash, randomBytes } from 'crypto';

// Secret key for signing tokens — MUST be set in production via VIDEO_SECRET env var
const VIDEO_SECRET = process.env.VIDEO_SECRET || '';

// Token expiration time (in seconds)
const TOKEN_EXPIRY = 3600; // 1 hour

/**
 * Generate a signed token for video access
 * @param videoId - Unique identifier for the video
 * @param userId - User ID (optional, for user-specific tokens)
 * @param expiresIn - Token expiration time in seconds (default: 1 hour)
 * @returns Signed token string
 */
export function generateVideoToken(
  videoId: string,
  userId?: string,
  expiresIn: number = TOKEN_EXPIRY
): string {
  const expiryTime = Math.floor(Date.now() / 1000) + expiresIn;
  const nonce = randomBytes(16).toString('hex');
  
  // Create payload
  const payload = {
    videoId,
    userId: userId || 'anonymous',
    exp: expiryTime,
    nonce,
  };
  
  // Create signature
  const dataToSign = `${payload.videoId}:${payload.userId}:${payload.exp}:${payload.nonce}`;
  const signature = createHash('sha256')
    .update(dataToSign + VIDEO_SECRET)
    .digest('hex');
  
  // Encode token
  const token = Buffer.from(JSON.stringify({ ...payload, sig: signature })).toString('base64url');
  
  return token;
}

/**
 * Verify a video access token
 * @param token - Token to verify
 * @returns Object with verification result and payload
 */
export function verifyVideoToken(token: string): {
  valid: boolean;
  payload?: any;
  error?: string;
} {
  try {
    // Decode token
    const decoded = JSON.parse(Buffer.from(token, 'base64url').toString());
    const { videoId, userId, exp, nonce, sig } = decoded;
    
    // Check expiration
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime > exp) {
      return { valid: false, error: 'Token expired' };
    }
    
    // Verify signature
    const dataToSign = `${videoId}:${userId}:${exp}:${nonce}`;
    const expectedSignature = createHash('sha256')
      .update(dataToSign + VIDEO_SECRET)
      .digest('hex');
    
    if (sig !== expectedSignature) {
      return { valid: false, error: 'Invalid signature' };
    }
    
    return {
      valid: true,
      payload: { videoId, userId, exp, nonce },
    };
  } catch (error) {
    return { valid: false, error: 'Invalid token format' };
  }
}

/**
 * Check if the request comes from an allowed referrer
 * @param referrer - Request referrer header
 * @param allowedDomains - List of allowed domains (default: your app domains)
 * @returns Boolean indicating if referrer is valid
 */
export function checkReferrer(
  referrer: string | null,
  allowedDomains: string[] = []
): boolean {
  // If no referrer, reject (prevents direct access)
  if (!referrer) {
    return false;
  }
  
  // Default allowed domains (add your production domains)
  const defaultAllowedDomains = [
    'localhost',
    '127.0.0.1',
    process.env.NEXT_PUBLIC_APP_DOMAIN || 'streamit.com',
    process.env.NEXT_PUBLIC_VERCEL_URL || '',
  ].filter(Boolean);
  
  const domainsToCheck = [...defaultAllowedDomains, ...allowedDomains];
  
  try {
    const referrerUrl = new URL(referrer);
    const referrerHost = referrerUrl.hostname;
    
    // Check if referrer matches any allowed domain
    return domainsToCheck.some(domain => 
      referrerHost === domain || referrerHost.endsWith(`.${domain}`)
    );
  } catch (error) {
    return false;
  }
}

/**
 * Rate limiting store (in-memory, use Redis in production)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Check rate limit for an IP address
 * @param ip - IP address to check
 * @param maxRequests - Maximum requests allowed per window
 * @param windowMs - Time window in milliseconds
 * @returns Object with allowed status and remaining requests
 */
export function checkRateLimit(
  ip: string,
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  
  // Clean up expired entries periodically
  if (Math.random() < 0.01) { // 1% chance to clean up
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }
  
  if (!record || now > record.resetTime) {
    // Create new record
    const resetTime = now + windowMs;
    rateLimitStore.set(ip, { count: 1, resetTime });
    return { allowed: true, remaining: maxRequests - 1, resetTime };
  }
  
  // Update existing record
  record.count++;
  
  if (record.count > maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }
  
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Get client IP address from request headers
 * @param headers - Request headers
 * @returns IP address string
 */
export function getClientIp(headers: Headers): string {
  // Check various headers that might contain the real IP
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  const cfConnectingIp = headers.get('cf-connecting-ip'); // Cloudflare
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  
  return 'unknown';
}

/**
 * Middleware function to protect video endpoints
 * Use this in your API routes that serve video content
 * Enforces referrer checking, rate limiting, and optional token verification.
 */
export async function protectVideoEndpoint(request: Request): Promise<{
  allowed: boolean;
  error?: string;
  userId?: string;
}> {
  const headers = request.headers;
  const url = new URL(request.url);
  
  // 1. Check referrer
  const referrer = headers.get('referer') || headers.get('referrer');
  if (!checkReferrer(referrer)) {
    return { allowed: false, error: 'Invalid referrer' };
  }
  
  // 2. Check rate limit
  const clientIp = getClientIp(headers);
  const rateLimit = checkRateLimit(clientIp);
  if (!rateLimit.allowed) {
    return { allowed: false, error: 'Rate limit exceeded' };
  }
  
  // 3. Token verification is optional — the /api/stream route 
  //    already requires server-side credentials. Token adds defense-in-depth.
  const token = url.searchParams.get('token');
  if (token) {
    const verification = verifyVideoToken(token);
    if (!verification.valid) {
      return { allowed: false, error: verification.error };
    }
    return {
      allowed: true,
      userId: verification.payload?.userId,
    };
  }

  // Allow requests without token if referrer and rate limit pass
  // (needed for /api/stream proxy which is already auth-gated)
  return { allowed: true };
}

/**
 * Generate a protected video URL
 * @param baseUrl - Base video URL
 * @param videoId - Video identifier
 * @param userId - User ID (optional)
 * @returns Protected URL with token
 */
export function generateProtectedVideoUrl(
  baseUrl: string,
  videoId: string,
  userId?: string
): string {
  const token = generateVideoToken(videoId, userId);
  const url = new URL(baseUrl);
  url.searchParams.set('token', token);
  return url.toString();
}
