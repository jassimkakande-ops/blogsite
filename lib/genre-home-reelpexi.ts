import ReelplexiService from './reelplexi-service'

export async function getGenreRowsForHomeReelpexi(limit = 12) {
  try {
    const genres = await ReelplexiService.getGenres()
    
    // Take first 5 genres for home page
    const topGenres = genres.slice(0, 5)
    
    const genreRows = await Promise.all(
      topGenres.map(async (genre) => {
        try {
          // Fetch both movies and series for this genre
          const [movies, series] = await Promise.all([
            ReelplexiService.getMoviesByGenre(genre.id),
            ReelplexiService.getSeriesByGenre(genre.id),
          ])
          
          // Combine and add type field
          const combined = [
            ...movies.slice(0, limit / 2).map(item => ({
              ...item,
              type: 'movie' as const,
              created_at: item.release_date || new Date().toISOString(),
            })),
            ...series.slice(0, limit / 2).map(item => ({
              ...item,
              type: 'series' as const,
              created_at: item.first_air_date || new Date().toISOString(),
            })),
          ]
          
          return {
            name: genre.name,
            movies: combined.slice(0, limit),
          }
        } catch (error) {
          console.error(`Error fetching genre ${genre.name}:`, error)
          return {
            name: genre.name,
            movies: [],
          }
        }
      })
    )
    
    // Filter out empty genre rows
    return genreRows.filter(row => row.movies.length > 0)
  } catch (error) {
    console.error('Error fetching genre rows from Reelpexi:', error)
    return []
  }
}
