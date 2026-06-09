# Reelpexi API Quick Reference

## Import
```typescript
import ReelplexiService from '@/lib/reelplexi-service'
// or use the wrapper functions from @/lib/api
import { getMovies, getSeries, getVJContent } from '@/lib/api'
```

## Common Usage Examples

### 1. Fetch Movies
```typescript
// Get movies (default: page 1, 50 per page)
const movies = await ReelplexiService.getMovies()

// Get specific page
const moviesPage2 = await ReelplexiService.getMovies(2, 50)

// Or use wrapper
const movies = await getMovies(20) // limit 20
```

### 2. Fetch Series
```typescript
// Get series
const series = await ReelplexiService.getSeries()

// Or use wrapper
const series = await getSeries(20) // limit 20
```

### 3. Get Specific Movie/Series
```typescript
// Get movie by ID
const movie = await ReelplexiService.getMovieById('movie-id-123')

// Get series by ID
const series = await ReelplexiService.getSeriesById('series-id-456')
```

### 4. Get Episodes for a Series
```typescript
// Get all episodes for season 1
const episodes = await ReelplexiService.getSeriesEpisodes('series-id', 1)

// Episodes will have:
// - id (synthetic: "seriesId:season:1:episode:1")
// - title, description
// - video_url, embed_url
// - thumbnail_url, cover_image_url
```

### 5. Get Streaming URLs
```typescript
// Get stream URL for a movie
const stream = await ReelplexiService.getMovieStream('movie-id')
console.log(stream?.stream_url) // "https://..."

// Get stream URL for an episode
const episodeStream = await ReelplexiService.getEpisodeStream('series-id', 1, 1)
console.log(episodeStream?.stream_url)
```

### 6. Get Genres
```typescript
const genres = await ReelplexiService.getGenres()
// Returns: [{ id: 'action', name: 'Action' }, ...]

// Get movies by genre
const actionMovies = await ReelplexiService.getMoviesByGenre('action')

// Get series by genre
const actionSeries = await ReelplexiService.getSeriesByGenre('action')
```

### 7. Get Trending Content
```typescript
// All trending (movies + series)
const trending = await ReelplexiService.getTrendingAll()

// Just movies
const trendingMovies = await ReelplexiService.getTrendingMovies()

// Just series
const trendingSeries = await ReelplexiService.getTrendingSeries()
```

### 8. Get Related Content
```typescript
// Related by genre
const relatedMovies = await ReelplexiService.getRelatedMovies('movie-id')
const relatedSeries = await ReelplexiService.getRelatedSeries('series-id')

// Related by VJ translator
const sameVJMovies = await ReelplexiService.getRelatedMoviesByVJ('movie-id')
const sameVJSeries = await ReelplexiService.getRelatedSeriesByVJ('series-id')
```

### 9. Get Top Content (Analytics)
```typescript
// Most watched movies
const topMovies = await ReelplexiService.getTopMovies()

// Most watched series
const topSeries = await ReelplexiService.getTopSeries()
```

### 10. Get VJ-Specific Content
```typescript
// Get only content with VJ translators
const vjMovies = await getVJMovies(10)
const vjSeries = await getVJSeries(10)

// Combined VJ content
const vjContent = await getVJContent(20)
```

### 11. Search Content
```typescript
// Search movies
const searchResults = await searchMovies('inception', 20)

// Search series
const seriesResults = await searchSeries('breaking', 20)
```

### 12. Genre Rows for Home
```typescript
import { getGenreRowsForHomeReelpexi } from '@/lib/genre-home-reelpexi'

const genreRows = await getGenreRowsForHomeReelpexi(12)
// Returns: [{ name: 'Action', movies: [...] }, ...]
```

## Data Structure

### Movie Object
```typescript
{
  id: string
  title: string
  description: string
  overview: string
  release_date: string
  poster_path: string
  thumbnail_url: string
  cover_image_url: string
  backdrop_path: string
  video_url: string
  embed_url: string
  genres: string[]
  genre_ids: string[]
  vjs: { name: string } | undefined
  published: boolean
  created_at: string
  premium: boolean
}
```

### Series Object
```typescript
{
  id: string
  title: string
  name: string
  description: string
  first_air_date: string
  poster_path: string
  thumbnail_url: string
  cover_image_url: string
  genres: string[]
  genre_ids: string[]
  vjs: { name: string } | undefined
  published: boolean
  created_at: string
  seasons: [] // Load separately with getSeriesEpisodes()
}
```

### Episode Object
```typescript
{
  id: string // Synthetic: "seriesId:season:1:episode:2"
  series_id: string
  season_number: number
  episode_number: number
  title: string
  description: string
  thumbnail_url: string
  cover_image_url: string
  video_url: string
  embed_url: string
  published: boolean
}
```

## VJ (Voice Translator) Information

Movies/Series with VJ translators will have:
```typescript
{
  vjs: {
    name: string // e.g., "VJ Junior", "VJ Emmy", "Ice P"
  }
}
```

To filter VJ content:
```typescript
const movies = await ReelplexiService.getMovies()
const vjMovies = movies.filter(movie => movie.vjs?.name)
```

## Error Handling

All methods return empty arrays or null on errors:
```typescript
const movies = await ReelplexiService.getMovies()
// Returns [] if API fails

const movie = await ReelplexiService.getMovieById('id')
// Returns null if not found or API fails
```

## Caching

Next.js automatically caches responses for 1 hour:
```typescript
// Cache is configured in the fetch call:
{ next: { revalidate: 3600 } }
```

To force refresh, restart the dev server or redeploy.

## Environment Variables

Required in `.env.local`:
```
REELPLEXI_API_KEY=sk_sandbox_138dd5fcea75232086bbb599ef33d0cf
REELPLEXI_BASE_URL=https://api.reelplexi.com
```

## Best Practices

1. **Use wrapper functions** from `@/lib/api` for consistency
2. **Check for null/empty** before rendering
3. **Handle loading states** with skeletons or spinners
4. **Display VJ badges** when `vjs.name` exists
5. **Use embed URLs** for iframe players
6. **Use stream URLs** for native video players
7. **Batch requests** when possible (e.g., Promise.all)
8. **Fallback images** when thumbnail_url is missing

## Migration from Supabase

If you're updating existing code:

**Before:**
```typescript
const { data, error } = await supabase.from('movies').select('*')
if (error) return []
return data
```

**After:**
```typescript
const movies = await ReelplexiService.getMovies()
return movies
```

The wrapper functions in `@/lib/api` handle this automatically!
