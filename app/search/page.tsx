"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { NetflixCard } from "@/components/NetflixCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"

// Types for the search results
interface Movie {
  id: string
  title: string
  thumbnail_url?: string
  cover_image_url?: string
  description?: string
  release_date?: string
  vjs?: { name: string }
}

interface Series {
  id: string
  title: string
  thumbnail_url?: string
  cover_image_url?: string
  description?: string
  release_date?: string
  vjs?: { name: string }
}

interface AnimeItem {
  id: string
  name?: string
  title?: string
  poster_path?: string
  first_air_date?: string
  overview?: string
  vote_average?: number
}

interface TMDBMovie {
  id: number
  title: string
  poster_url?: string
  description?: string
  release_date?: string
  rating?: number
}

interface TMDBTVShow {
  id: number
  title: string
  poster_url?: string
  description?: string
  release_date?: string
  rating?: number
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [movies, setMovies] = useState<Movie[]>([])
  const [series, setSeries] = useState<Series[]>([])
  const [anime, setAnime] = useState<AnimeItem[]>([])
  const [englishMovies, setEnglishMovies] = useState<TMDBMovie[]>([])
  const [englishSeries, setEnglishSeries] = useState<TMDBTVShow[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"all" | "movies-translated" | "series-translated" | "non-translated">("all")

  const searchContent = async (query: string) => {
    if (!query.trim()) {
      setMovies([])
      setSeries([])
      setAnime([])
      setEnglishMovies([])
      setEnglishSeries([])
      return
    }

    setLoading(true)
    try {
      const normalizedQuery = query.replace(/\s+/g, "")
      
      // Start Supabase search immediately (fastest)
      const supabasePromise = Promise.all([
        supabase
          .from("movies")
          .select(`
            id, title, thumbnail_url, cover_image_url, description, release_date,
            vjs (name)
          `)
          .eq("published", true)
          .ilike("title", `%${normalizedQuery}%`)
          .limit(15), // Reduced limit for faster response
        supabase
          .from("series")
          .select(`
            id, title, thumbnail_url, cover_image_url, description, release_date,
            vjs (name)
          `)
          .eq("published", true)
          .ilike("title", `%${normalizedQuery}%`)
          .limit(15) // Reduced limit for faster response
      ])

      // Get Supabase results first (usually fastest)
      const [movieResults, seriesResults] = await supabasePromise
      
      // Update UI immediately with Supabase results (normalize vjs data)
      const normalizedMovies = (movieResults.data || []).map((movie: any) => ({
        ...movie,
        vjs: Array.isArray(movie.vjs) ? movie.vjs[0] : movie.vjs
      }))
      
      const normalizedSeries = (seriesResults.data || []).map((series: any) => ({
        ...series,
        vjs: Array.isArray(series.vjs) ? series.vjs[0] : series.vjs
      }))
      
      setMovies(normalizedMovies)
      setSeries(normalizedSeries)
      
      // Start TMDB searches in parallel (these are slower)
      const tmdbPromises = [
        fetch(`/api/anime/search?q=${encodeURIComponent(query)}`, {
          signal: AbortSignal.timeout(5000) // 5 second timeout
        }).catch(() => ({ ok: false })),
        fetch(`/api/english-movies-search?q=${encodeURIComponent(query)}`, {
          signal: AbortSignal.timeout(5000)
        }).catch(() => ({ ok: false })),
        fetch(`/api/english-series-search?q=${encodeURIComponent(query)}`, {
          signal: AbortSignal.timeout(5000)
        }).catch(() => ({ ok: false }))
      ]

      // Process TMDB results as they come in
      const [animeResponse, englishMoviesResponse, englishSeriesResponse] = await Promise.all(tmdbPromises)

      // Update anime results
      if (animeResponse.ok && 'json' in animeResponse) {
        const animeData = await animeResponse.json()
        setAnime(animeData.results || [])
      } else {
        setAnime([])
      }

      // Update English movies results
      if (englishMoviesResponse.ok && 'json' in englishMoviesResponse) {
        const englishMoviesData = await englishMoviesResponse.json()
        setEnglishMovies(englishMoviesData || [])
      } else {
        setEnglishMovies([])
      }

      // Update English series results
      if (englishSeriesResponse.ok && 'json' in englishSeriesResponse) {
        const englishSeriesData = await englishSeriesResponse.json()
        setEnglishSeries(englishSeriesData || [])
      } else {
        setEnglishSeries([])
      }

    } catch (error) {
      console.error('Search error:', error)
      // Don't clear existing results on error, just log it
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchContent(searchQuery)
    }, 200) // Reduced from 300ms to 200ms for faster response

    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  const totalResults = movies.length + series.length + anime.length + englishMovies.length + englishSeries.length
  const nonTranslatedTotal = anime.length + englishMovies.length + englishSeries.length

  // Filter results based on active tab
  const getFilteredResults = () => {
    switch (activeTab) {
      case "movies-translated":
        return { movies, series: [], anime: [], englishMovies: [], englishSeries: [] }
      case "series-translated":
        return { movies: [], series, anime: [], englishMovies: [], englishSeries: [] }
      case "non-translated":
        return { movies: [], series: [], anime, englishMovies, englishSeries }
      default: // "all"
        return { movies, series, anime, englishMovies, englishSeries }
    }
  }

  const { movies: filteredMovies, series: filteredSeries, anime: filteredAnime, englishMovies: filteredEnglishMovies, englishSeries: filteredEnglishSeries } = getFilteredResults()

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="container mx-auto px-2 sm:px-4 py-8 flex-1">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6">Search</h1>
          
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search translated movies, translated series, and non-translated content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 bg-gray-900 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Filter Buttons */}
          <div className="bg-gray-900/50 rounded-xl p-4 mb-6">
            <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
              <Button
                variant="ghost"
                onClick={() => setActiveTab("all")}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === "all"
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25"
                    : "bg-gray-800 text-gray-300 hover:bg-orange-500/20 hover:text-orange-400 hover:border-orange-500/50 border border-gray-700"
                }`}
              >
                All ({totalResults})
              </Button>
              <Button
                variant="ghost"
                onClick={() => setActiveTab("movies-translated")}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === "movies-translated"
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25"
                    : "bg-gray-800 text-gray-300 hover:bg-orange-500/20 hover:text-orange-400 hover:border-orange-500/50 border border-gray-700"
                }`}
              >
                Movies Translated ({movies.length})
              </Button>
              <Button
                variant="ghost"
                onClick={() => setActiveTab("series-translated")}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === "series-translated"
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25"
                    : "bg-gray-800 text-gray-300 hover:bg-orange-500/20 hover:text-orange-400 hover:border-orange-500/50 border border-gray-700"
                }`}
              >
                Series Translated ({series.length})
              </Button>
              <Button
                variant="ghost"
                onClick={() => setActiveTab("non-translated")}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === "non-translated"
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25"
                    : "bg-gray-800 text-gray-300 hover:bg-orange-500/20 hover:text-orange-400 hover:border-orange-500/50 border border-gray-700"
                }`}
              >
                Non-Translated ({nonTranslatedTotal})
              </Button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400 text-lg">Searching...</p>
            </div>
          </div>
        )}

        {!searchQuery && !loading && (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Start typing to search for translated and non-translated content</p>
          </div>
        )}

        {searchQuery && !loading && totalResults === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No results found for &quot;{searchQuery}&quot;</p>
            <p className="text-gray-500 text-sm mt-2">Try searching with different keywords</p>
          </div>
        )}

        {!loading && totalResults > 0 && (
          <div className="space-y-8">
            {/* Movies Translated */}
            {filteredMovies.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-blue-400 mb-4">
                  Movies Translated ({filteredMovies.length})
                </h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-1 sm:gap-2">
                  {filteredMovies.map((movie) => (
                    <NetflixCard
                      key={movie.id}
                      content={{
                        id: movie.id,
                        title: movie.title,
                        thumbnail_url: movie.thumbnail_url,
                        cover_image_url: movie.cover_image_url,
                        description: movie.description,
                        release_date: movie.release_date,
                      }}
                      type="movie"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Series Translated */}
            {filteredSeries.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-green-400 mb-4">
                  Series Translated ({filteredSeries.length})
                </h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-1 sm:gap-2">
                  {filteredSeries.map((seriesItem) => (
                    <NetflixCard
                      key={seriesItem.id}
                      content={{
                        id: seriesItem.id,
                        title: seriesItem.title,
                        thumbnail_url: seriesItem.thumbnail_url,
                        cover_image_url: seriesItem.cover_image_url,
                        description: seriesItem.description,
                        release_date: seriesItem.release_date,
                      }}
                      type="series"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Non-Translated Content */}
            {(filteredEnglishMovies.length > 0 || filteredEnglishSeries.length > 0 || filteredAnime.length > 0) && activeTab === "non-translated" && (
              <div>
                <h2 className="text-lg font-semibold text-purple-400 mb-4">
                  Non-Translated ({nonTranslatedTotal})
                </h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-1 sm:gap-2">
                  {/* English Movies */}
                  {filteredEnglishMovies.map((movie) => (
                    <NetflixCard
                      key={`movie-${movie.id}`}
                      content={{
                        id: String(movie.id),
                        title: movie.title,
                        poster_url: movie.poster_url,
                        description: movie.description,
                        release_date: movie.release_date,
                      }}
                      type="movie"
                      isNonTranslated={true}
                    />
                  ))}
                  
                  {/* English Series */}
                  {filteredEnglishSeries.map((seriesItem) => (
                    <NetflixCard
                      key={`series-${seriesItem.id}`}
                      content={{
                        id: String(seriesItem.id),
                        title: seriesItem.title,
                        poster_url: seriesItem.poster_url,
                        description: seriesItem.description,
                        release_date: seriesItem.release_date,
                      }}
                      type="series"
                      isNonTranslated={true}
                    />
                  ))}
                  
                  {/* Anime */}
                  {filteredAnime.map((animeItem) => (
                    <NetflixCard
                      key={`anime-${animeItem.id}`}
                      content={{
                        id: String(animeItem.id),
                        title: animeItem.name || animeItem.title || 'Unknown Title',
                        poster_url: animeItem.poster_path ? `https://image.tmdb.org/t/p/w500${animeItem.poster_path}` : undefined,
                        description: animeItem.overview,
                        release_date: animeItem.first_air_date,
                      }}
                      type="series"
                      isNonTranslated={true}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Show all non-translated content in "All" tab */}
            {activeTab === "all" && (filteredEnglishMovies.length > 0 || filteredEnglishSeries.length > 0 || filteredAnime.length > 0) && (
              <div>
                <h2 className="text-lg font-semibold text-purple-400 mb-4">
                  Non-Translated ({nonTranslatedTotal})
                </h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-1 sm:gap-2">
                  {/* English Movies */}
                  {filteredEnglishMovies.map((movie) => (
                    <NetflixCard
                      key={`all-movie-${movie.id}`}
                      content={{
                        id: String(movie.id),
                        title: movie.title,
                        poster_url: movie.poster_url,
                        description: movie.description,
                        release_date: movie.release_date,
                      }}
                      type="movie"
                      isNonTranslated={true}
                    />
                  ))}
                  
                  {/* English Series */}
                  {filteredEnglishSeries.map((seriesItem) => (
                    <NetflixCard
                      key={`all-series-${seriesItem.id}`}
                      content={{
                        id: String(seriesItem.id),
                        title: seriesItem.title,
                        poster_url: seriesItem.poster_url,
                        description: seriesItem.description,
                        release_date: seriesItem.release_date,
                      }}
                      type="series"
                      isNonTranslated={true}
                    />
                  ))}
                  
                  {/* Anime */}
                  {filteredAnime.map((animeItem) => (
                    <NetflixCard
                      key={`all-anime-${animeItem.id}`}
                      content={{
                        id: String(animeItem.id),
                        title: animeItem.name || animeItem.title || 'Unknown Title',
                        poster_url: animeItem.poster_path ? `https://image.tmdb.org/t/p/w500${animeItem.poster_path}` : undefined,
                        description: animeItem.overview,
                        release_date: animeItem.first_air_date,
                      }}
                      type="series"
                      isNonTranslated={true}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}