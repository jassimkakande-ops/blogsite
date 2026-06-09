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

    // Search English movies
    const data = await fetchFromTMDB('/search/movie', {
      query: query,
      page: '1',
      include_adult: 'false',
      language: 'en-US',
    })

    // Filter for English movies and transform data
    const englishMovies = (data.results || [])
      .filter((movie: any) => movie.original_language === 'en')
      .slice(0, 20)
      .map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.overview,
        poster_url: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
        backdrop_url: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
        thumbnail_medium: item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : null,
        rating: item.vote_average,
        release_date: item.release_date,
        genre: item.genre_ids || [],
        year: item.release_date ? new Date(item.release_date).getFullYear().toString() : null,
        published: true,
        trending: false,
        popular: true,
        recommend: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        media_type: 'movie' as const
      }))

    return NextResponse.json(englishMovies)
  } catch (error) {
    console.error('Error in English movies search API:', error)
    return NextResponse.json(
      { error: 'Failed to search English movies' },
      { status: 500 }
    )
  }
}