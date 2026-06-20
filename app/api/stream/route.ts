import { NextRequest, NextResponse } from 'next/server';
import { protectVideoEndpoint } from '@/lib/video-protection';

/**
 * Validates that a URL belongs to a trusted video host.
 * Configure allowed hosts via the ALLOWED_VIDEO_HOSTS env var (comma-separated).
 * This prevents SSRF attacks where an attacker could use this proxy to reach
 * internal networks or arbitrary external services.
 */
function isAllowedVideoUrl(urlString: string): boolean {
  // Configurable allowlist via env var (comma-separated domains)
  const envHosts = process.env.ALLOWED_VIDEO_HOSTS || '';
  const allowedHosts = envHosts
    .split(',')
    .map(h => h.trim().toLowerCase())
    .filter(Boolean);

  console.log('isAllowedVideoUrl: Checking URL:', urlString);
  console.log('isAllowedVideoUrl: ALLOWED_VIDEO_HOSTS:', envHosts || '(not set)');

  // If no allowlist is configured, only block obviously dangerous targets
  // (private IPs, metadata endpoints, localhost). In production you should
  // set ALLOWED_VIDEO_HOSTS for a strict allowlist.
  try {
    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();
    
    console.log('isAllowedVideoUrl: Parsed hostname:', hostname);
    console.log('isAllowedVideoUrl: Protocol:', url.protocol);

    // Always block private/internal addresses
    const blockedPatterns = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^192\.168\./,
      /^169\.254\./,        // AWS metadata
      /^0\./,
      /^\[::1\]$/,          // IPv6 localhost
      /^metadata\./i,
      /^internal\./i,
    ];

    const matchedBlockedPattern = blockedPatterns.find(p => p.test(hostname));
    if (matchedBlockedPattern) {
      console.log('isAllowedVideoUrl: BLOCKED by pattern:', matchedBlockedPattern);
      return false;
    }

    // Block non-http(s) schemes
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      console.log('isAllowedVideoUrl: BLOCKED - invalid protocol:', url.protocol);
      return false;
    }

    // If an allowlist is configured, enforce it strictly
    if (allowedHosts.length > 0) {
      const allowed = allowedHosts.some(
        host => hostname === host || hostname.endsWith(`.${host}`)
      );
      console.log('isAllowedVideoUrl: Allowlist check result:', allowed);
      return allowed;
    }

    // No allowlist configured — allow (with blocked patterns filtered above)
    console.log('isAllowedVideoUrl: ALLOWED (no allowlist configured)');
    return true;
  } catch (error) {
    console.error('isAllowedVideoUrl: ERROR parsing URL:', error);
    return false;
  }
}
export async function GET(request: NextRequest) {
  try {
    // Apply protection middleware
    const protection = await protectVideoEndpoint(request);
    
    if (!protection.allowed) {
      console.error('Stream API: Protection denied:', protection.error);
      return NextResponse.json(
        { error: protection.error || 'Access denied' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const videoUrl = searchParams.get('url');
    const filename = searchParams.get('filename');

    if (!videoUrl) {
      console.error('Stream API: No video URL provided');
      return NextResponse.json({ error: 'Video URL is required' }, { status: 400 });
    }

    // SECURITY: Validate the URL against the allowlist to prevent SSRF
    if (!isAllowedVideoUrl(videoUrl)) {
      console.error('Stream API: Blocked request to non-allowed host');
      return NextResponse.json({ error: 'Invalid video source' }, { status: 403 });
    }

    console.log('Stream API: Processing URL:', videoUrl);

    // Use consistent environment variables with components
    const username = process.env.NEXT_PUBLIC_CADDY_USERNAME || process.env.CADDY_USERNAME || "mat";
    const password = process.env.NEXT_PUBLIC_CADDY_PASSWORD || process.env.CADDY_PASSWORD || "MatTh3pAR";

    const range = request.headers.get('range');
    const upstreamHeaders: Record<string, string> = {};

    // SECURITY: Only attach auth credentials when URL is on an allowed host
    if (username && password && isAllowedVideoUrl(videoUrl)) {
      const encodedCredentials = btoa(`${username}:${password}`);
      upstreamHeaders['Authorization'] = `Basic ${encodedCredentials}`;
    }

    if (range) {
      upstreamHeaders['Range'] = range;
    }

    console.log('Stream API: Fetching from upstream with auth');
    const videoResponse = await fetch(videoUrl, {
      headers: upstreamHeaders
    });

    if (!videoResponse.ok) {
      console.error('Stream API: Upstream fetch failed:', videoResponse.status, videoResponse.statusText);
      return NextResponse.json({
        error: 'Video fetch failed',
        status: videoResponse.status,
        statusText: videoResponse.statusText,
        url: videoUrl
      }, { status: videoResponse.status });
    }

    const contentType = videoResponse.headers.get('content-type') || 'video/mp4';
    const contentLength = videoResponse.headers.get('content-length');
    const contentRange = videoResponse.headers.get('content-range');
    const acceptRanges = videoResponse.headers.get('accept-ranges');

    const responseHeaders = new Headers({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Range, Content-Length, Content-Type'
    });

    // Set proper filename for downloads
    if (filename) {
      // Sanitize filename and ensure it has proper extension
      let cleanFilename = filename.replace(/[^a-zA-Z0-9\s\-_.]/g, '').trim();

      // If no extension, add .mp4 as default
      if (!cleanFilename.includes('.')) {
        cleanFilename += '.mp4';
      }

      responseHeaders.set('Content-Disposition', `attachment; filename="${cleanFilename}"`);
    }

    if (contentLength) {
      responseHeaders.set('Content-Length', contentLength);
    }

    if (contentRange) {
      responseHeaders.set('Content-Range', contentRange);
    }

    if (acceptRanges) {
      responseHeaders.set('Accept-Ranges', acceptRanges);
    } else {
      responseHeaders.set('Accept-Ranges', 'bytes');
    }

    console.log('Stream API: Successfully proxying video stream');
    return new NextResponse(videoResponse.body, {
      status: videoResponse.status,
      headers: responseHeaders
    });

  } catch (error) {
    console.error('Stream API: Internal error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function HEAD(request: NextRequest) {
  return GET(request);
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Range, Content-Length, Content-Type',
    },
  });
}