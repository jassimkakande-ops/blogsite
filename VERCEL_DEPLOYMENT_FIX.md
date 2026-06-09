# VERCEL DEPLOYMENT CHECKLIST

## Required Environment Variables to Set in Vercel Dashboard

Go to: Project Settings → Environment Variables

### Supabase (REQUIRED)
- `NEXT_PUBLIC_SUPABASE_URL` = your_supabase_project_url
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your_supabase_anon_key
- `SUPABASE_SERVICE_ROLE_KEY` = your_supabase_service_role_key (for admin operations)

### MakyPay (REQUIRED for payments)
- `MAKYPAY_API_KEY` = your_makypay_api_key
- `MAKYPAY_API_SECRET` = your_makypay_api_secret
- `MAKYPAY_BASE64_AUTH` = your_base64_encoded_credentials (recommended)

### Reelplexi (REQUIRED for content)
- `NEXT_PUBLIC_REELPLEXI_API_KEY` = your_reelplexi_api_key

### App Configuration
- `NEXT_PUBLIC_APP_URL` = https://your-vercel-domain.vercel.app

## Steps to Fix 404 Error:

1. **Set ALL environment variables in Vercel**:
   - Go to vercel.com → Your Project → Settings → Environment Variables
   - Add each variable above
   - Apply to: Production, Preview, and Development

2. **Redeploy**:
   - Go to Deployments tab
   - Click "..." on latest deployment
   - Click "Redeploy"
   - OR push a new commit to trigger rebuild

3. **Check Build Logs**:
   - Click on deployment
   - Check "Building" logs for errors
   - Check "Runtime Logs" after deployment

4. **Common Issues**:
   - Missing SUPABASE_URL/ANON_KEY = App crashes immediately
   - Missing REELPLEXI_API_KEY = No content loads
   - Port conflicts = Already fixed (removed -p 4577)

## Quick Test After Fixing:
Visit: https://your-domain.vercel.app
Should see homepage, not 404

## Need Help?
Check Vercel deployment logs:
vercel.com → Project → Deployments → Click deployment → View Logs
