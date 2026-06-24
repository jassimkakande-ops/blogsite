import { NextRequest, NextResponse } from 'next/server';
import ReelplexiService from '@/lib/reelplexi-service';

/**
 * Download route that fetches a presigned download URL from the backend
 * and redirects the user to it.
 *
 * This relies on the Reelplexi backend properly signing the URL with Wasabi keys
 * so that the resulting S3 URL contains the `response-content-disposition=attachment`
 * query parameter. When Chrome follows the redirect to that signed URL, Wasabi
 * forces the download.
 *
 * Two modes:
 *
 * 1. Direct redirect (url already known):
 *    ?url=<signed-url>
 *    Redirects to the provided URL.
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
      return NextResponse.json({ error: 'Download URL not available, resolvedUrl was null' }, { status: 404 });
    }

    // Redirect the browser directly to the Wasabi presigned URL.
    return NextResponse.redirect(resolvedUrl);
  } catch (error: any) {
    console.error('[Download API] Reelplexi lookup error:', error);
    return NextResponse.json({ error: 'Failed to resolve download URL', details: error.message }, { status: 500 });
  }
}
