# Testing the Reelpexi Implementation

## Quick Start

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Open browser:**
   Navigate to `http://localhost:4577`

3. **Check console:**
   Open browser DevTools (F12) and check for errors

## Test Checklist

### ✅ Home Page Tests

- [ ] Hero section loads with featured content
- [ ] "VJ Movies & Series" section displays
- [ ] "Kilax Exclusive" section shows content
- [ ] "Latest Movies" section populated
- [ ] "Latest Series" section populated
- [ ] Genre rows display (Action, Romance, Drama, etc.)
- [ ] All thumbnails load properly
- [ ] VJ badges show on content with translators
- [ ] No "undefined" or "null" text visible
- [ ] Auto-slide works on hero banner

### ✅ Movies Page Tests

- [ ] Movies list loads from Reelpexi
- [ ] Pagination works (if implemented)
- [ ] Movie cards display correctly
- [ ] Click on movie navigates to detail page

### ✅ Series Page Tests

- [ ] Series list loads from Reelpexi
- [ ] Series cards display correctly
- [ ] Click on series navigates to detail page

### ✅ Search Tests

- [ ] Search bar accepts input
- [ ] Search returns results from Reelpexi
- [ ] Both movies and series appear in results
- [ ] VJ content is searchable

### ✅ Genre/Category Tests

- [ ] Genre pages load content
- [ ] Genre filtering works correctly
- [ ] Mixed movies/series in genre views

### ✅ Data Quality Tests

- [ ] Movie titles display correctly
- [ ] Descriptions show without errors
- [ ] Release dates format properly
- [ ] VJ names appear when available
- [ ] Images load (poster and backdrop)
- [ ] No broken image placeholders

### ✅ Performance Tests

- [ ] Initial page load < 3 seconds
- [ ] Subsequent navigations are fast
- [ ] No excessive API calls in Network tab
- [ ] Caching works (check Network tab for 304s)

## Manual Testing Scenarios

### Scenario 1: First Time Visitor
1. Open incognito/private window
2. Navigate to home page
3. Verify all content loads
4. Check that VJ content is highlighted
5. Click on a movie → should see details
6. Go back → content should load from cache

### Scenario 2: Search & Browse
1. Use search bar
2. Type "action" or any genre
3. Verify results appear
4. Click a result
5. Check related content section
6. Verify VJ translator info displays

### Scenario 3: Genre Exploration
1. Navigate to a genre page
2. Verify mixed content (movies + series)
3. Check that genre name matches
4. Verify "See All" links work
5. Test pagination if available

### Scenario 4: VJ Content
1. Look for VJ badges on cards
2. Click VJ content
3. Verify VJ name shows in details
4. Check related VJ content works

## Debugging Commands

### Check Reelpexi Config
```typescript
// In browser console
console.log(process.env.REELPLEXI_API_KEY)
console.log(process.env.REELPLEXI_BASE_URL)
```

### Test API Directly
Open your browser console and run:

```javascript
// Test movie fetch
fetch('https://api.reelplexi.com/v1/movies?page=1&per_page=10', {
  headers: {
    'Authorization': 'Bearer sk_sandbox_138dd5fcea75232086bbb599ef33d0cf'
  }
})
.then(r => r.json())
.then(data => console.log('Movies:', data))

// Test series fetch
fetch('https://api.reelplexi.com/v1/series?page=1&per_page=10', {
  headers: {
    'Authorization': 'Bearer sk_sandbox_138dd5fcea75232086bbb599ef33d0cf'
  }
})
.then(r => r.json())
.then(data => console.log('Series:', data))

// Test genres
fetch('https://api.reelplexi.com/v1/genres', {
  headers: {
    'Authorization': 'Bearer sk_sandbox_138dd5fcea75232086bbb599ef33d0cf'
  }
})
.then(r => r.json())
.then(data => console.log('Genres:', data))
```

### Check Network Requests
1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Look for requests to `api.reelplexi.com`
4. Verify:
   - Status: 200 OK
   - Response has `data` array
   - Headers include Authorization

### Common Issues & Solutions

#### Issue: "Reelplexi API key is missing"
**Solution:** Check `.env.local` exists and has `REELPLEXI_API_KEY`

#### Issue: "401 Unauthorized"
**Solution:** Verify API key is correct in `.env.local`

#### Issue: No content displays
**Solution:** 
1. Check browser console for errors
2. Verify API responses in Network tab
3. Check that `data` array in response is not empty

#### Issue: Images not loading
**Solution:** 
1. Check if `thumbnail_url` or `poster_url` exists
2. Verify URLs are valid
3. Implement placeholder images

#### Issue: VJ content not showing
**Solution:**
1. Check if content has `vjs.name` field
2. Verify VJ filtering logic
3. Test with `getVJMovies()` directly

#### Issue: Slow loading
**Solution:**
1. Check if caching is working
2. Reduce `perPage` limit
3. Implement progressive loading
4. Add loading skeletons

## Logs to Monitor

### Server Console (Terminal)
Look for:
```
✓ Compiled in XXXms
Error fetching movies from Reelpexi: ...
Error fetching series from Reelpexi: ...
```

### Browser Console
Look for:
```
Movies: [...]
Series: [...]
Genres: [...]
Error fetching data: ...
```

## API Response Validation

### Expected Movie Response
```json
{
  "data": [
    {
      "id": "123",
      "title": "Movie Title",
      "description": "...",
      "poster_url": "https://...",
      "backdrop_url": "https://...",
      "release_date": "2024-01-01",
      "genres": ["Action", "Drama"],
      "vjs": { "name": "VJ Junior" }
    }
  ]
}
```

### Expected Series Response
```json
{
  "data": [
    {
      "id": "456",
      "title": "Series Title",
      "first_air_date": "2024-01-01",
      "poster_url": "https://...",
      "vjs": { "name": "VJ Emmy" }
    }
  ]
}
```

## Performance Benchmarks

### Target Metrics
- Initial page load: < 3 seconds
- Time to interactive: < 5 seconds
- API response time: < 1 second
- Cache hit rate: > 80% after first load

### Measure Performance
```javascript
// In browser console
performance.measure('page-load')
console.log(performance.getEntriesByType('navigation')[0])
```

## Production Checklist

Before deploying to production:

- [ ] Environment variables set in production
- [ ] API key is production key (not sandbox)
- [ ] Caching is working correctly
- [ ] Error boundaries implemented
- [ ] Loading states added
- [ ] Image placeholders configured
- [ ] Search is performant
- [ ] All pages tested
- [ ] Mobile responsive
- [ ] Analytics tracking added

## Support Resources

- **Reelpexi API Docs:** Check Reelpexi documentation
- **Mobile App Reference:** `c:\Users\Hp\Kilax\conven\conven\Kilax\lib\core\services\reelplexi_service.dart`
- **Implementation Doc:** `REELPEXI_IMPLEMENTATION.md`
- **Quick Reference:** `REELPEXI_QUICK_REFERENCE.md`

## Automated Testing (Future Enhancement)

Consider adding:
```typescript
// __tests__/reelplexi.test.ts
import ReelplexiService from '@/lib/reelplexi-service'

describe('Reelpexi Service', () => {
  it('should fetch movies', async () => {
    const movies = await ReelplexiService.getMovies()
    expect(movies).toBeInstanceOf(Array)
    expect(movies.length).toBeGreaterThan(0)
  })
  
  it('should fetch genres', async () => {
    const genres = await ReelplexiService.getGenres()
    expect(genres).toBeInstanceOf(Array)
    expect(genres[0]).toHaveProperty('id')
    expect(genres[0]).toHaveProperty('name')
  })
})
```

Run tests with: `npm test` (after setting up Jest/Vitest)
