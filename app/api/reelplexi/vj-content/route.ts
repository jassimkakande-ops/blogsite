import { NextResponse } from 'next/server'
import ReelplexiService from '@/lib/reelplexi-service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '12')

    const movies = await ReelplexiService.getMovies(1, limit)
    const series = await ReelplexiService.getSeries(1, limit)

    const vjMovies = movies.filter(movie => movie.vjs?.name).slice(0, Math.ceil(limit / 2))
    const vjSeries = series.filter(show => show.vjs?.name).slice(0, Math.ceil(limit / 2))

    const combined = [
      ...vjMovies.map(item => ({ 
        ...item, 
        type: 'movie' as const,
        created_at: item.release_date || new Date().toISOString(),
      })),
      ...vjSeries.map(item => ({ 
        ...item, 
        type: 'series' as const,
        created_at: item.first_air_date || new Date().toISOString(),
      })),
    ]

    const sorted = combined.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ).slice(0, limit)

    return NextResponse.json({
      success: true,
      data: sorted
    })
  } catch (error) {
    console.error('Error fetching VJ content:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch VJ content' },
      { status: 500 }
    )
  }
}
