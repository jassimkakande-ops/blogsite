import { NextResponse } from 'next/server'
import ReelplexiService from '@/lib/reelplexi-service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type') // 'movie' or 'episode'
    const season = searchParams.get('season')
    const episode = searchParams.get('episode')
    
    if (!id || !type) {
      return NextResponse.json(
        { success: false, error: 'ID and type are required' },
        { status: 400 }
      )
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

    if (!streamData || !streamData.stream_url) {
      return NextResponse.json(
        { success: false, error: 'Stream URL not available' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      stream_url: streamData.stream_url,
      proxy_url: streamData.proxy_url,
      expires_at: streamData.expires_at
    })
  } catch (error) {
    console.error('Error fetching stream URL:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stream URL' },
      { status: 500 }
    )
  }
}
