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

    console.log('Fetching movie from Reelplexi API:', id)
    const movie = await ReelplexiService.getMovieById(id)
    
    if (!movie) {
      return NextResponse.json(
        { success: false, error: 'Movie not found' },
        { status: 404 }
      )
    }

    console.log('Movie fetched, raw fields:', {
      id: movie.id,
      title: movie.title,
      embed_url: movie.embed_url,
      video_url: movie.video_url,
      stream_url: movie.stream_url,
      proxy_url: movie.proxy_url
    })

    // Get streaming URL
    const streamData = await ReelplexiService.getMovieStream(id)
    console.log('Stream data:', streamData)
    
    // Get all translated content
    const [allMovies, allSeries] = await Promise.all([
      ReelplexiService.getMovies(1, 50),
      ReelplexiService.getSeries(1, 50)
    ])

    // Combine and add type field
    const combined = [
      ...allMovies.map(m => ({ ...m, type: 'movie' as const, created_at: m.release_date || new Date().toISOString() })),
      ...allSeries.map(s => ({ ...s, type: 'series' as const, created_at: s.first_air_date || new Date().toISOString() }))
    ]

    // Shuffle and take first 20
    const shuffled = combined.sort(() => Math.random() - 0.5)
    const related = shuffled.slice(0, 20)

    const result = {
      ...movie,
      created_at: movie.release_date || new Date().toISOString(),
      published: true,
      premium: false,
      video_url: streamData?.stream_url || movie.video_url,
      stream_url: streamData?.stream_url,
    }

    console.log('Final movie result video_url:', result.video_url)

    return NextResponse.json({
      success: true,
      data: {
        movie: result,
        related
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
