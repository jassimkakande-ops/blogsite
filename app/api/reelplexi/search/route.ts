import { NextResponse } from 'next/server'
import ReelplexiService from '@/lib/reelplexi-service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const type = searchParams.get('type') || 'movies' // 'movies' or 'series'
    
    if (!query.trim()) {
      return NextResponse.json({ success: true, data: [] })
    }

    let allContent
    if (type === 'series') {
      allContent = await ReelplexiService.getSeries(1, 100)
    } else {
      allContent = await ReelplexiService.getMovies(1, 100)
    }
    
    const lowerQuery = query.toLowerCase()
    const filtered = allContent.filter(item => {
      const title = (item.title || '').toLowerCase()
      const desc = (item.description || item.overview || '').toLowerCase()
      return title.includes(lowerQuery) || desc.includes(lowerQuery)
    })

    const results = filtered.map(item => ({
      ...item,
      created_at: type === 'series' ? (item.first_air_date || new Date().toISOString()) : (item.release_date || new Date().toISOString()),
      published: true,
      premium: false,
    }))

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
