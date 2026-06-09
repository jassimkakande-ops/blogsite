import { NextResponse } from 'next/server'
import ReelplexiService from '@/lib/reelplexi-service'

export async function GET() {
  try {
    // Get all movies and extract unique VJ names
    const movies = await ReelplexiService.getMovies(1, 200)
    const series = await ReelplexiService.getSeries(1, 200)
    
    const allContent = [...movies, ...series]
    const vjsMap = new Map<string, { id: string; name: string }>()
    
    allContent.forEach(item => {
      if (item.vjs?.name) {
        const vjName = item.vjs.name
        const vjId = vjName.toLowerCase().replace(/\s+/g, '-')
        if (!vjsMap.has(vjId)) {
          vjsMap.set(vjId, { id: vjId, name: vjName })
        }
      }
    })
    
    const vjs = Array.from(vjsMap.values()).sort((a, b) => a.name.localeCompare(b.name))
    
    return NextResponse.json({
      success: true,
      data: vjs
    })
  } catch (error) {
    console.error('Error fetching VJs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch VJs' },
      { status: 500 }
    )
  }
}
