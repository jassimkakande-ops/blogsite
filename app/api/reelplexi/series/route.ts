import { NextResponse } from 'next/server'
import ReelplexiService, { type ReelplexiEpisode } from '@/lib/reelplexi-service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const season = searchParams.get('season')
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')
    
    // If no ID, return list of series
    if (!id) {
      const seriesList = await ReelplexiService.getSeries(page, limit)
      return NextResponse.json(seriesList.map(s => ({
        ...s,
        created_at: s.first_air_date || new Date().toISOString(),
        published: true,
      })))
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

    // Get related series
    const related = await ReelplexiService.getRelatedSeries(id, 1, 6)
    console.log(`Fetched ${related.length} related series for series ${id}`)
    if (related.length > 0) {
      console.log('First related series sample:', JSON.stringify(related[0], null, 2))
    }

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
        related: related.map(s => ({
          ...s,
          created_at: s.first_air_date || new Date().toISOString(),
        }))
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
