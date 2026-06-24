import { NextRequest, NextResponse } from 'next/server';
import ReelplexiService from '@/lib/reelplexi-service';

/**
 * Proxy download route that streams the file through our server.
 * This forces the browser to download rather than play the video,
 * because the `a.download` attribute only works on same-origin URLs.
 *
 * Two modes:
 *
 * 1. Direct proxy (streamit pattern):
 *    ?url=<signed-url>&filename=<name.mp4>
 *    Streams the upstream file through with Content-Disposition: attachment
 *    and Content-Type: application/octet-stream so the browser downloads it.
 *
 * 2. Reelplexi lookup (legacy):
 *    ?id=<id>&type=movie|episode&season=<n>&episode=<n>
 *    Resolves the stream URL from Reelplexi, then proxies it through.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  const filename = req.nextUrl.searchParams.get('filename') || 'download.mp4';

  // Mode 1: Direct proxy — url is already known
  if (url) {
    return proxyDownload(url, filename);
  }

  // Mode 2: Resolve URL from Reelplexi first
  const id = req.nextUrl.searchParams.get('id');
  const type = req.nextUrl.searchParams.get('type') || 'movie';
  const season = req.nextUrl.searchParams.get('season');
  const episode = req.nextUrl.searchParams.get('episode');

  if (!id) {
    return NextResponse.json({ error: 'Either url or id is required' }, { status: 400 });
  }

  try {
    let streamData = null;

    if (type === 'movie') {
      streamData = await ReelplexiService.getMovieStream(id);
    } else if (type === 'episode' && season && episode) {
      streamData = await ReelplexiService.getEpisodeStream(
        id,
        parseInt(season),
        parseInt(episode)
      );
    }

    if (!streamData || (!streamData.stream_url && !streamData.proxy_url)) {
      return NextResponse.json({ error: 'Stream URL not available' }, { status: 404 });
    }

    const resolvedUrl = streamData.proxy_url || streamData.stream_url;
    if (!resolvedUrl) {
      return NextResponse.json({ error: 'Stream URL not available' }, { status: 404 });
    }
    return proxyDownload(resolvedUrl, filename);
  } catch (error) {
    console.error('[Download Proxy] Reelplexi lookup error:', error);
    return NextResponse.json({ error: 'Failed to resolve download URL' }, { status: 500 });
  }
}

/**
 * Proxy the upstream URL through our server as a forced download.
 * Content-Type is set to application/octet-stream so the browser
 * treats it as a binary file rather than trying to play it inline.
 */
async function proxyDownload(url: string, filename: string) {
  try {
    const upstream = await fetch(url);

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${upstream.status}` },
        { status: upstream.status }
      );
    }

    const contentLength = upstream.headers.get('content-length');

    const headers = new Headers({
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Type': 'application/octet-stream',
    });

    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }

    // Stream the body through — avoids loading the entire file into memory
    return new NextResponse(upstream.body, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('[Download Proxy] Error:', error.message);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}
