# Deployment Guide

## Prerequisites

1. Vercel account (free tier works)
2. Supabase project with tables created
3. Git repository (optional but recommended)

## Step 1: Prepare Environment Variables

### Local Development

1. Copy the config template:
```bash
cp config.example.js config.js
```

2. Edit `config.js` with your actual Supabase credentials:
```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

**Note:** `config.js` is gitignored for security.

### Vercel Deployment

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables

2. Add these variables:
   - `SUPABASE_URL` = `https://your-project.supabase.co`
   - `SUPABASE_ANON_KEY` = `your-anon-key-here`

3. Apply to: Production, Preview, and Development

## Step 2: Deploy to Vercel

### Option A: Git Integration (Recommended)

1. Push your code to GitHub/GitLab/Bitbucket:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_REPO_URL
git push -u origin main
```

2. Import project in Vercel:
   - Go to Vercel Dashboard
   - Click "Add New Project"
   - Import your Git repository
   - Add environment variables
   - Deploy!

### Option B: Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow prompts:
   - Link to existing project? No
   - Project name? [your-app-name]
   - Directory? ./
   - Override settings? No

4. Add environment variables in Vercel Dashboard

5. Redeploy:
```bash
vercel --prod
```

## Step 3: Verify Deployment

1. Open your Vercel URL
2. Check browser console for:
   - "Migration completed successfully!" (first load)
   - No Supabase errors
3. Test features:
   - Start/stop timer
   - Create todos
   - Add notes
   - Create tags
4. Verify in Supabase Dashboard → Table Editor

## Step 4: Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Wait for DNS propagation (5-30 minutes)

## Security Checklist

- [ ] `config.js` is in .gitignore
- [ ] Environment variables set in Vercel
- [ ] No sensitive keys in Git history
- [ ] Supabase RLS policies enabled (if needed)
- [ ] Test deployment works without local config.js

## Troubleshooting

### Config not loading in production

**Problem:** App can't connect to Supabase after deployment

**Solution:**
1. Verify environment variables in Vercel Dashboard
2. Check variable names match exactly: `SUPABASE_URL` and `SUPABASE_ANON_KEY`
3. Redeploy after adding variables

### Migration not running

**Problem:** Data not syncing to Supabase

**Solution:**
1. Check browser console for errors
2. Verify Supabase tables exist (run SUPABASE_MIGRATION.sql)
3. Check network tab for failed requests
4. Verify API keys are correct

### CORS errors

**Problem:** API requests blocked by CORS

**Solution:**
1. Supabase anon key should work without CORS issues
2. If using custom API routes, check CORS headers
3. Verify Supabase URL is correct

## Files Included in Deployment

**Essential files:**
- `index.html` - Main app
- `app.js` - Application logic
- `styles.css` - Styling
- `config.js` - Supabase config (local only, not in Git)
- `vercel.json` - Vercel configuration
- `api/config.js` - Serverless function for config (optional)

**Documentation:**
- `README.md` - Project overview
- `SUPABASE_SETUP.md` - Supabase setup guide
- `SUPABASE_MIGRATION.sql` - Database schema

**Excluded from Git:**
- All `test-*.html` files
- All `verify-*.js` files
- All `task-*-completion-*.md` files
- `.kiro/` directory
- `config.js` (use config.example.js as template)

## Post-Deployment

1. Share your app URL with users
2. Monitor Supabase usage in dashboard
3. Check Vercel analytics for traffic
4. Collect user feedback
5. Iterate and improve!

## Updating the App

### With Git Integration:
```bash
git add .
git commit -m "Update description"
git push
```
Vercel auto-deploys on push!

### With Vercel CLI:
```bash
vercel --prod
```

## Support

If you encounter issues:
1. Check browser console for errors
2. Review Vercel deployment logs
3. Verify Supabase connection in dashboard
4. Check TROUBLESHOOTING.md for common issues
