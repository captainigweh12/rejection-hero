# Quick Production Deployment Guide

## Current Situation
You're running on Vibecode sandbox which uses `sandbox.dev` domain. To show your real domain (`rejectionhero.com`) in Google OAuth, you need to deploy your backend to a production server.

## Fastest Deployment Option: Railway (5-10 minutes)

### Step 1: Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub
3. Connect your repository or upload this project

### Step 2: Deploy Backend to Railway

**Option A: Deploy from GitHub**
1. Push your code to GitHub
2. In Railway dashboard, click "New Project"
3. Select "Deploy from GitHub repo"
4. Select your repository
5. Railway will auto-detect Bun and deploy

**Option B: Deploy from CLI**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

### Step 3: Add PostgreSQL Database
1. In Railway project dashboard, click "New"
2. Select "Database" → "PostgreSQL"
3. Railway automatically sets DATABASE_URL environment variable

### Step 4: Set Environment Variables

In Railway dashboard, go to your service → Variables → Add these:

```bash
NODE_ENV=production
PORT=3000
BETTER_AUTH_SECRET=your-secret-min-32-chars-long-change-this-value
BACKEND_URL=${{RAILWAY_PUBLIC_DOMAIN}}
DATABASE_PROVIDER=postgresql

# Copy from your current .env
GOOGLE_CLIENT_ID=94427138884-cc2db90qkmg6dfshccce94ffmt5rpla0.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_IOS_CLIENT_ID=94427138884-vp4hj04sfr29fndq917iau9alpiv52e6.apps.googleusercontent.com
OPENAI_API_KEY=<your-key>
GOOGLE_MAPS_API_KEY=AIzaSyCHMHlOrPPSRULrUf-FqPWHz0Y6PJoPrRk
```

### Step 5: Get Your Production URL
Railway will give you a URL like: `https://your-app.up.railway.app`

### Step 6: Update Google OAuth
1. Go to https://console.cloud.google.com
2. APIs & Services → Credentials
3. Edit your Web OAuth client
4. Add to **Authorized redirect URIs**:
   ```
   https://your-app.up.railway.app/api/auth/callback/google
   ```

### Step 7: Point Custom Domain (Optional)
1. In Railway, go to Settings → Domains
2. Add custom domain: `api.rejectionhero.com`
3. Add DNS records Railway provides
4. Update Google OAuth with: `https://api.rejectionhero.com/api/auth/callback/google`

### Step 8: Update Vibecode Environment
In Vibecode app, update environment variable:
```
EXPO_PUBLIC_VIBECODE_BACKEND_URL=https://your-app.up.railway.app
```
Or if using custom domain:
```
EXPO_PUBLIC_VIBECODE_BACKEND_URL=https://api.rejectionhero.com
```

### Step 9: Rebuild Mobile App
```bash
# This rebuilds the app with new backend URL
# Vibecode will do this automatically when you update the env var
```

---

## Alternative: Vercel Deployment (5 minutes)

### Deploy Backend to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd backend
vercel --prod
```

### Add PostgreSQL
Use Neon (free tier):
1. Go to https://neon.tech
2. Create database
3. Copy connection string
4. Add to Vercel environment variables

---

## Alternative: Render Deployment (10 minutes)

### Deploy to Render
1. Go to https://render.com
2. Sign up and connect GitHub
3. Create "New Web Service"
4. Select your repository
5. Set:
   - Build Command: `cd backend && bun install`
   - Start Command: `cd backend && bun run src/index.ts`
6. Add PostgreSQL database (free tier available)

---

## What Happens After Deployment

✅ **Google OAuth will show your domain** instead of sandbox.dev
✅ **Backend runs on production infrastructure**
✅ **PostgreSQL database instead of SQLite**
✅ **HTTPS enabled automatically**
✅ **Automatic deployments on git push**

---

## Quick Start Commands

### For Railway:
```bash
npm i -g @railway/cli
railway login
railway init
railway up
```

### For Vercel:
```bash
npm i -g vercel
vercel login
cd backend
vercel --prod
```

### For Render:
Go to https://render.com and use web dashboard

---

## Next Steps After Deployment

1. ✅ Get production URL from hosting provider
2. ✅ Update `EXPO_PUBLIC_VIBECODE_BACKEND_URL` in Vibecode
3. ✅ Add production URL to Google OAuth redirect URIs
4. ✅ Test Google sign-in → will show your domain!
5. ✅ Point custom domain (optional but recommended)

---

## Which One Should You Choose?

| Platform | Best For | Cost | Setup Time |
|----------|----------|------|------------|
| **Railway** | Quick start, auto-scaling | $5/mo after free tier | 5 min |
| **Vercel** | Serverless, global edge | Free tier generous | 5 min |
| **Render** | Traditional hosting | Free tier available | 10 min |

**Recommendation: Start with Railway** - it's the easiest and has PostgreSQL included.

---

## Let's Deploy!

Tell me which platform you want to use and I'll help you deploy right now:
- **Railway** (recommended - easiest)
- **Vercel** (serverless)
- **Render** (traditional hosting)
- **Your own server** (if you already have one)
