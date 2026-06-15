import { ReelplexiConfig } from './reelplexi-config'

export interface ReelplexiMovie {
  id: string
  title: string
  name?: string
  overview?: string
  description?: string
  release_date?: string
  released_at?: string
  year?: number
  poster_url?: string
  poster_path?: string
  thumbnail_url?: string
  backdrop_url?: string
  backdrop_path?: string
  cover_image_url?: string
  embed_url?: string
  stream_url?: string
  proxy_url?: string
  video_url?: string
  genres?: string[]
  genre_ids?: string[]
  vj_name?: string
  vj?: string
  translator?: string
  vjs?: { name: string }
  available_vj_versions?: Array<{ vj_name?: string; name?: string }>
  published?: boolean
}

export interface ReelplexiSeries extends ReelplexiMovie {
  first_air_date?: string
  number_of_seasons?: number
  seasons?: number
}

export interface ReelplexiEpisode {
  id: string
  series_id?: string
  season_number: number
  episode_number: number
  title?: string
  name?: string
  overview?: string
  description?: string
  thumbnail_url?: string
  poster_url?: string
  poster_path?: string
  backdrop_url?: string
  backdrop_path?: string
  cover_image_url?: string
  video_url?: string
  stream_url?: string
  proxy_url?: string
  embed_url?: string
  published?: boolean
}

class ReelplexiService {
  private static async getJson(
    path: string,
    query?: Record<string, string>
  ): Promise<any> {
    if (!ReelplexiConfig.isConfigured) {
      throw new Error('Reelplexi API key is missing')
    }

    const url = new URL(`${ReelplexiConfig.baseUrl}${path}`)
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        url.searchParams.set(key, value)
      })
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${ReelplexiConfig.apiKey}`,
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!response.ok) {
      let message = 'Unknown API error'
      try {
        const body = await response.json()
        if (body.error) {
          message = typeof body.error === 'object' ? body.error.message : body.error
        }
      } catch {
        message = await response.text() || message
      }
      throw new Error(`Reelplexi API error (${response.status}): ${message}`)
    }

    return response.json()
  }

  private static normalizeMovie(raw: any): ReelplexiMovie {
    const genres = Array.isArray(raw.genres) ? raw.genres.filter((g: any) => g?.toString().trim()) : []
    const vjName = this.extractVjName(raw)
    const posterUrl = raw.poster_url
    const backdropUrl = raw.backdrop_url || posterUrl

    // Log the raw data to see what we're getting
    console.log('Reelplexi movie raw data:', {
      id: raw.id,
      title: raw.title,
      embed_url: raw.embed_url,
      stream_url: raw.stream_url,
      proxy_url: raw.proxy_url,
      video_url: raw.video_url
    })

    // Build embed URL: always ensure the API key is appended, whether from the API or constructed
    const buildEmbedUrl = (base: string | undefined, id: string | undefined): string | undefined => {
      const baseUrl = base || (id ? `https://embed.reelplexi.com/movie/${id}` : undefined)
      if (!baseUrl) return undefined
      return baseUrl.includes('?')
        ? `${baseUrl}&key=${ReelplexiConfig.apiKey}`
        : `${baseUrl}?key=${ReelplexiConfig.apiKey}`
    }

    return {
      ...raw,
      id: raw.id?.toString() || '',
      title: raw.title || raw.name || 'Untitled',
      overview: raw.overview || raw.description,
      description: raw.description || raw.overview || '',
      release_date: raw.release_date || raw.released_at || this.yearToDate(raw.year),
      poster_path: posterUrl,
      thumbnail_url: posterUrl,
      cover_image_url: backdropUrl,
      backdrop_path: backdropUrl,
      embed_url: buildEmbedUrl(raw.embed_url, raw.id?.toString()),
      video_url: raw.stream_url || raw.proxy_url,
      genres,
      genre_ids: genres.map((g: string) => g.toLowerCase()),
      vjs: vjName ? { name: vjName } : undefined,
      published: true,
      premium: raw.premium !== false,
    }
  }

  private static normalizeSeries(raw: any): ReelplexiSeries {
    const genres = Array.isArray(raw.genres) ? raw.genres.filter((g: any) => g?.toString().trim()) : []
    const vjName = this.extractVjName(raw)
    const posterUrl = raw.poster_url
    const backdropUrl = raw.backdrop_url || posterUrl

    return {
      ...raw,
      id: raw.id?.toString() || '',
      title: raw.title || raw.name || 'Untitled',
      name: raw.name || raw.title || 'Untitled',
      overview: raw.overview || raw.description,
      description: raw.description || raw.overview || '',
      first_air_date: raw.first_air_date || this.yearToDate(raw.year) || raw.release_date,
      poster_path: posterUrl,
      thumbnail_url: posterUrl,
      cover_image_url: backdropUrl,
      backdrop_path: backdropUrl,
      genres,
      genre_ids: genres.map((g: string) => g.toLowerCase()),
      vjs: vjName ? { name: vjName } : undefined,
      published: true,
      premium: raw.premium !== false,
    }
  }

  private static normalizeMixedContent(raw: any): ReelplexiMovie | ReelplexiSeries {
    if (raw.type === 'series' || raw.first_air_date || raw.seasons != null) {
      return this.normalizeSeries(raw)
    }
    return this.normalizeMovie(raw)
  }

  private static normalizeEpisode(seriesId: string, season: number, raw: any): ReelplexiEpisode {
    const episodeNumber = parseInt(raw.episode_number?.toString() || '0')
    const posterUrl = raw.poster_url || raw.thumbnail_url
    const backdropUrl = raw.backdrop_url || posterUrl
    const syntheticId = `${seriesId}:season:${season}:episode:${episodeNumber}`

    // Build episode embed URL: always ensure the API key is appended
    const buildEpisodeEmbedUrl = (base: string | undefined, sid: string, s: number, ep: number): string | undefined => {
      const baseUrl = base || `https://embed.reelplexi.com/tv/${sid}/${s}/${ep}`
      return baseUrl.includes('?')
        ? `${baseUrl}&key=${ReelplexiConfig.apiKey}`
        : `${baseUrl}?key=${ReelplexiConfig.apiKey}`
    }

    return {
      ...raw,
      id: syntheticId,
      series_id: raw.series_id || seriesId,
      season_number: season,
      episode_number: episodeNumber,
      title: raw.title || `Episode ${episodeNumber}`,
      name: raw.name || raw.title || `Episode ${episodeNumber}`,
      overview: raw.overview || raw.description,
      description: raw.description || raw.overview || '',
      thumbnail_url: posterUrl,
      poster_path: posterUrl,
      cover_image_url: backdropUrl,
      backdrop_path: backdropUrl,
      video_url: raw.video_url || raw.stream_url || raw.proxy_url,
      embed_url: buildEpisodeEmbedUrl(raw.embed_url, raw.series_id || seriesId, season, episodeNumber),
      published: true,
    }
  }

  private static extractVjName(raw: any): string | undefined {
    const direct = raw.vj_name || raw.vj || raw.translator
    if (direct?.trim()) return direct.trim()

    const versions = raw.available_vj_versions
    if (Array.isArray(versions) && versions.length > 0 && versions[0]) {
      return versions[0].vj_name || versions[0].name
    }
    return undefined
  }

  private static yearToDate(year: any): string | undefined {
    const parsed = parseInt(year?.toString() || '')
    return isNaN(parsed) ? undefined : `${parsed}-01-01`
  }

  static async getMovies(page = 1, perPage = 50): Promise<ReelplexiMovie[]> {
    const response = await this.getJson('/v1/movies', {
      page: page.toString(),
      per_page: perPage.toString(),
    })
    const data = Array.isArray(response.data) ? response.data : []
    return data.map((item: any) => this.normalizeMovie(item))
  }

  static async getMovieById(id: string): Promise<ReelplexiMovie | null> {
    try {
      const response = await this.getJson(`/v1/movies/${id}`)
      console.log('Raw API response for movie:', JSON.stringify(response, null, 2))
      const movie = response.data || response
      return movie ? this.normalizeMovie(movie) : null
    } catch (error) {
      console.error('Error fetching movie by ID:', error)
      return null
    }
  }

  static async getSeries(page = 1, perPage = 50): Promise<ReelplexiSeries[]> {
    const response = await this.getJson('/v1/series', {
      page: page.toString(),
      per_page: perPage.toString(),
    })
    const data = Array.isArray(response.data) ? response.data : []
    return data.map((item: any) => this.normalizeSeries(item))
  }

  static async getSeriesById(id: string): Promise<ReelplexiSeries | null> {
    try {
      const response = await this.getJson(`/v1/series/${id}`)
      const series = response.data || response
      return series ? this.normalizeSeries(series) : null
    } catch {
      return null
    }
  }

  static async getSeriesEpisodes(seriesId: string, season: number): Promise<ReelplexiEpisode[]> {
    try {
      const response = await this.getJson(`/v1/series/${seriesId}/seasons/${season}/episodes`)
      const data = Array.isArray(response.data) ? response.data : []
      return data.map((episode: any) => this.normalizeEpisode(seriesId, season, episode))
    } catch {
      return []
    }
  }

  static async getMovieStream(id: string): Promise<{ stream_url?: string; proxy_url?: string; expires_at?: string } | null> {
    try {
      // Try to get stream from the API
      try {
        const response = await this.getJson(`/v1/movies/${id}/stream`)
        const streamData = response.data || response
        
        console.log('Movie stream data from API:', streamData)
        
        // Return the actual URLs from the API
        if (streamData.video_url) {
          return { 
            stream_url: streamData.video_url,
            proxy_url: streamData.video_url,
          }
        }
      } catch (apiError) {
        console.error('Error fetching movie stream from API:', apiError)
      }
      
      return null
    } catch (error) {
      console.error('Error getting movie stream:', error)
      return null
    }
  }

  static async getEpisodeStream(seriesId: string, season: number, episode: number): Promise<{ stream_url?: string; proxy_url?: string; expires_at?: string } | null> {
    try {
      // Try to get the episode stream directly
      try {
        const response = await this.getJson(`/v1/series/${seriesId}/seasons/${season}/episodes/${episode}/stream`)
        const streamData = response.data || response
        
        console.log('Episode stream data from API:', streamData)
        
        if (streamData.video_url) {
          return { 
            stream_url: streamData.video_url,
            proxy_url: streamData.video_url,
          }
        }
      } catch (apiError) {
        console.error('Error fetching episode stream from API:', apiError)
      }
      
      return null
    } catch (error) {
      console.error('Error getting episode stream:', error)
      return null
    }
  }

  static async getMovieDownload(id: string): Promise<string | null> {
    try {
      const response = await this.getJson(`/v1/download/movie/${id}`)
      return response.download_url || null
    } catch (error) {
      console.error('Error getting movie download URL:', error)
      return null
    }
  }

  static async getEpisodeDownload(seriesId: string, season: number, episode: number): Promise<string | null> {
    try {
      const response = await this.getJson(`/v1/download/tv/${seriesId}/${season}/${episode}`)
      return response.download_url || null
    } catch (error) {
      console.error('Error getting episode download URL:', error)
      return null
    }
  }

  static async getGenres(): Promise<Array<{ id: string; name: string }>> {
    try {
      const response = await this.getJson('/v1/genres')
      const raw = response.data
      if (!Array.isArray(raw)) return []

      return raw
        .map((g) => g?.toString().trim())
        .filter((g) => g)
        .map((genre) => ({
          id: genre.toLowerCase(),
          name: this.titleCase(genre),
        }))
    } catch {
      return []
    }
  }

  static async getMoviesByGenre(genre: string): Promise<ReelplexiMovie[]> {
    try {
      const genreId = genre.toLowerCase()
      console.log(`Fetching movies for genre: ${genreId} from /v1/genres/${genreId}/movies`)
      const response = await this.getJson(`/v1/genres/${genreId}/movies`)
      console.log(`Raw genre response:`, JSON.stringify(response, null, 2))
      const data = Array.isArray(response.data) ? response.data : []
      return data.map((item: any) => this.normalizeMovie(item))
    } catch (error) {
      console.error(`Error fetching movies for genre ${genre}:`, error)
      return []
    }
  }

  static async getSeriesByGenre(genre: string): Promise<ReelplexiSeries[]> {
    try {
      const genreId = genre.toLowerCase()
      const response = await this.getJson(`/v1/genres/${genreId}/series`)
      const data = Array.isArray(response.data) ? response.data : []
      return data.map((item: any) => this.normalizeSeries(item))
    } catch (error) {
      console.error(`Error fetching series for genre ${genre}:`, error)
      return []
    }
  }

  static async getTrendingAll(page = 1, perPage = 50): Promise<Array<ReelplexiMovie | ReelplexiSeries>> {
    try {
      const response = await this.getJson('/v1/trending/all', {
        page: page.toString(),
        per_page: perPage.toString(),
      })
      const data = Array.isArray(response.data) ? response.data : []
      return data.map((item: any) => this.normalizeMixedContent(item))
    } catch {
      return []
    }
  }

  static async searchAll(query: string, page = 1, perPage = 50): Promise<Array<ReelplexiMovie | ReelplexiSeries>> {
    try {
      const response = await this.getJson('/v1/search', {
        q: query,
        page: page.toString(),
        per_page: perPage.toString(),
      })
      const data = Array.isArray(response.data) ? response.data : []
      return data.map((item: any) => this.normalizeMixedContent(item))
    } catch {
      return []
    }
  }

  static async searchMovies(query: string, page = 1, perPage = 50): Promise<ReelplexiMovie[]> {
    try {
      const response = await this.getJson('/v1/movies/search', {
        q: query,
        page: page.toString(),
        per_page: perPage.toString(),
      })
      const data = Array.isArray(response.data) ? response.data : []
      return data.map((item: any) => this.normalizeMovie(item))
    } catch {
      return []
    }
  }

  static async searchSeries(query: string, page = 1, perPage = 50): Promise<ReelplexiSeries[]> {
    try {
      const response = await this.getJson('/v1/series/search', {
        q: query,
        page: page.toString(),
        per_page: perPage.toString(),
      })
      const data = Array.isArray(response.data) ? response.data : []
      return data.map((item: any) => this.normalizeSeries(item))
    } catch {
      return []
    }
  }

  static async getTrendingMovies(page = 1, perPage = 50): Promise<ReelplexiMovie[]> {
    try {
      const response = await this.getJson('/v1/trending/movies', {
        page: page.toString(),
        per_page: perPage.toString(),
      })
      const data = Array.isArray(response.data) ? response.data : []
      return data.map((item: any) => this.normalizeMovie(item))
    } catch {
      return []
    }
  }

  static async getTrendingSeries(page = 1, perPage = 50): Promise<ReelplexiSeries[]> {
    try {
      const response = await this.getJson('/v1/trending/series', {
        page: page.toString(),
        per_page: perPage.toString(),
      })
      const data = Array.isArray(response.data) ? response.data : []
      return data.map((item: any) => this.normalizeSeries(item))
    } catch {
      return []
    }
  }

  static async getRelatedMovies(id: string, page = 1, perPage = 20): Promise<ReelplexiMovie[]> {
    try {
      const response = await this.getJson(`/v1/movies/${id}/related/genre`, {
        page: page.toString(),
        per_page: perPage.toString(),
      })
      const data = Array.isArray(response.data) ? response.data : []
      return data.map((item: any) => this.normalizeMovie(item))
    } catch {
      return []
    }
  }

  static async getRelatedMoviesByVJ(id: string, page = 1, perPage = 20): Promise<ReelplexiMovie[]> {
    try {
      const response = await this.getJson(`/v1/movies/${id}/related/vj`, {
        page: page.toString(),
        per_page: perPage.toString(),
      })
      const data = Array.isArray(response.data) ? response.data : []
      return data.map((item: any) => this.normalizeMovie(item))
    } catch {
      return []
    }
  }

  static async getRelatedSeries(id: string, page = 1, perPage = 20): Promise<ReelplexiSeries[]> {
    try {
      const response = await this.getJson(`/v1/series/${id}/related/genre`, {
        page: page.toString(),
        per_page: perPage.toString(),
      })
      const data = Array.isArray(response.data) ? response.data : []
      return data.map((item: any) => this.normalizeSeries(item))
    } catch {
      return []
    }
  }

  static async getRelatedSeriesByVJ(id: string, page = 1, perPage = 20): Promise<ReelplexiSeries[]> {
    try {
      const response = await this.getJson(`/v1/series/${id}/related/vj`, {
        page: page.toString(),
        per_page: perPage.toString(),
      })
      const data = Array.isArray(response.data) ? response.data : []
      return data.map((item: any) => this.normalizeSeries(item))
    } catch {
      return []
    }
  }

  static async getTopMovies(page = 1, perPage = 20): Promise<ReelplexiMovie[]> {
    try {
      const response = await this.getJson('/v1/account/analytics/top-movies', {
        page: page.toString(),
        per_page: perPage.toString(),
      })
      const data = Array.isArray(response.data) ? response.data : []
      return data.map((item: any) => this.normalizeMovie(item))
    } catch {
      return []
    }
  }

  static async getTopSeries(page = 1, perPage = 20): Promise<ReelplexiSeries[]> {
    try {
      const response = await this.getJson('/v1/account/analytics/top-series', {
        page: page.toString(),
        per_page: perPage.toString(),
      })
      const data = Array.isArray(response.data) ? response.data : []
      return data.map((item: any) => this.normalizeSeries(item))
    } catch {
      return []
    }
  }

  private static titleCase(value: string): string {
    return value
      .split(' ')
      .filter((part) => part.trim())
      .map((part) => {
        const p = part.trim()
        return p.length === 1 ? p.toUpperCase() : `${p[0].toUpperCase()}${p.substring(1).toLowerCase()}`
      })
      .join(' ')
  }
}

export default ReelplexiService
