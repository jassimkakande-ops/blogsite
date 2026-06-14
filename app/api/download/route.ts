import { NextResponse } from 'next/server'
import ReelplexiService from '@/lib/reelplexi-service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type') || 'movie' // 'movie' or 'episode'
    const season = searchParams.get('season')
    const episode = searchParams.get('episode')
    const filenameParam = searchParams.get('filename')
    
    if (!id) {
      return new Response('ID is required', { status: 400 })
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
      return new Response('Stream URL not available', { status: 404 })
    }

    const targetUrl = streamData.proxy_url || streamData.stream_url
    
    if (!targetUrl) {
      return new Response('Stream URL is empty', { status: 404 })
    }

    // Redirect directly to the Reelplexi proxy/stream URL to avoid our server acting as an extra proxy
    return NextResponse.redirect(targetUrl)
  } catch (error) {
    console.error('Download error:', error)
    return new Response('Failed to redirect to download', { status: 500 })
  }
}
