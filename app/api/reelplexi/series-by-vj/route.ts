import { NextResponse } from 'next/server'
import ReelplexiService from '@/lib/reelplexi-service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const vjId = searchParams.get('vjId') || ''
    const vjName = searchParams.get('vjName') || ''
    
    if (!vjId && !vjName) {
      return NextResponse.json({ success: true, data: [] })
    }

    const series = await ReelplexiService.getSeries(1, 200)
    
    const filtered = series.filter(show => {
      if (!show.vjs?.name) return false
      const showVjName = show.vjs.name.toLowerCase()
      return showVjName === vjName.toLowerCase() || 
             showVjName.replace(/\s+/g, '-') === vjId
    })

    const results = filtered.map(show => ({
      ...show,
      created_at: show.first_air_date || new Date().toISOString(),
      published: true,
      seasons: [],
    }))

    return NextResponse.json({
      success: true,
      data: results
    })
  } catch (error) {
    console.error('Error filtering series by VJ:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to filter by VJ' },
      { status: 500 }
    )
  }
}
