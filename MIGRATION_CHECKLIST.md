# Reelpexi Migration Checklist

## ✅ Completed

### Core Infrastructure
- [x] Created `lib/reelplexi-config.ts`
- [x] Created `lib/reelplexi-service.ts` (500+ lines)
- [x] Created `lib/genre-home-reelpexi.ts`
- [x] Updated `lib/api.ts` with Reelpexi integration
- [x] Created `.env.local` with credentials
- [x] Updated home page (`app/page.tsx`)

### API Functions Migrated
- [x] `getMovies()`
- [x] `getFeaturedMovie()`
- [x] `getPopularMovies()`
- [x] `getSeries()`
- [x] `getTranslatedMovies/Series()`
- [x] `getVJMovies/Series()`
- [x] `getVJContent()`
- [x] `getGenres()`
- [x] `searchMovies/Series()`
- [x] `getRelatedMoviesByGenre()`
- [x] `getRelatedSeriesByGenre()`
- [x] `getKilaxExclusiveMovies/Series()`
- [x] `getMoviesByCategory/Series()`

### Documentation
- [x] REELPLEXI_IMPLEMENTATION.md
- [x] REELPLEXI_QUICK_REFERENCE.md
- [x] TESTING_GUIDE.md
- [x] README_REELPEXI.md

## 🔄 Pages to Update

### Movie Detail Page
**File:** `app/movies/[id]/page.tsx`

**Current:** Fetches from Supabase
```typescript
const { data } = await supabase
  .from('movies')
  .select('*')
  .eq('id', id)
  .single()
```

**Update to:**
```typescript
import ReelplexiService from '@/lib/reelplexi-service'

const movie = await ReelplexiService.getMovieById(id)
if (!movie) notFound()
```

**Additional:**
- Get related movies: `await ReelplexiService.getRelatedMovies(id)`
- Get streaming URL: `await ReelplexiService.getMovieStream(id)`
- Display VJ information from `movie.vjs?.name`

### Series Detail Page
**File:** `app/series/[id]/page.tsx`

**Update to:**
```typescript
import ReelplexiService from '@/lib/reelplexi-service'

const series = await ReelplexiService.getSeriesById(id)
if (!series) notFound()

// Load seasons/episodes
const episodesSeason1 = await ReelplexiService.getSeriesEpisodes(id, 1)
```

**Additional:**
- Load episodes for each season dynamically
- Get streaming URLs for episodes
- Display VJ information

### Movies List Page
**File:** `app/movies/page.tsx`

**Status:** Should work with updated `lib/api.ts`

**Verify:**
- Movies load from Reelpexi
- Pagination works
- Genre filtering works
- VJ badges display

### Series List Page
**File:** `app/series/page.tsx`

**Status:** Should work with updated `lib/api.ts`

**Verify:**
- Series load from Reelpexi
- Pagination works
- Genre filtering works

### Search Page
**File:** `app/search/page.tsx`

**Status:** Should work with updated `searchMovies/Series()`

**Verify:**
- Search returns Reelpexi results
- Both movies and series appear
- VJ content is searchable

### Categories Page
**File:** `app/categories/page.tsx`

**Update to:**
```typescript
import ReelplexiService from '@/lib/reelplexi-service'

const genres = await ReelplexiService.getGenres()
```

### Player Page
**File:** `app/player/page.tsx`

**Update to use streaming URLs:**
```typescript
// For movies
const stream = await ReelplexiService.getMovieStream(movieId)
const videoUrl = stream?.stream_url

// For series episodes
const stream = await ReelplexiService.getEpisodeStream(seriesId, season, episode)
const videoUrl = stream?.stream_url
```

### Non-Translated Pages
**Files:** `app/non-translated/*`

**Note:** All Reelpexi content IS translated (by VJs), so these pages might need renaming or repurposing.

**Options:**
1. Rename to "VJ Translated" sections
2. Filter content by VJ name
3. Remove if not needed

## 🔍 Components to Update

### NetflixCard Component
**File:** `components/NetflixCard.tsx`

**Verify:**
- Displays Reelpexi data correctly
- Shows VJ badges
- Handles missing images
- Links to correct detail pages

### HeroDetail Component
**File:** `components/HeroDetail.tsx`

**Verify:**
- Works with Reelpexi data structure
- Displays VJ information
- Handles streaming URLs

### SearchResults Component
**File:** `components/SearchResults.tsx`

**Verify:**
- Renders Reelpexi search results
- Shows VJ content correctly

### VideoPlayer Component
**File:** `components/VideoPlayer.tsx`

**Update to use streaming URLs:**
```typescript
// Pass stream URL from Reelpexi
<VideoPlayer src={streamUrl} />
```

## 📊 API Routes to Update

### Search API Route
**File:** `app/api/search/route.ts`

**Update to:**
```typescript
import { searchMovies, searchSeries } from '@/lib/api'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  
  const [movies, series] = await Promise.all([
    searchMovies(query),
    searchSeries(query)
  ])
  
  return Response.json({ movies, series })
}
```

### Genres API Route
**File:** `app/api/genres/route.ts`

**Update to:**
```typescript
import ReelplexiService from '@/lib/reelplexi-service'

export async function GET() {
  const genres = await ReelplexiService.getGenres()
  return Response.json(genres)
}
```

### Stream API Route (if exists)
**File:** `app/api/stream/route.ts`

**Update to:**
```typescript
import ReelplexiService from '@/lib/reelplexi-service'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const type = searchParams.get('type') // 'movie' or 'series'
  
  if (type === 'movie') {
    const stream = await ReelplexiService.getMovieStream(id!)
    return Response.json(stream)
  } else {
    const season = searchParams.get('season')
    const episode = searchParams.get('episode')
    const stream = await ReelplexiService.getEpisodeStream(
      id!,
      parseInt(season!),
      parseInt(episode!)
    )
    return Response.json(stream)
  }
}
```

## 🧹 Cleanup Tasks

### Remove Unused Supabase Queries
- [ ] Check `lib/supabase.ts` for content-related types
- [ ] Update or remove content-specific types
- [ ] Keep user/auth-related types

### Update TypeScript Types
- [ ] Ensure Movie/Series types match Reelpexi structure
- [ ] Add VJ type definitions
- [ ] Update Episode type for synthetic IDs

### Remove Old Files (if applicable)
- [ ] `lib/genre-home-supabase.ts` (replaced by `genre-home-reelpexi.ts`)
- [ ] Any content-specific Supabase queries

## 🎯 Testing Tasks

For each updated page:
- [ ] Verify data loads correctly
- [ ] Check VJ badges display
- [ ] Test error states
- [ ] Verify loading states
- [ ] Check mobile responsiveness
- [ ] Test search functionality
- [ ] Verify pagination
- [ ] Check image loading
- [ ] Test related content
- [ ] Verify streaming URLs

## 📝 Documentation Updates

- [ ] Update main README.md with Reelpexi info
- [ ] Add API documentation
- [ ] Update deployment guide
- [ ] Add troubleshooting section
- [ ] Document environment variables

## 🚀 Deployment Checklist

### Environment Variables
- [ ] Set `REELPLEXI_API_KEY` in production
- [ ] Set `REELPLEXI_BASE_URL` in production
- [ ] Use production API key (not sandbox)

### Performance
- [ ] Verify caching works in production
- [ ] Test with production data
- [ ] Monitor API response times
- [ ] Check for rate limiting

### Monitoring
- [ ] Set up error tracking
- [ ] Monitor API failures
- [ ] Track content load times
- [ ] Monitor cache hit rates

## 🔄 Gradual Migration Strategy

If you prefer a gradual approach:

### Phase 1 (✅ Complete)
- [x] Core API integration
- [x] Home page
- [x] List pages (movies/series)
- [x] Search

### Phase 2 (Recommended Next)
- [ ] Movie detail pages
- [ ] Series detail pages
- [ ] Related content

### Phase 3
- [ ] Video player with streaming
- [ ] Episode loading
- [ ] Advanced search

### Phase 4
- [ ] Optimization
- [ ] Analytics
- [ ] Advanced features

## 📞 Support

If you encounter issues:
1. Check [TESTING_GUIDE.md](./TESTING_GUIDE.md)
2. Review [REELPLEXI_IMPLEMENTATION.md](./REELPLEXI_IMPLEMENTATION.md)
3. Check mobile app reference
4. Test API directly in browser console

## ✨ Success Metrics

Migration is complete when:
- ✅ All pages load Reelpexi data
- ✅ No Supabase content queries remain
- ✅ VJ content displays correctly
- ✅ Search works
- ✅ Streaming URLs functional
- ✅ No console errors
- ✅ Performance acceptable
- ✅ Tests pass

---

**Last Updated:** Today  
**Migration Status:** Phase 1 Complete ✅
