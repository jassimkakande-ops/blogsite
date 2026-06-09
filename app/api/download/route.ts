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

    // Fetch the file from the remote URL
    const proxyResponse = await fetch(targetUrl)
    
    if (!proxyResponse.ok) {
      throw new Error(`Failed to fetch the file: ${proxyResponse.statusText}`)
    }

    const filename = filenameParam || 'download.mp4'

    // Proxy the response stream with attachment headers
    return new Response(proxyResponse.body, {
      headers: {
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': proxyResponse.headers.get('Content-Type') || 'video/mp4',
        // Copy content length if available so browser shows progress
        ...(proxyResponse.headers.get('Content-Length') ? { 'Content-Length': proxyResponse.headers.get('Content-Length') as string } : {})
      }
    })
  } catch (error) {
    console.error('Download error:', error)
    return new Response('Failed to download file', { status: 500 })
  }
}
