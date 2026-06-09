# CRITICAL: CORS Configuration Required

## Problem
Videos won't play due to CORS error:
```
Access to video at 'https://api.reelplexi.com/v1/stream/proxy?token=...' 
from origin 'http://localhost:4577' has been blocked by CORS policy
```

## Solution

### Step 1: Add Allowed Domain in Reelplexi Dashboard

1. Go to: https://app.reelplexi.com/dashboard/api-keys
2. Click "Edit" on your API key: `sk_sandbox_138dd5fcea75232086bbb599ef33d0cf`
3. In "Allowed Domains" section, add:
   - `http://localhost:4577` (for local development)
   - `http://localhost:3000` (if testing on default port)
   - Your production domain when deploying (e.g., `https://yourdomain.com`)

4. Save the changes

### Step 2: Wait a Few Minutes
CORS changes may take 1-2 minutes to propagate.

### Step 3: Test Again
Refresh your browser and try playing a movie.

## Important Notes

- **Sandbox keys require allowed domains** to be configured
- Without this, the browser will block all video requests
- You must add EACH domain/port you use (localhost:4577, localhost:3000, production domain)
- Use `http://` for localhost, `https://` for production

## Production Deployment

When deploying to production, update the allowed domains to include:
```
https://yourdomain.com
https://www.yourdomain.com
```

Remove localhost domains from production keys for security.
