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
      const allSeries = await ReelplexiService.getSeries(1, 100)
      const filtered = allSeries.filter(item => {
        const title = (item.title || '').toLowerCase()
        const desc = (item.description || item.overview || '').toLowerCase()
        return title.includes(lowerQuery) || desc.includes(lowerQuery)
      })
      results = filtered.map(item => ({
        ...item,
        created_at: item.first_air_date || new Date().toISOString(),
        published: true,
        premium: false,
      }))
    } else {
      const allMovies = await ReelplexiService.getMovies(1, 100)
      const filtered = allMovies.filter(item => {
        const title = (item.title || '').toLowerCase()
        const desc = (item.description || item.overview || '').toLowerCase()
        return title.includes(lowerQuery) || desc.includes(lowerQuery)
      })
      results = filtered.map(item => ({
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
