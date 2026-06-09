import { useState, useCallback } from 'react';

interface SearchResult {
  id: string;
  title: string;
  poster_url?: string;
  release_date?: string;
  rating?: number;
  type: 'movie' | 'series' | 'anime' | 'english-movie' | 'english-series';
  genre?: string;
  description?: string;
  relevanceScore?: number;
}

interface SearchStats {
  totalCount: number;
  movieCount: number;
  seriesCount: number;
  animeCount: number;
  englishMovieCount: number;
  englishSeriesCount: number;
}

interface SearchOptions {
  filter?: 'all' | 'movies' | 'series' | 'anime' | 'english-movies' | 'english-series';
  sort?: 'relevance' | 'date' | 'title';
  vj?: string;
  genre?: string;
  limit?: number;
}

export function useEnhancedSearch(defaultOptions: SearchOptions = {}) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchStats, setSearchStats] = useState<SearchStats>({
    totalCount: 0,
    movieCount: 0,
    seriesCount: 0,
    animeCount: 0,
    englishMovieCount: 0,
    englishSeriesCount: 0,
  });

  const search = useCallback(async (query: string, options: SearchOptions = {}) => {
    if (!query.trim()) {
      setResults([]);
      setSearchStats({
        totalCount: 0,
        movieCount: 0,
        seriesCount: 0,
        animeCount: 0,
        englishMovieCount: 0,
        englishSeriesCount: 0,
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const searchOptions = { ...defaultOptions, ...options };
      
      // Start with Supabase search only
      const supabaseParams = new URLSearchParams({
        q: query,
        filter: searchOptions.filter || 'all',
        sort: searchOptions.sort || 'relevance',
        vj: searchOptions.vj || 'all',
        genre: searchOptions.genre || 'all',
      });

      console.log('🔍 Starting search with query:', query);
      
      // First, get Supabase results
      const supabaseResponse = await fetch(`/api/search?${supabaseParams}`);
      const supabaseData = supabaseResponse.ok ? await supabaseResponse.json() : { results: [] };
      
      console.log('📊 Supabase results:', supabaseData.results?.length || 0);

      // Initialize results with Supabase data
      let allResults: SearchResult[] = [...(supabaseData.results || []).filter((item: any) => item && item.id)];

      // Try to fetch TMDB data, but don't let it block the search
      try {
        const tmdbPromises = [
          fetch(`/api/anime/search?q=${encodeURIComponent(query)}`).catch(() => ({ ok: false })),
          fetch(`/api/english-movies-search?q=${encodeURIComponent(query)}`).catch(() => ({ ok: false })),
          fetch(`/api/english-series-search?q=${encodeURIComponent(query)}`).catch(() => ({ ok: false }))
        ];

        const [animeResponse, englishMoviesResponse, englishSeriesResponse] = await Promise.all(tmdbPromises);

        // Process anime results
        if (animeResponse.ok && 'json' in animeResponse) {
          const animeData = await animeResponse.json();
          const animeResults = (animeData.results || [])
            .filter((item: any) => item && item.id)
            .map((item: any) => ({
              id: String(item.id),
              title: item.name || item.title || 'Unknown Title',
              poster_url: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
              release_date: item.first_air_date,
              rating: item.vote_average,
              type: 'anime' as const,
              description: item.overview,
            }));
          allResults.push(...animeResults);
          console.log('🎌 Anime results:', animeResults.length);
        }

        // Process English movies
        if (englishMoviesResponse.ok && 'json' in englishMoviesResponse) {
          const englishMoviesData = await englishMoviesResponse.json();
          const movieResults = (englishMoviesData || [])
            .filter((item: any) => item && item.id)
            .map((item: any) => ({
              id: String(item.id),
              title: item.title || 'Unknown Title',
              poster_url: item.poster_url,
              release_date: item.release_date,
              rating: item.rating,
              type: 'english-movie' as const,
              description: item.description,
            }));
          allResults.push(...movieResults);
          console.log('🎬 English movies results:', movieResults.length);
        }

        // Process English series
        if (englishSeriesResponse.ok && 'json' in englishSeriesResponse) {
          const englishSeriesData = await englishSeriesResponse.json();
          const seriesResults = (englishSeriesData || [])
            .filter((item: any) => item && item.id)
            .map((item: any) => ({
              id: String(item.id),
              title: item.title || 'Unknown Title',
              poster_url: item.poster_url,
              release_date: item.release_date,
              rating: item.rating,
              type: 'english-series' as const,
              description: item.description,
            }));
          allResults.push(...seriesResults);
          console.log('📺 English series results:', seriesResults.length);
        }
      } catch (tmdbError) {
        console.warn('⚠️ TMDB search failed, showing Supabase results only:', tmdbError);
      }

      // Calculate stats
      const stats: SearchStats = {
        totalCount: allResults.length,
        movieCount: allResults.filter(r => r.type === 'movie').length,
        seriesCount: allResults.filter(r => r.type === 'series').length,
        animeCount: allResults.filter(r => r.type === 'anime').length,
        englishMovieCount: allResults.filter(r => r.type === 'english-movie').length,
        englishSeriesCount: allResults.filter(r => r.type === 'english-series').length,
      };

      console.log('✅ Final search stats:', stats);

      setResults(allResults);
      setSearchStats(stats);
    } catch (err) {
      console.error('❌ Search error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
      setSearchStats({
        totalCount: 0,
        movieCount: 0,
        seriesCount: 0,
        animeCount: 0,
        englishMovieCount: 0,
        englishSeriesCount: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    results,
    loading,
    error,
    searchStats,
    search,
  };
}

export function filterResultsByType(results: SearchResult[], type: string): SearchResult[] {
  if (type === 'all') return results;
  if (type === 'movies') return results.filter(r => r.type === 'movie');
  if (type === 'series') return results.filter(r => r.type === 'series');
  if (type === 'anime') return results.filter(r => r.type === 'anime');
  if (type === 'english-movies') return results.filter(r => r.type === 'english-movie');
  if (type === 'english-series') return results.filter(r => r.type === 'english-series');
  return results;
}