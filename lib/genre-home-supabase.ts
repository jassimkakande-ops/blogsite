import { supabase, Genre } from './supabase'
import { Movie, Series } from './supabase'

// Fetch genres from Supabase and get both movies and series for each genre
export async function getGenreRowsForHomeSupabase(limit = 20) {
  // Pick 3 genres (can be customized)
  const genres = await supabase
    .from('genres')
    .select('*')
    .order('name')
    .limit(3);

  if (!genres.data) return [];

  // For each genre, fetch movies and series that belong to it
  const genreRows = await Promise.all(
    genres.data.map(async (genre: Genre) => {
      // Movies
      const { data: movies } = await supabase
        .from('movies')
        .select(`*, vjs:vj_id (id, name)`)
        .eq('published', true)
        .not('video_url', 'is', null)
        .contains('genre_ids', [genre.id])
        .order('created_at', { ascending: false })
        .limit(limit);

      // Series
      const { data: series } = await supabase
        .from('series')
        .select(`*, vjs:vj_id (id, name)`)
        .eq('published', true)
        .contains('genre_ids', [genre.id])
        .order('created_at', { ascending: false })
        .limit(limit);

      // Add type and normalize vjs field
      const moviesWithType = (movies || []).map((item: any) => ({
        ...item,
        vjs: Array.isArray(item.vjs) ? item.vjs[0] || null : item.vjs || null,
        type: 'movie',
      }));
      const seriesWithType = (series || []).map((item: any) => ({
        ...item,
        vjs: Array.isArray(item.vjs) ? item.vjs[0] || null : item.vjs || null,
        type: 'series',
      }));

      // Combine and sort by created_at
      const combined = [
        ...moviesWithType,
        ...seriesWithType
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, limit);

      return {
        name: genre.name,
        movies: combined,
      };
    })
  );

  return genreRows;
}
