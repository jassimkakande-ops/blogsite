import { NextResponse } from 'next/server'
import ReelplexiService from '@/lib/reelplexi-service'
import type { ReelplexiSeries } from '@/lib/reelplexi-service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const type = searchParams.get('type') || 'movies' // 'movies' or 'series'
    
    if (!query.trim()) {
      return NextResponse.json({ success: true, data: [] })
    }

    const lowerQuery = query.toLowerCase()
    let results
    
    if (type === 'series') {
      const seriesResults = await ReelplexiService.searchSeries(query, 1, 100)
      results = seriesResults.map(item => ({
        ...item,
        created_at: item.first_air_date || new Date().toISOString(),
        published: true,
        premium: false,
      }))
    } else {
      const movieResults = await ReelplexiService.searchMovies(query, 1, 100)
      results = movieResults.map(item => ({
        ...item,
        created_at: item.release_date || new Date().toISOString(),
        published: true,
        premium: false,
      }))
    }

    return NextResponse.json({
      success: true,
      data: results
    })
  } catch (error) {
    console.error('Error searching:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to search' },
      { status: 500 }
    )
  }
}
