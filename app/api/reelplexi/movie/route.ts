import { NextResponse } from 'next/server'
import ReelplexiService from '@/lib/reelplexi-service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Movie ID is required' },
        { status: 400 }
      )
    }

    const movie = await ReelplexiService.getMovieById(id)
    
    if (!movie) {
      return NextResponse.json(
        { success: false, error: 'Movie not found' },
        { status: 404 }
      )
    }

    // Get streaming URL
    const streamData = await ReelplexiService.getMovieStream(id)
    
    // Get related movies
    const related = await ReelplexiService.getRelatedMovies(id, 1, 6)

    const result = {
      ...movie,
      created_at: movie.release_date || new Date().toISOString(),
      published: true,
      premium: false,
      video_url: streamData?.stream_url || movie.video_url,
      stream_url: streamData?.stream_url,
    }

    return NextResponse.json({
      success: true,
      data: {
        movie: result,
        related: related.map(m => ({
          ...m,
          created_at: m.release_date || new Date().toISOString(),
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching movie:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch movie' },
      { status: 500 }
    )
  }
}
