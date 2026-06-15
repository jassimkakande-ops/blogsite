import { NextResponse } from 'next/server'
import ReelplexiService from '@/lib/reelplexi-service'

/**
 * Returns the Reelplexi stream URL as JSON so the client can open it directly.
 * No server-side content proxying — zero data passes through this server.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type') || 'movie' // 'movie' or 'episode'
    const season = searchParams.get('season')
    const episode = searchParams.get('episode')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    let downloadUrl = null

    if (type === 'movie') {
      downloadUrl = await ReelplexiService.getMovieDownload(id)
    } else if (type === 'episode' && season && episode) {
      downloadUrl = await ReelplexiService.getEpisodeDownload(
        id,
        parseInt(season),
        parseInt(episode)
      )
    }

    if (!downloadUrl) {
      return NextResponse.json({ error: 'Download URL not available' }, { status: 404 })
    }

    // Return the URL only — the client opens it directly via the proxy route
    return NextResponse.json({ url: downloadUrl })
  } catch (error) {
    console.error('Download URL lookup error:', error)
    return NextResponse.json({ error: 'Failed to get download URL' }, { status: 500 })
  }
}
