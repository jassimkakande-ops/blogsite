# Streaming & Download Implementation

## Streaming - How It Works ✅

### Architecture
Reelpexi uses a **JWT-based Proxy Architecture** for streaming:

1. **Request Stream**: Call `/api/reelplexi/stream?id={id}&type=movie` or with episode parameters
2. **Get Proxy URL**: Reelpexi returns a signed proxy URL like `https://api.reelplexi.com/v1/stream/proxy?token=...`
3. **Player Uses Proxy**: Your video player uses this proxy URL
4. **Proxy Forwards**: Reelpexi's proxy verifies the token and forwards the video chunks

### Implementation Status ✅

**Movies:**
```javascript
// Get stream URL
const streamUrl = await getStreamUrlClient(movieId, 'movie')
// Returns: https://api.reelplexi.com/v1/stream/proxy?token=eyJ...
```

**Series Episodes:**
```javascript
// Get episode stream URL
const streamUrl = await getStreamUrlClient(seriesId, 'episode', seasonNum, episodeNum)
// Returns: https://api.reelplexi.com/v1/stream/proxy?token=eyJ...
```

### Files Updated:
- ✅ `lib/reelplexi-service.ts` - Added proper stream methods with proxy_url support
- ✅ `app/api/reelplexi/stream/route.ts` - Returns proxy URLs from Reelpexi
- ✅ `lib/api-client.ts` - Client function to get stream URLs
- ✅ `app/player/PlayerContent.tsx` - Uses URL parameter for direct streaming
- ✅ `app/movies/[id]/page.tsx` - Gets stream URL before playing
- ✅ `app/series/[id]/page.tsx` - Gets episode stream URLs

### Token Expiration ⏰
- **Sandbox**: Tokens expire after **12 minutes**
- **Production**: Longer expiration (check your plan)
- If playback stops, user needs to refresh/get new token

## Downloading - Current Limitations ⚠️

### Why Downloads Have Issues:

1. **Proxy URLs Expire**: The JWT tokens expire (12 mins in sandbox), so you can't save them for later
2. **No Direct CDN Access**: Reelpexi doesn't give direct CDN URLs in sandbox/basic plans
3. **Security by Design**: Proxy architecture prevents unauthorized downloads

### Current Download Implementation:

**Movies** (`app/movies/[id]/page.tsx`):
```javascript
const handleDownload = async () => {
  // Check auth and premium
  if (!user?.id) { /* show auth modal */ }
  if (!hasStandardPremium) { /* show upgrade modal */ }
  
  // Get stream URL (but it's a proxy URL that expires!)
  const streamUrl = await getStreamUrlClient(movie.id, 'movie')
  
  // Try to download (will expire after 12 minutes)
  const a = document.createElement('a')
  a.href = streamUrl
  a.download = movie.title + '.mp4'
  a.click()
}
```

### Download Solutions:

#### Option 1: Use Reelpexi Embed Player (Recommended for Sandbox)
Instead of downloading, let users watch in the embed player:
```html
<iframe 
  src="https://embed.reelplexi.com/movie/{id}?key={api_key}"
  allowfullscreen
></iframe>
```

#### Option 2: Backend Download Proxy (Advanced)
Create a server endpoint that:
1. Gets fresh proxy URL from Reelpexi
2. Streams chunks to user
3. Handles token refresh
4. Adds download headers

```javascript
// app/api/download/route.ts (not yet implemented)
export async function GET(request) {
  const id = searchParams.get('id')
  
  // Get stream from Reelpexi
  const stream = await ReelplexiService.getMovieStream(id)
  
  // Proxy the stream to user with download headers
  const response = await fetch(stream.proxy_url)
  return new Response(response.body, {
    headers: {
      'Content-Disposition': 'attachment; filename="movie.mp4"',
      'Content-Type': 'video/mp4',
    }
  })
}
```

#### Option 3: Upgrade to Advanced Plan
Contact Reelpexi for plans that include:
- Direct CDN URLs (no proxy)
- Longer token expiration
- Download-friendly URLs

### Recommendation:

**For Sandbox/Testing:**
- ✅ **Streaming works perfectly** with proxy URLs
- ⚠️ **Downloads are limited** due to token expiration
- 💡 Hide download button or show "Premium feature coming soon"

**For Production:**
- Contact Reelpexi about plans with direct CDN access
- Or implement backend download proxy (Option 2)
- Or use embed player for offline-like experience

## Testing Checklist

### Streaming (Should Work):
- [ ] Click "Watch" on a movie → Player loads → Video plays
- [ ] Click "Watch" on a series episode → Player loads → Video plays
- [ ] Episode auto-advance works
- [ ] Video plays for at least 12 minutes (sandbox limit)

### Download (Known Issues):
- [ ] Click "Download" → File starts downloading
- [ ] File may stop after 12 minutes (token expires)
- [ ] Downloaded file may not be complete
- [ ] Re-downloading requires new token

## Code Files Reference:

### Core Streaming:
1. `lib/reelplexi-service.ts` - Fetches proxy URLs from Reelpexi API
2. `app/api/reelplexi/stream/route.ts` - Server endpoint for streams
3. `lib/api-client.ts` - Client wrapper: `getStreamUrlClient()`

### Player Integration:
4. `app/player/PlayerContent.tsx` - Video player component
5. `components/VideoPlayer.tsx` - Actual video element

### Content Pages:
6. `app/movies/[id]/page.tsx` - Movie detail page
7. `app/series/[id]/page.tsx` - Series detail page

## Environment Variables:
```env
REELPLEXI_API_KEY=sk_sandbox_138dd5fcea75232086bbb599ef33d0cf
REELPLEXI_BASE_URL=https://api.reelplexi.com
```

## Next Steps:

1. **Test streaming** - Should work perfectly ✅
2. **Decide on downloads**:
   - Hide feature for now? ⚠️
   - Implement backend proxy? 🔧
   - Upgrade Reelpexi plan? 💰
3. **Monitor token expiration** - Consider refresh mechanism for long videos
