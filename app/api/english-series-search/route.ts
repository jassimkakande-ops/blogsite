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
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    // Search English TV shows
    const data = await fetchFromTMDB('/search/tv', {
      query: query,
      page: '1',
      include_adult: 'false',
      language: 'en-US',
    })

    // Filter for English TV shows and transform data
    const englishTVShows = (data.results || [])
      .filter((show: any) => show.original_language === 'en')
      .slice(0, 20)
      .map((item: any) => ({
        id: item.id,
        title: item.name || item.title,
        description: item.overview,
        poster_url: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
        backdrop_url: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
        rating: item.vote_average,
        release_date: item.first_air_date,
        genre: item.genre_ids || [],
        no_of_seasons: item.number_of_seasons || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        media_type: 'tv' as const
      }))

    return NextResponse.json(englishTVShows)
  } catch (error) {
    console.error('Error in English TV shows search API:', error)
    return NextResponse.json(
      { error: 'Failed to search English TV shows' },
      { status: 500 }
    )
  }
}