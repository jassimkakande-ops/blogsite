// Fetch movies by genre from TMDB (for Action, Sci-Fi, Comedy)
// Action: 28, Sci-Fi: 878, Comedy: 35
import { fetchFromTMDB } from '@/lib/tmdb'

export async function getMoviesByGenreTMDB(genreId: number, limit = 20) {
  const results = await fetchFromTMDB('/discover/movie', {
    with_genres: genreId,
    sort_by: 'release_date.desc',
    'vote_count.gte': 10,
    language: 'en-US',
  });
  const movies = results.slice(0, limit);
  // Fetch full details for each movie to get the description/overview
  const detailedMovies = await Promise.all(
    movies.map(async (movie: any) => {
      try {
        const details = await fetchFromTMDB(`/movie/${movie.id}`);
        return {
          ...movie,
          overview: details.overview,
          poster_url: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
          cover_url: movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : null,
        };
      } catch {
        return {
          ...movie,
          overview: movie.overview || '',
          poster_url: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
          cover_url: movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : null,
        };
      }
    })
  );
  return detailedMovies;
}

export async function getGenreRowsForHome() {
  // You can change genres as needed
  const genres = [
    { id: 28, name: 'Action' },
    { id: 878, name: 'Sci-Fi' },
    { id: 35, name: 'Comedy' },
  ];
  const genreRows = await Promise.all(
    genres.map(async (genre) => {
      const movies = await getMoviesByGenreTMDB(genre.id, 20);
      return { ...genre, movies };
    })
  );
  return genreRows;
}
