import { supabase, Movie, Series, Genre } from './supabase'
import ReelplexiService, { ReelplexiMovie, ReelplexiSeries } from './reelplexi-service'

// Movies API - Enhanced with video URLs and watchable content from Reelpexi
export async function getMovies(limit = 20) {
  try {
    const movies = await ReelplexiService.getMovies(1, limit)
    return movies.map(movie => ({
      ...movie,
      created_at: movie.release_date || new Date().toISOString(),
      published: true,
      premium: false,
    })) as unknown as Movie[]
  } catch (error) {
    console.error('Error fetching movies from Reelpexi:', error)
    return []
  }
}

export async function getFeaturedMovie() {
  try {
    const trending = await ReelplexiService.getTrendingMovies(1, 1)
    if (trending.length === 0) return null
    const movie = trending[0]
    return {
      ...movie,
      created_at: movie.release_date || new Date().toISOString(),
      published: true,
      premium: false,
      recommend: true,
    } as unknown as Movie
  } catch (error) {
    console.error('Error fetching featured movie from Reelpexi:', error)
    return null
  }
}

export async function getPopularMovies(limit = 6) {
  try {
    const movies = await ReelplexiService.getTopMovies(1, limit)
    return movies.map(movie => ({
      ...movie,
      created_at: movie.release_date || new Date().toISOString(),
      published: true,
      premium: false,
      popular: true,
    })) as unknown as Movie[]
  } catch (error) {
    console.error('Error fetching popular movies from Reelpexi:', error)
    return []
  }
}

// Series API - Enhanced with video URLs and watchable content from Reelpexi
export async function getSeries(limit = 20) {
  try {
    const series = await ReelplexiService.getSeries(1, limit)
    return series.map(show => ({
      ...show,
      created_at: show.first_air_date || new Date().toISOString(),
      published: true,
      seasons: [], // Seasons loaded separately when needed
    })) as unknown as Series[]
  } catch (error) {
    console.error('Error fetching series from Reelpexi:', error)
    return []
  }
}

// Translated Content (VJ-translated content) - Enhanced with video URLs from Reelpexi
export async function getTranslatedMovies(limit = 6) {
  return getMovies(limit)
}

export async function getTranslatedSeries(limit = 6) {
  return getSeries(limit)
}

// Combined translated content
export async function getTranslatedContent(limit = 12) {
  const movies = await getTranslatedMovies(limit / 2)
  const series = await getTranslatedSeries(limit / 2)

  // Combine and add type field
  const combined = [
    ...movies.map(item => ({ ...item, type: 'movie' as const })),
    ...series.map(item => ({ ...item, type: 'series' as const }))
  ]

  // Sort by created_at
  return combined.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ).slice(0, limit)
}

// VJ Content (content WITH VJs) - Enhanced with video URLs from Reelpexi
export async function getVJMovies(limit = 6) {
  try {
    const movies = await ReelplexiService.getMovies(1, limit)
    // Filter only movies with VJ translators
    const vjMovies = movies.filter(movie => movie.vjs?.name)
    return vjMovies.map(movie => ({
      ...movie,
      created_at: movie.release_date || new Date().toISOString(),
      published: true,
      premium: false,
    })) as unknown as (Movie & { vjs: { id: string; name: string } | null })[]
  } catch (error) {
    console.error('Error fetching VJ movies from Reelpexi:', error)
    return []
  }
}

export async function getVJSeries(limit = 6) {
  try {
    const series = await ReelplexiService.getSeries(1, limit)
    // Filter only series with VJ translators
    const vjSeries = series.filter(show => show.vjs?.name)
    return vjSeries.map(show => ({
      ...show,
      created_at: show.first_air_date || new Date().toISOString(),
      published: true,
      seasons: [],
    })) as unknown as (Series & { vjs: { id: string; name: string } | null })[]
  } catch (error) {
    console.error('Error fetching VJ series from Reelpexi:', error)
    return []
  }
}

// Combined VJ content
export async function getVJContent(limit = 12) {
  const movies = await getVJMovies(limit / 2)
  const series = await getVJSeries(limit / 2)

  // Combine and add type field
  const combined = [
    ...movies.map(item => ({ ...item, type: 'movie' as const })),
    ...series.map(item => ({ ...item, type: 'series' as const }))
  ]

  // Sort by created_at
  return combined.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ).slice(0, limit)
}



// Genres API from Reelpexi
export async function getGenres() {
  try {
    const genres = await ReelplexiService.getGenres()
    return genres as Genre[]
  } catch (error) {
    console.error('Error fetching genres from Reelpexi:', error)
    return []
  }
}

// Search API - Enhanced with video URLs from Reelpexi
export async function searchMovies(query: string, limit = 20) {
  try {
    const allMovies = await ReelplexiService.getMovies(1, 100)
    const filtered = allMovies.filter(movie => 
      movie.title.toLowerCase().includes(query.toLowerCase()) ||
      movie.description?.toLowerCase().includes(query.toLowerCase())
    )
    return filtered.slice(0, limit).map(movie => ({
      ...movie,
      created_at: movie.release_date || new Date().toISOString(),
      published: true,
      premium: false,
    })) as unknown as Movie[]
  } catch (error) {
    console.error('Error searching movies from Reelpexi:', error)
    return []
  }
}

export async function searchSeries(query: string, limit = 20) {
  try {
    const allSeries = await ReelplexiService.getSeries(1, 100)
    const filtered = allSeries.filter(show => 
      show.title.toLowerCase().includes(query.toLowerCase()) ||
      show.description?.toLowerCase().includes(query.toLowerCase())
    )
    return filtered.slice(0, limit).map(show => ({
      ...show,
      created_at: show.first_air_date || new Date().toISOString(),
      published: true,
      seasons: [],
    })) as unknown as Series[]
  } catch (error) {
    console.error('Error searching series from Reelpexi:', error)
    return []
  }
}

// Related content by genre - Enhanced with video URLs from Reelpexi
export async function getRelatedMoviesByGenre(movieId: string, genreIds: string[], limit = 6) {
  try {
    const related = await ReelplexiService.getRelatedMovies(movieId, 1, limit)
    return related.map(movie => ({
      ...movie,
      created_at: movie.release_date || new Date().toISOString(),
      published: true,
      premium: false,
    })) as unknown as Movie[]
  } catch (error) {
    console.error('Error fetching related movies from Reelpexi:', error)
    return []
  }
}

export async function getRelatedSeriesByGenre(seriesId: string, genreIds: string[], limit = 6) {
  try {
    const related = await ReelplexiService.getRelatedSeries(seriesId, 1, limit)
    return related.map(show => ({
      ...show,
      created_at: show.first_air_date || new Date().toISOString(),
      published: true,
      seasons: [],
    })) as unknown as Series[]
  } catch (error) {
    console.error('Error fetching related series from Reelpexi:', error)
    return []
  }
}

// Kilax Exclusive Content API - All content from Reelpexi is considered exclusive
export async function getKilaxExclusiveMovies(limit = 6) {
  return getMovies(limit)
}

export async function getKilaxExclusiveSeries(limit = 6) {
  return getSeries(limit)
}

// Combined Kilax exclusive content
export async function getKilaxExclusiveContent(limit = 12) {
  const movies = await getKilaxExclusiveMovies(limit / 2)
  const series = await getKilaxExclusiveSeries(limit / 2)

  // Combine and add type field
  const combined = [
    ...movies.map(item => ({ ...item, type: 'movie' as const })),
    ...series.map(item => ({ ...item, type: 'series' as const }))
  ]

  // Sort by created_at
  return combined.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ).slice(0, limit) as Array<(Movie | Series) & { type: 'movie' | 'series'; vjs: { id: string; name: string } | null }>
}

// Category API - Enhanced with video URLs from Reelpexi
export async function getMoviesByCategory(category: string, limit = 20) {
  try {
    const movies = await ReelplexiService.getMoviesByGenre(category.toLowerCase(), 1, limit)
    return movies.map(movie => ({
      ...movie,
      created_at: movie.release_date || new Date().toISOString(),
      published: true,
      premium: false,
      category,
    })) as unknown as Movie[]
  } catch (error) {
    console.error('Error fetching movies by category from Reelpexi:', error)
    return []
  }
}

export async function getSeriesByCategory(category: string, limit = 20) {
  try {
    const series = await ReelplexiService.getSeriesByGenre(category.toLowerCase(), 1, limit)
    return series.map(show => ({
      ...show,
      created_at: show.first_air_date || new Date().toISOString(),
      published: true,
      seasons: [],
      category,
    })) as unknown as Series[]
  } catch (error) {
    console.error('Error fetching series by category from Reelpexi:', error)
    return []
  }
}