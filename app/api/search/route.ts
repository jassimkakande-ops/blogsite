import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const filter = searchParams.get('filter') || 'all';
  const sort = searchParams.get('sort') || 'relevance';
  const genre = searchParams.get('genre') || 'all';
  const vj = searchParams.get('vj') || 'all';

  console.log('🔍 Search API called with:', { query, filter, sort, genre, vj });

  if (!query || query.trim().length === 0) {
    console.log('❌ Empty query, returning empty results');
    return NextResponse.json({ results: [] });
  }

  try {
    const results = [];
    console.log('🚀 Starting database search...');

    // Search movies if filter allows
    if (filter === 'all' || filter === 'movies') {
      console.log('🎬 Searching movies table...');
      let moviesQuery = supabase
        .from('movies')
        .select('id, title, thumbnail_url, cover_image_url, description, release_date, vj_id, genre_ids')
        .ilike('title', `%${query}%`);

      // Apply genre filter
      if (genre !== 'all') {
        moviesQuery = moviesQuery.contains('genre_ids', [genre]);
      }

      // Apply VJ filter
      if (vj !== 'all') {
        moviesQuery = moviesQuery.eq('vj_id', vj);
      }

      const { data: movies, error: moviesError } = await moviesQuery.limit(20);

      console.log('🎬 Movies query result:', {
        moviesCount: movies?.length || 0,
        moviesError: moviesError?.message,
        sampleTitles: movies?.slice(0, 3).map(m => m.title)
      });

      if (!moviesError && movies) {
        const movieResults = movies.map(movie => ({
          ...movie,
          type: 'movie' as const,
          poster_url: movie.thumbnail_url || movie.cover_image_url
        }));
        results.push(...movieResults);
        console.log('✅ Added', movieResults.length, 'movies to results');
      } else if (moviesError) {
        console.error('❌ Movies search error:', moviesError);
      }
    }

    // Search series if filter allows
    if (filter === 'all' || filter === 'series') {
      console.log('📺 Searching series table...');
      let seriesQuery = supabase
        .from('series')
        .select('id, title, thumbnail_url, cover_image_url, description, release_date, vj_id, genre_ids')
        .ilike('title', `%${query}%`);

      // Apply genre filter
      if (genre !== 'all') {
        seriesQuery = seriesQuery.contains('genre_ids', [genre]);
      }

      // Apply VJ filter
      if (vj !== 'all') {
        seriesQuery = seriesQuery.eq('vj_id', vj);
      }

      const { data: series, error: seriesError } = await seriesQuery.limit(20);

      console.log('📺 Series query result:', {
        seriesCount: series?.length || 0,
        seriesError: seriesError?.message,
        sampleTitles: series?.slice(0, 3).map(s => s.title)
      });

      if (!seriesError && series) {
        const seriesResults = series.map(serie => ({
          ...serie,
          type: 'series' as const,
          poster_url: serie.thumbnail_url || serie.cover_image_url
        }));
        results.push(...seriesResults);
        console.log('✅ Added', seriesResults.length, 'series to results');
      } else if (seriesError) {
        console.error('❌ Series search error:', seriesError);
      }
    }

    // Results are returned in relevance order (database default order)
    console.log('� Restults returned in relevance order');

    console.log('✨ Final results:', {
      totalCount: results.length,
      movieCount: results.filter(r => r.type === 'movie').length,
      seriesCount: results.filter(r => r.type === 'series').length,
      titles: results.slice(0, 5).map(r => `${r.title} (${r.type})`)
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error('💥 Search API error:', error);
    return NextResponse.json({
      results: [],
      error: 'Search failed',
      debug: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    }, { status: 500 });
  }
}