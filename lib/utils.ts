import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Redirect cookie functions for authentication flow
export function setRedirectCookie(path: string, maxAgeSeconds = 600) {
  // Validate that path is a valid relative path (starts with /)
  if (!path || typeof path !== 'string') {
    console.warn('Invalid redirect path:', path);
    return;
  }
  
  // Ensure path is relative (doesn't include domain)
  let validPath = path;
  try {
    // If it looks like a full URL, extract just the path
    if (path.startsWith('http://') || path.startsWith('https://')) {
      const url = new URL(path);
      validPath = url.pathname + url.search;
    }
  } catch (e) {
    console.warn('Could not parse redirect path:', path, e);
    return;
  }
  
  // Only set cookie for valid relative paths
  if (!validPath.startsWith('/')) {
    console.warn('Redirect path must be relative:', validPath);
    return;
  }
  
  const encoded = encodeURIComponent(validPath)
  const cookieValue = `redirectAfterAuth=${encoded}; path=/; max-age=${maxAgeSeconds}`
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    document.cookie = cookieValue + '; SameSite=None; Secure'
  } else if (typeof window !== 'undefined') {
    document.cookie = cookieValue
  }
}

export function clearRedirectCookie() {
  if (typeof window !== 'undefined') {
    document.cookie = 'redirectAfterAuth=; path=/; max-age=0'
  }
}

export function getRedirectCookie(): string | null {
  if (typeof window === 'undefined') return null
  const cookie = document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith('redirectAfterAuth='))
  if (!cookie) return null
  try {
    return decodeURIComponent(cookie.split('=')[1])
  } catch {
    return cookie.split('=')[1]
  }
}

// Video URL processing functions - proxy through API to handle CORS
export function normalizeVideoUrl(url: string): string {
  if (!url || url === "#") {
    return url
  }

  let fullUrl = url
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    fullUrl = `https://${url}`
  }

  // Proxy through /api/stream to handle CORS and authentication
  return `/api/stream?url=${encodeURIComponent(fullUrl)}`
}

export async function fetchAuthenticatedVideoUrl(videoPath: string): Promise<string | null> {
  if (!videoPath || videoPath === "#") {
    return videoPath
  }

  let normalizedUrl = videoPath
  if (!videoPath.startsWith('http://') && !videoPath.startsWith('https://')) {
    normalizedUrl = `https://${videoPath}`
  }

  // Proxy through /api/stream to handle CORS and authentication
  return `/api/stream?url=${encodeURIComponent(normalizedUrl)}`
}



export function redirectToLogin(currentPath?: string) {
  if (currentPath) {
    setRedirectCookie(currentPath)
  }
  if (typeof window !== 'undefined') {
    window.location.href = '/signin'
  }
}
