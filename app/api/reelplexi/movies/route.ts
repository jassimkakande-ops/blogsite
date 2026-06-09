import { NextResponse } from 'next/server'
import ReelplexiService from '@/lib/reelplexi-service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')

    const movies = await ReelplexiService.getMovies(page, limit)
    
    return NextResponse.json({
      success: true,
      data: movies.map(movie => ({
        ...movie,
        created_at: movie.release_date || new Date().toISOString(),
        published: true,
        premium: false,
      }))
    })
  } catch (error) {
    console.error('Error fetching movies:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch movies' },
      { status: 500 }
    )
  }
}
