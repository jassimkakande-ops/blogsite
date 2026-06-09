// Client-side API wrapper for Reelpexi endpoints
// Use these functions in client components ("use client")

export async function getMoviesClient(page = 1, limit = 50) {
  try {
    const response = await fetch(`/api/reelplexi/movies?page=${page}&limit=${limit}`)
    const data = await response.json()
    return data.success ? { data: data.data, hasMore: data.pagination?.hasMore ?? false } : { data: [], hasMore: false }
  } catch (error) {
    console.error('Error fetching movies:', error)
    return { data: [], hasMore: false }
  }
}

export async function getSeriesClient(page = 1, limit = 50) {
  try {
    const response = await fetch(`/api/reelplexi/series?page=${page}&limit=${limit}`)
    if (!response.ok) return { data: [], hasMore: false }
    const data = await response.json()
    return data.success ? { data: data.data, hasMore: data.pagination?.hasMore ?? false } : { data: [], hasMore: false }
  } catch (error) {
    console.error('Error fetching series:', error)
    return { data: [], hasMore: false }
  }
}

export async function getVJContentClient(limit = 12) {
  try {
    const response = await fetch(`/api/reelplexi/vj-content?limit=${limit}`)
    const data = await response.json()
    return data.success ? data.data : []
  } catch (error) {
    console.error('Error fetching VJ content:', error)
    return []
  }
}

export async function getKilaxExclusiveContentClient(limit = 12) {
  // All Reelpexi content is considered exclusive
  try {
    const [moviesResult, seriesResult] = await Promise.all([
      getMoviesClient(1, Math.ceil(limit / 2)),
      getSeriesClient(1, Math.ceil(limit / 2))
    ])
    
    const combined = [
      ...moviesResult.data.map((item: any) => ({ ...item, type: 'movie' as const })),
      ...seriesResult.data.map((item: any) => ({ ...item, type: 'series' as const })),
    ]
    
    return combined.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ).slice(0, limit)
  } catch (error) {
    console.error('Error fetching exclusive content:', error)
    return []
  }
}

export async function getGenreRowsClient(limit = 12) {
  try {
    console.log('Fetching genre rows...')
    const response = await fetch(`/api/reelplexi/genres?limit=${limit}`)
    console.log('Genre rows response status:', response.status)
    if (!response.ok) {
      console.error('Genre rows failed with status:', response.status)
      return []
    }
    const data = await response.json()
    console.log('Genre rows data:', data)
    return data.success ? data.data : []
  } catch (error) {
    console.error('Error fetching genre rows:', error)
    return []
  }
}

export async function searchMoviesClient(query: string) {
  try {
    const response = await fetch(`/api/reelplexi/search?q=${encodeURIComponent(query)}&type=movies`)
    const data = await response.json()
    return data.success ? data.data : []
  } catch (error) {
    console.error('Error searching movies:', error)
    return []
  }
}

export async function searchSeriesClient(query: string) {
  try {
    const response = await fetch(`/api/reelplexi/search?q=${encodeURIComponent(query)}&type=series`)
    const data = await response.json()
    return data.success ? data.data : []
  } catch (error) {
    console.error('Error searching series:', error)
    return []
  }
}

export async function getVJsClient() {
  try {
    const response = await fetch('/api/reelplexi/vjs')
    const data = await response.json()
    return data.success ? data.data : []
  } catch (error) {
    console.error('Error fetching VJs:', error)
    return []
  }
}

export async function getMoviesByVJClient(vjId: string, vjName: string) {
  try {
    const response = await fetch(`/api/reelplexi/movies-by-vj?vjId=${encodeURIComponent(vjId)}&vjName=${encodeURIComponent(vjName)}`)
    const data = await response.json()
    return data.success ? data.data : []
  } catch (error) {
    console.error('Error fetching movies by VJ:', error)
    return []
  }
}

export async function getSeriesByVJClient(vjId: string, vjName: string) {
  try {
    const response = await fetch(`/api/reelplexi/series-by-vj?vjId=${encodeURIComponent(vjId)}&vjName=${encodeURIComponent(vjName)}`)
    const data = await response.json()
    return data.success ? data.data : []
  } catch (error) {
    console.error('Error fetching series by VJ:', error)
    return []
  }
}

export async function getMovieByIdClient(id: string) {
  try {
    const response = await fetch(`/api/reelplexi/movie?id=${encodeURIComponent(id)}`)
    const data = await response.json()
    return data.success ? data.data : null
  } catch (error) {
    console.error('Error fetching movie:', error)
    return null
  }
}

export async function getSeriesByIdClient(id: string, season?: number) {
  try {
    const url = season 
      ? `/api/reelplexi/series?id=${encodeURIComponent(id)}&season=${season}`
      : `/api/reelplexi/series?id=${encodeURIComponent(id)}`
    const response = await fetch(url)
    const data = await response.json()
    return data.success ? data.data : null
  } catch (error) {
    console.error('Error fetching series:', error)
    return null
  }
}

export async function getStreamUrlClient(id: string, type: 'movie' | 'episode', season?: number, episode?: number) {
  try {
    let url = `/api/reelplexi/stream?id=${encodeURIComponent(id)}&type=${type}`
    if (type === 'episode' && season !== undefined && episode !== undefined) {
      url += `&season=${season}&episode=${episode}`
    }
    const response = await fetch(url)
    const data = await response.json()
    // Return the stream_url directly from the response
    return data.stream_url || null
  } catch (error) {
    console.error('Error fetching stream URL:', error)
    return null
  }
}
