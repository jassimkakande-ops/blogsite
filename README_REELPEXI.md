# Reelpexi Integration for Kilax Website

## 🎬 Overview

This project has been successfully migrated from Supabase to **Reelpexi API** for all movie and series content, matching the implementation used in the KilaxMovies mobile app. All content is now fetched from Reelpexi, including VJ-translated movies and series.

## 📁 Project Structure

```
blog_site/
├── lib/
│   ├── reelplexi-config.ts          # Reelpexi configuration
│   ├── reelplexi-service.ts         # Complete Reelpexi API service
│   ├── genre-home-reelpexi.ts       # Genre rows for home page
│   └── api.ts                       # Wrapper functions (updated)
├── .env.local                        # Environment variables
├── REELPLEXI_IMPLEMENTATION.md      # Detailed implementation docs
├── REELPLEXI_QUICK_REFERENCE.md     # API quick reference
└── TESTING_GUIDE.md                 # Testing instructions
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Ensure `.env.local` exists with:
```
REELPLEXI_API_KEY=sk_sandbox_138dd5fcea75232086bbb599ef33d0cf
REELPLEXI_BASE_URL=https://api.reelplexi.com
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:4577](http://localhost:4577)

## 🎯 Key Features

### ✨ Implemented Features
- ✅ Movie browsing from Reelpexi
- ✅ Series browsing with season support
- ✅ VJ (Voice Translator) content highlighting
- ✅ Genre-based filtering
- ✅ Trending content
- ✅ Search functionality
- ✅ Related content recommendations
- ✅ Featured/hero content rotation
- ✅ Top movies/series analytics
- ✅ Streaming URL generation
- ✅ Automatic caching (1 hour)

### 🎭 VJ (Voice Translator) Support
The platform fully supports VJ-translated content with:
- VJ name extraction and display
- VJ-specific filtering
- VJ badges on content cards
- Related content by same VJ translator

## 📚 Documentation

### Core Documents
1. **[REELPLEXI_IMPLEMENTATION.md](./REELPLEXI_IMPLEMENTATION.md)** - Complete implementation details
2. **[REELPLEXI_QUICK_REFERENCE.md](./REELPLEXI_QUICK_REFERENCE.md)** - API usage examples
3. **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Testing procedures

### Mobile App Reference
The implementation mirrors: `Kilax/lib/core/services/reelplexi_service.dart`

## 🔧 API Usage Examples

### Fetch Movies
```typescript
import { getMovies } from '@/lib/api'

const movies = await getMovies(20)
```

### Fetch Series
```typescript
import { getSeries } from '@/lib/api'

const series = await getSeries(20)
```

### Get VJ Content
```typescript
import { getVJContent } from '@/lib/api'

const vjContent = await getVJContent(12)
```

### Search
```typescript
import { searchMovies } from '@/lib/api'

const results = await searchMovies('inception')
```

### Direct Reelpexi API
```typescript
import ReelplexiService from '@/lib/reelplexi-service'

// Get movie by ID
const movie = await ReelplexiService.getMovieById('123')

// Get genres
const genres = await ReelplexiService.getGenres()

// Get trending
const trending = await ReelplexiService.getTrendingMovies()

// Get streaming URL
const stream = await ReelplexiService.getMovieStream('123')
```

See [REELPLEXI_QUICK_REFERENCE.md](./REELPLEXI_QUICK_REFERENCE.md) for more examples.

## 🔄 Migration from Supabase

### What Changed
- **Movies/Series data:** Now from Reelpexi (was Supabase)
- **Genres:** Now from Reelpexi (was Supabase)
- **Search:** Now filters Reelpexi data (was Supabase query)
- **VJ content:** Now from Reelpexi (was Supabase join)

### What Stayed the Same
- User authentication (still Supabase)
- User profiles (still Supabase)
- Subscriptions (still Supabase)
- Watchlist/History (still Supabase)

### API Compatibility
All existing function signatures in `lib/api.ts` remain the same, ensuring backward compatibility.

## 🧪 Testing

### Run Tests
```bash
# Start dev server
npm run dev

# Open browser
http://localhost:4577
```

Follow the detailed testing checklist in [TESTING_GUIDE.md](./TESTING_GUIDE.md).

### Quick Validation
1. ✅ Home page loads
2. ✅ Movies section populated
3. ✅ Series section populated
4. ✅ VJ badges visible
5. ✅ Genre rows display
6. ✅ Search works
7. ✅ No console errors

## 🎨 Data Structure

### Movie Object
```typescript
{
  id: string
  title: string
  description: string
  thumbnail_url: string
  cover_image_url: string
  video_url: string
  release_date: string
  genres: string[]
  vjs?: { name: string }
}
```

### Series Object
```typescript
{
  id: string
  title: string
  description: string
  thumbnail_url: string
  first_air_date: string
  genres: string[]
  vjs?: { name: string }
  seasons: []
}
```

## 🔐 Environment Variables

Required in `.env.local`:
```env
# Reelpexi API
REELPLEXI_API_KEY=sk_sandbox_138dd5fcea75232086bbb599ef33d0cf
REELPLEXI_BASE_URL=https://api.reelplexi.com

# Supabase (for auth/profiles)
NEXT_PUBLIC_SUPABASE_URL=https://cshuwyaclvabveofknrw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key-here

# Optional
NEXT_PUBLIC_TMDB_API_KEY=your-key-here
```

## 📦 Dependencies

No new dependencies required! Reelpexi service uses:
- Native `fetch` API
- Next.js caching (`next: { revalidate }`)
- TypeScript for type safety

## ⚡ Performance

### Caching Strategy
- **Duration:** 1 hour per request
- **Method:** Next.js automatic revalidation
- **Benefit:** Reduces API calls, improves speed

### Optimization Tips
1. Use wrapper functions from `lib/api.ts`
2. Batch requests with `Promise.all()`
3. Implement loading skeletons
4. Add error boundaries
5. Lazy load images

## 🐛 Troubleshooting

### Common Issues

**Issue:** No content displays
```bash
# Check environment variables
cat .env.local | grep REELPLEXI

# Check browser console for errors
# Check Network tab for API calls
```

**Issue:** 401 Unauthorized
```bash
# Verify API key in .env.local
# Restart dev server
npm run dev
```

**Issue:** Slow loading
```bash
# Check caching is enabled
# Reduce per-page limits
# Monitor Network tab
```

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for detailed troubleshooting.

## 📈 Future Enhancements

### Planned Features
- [ ] Detail pages with Reelpexi data
- [ ] Episode loading for series
- [ ] Video player with stream URLs
- [ ] Advanced search filters
- [ ] Genre-specific pages
- [ ] VJ translator profiles
- [ ] Continue watching sync
- [ ] Recommendations engine

### Optional Improvements
- [ ] Server-side pagination
- [ ] Infinite scroll
- [ ] Image optimization
- [ ] SEO metadata from Reelpexi
- [ ] Offline mode with service workers
- [ ] Analytics integration

## 🤝 Contributing

When adding new features:
1. Follow existing patterns in `reelplexi-service.ts`
2. Add wrapper functions to `lib/api.ts`
3. Update documentation
4. Test thoroughly
5. Handle errors gracefully

## 📄 License

This project is part of the Kilax platform.

## 🆘 Support

For issues or questions:
1. Check [TESTING_GUIDE.md](./TESTING_GUIDE.md)
2. Review [REELPLEXI_IMPLEMENTATION.md](./REELPLEXI_IMPLEMENTATION.md)
3. Check browser console and Network tab
4. Review mobile app implementation for reference

## 🎉 Success Criteria

The integration is successful when:
- ✅ All content loads from Reelpexi
- ✅ No Supabase content queries remain
- ✅ VJ content displays correctly
- ✅ Performance is acceptable (< 3s load)
- ✅ No console errors
- ✅ Search works
- ✅ Genre filtering functions
- ✅ Mobile app and website content match

---

**Built with ❤️ for Kilax** | Powered by Reelpexi API
