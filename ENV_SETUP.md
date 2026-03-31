# Environment Variables Setup

## Overview

This app uses environment variables to keep Supabase credentials secure. The setup works differently for local development vs production deployment.

## Local Development

For local development, credentials are hardcoded in `config.js` (which is gitignored).

**Current setup:** Already configured and working!

## Production Deployment (Vercel)

### Step 1: Add Environment Variables in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (or create new one)
3. Go to **Settings** → **Environment Variables**
4. Add these two variables:

| Name | Value |
|------|-------|
| `SUPABASE_URL` | `https://mgydwgatzllsizlbrwgp.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1neWR3Z2F0emxsc2l6bGJyd2dwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NTQyNDcsImV4cCI6MjA5MDQzMDI0N30.g615HRf9JDTvtAmIkwEJbzbrRK-LhRaRUL-_OGJKRRY` |

5. Select environments: **Production**, **Preview**, **Development**
6. Click **Save**

### Step 2: Deploy

```bash
# First time
vercel

# Or if already deployed
vercel --prod
```

### Step 3: Verify

1. Open your Vercel URL
2. Open browser console
3. Look for: `✓ Loaded config from environment variables`
4. Test the app - create todos, notes, etc.
5. Check Supabase Dashboard to verify data syncing

## How It Works

### Local Development
- `config.js` has hardcoded credentials
- App uses them directly
- Console shows: `Using local config`

### Production (Vercel)
- `api/config.js` serverless function reads from environment variables
- App fetches config from `/api/config` endpoint
- Console shows: `✓ Loaded config from environment variables`
- Credentials never exposed in client code

## Security Benefits

✅ **Credentials not in Git** - `config.js` is gitignored
✅ **Credentials not in client code** - Loaded from serverless function in production
✅ **Easy to rotate** - Update in Vercel dashboard, redeploy
✅ **Safe to open source** - No secrets in repository

## Troubleshooting

### "Using local config" in production

**Problem:** App is using hardcoded values instead of environment variables

**Solution:**
1. Verify environment variables are set in Vercel Dashboard
2. Check variable names match exactly: `SUPABASE_URL` and `SUPABASE_ANON_KEY`
3. Redeploy: `vercel --prod`

### API endpoint not found

**Problem:** `/api/config` returns 404

**Solution:**
1. Verify `api/config.js` file exists in your project
2. Redeploy to Vercel
3. Check Vercel Functions tab to see if function deployed

### CORS errors

**Problem:** Browser blocks API request

**Solution:**
- The `api/config.js` already has CORS headers set to `*`
- If still having issues, check browser console for specific error
- Verify the API endpoint URL is correct

## For Open Source Projects

If you're making this project public:

1. **Remove credentials from config.js:**
```javascript
let SUPABASE_URL = '';
let SUPABASE_ANON_KEY = '';
```

2. **Update README with setup instructions:**
```markdown
## Setup

1. Create a Supabase project
2. Run SUPABASE_MIGRATION.sql in SQL Editor
3. Copy your credentials to config.js
4. For deployment, add credentials to Vercel environment variables
```

3. **Add config.example.js to repo:**
```bash
git add config.example.js
git commit -m "Add config template"
```

## Quick Reference

**Local:** Credentials in `config.js` (gitignored)
**Production:** Credentials in Vercel environment variables
**API Function:** `api/config.js` serves credentials securely
**Fallback:** If API fails, uses local config (development only)
