import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy download route that streams the file through our server.
 * This forces the browser to download rather than play the video,
 * because the `a.download` attribute only works on same-origin URLs.
 *
 * This is the same approach used in the streamit project.
 *
 * Query params:
 *   url      – the upstream download/stream URL
 *   filename – desired filename for the downloaded file
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  const filename = req.nextUrl.searchParams.get('filename') || 'download.mp4';

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const upstream = await fetch(url);

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${upstream.status}` },
        { status: upstream.status }
      );
    }

    // Determine content length if available for progress indication
    const contentLength = upstream.headers.get('content-length');

    const headers = new Headers({
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Type': 'application/octet-stream',
    });

    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }

    // Stream the body through to avoid loading the entire file into memory
    return new NextResponse(upstream.body, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('[Download Proxy] Error:', error.message);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}
