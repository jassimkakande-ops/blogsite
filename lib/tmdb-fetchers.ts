import { fetchFromTMDB, fetchMultiplePagesFromTMDB } from '@/lib/tmdb'
import type { TMDBMovie, TMDBTVShow, TMDBTrendingItem, TMDBSeason } from '@/lib/types/tmdb'

// Fetch popular movies
export async function getPopularMovies() {
  return await fetchFromTMDB('/movie/popular')
}

// Fetch popular TV shows
export async function getPopularTV() {
  return await fetchFromTMDB('/tv/popular')
}

// Fetch popular animations (movies with genre 16) (up to 1000 items)
export async function getPopularAnimations() {
  // Fetch animations from multiple discovery queries to get variety
  const [popularAnimations, topRatedAnimations, recentAnimations] = await Promise.all([
    fetchMultiplePagesFromTMDB('/discover/movie', { 
      with_genres: 16,
      sort_by: 'popularity.desc'
    }, 20), // ~400 items
    fetchMultiplePagesFromTMDB('/discover/movie', { 
      with_genres: 16,
      sort_by: 'vote_average.desc',
      'vote_count.gte': 100
    }, 15), // ~300 items
    fetchMultiplePagesFromTMDB('/discover/movie', { 
      with_genres: 16,
      sort_by: 'release_date.desc',
      'primary_release_date.gte': '2020-01-01'
    }, 15), // ~300 items
  ])
  
  // Combine and deduplicate by ID
  const allAnimations = [...popularAnimations, ...topRatedAnimations, ...recentAnimations]
  const uniqueAnimations = allAnimations.filter((animation, index, self) => 
    index === self.findIndex(a => a.id === animation.id)
  )
  
  // Limit to 1000 items and return without detailed runtime fetching for performance
  return uniqueAnimations.slice(0, 1000)
}

// Fetch more popular animations for slider (20 items)
export async function getPopularAnimationsForSlider() {
  const results = await fetchFromTMDB('/discover/movie', { with_genres: 16 })
  
  // Fetch runtime for each animation movie
  const detailedResults = await Promise.all(
    results.slice(0, 20).map(async (movie: TMDBMovie) => {
      try {
        const details = await fetchFromTMDB(`/movie/${movie.id}`)
        return { ...movie, runtime: details.runtime }
      } catch {
        return movie
      }
    })
  )
  
  return detailedResults
}

// Fetch trending content (all media types) with detailed info
export async function getTrending() {
  const results = await fetchFromTMDB('/trending/all/week')
  
  // Fetch detailed info for each item
  const detailedResults = await Promise.all(
    results.slice(0, 10).map(async (item: TMDBTrendingItem) => {
      try {
        if (item.media_type === 'movie') {
          const details = await fetchFromTMDB(`/movie/${item.id}`)
          return { ...item, runtime: details.runtime }
        } else if (item.media_type === 'tv') {
          const details = await fetchFromTMDB(`/tv/${item.id}`)
          return { ...item, number_of_seasons: details.number_of_seasons }
        }
        return item
      } catch {
        return item
      }
    })
  )
  
  return detailedResults
}

// Fetch more trending content for slider (20 items)
export async function getTrendingForSlider() {
  const results = await fetchFromTMDB('/trending/all/week')
  
  // Fetch detailed info for each item
  const detailedResults = await Promise.all(
    results.slice(0, 20).map(async (item: TMDBTrendingItem) => {
      try {
        if (item.media_type === 'movie') {
          const details = await fetchFromTMDB(`/movie/${item.id}`)
          return { ...item, runtime: details.runtime }
        } else if (item.media_type === 'tv') {
          const details = await fetchFromTMDB(`/tv/${item.id}`)
          return { ...item, number_of_seasons: details.number_of_seasons }
        }
        return item
      } catch {
        return item
      }
    })
  )
  
  return detailedResults
}

// Fetch latest movies with runtime (up to 1000 items)
export async function getLatestMovies() {
  // Fetch from multiple endpoints to get variety
  const [nowPlaying, popular, topRated, upcoming] = await Promise.all([
    fetchMultiplePagesFromTMDB('/movie/now_playing', {}, 15), // ~300 items
    fetchMultiplePagesFromTMDB('/movie/popular', {}, 15), // ~300 items
    fetchMultiplePagesFromTMDB('/movie/top_rated', {}, 10), // ~200 items
    fetchMultiplePagesFromTMDB('/movie/upcoming', {}, 10), // ~200 items
  ])
  
  // Combine and deduplicate by ID
  const allMovies = [...nowPlaying, ...popular, ...topRated, ...upcoming]
  const uniqueMovies = allMovies.filter((movie, index, self) => 
    index === self.findIndex(m => m.id === movie.id)
  )
  
  // Limit to 1000 items and return without detailed runtime fetching for performance
  return uniqueMovies.slice(0, 1000)
}

// Fetch more latest movies for slider (20 items)
export async function getLatestMoviesForSlider() {
  const results = await fetchFromTMDB('/movie/now_playing')
  
  // Fetch runtime for each movie
  const detailedResults = await Promise.all(
    results.slice(0, 20).map(async (movie: TMDBMovie) => {
      try {
        const details = await fetchFromTMDB(`/movie/${movie.id}`)
        return { ...movie, runtime: details.runtime }
      } catch {
        return movie
      }
    })
  )
  
  return detailedResults
}

// Fetch latest TV series with season count (up to 1000 items)
export async function getLatestSeries() {
  // Fetch from multiple endpoints to get variety
  const [onTheAir, popular, topRated, airingToday] = await Promise.all([
    fetchMultiplePagesFromTMDB('/tv/on_the_air', {}, 15), // ~300 items
    fetchMultiplePagesFromTMDB('/tv/popular', {}, 15), // ~300 items
    fetchMultiplePagesFromTMDB('/tv/top_rated', {}, 10), // ~200 items
    fetchMultiplePagesFromTMDB('/tv/airing_today', {}, 10), // ~200 items
  ])
  
  // Combine and deduplicate by ID
  const allSeries = [...onTheAir, ...popular, ...topRated, ...airingToday]
  const uniqueSeries = allSeries.filter((series, index, self) => 
    index === self.findIndex(s => s.id === series.id)
  )
  
  // Limit to 1000 items and return without detailed season count fetching for performance
  return uniqueSeries.slice(0, 1000)
}

// Fetch more latest series for slider (20 items)
export async function getLatestSeriesForSlider() {
  const results = await fetchFromTMDB('/tv/on_the_air')
  
  // Fetch season count for each series
  const detailedResults = await Promise.all(
    results.slice(0, 20).map(async (series: TMDBTVShow) => {
      try {
        const details = await fetchFromTMDB(`/tv/${series.id}`)
        return { ...series, number_of_seasons: details.number_of_seasons }
      } catch {
        return series
      }
    })
  )
  
  return detailedResults
}

// Fetch anime content (TV shows with anime genre from Japan only) (up to 1000 items)
export async function getAnime() {
  // Fetch anime from multiple discovery queries to get variety
  const [japaneseAnime, popularAnime, topRatedAnime] = await Promise.all([
    fetchMultiplePagesFromTMDB('/discover/tv', { 
      with_genres: 16, // Animation genre
      with_origin_country: 'JP' // Only Japanese content
    }, 25), // ~500 items
    fetchMultiplePagesFromTMDB('/discover/tv', { 
      with_genres: 16,
      sort_by: 'popularity.desc'
    }, 15), // ~300 items
    fetchMultiplePagesFromTMDB('/discover/tv', { 
      with_genres: 16,
      sort_by: 'vote_average.desc',
      'vote_count.gte': 100
    }, 10), // ~200 items
  ])
  
  // Combine all anime and filter for Japanese content
  const allAnime = [...japaneseAnime, ...popularAnime, ...topRatedAnime]
  const filteredAnime = allAnime.filter((anime: TMDBTVShow) => 
    anime.origin_country && (anime.origin_country.includes('JP') || anime.origin_country.includes('KR'))
  )
  
  // Deduplicate by ID
  const uniqueAnime = filteredAnime.filter((anime, index, self) => 
    index === self.findIndex(a => a.id === anime.id)
  )
  
  // Limit to 1000 items
  return uniqueAnime.slice(0, 1000)
}

// Fetch more anime for slider (20 items)
export async function getAnimeForSlider() {
  const results = await fetchFromTMDB('/discover/tv', { with_genres: 16 })
  
  // Fetch season count for each anime
  const detailedResults = await Promise.all(
    results.slice(0, 20).map(async (anime: TMDBTVShow) => {
      try {
        const details = await fetchFromTMDB(`/tv/${anime.id}`)
        return { ...anime, number_of_seasons: details.number_of_seasons }
      } catch {
        return anime
      }
    })
  )
  
  return detailedResults
}

// Fetch individual movie details
export async function getTMDBMovieDetails(movieId: string) {
  return await fetchFromTMDB(`/movie/${movieId}`, { append_to_response: 'credits,videos,similar' })
}

// Fetch individual TV show details
export async function getTMDBTVDetails(tvId: string) {
  const tvDetails = await fetchFromTMDB(`/tv/${tvId}`, { append_to_response: 'credits,videos,similar' })

  // Fetch episodes for each season
  if (tvDetails.seasons && tvDetails.seasons.length > 0) {
    const seasonsWithEpisodes = await Promise.all(
      tvDetails.seasons.map(async (season: TMDBSeason) => {
        try {
          const seasonDetails = await fetchFromTMDB(`/tv/${tvId}/season/${season.season_number}`)
          return {
            ...season,
            episodes: seasonDetails.episodes || []
          }
        } catch (error) {
          console.error(`Error fetching episodes for season ${season.season_number}:`, error)
          return {
            ...season,
            episodes: []
          }
        }
      })
    )
    tvDetails.seasons = seasonsWithEpisodes
  }

  return tvDetails
}

// Fetch similar movies
export async function getSimilarMovies(movieId: string) {
  return await fetchFromTMDB(`/movie/${movieId}/similar`)
}

// Fetch similar TV shows
export async function getSimilarTV(tvId: string) {
  return await fetchFromTMDB(`/tv/${tvId}/similar`)
}

// Example search for movies or TV
export async function searchTMDBMovies(query: string) {
  return await fetchFromTMDB('/search/movie', { query })
}

export async function searchTMDBTV(query: string) {
  return await fetchFromTMDB('/search/tv', { query })
}
