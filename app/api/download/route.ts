import { NextRequest, NextResponse } from 'next/server';
import ReelplexiService from '@/lib/reelplexi-service';

/**
 * Download route that fetches a presigned download URL from the Reelplexi backend
 * and redirects the browser directly to it.
 *
 * Uses the dedicated /v1/download/ endpoints which return a signed Wasabi S3 URL
 * with response-content-disposition=attachment so the browser downloads the file
 * directly from the CDN — avoiding large-file timeouts through the Next.js server.
 *
 * Two modes:
 *
 * 1. Direct redirect (url already known):
 *    ?url=<signed-url>
 *    Redirects straight to the provided URL.
 *
 * 2. Reelplexi lookup:
 *    ?id=<id>&type=movie|episode&season=<n>&episode=<n>
 *    Resolves the dedicated download URL from Reelplexi server-side, then redirects.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');

  // Mode 1: Direct redirect — url is already known
  if (url) {
    return NextResponse.redirect(url);
  }

  // Mode 2: Resolve URL from Reelplexi server-side
  const id = req.nextUrl.searchParams.get('id');
  const type = req.nextUrl.searchParams.get('type') || 'movie';
  const season = req.nextUrl.searchParams.get('season');
  const episode = req.nextUrl.searchParams.get('episode');

  if (!id) {
    return NextResponse.json({ error: 'Either url or id is required' }, { status: 400 });
  }

  try {
    let resolvedUrl: string | null = null;

    if (type === 'movie') {
      try {
        resolvedUrl = await ReelplexiService.getMovieDownloadUrl(id);
      } catch (e: any) {
        return NextResponse.json({ error: 'Failed to get movie download url', details: e.message }, { status: 500 });
      }
    } else if (type === 'episode' && season && episode) {
      try {
        resolvedUrl = await ReelplexiService.getEpisodeDownloadUrl(
          id,
          parseInt(season, 10),
          parseInt(episode, 10)
        );
      } catch (e: any) {
        return NextResponse.json({ error: 'Failed to get episode download url', details: e.message }, { status: 500 });
      }
    }

    if (!resolvedUrl) {
      return NextResponse.json({ error: 'Download URL not available' }, { status: 404 });
    }

    // Redirect the browser directly to the Wasabi presigned URL.
    return NextResponse.redirect(resolvedUrl);
  } catch (error: any) {
    console.error('[Download API] Error:', error);
    return NextResponse.json({ error: 'Failed to resolve download URL', details: error.message }, { status: 500 });
  }
}
