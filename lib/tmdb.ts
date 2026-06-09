// Utility to fetch data from TMDB API
// Usage: fetchFromTMDB(endpoint: string, params?: Record<string, string | number>)

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || ''
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

export async function fetchFromTMDB(endpoint: string, params: Record<string, string | number> = {}) {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`)
  url.searchParams.set('api_key', TMDB_API_KEY)
  url.searchParams.set('language', 'en-US')
  url.searchParams.set('page', '1')
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value))
  }
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`)
  const data = await res.json()
  return data.results || data
}

// New function that returns the full TMDB response with pagination info
export async function fetchFromTMDBWithPagination(endpoint: string, params: Record<string, string | number> = {}) {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`)
  url.searchParams.set('api_key', TMDB_API_KEY)
  url.searchParams.set('language', 'en-US')
  url.searchParams.set('page', '1')
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value))
  }
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`)
  const data = await res.json()
  return data
}

// Utility to fetch multiple pages from TMDB API (use sparingly - prefer pagination)
export async function fetchMultiplePagesFromTMDB(endpoint: string, params: Record<string, string | number> = {}, maxPages: number = 50) {
  const allResults: any[] = []
  
  for (let page = 1; page <= maxPages; page++) {
    try {
      const url = new URL(`${TMDB_BASE_URL}${endpoint}`)
      url.searchParams.set('api_key', TMDB_API_KEY)
      url.searchParams.set('language', 'en-US')
      url.searchParams.set('page', String(page))
      
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, String(value))
      }
      
      const res = await fetch(url.toString())
      if (!res.ok) throw new Error(`TMDB error: ${res.status}`)
      
      const data = await res.json()
      const results = data.results || []
      
      if (results.length === 0) {
        // No more results, break the loop
        break
      }
      
      allResults.push(...results)
      
      // If we've reached the total pages available, break
      if (page >= data.total_pages) {
        break
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
      
    } catch (error) {
      console.error(`Error fetching page ${page}:`, error)
      // Continue with next page on error
      continue
    }
  }
  
  return allResults
}

// Enhanced function for better performance with caching
export async function fetchFromTMDBWithCache(endpoint: string, params: Record<string, string | number> = {}) {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`)
  url.searchParams.set('api_key', TMDB_API_KEY)
  url.searchParams.set('language', 'en-US')
  
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value))
  }
  
  const res = await fetch(url.toString(), {
    next: { revalidate: 3600 } // Cache for 1 hour
  })
  
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`)
  const data = await res.json()
  return data
}
