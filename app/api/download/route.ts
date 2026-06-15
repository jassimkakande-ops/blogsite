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

    let streamData = null

    if (type === 'movie') {
      streamData = await ReelplexiService.getMovieStream(id)
    } else if (type === 'episode' && season && episode) {
      streamData = await ReelplexiService.getEpisodeStream(
        id,
        parseInt(season),
        parseInt(episode)
      )
    }

    if (!streamData || (!streamData.stream_url && !streamData.proxy_url)) {
      return NextResponse.json({ error: 'Stream URL not available' }, { status: 404 })
    }

    const url = streamData.proxy_url || streamData.stream_url

    // Return the URL only — the client opens it directly, nothing is proxied here
    return NextResponse.json({ url, expires_at: streamData.expires_at })
  } catch (error) {
    console.error('Download URL lookup error:', error)
    return NextResponse.json({ error: 'Failed to get download URL' }, { status: 500 })
  }
}
