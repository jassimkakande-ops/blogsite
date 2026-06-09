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

    const movies = await ReelplexiService.getMovies(1, 200)
    
    const filtered = movies.filter(movie => {
      if (!movie.vjs?.name) return false
      const movieVjName = movie.vjs.name.toLowerCase()
      return movieVjName === vjName.toLowerCase() || 
             movieVjName.replace(/\s+/g, '-') === vjId
    })

    const results = filtered.map(movie => ({
      ...movie,
      created_at: movie.release_date || new Date().toISOString(),
      published: true,
      premium: false,
    }))

    return NextResponse.json({
      success: true,
      data: results
    })
  } catch (error) {
    console.error('Error filtering movies by VJ:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to filter by VJ' },
      { status: 500 }
    )
  }
}
