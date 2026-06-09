import { NextRequest, NextResponse } from 'next/server'

// TMDB API configuration
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || process.env.TMDB_API_KEY

if (!TMDB_API_KEY) {
  throw new Error('TMDB_API_KEY is not defined in environment variables')
}

// Helper function to fetch from TMDB
async function fetchFromTMDB(endpoint: string, params: Record<string, string> = {}) {
  const queryParams = new URLSearchParams()
  queryParams.append('api_key', TMDB_API_KEY!)

  Object.entries(params).forEach(([key, value]) => {
    queryParams.append(key, value)
  })

  const url = `${TMDB_BASE_URL}${endpoint}?${queryParams}`

  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!response.ok) {
      console.error(`TMDB API error: ${response.status} ${response.statusText}`)
      console.error(`URL: ${url}`)
      throw new Error(`TMDB API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching from TMDB:', error)
    throw error
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json({ results: [] })
    }

    // Search for anime (TV shows with animation genre)
    const data = await fetchFromTMDB('/search/tv', {
      query: query,
      include_adult: 'false',
      language: 'en-US',
      page: '1'
    })

    // Filter results to only include anime (shows with genre 16 - Animation)
    const animeResults = data.results?.filter((show: any) =>
      show.genre_ids?.includes(16) &&
      show.origin_country?.includes('JP')
    ) || []

    return NextResponse.json({
      results: animeResults,
      total_results: animeResults.length
    })
  } catch (error) {
    console.error('Error searching anime:', error)
    return NextResponse.json(
      { error: 'Failed to search anime', results: [] },
      { status: 500 }
    )
  }
}