# 🚀 Deploy to Railway - Quick Start

## You're Ready to Deploy!

Everything is prepared for Railway deployment. Follow these simple steps to get your production URL and fix the "sandbox.dev" issue in Google OAuth.

---

## 📋 Pre-Deployment Checklist

✅ Backend code optimized for Railway
✅ Package.json configured with correct start command
✅ Railway configuration files created
✅ Environment variables template ready
✅ PostgreSQL migration ready
✅ Google OAuth deep linking fixed
✅ Documentation complete

**You're all set! Let's deploy now.**

---

## 🎯 Quick Deploy Steps (10 minutes)

### Step 1: Sign Up for Railway (2 minutes)
1. Go to **https://railway.app**
2. Click **"Login with GitHub"**
3. Authorize Railway

### Step 2: Push Code to GitHub (if needed)
```bash
cd /home/user/workspace
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

### Step 3: Deploy on Railway (2 minutes)
1. In Railway dashboard: **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your repository
4. Railway auto-deploys! ✨

### Step 4: Add PostgreSQL (1 minute)
1. In your project, click **"New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Done! `DATABASE_URL` is set automatically

### Step 5: Set Environment Variables (3 minutes)
Open `RAILWAY_ENV_TEMPLATE.md` and copy-paste these into Railway Variables:

**Required:**
- `NODE_ENV=production`
- `PORT=3000`
- `DATABASE_PROVIDER=postgresql`
- `BACKEND_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}`
- `BETTER_AUTH_SECRET=` (generate with: `openssl rand -base64 32`)
- Your Google OAuth credentials

### Step 6: Get Your Production URL (1 minute)
1. Go to your service → **Settings** → **Domains**
2. Copy URL like: `https://your-app-production.up.railway.app`

### Step 7: Update Google OAuth (1 minute)
1. Go to https://console.cloud.google.com
2. **APIs & Services** → **Credentials**
3. Edit your OAuth client
4. Add redirect URI:
   ```
   https://your-app-production.up.railway.app/api/auth/callback/google
   ```

### Step 8: Update Vibecode Environment
In Vibecode app → **ENV tab**:
```
EXPO_PUBLIC_VIBECODE_BACKEND_URL=https://your-app-production.up.railway.app
```

### Step 9: Test! 🎉
1. Refresh Vibecode app
2. Go to login → "Continue with Google"
3. **You should see your Railway domain instead of sandbox.dev!**

---

## 📚 Detailed Guides

If you need more details, check these files:

- 📄 **RAILWAY_DEPLOY_GUIDE.md** - Complete step-by-step guide
- 📄 **RAILWAY_ENV_TEMPLATE.md** - All environment variables explained
- 📄 **GOOGLE_OAUTH_SETUP.md** - Google Cloud Console configuration

---

## 💡 What You'll Get

After deployment:
- ✅ Production backend on Railway infrastructure
- ✅ PostgreSQL database (not SQLite)
- ✅ HTTPS enabled automatically
- ✅ Your actual domain in Google OAuth popup
- ✅ Auto-deployments on git push
- ✅ Free $5 credit/month to start

---

## 🆘 Need Help?

### Backend not starting?
- Check logs in Railway dashboard
- Verify environment variables are set
- Ensure PostgreSQL is connected

### Database connection error?
- `DATABASE_URL` should be set automatically by Railway
- Check PostgreSQL service is running

### Google OAuth not working?
- Verify redirect URI is exactly: `https://your-url.up.railway.app/api/auth/callback/google`
- Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- Make sure `BACKEND_URL` uses `${{RAILWAY_PUBLIC_DOMAIN}}`

---

## 🎊 Success!

Once deployed, your Google OAuth popup will show:
```
"Vibecode" Wants to Use "your-app-production.up.railway.app" to Sign In
```

Instead of:
```
"Vibecode" Wants to Use "sandbox.dev" to Sign In
```

---

## Ready to Deploy?

1. Open https://railway.app
2. Follow steps above
3. You'll be live in 10 minutes!

**Let's do this! 🚀**
