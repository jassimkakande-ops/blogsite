import { NextResponse } from 'next/server'
import ReelplexiService, { type ReelplexiEpisode } from '@/lib/reelplexi-service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const season = searchParams.get('season')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    
    // If no ID, return list of series
    if (!id) {
      const seriesList = await ReelplexiService.getSeries(page, limit)
      return NextResponse.json({
        success: true,
        data: seriesList.map(s => ({
          ...s,
          created_at: s.first_air_date || new Date().toISOString(),
          published: true,
        })),
        pagination: {
          page,
          limit,
          hasMore: seriesList.length === limit
        }
      })
    }

    // If ID provided, return single series with details
    const series = await ReelplexiService.getSeriesById(id)
    
    if (!series) {
      return NextResponse.json(
        { success: false, error: 'Series not found' },
        { status: 404 }
      )
    }

    // Get episodes if season is provided
    let episodes: ReelplexiEpisode[] = []
    if (season) {
      episodes = await ReelplexiService.getSeriesEpisodes(id, parseInt(season))
      console.log(`Fetched ${episodes.length} episodes for series ${id} season ${season}`)
      if (episodes.length > 0) {
        console.log('First episode sample:', JSON.stringify(episodes[0], null, 2))
      }
    }

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
    console.log(`Generated ${related.length} related items for series ${id}`)

    const result = {
      ...series,
      created_at: series.first_air_date || new Date().toISOString(),
      published: true,
      seasons: [], // Episodes loaded separately
    }

    return NextResponse.json({
      success: true,
      data: {
        series: result,
        episodes,
        related
      }
    })
  } catch (error) {
    console.error('Error fetching series:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch series' },
      { status: 500 }
    )
  }
}
