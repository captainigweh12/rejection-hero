# Railway.app Deployment - Quick Start Guide

## 🚀 Deploy Your Backend to Railway (No CLI Needed!)

Since we can't use Railway CLI in the sandbox, we'll use Railway's web interface which is even easier!

---

## Step 1: Sign Up for Railway

1. Go to **https://railway.app**
2. Click **"Login with GitHub"**
3. Authorize Railway to access your GitHub account

---

## Step 2: Push Your Code to GitHub (If Not Already)

```bash
cd /home/user/workspace
git add .
git commit -m "Prepare backend for Railway deployment"
git push origin main
```

---

## Step 3: Create New Project on Railway

1. In Railway dashboard, click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your repository
4. Railway will automatically detect your backend and start deploying

**Railway Auto-Detection:**
- ✅ Detects Bun runtime automatically
- ✅ Runs `bun install` automatically
- ✅ Runs `bun start` to launch your app
- ✅ Generates a public URL automatically

---

## Step 4: Add PostgreSQL Database

1. In your Railway project, click **"New"** button
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway automatically:
   - Creates a PostgreSQL database
   - Sets `DATABASE_URL` environment variable
   - Connects it to your backend service

---

## Step 5: Configure Environment Variables

In Railway dashboard:
1. Click your backend service
2. Go to **"Variables"** tab
3. Click **"+ New Variable"** and add each of these:

### Required Environment Variables:

```bash
NODE_ENV=production
PORT=3000
DATABASE_PROVIDER=postgresql

# Authentication
BETTER_AUTH_SECRET=your-super-secret-key-min-32-characters-change-this-now

# Google OAuth (copy from your current .env)
GOOGLE_CLIENT_ID=94427138884-cc2db90qkmg6dfshccce94ffmt5rpla0.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_IOS_CLIENT_ID=94427138884-vp4hj04sfr29fndq917iau9alpiv52e6.apps.googleusercontent.com
```

### Optional Environment Variables (add if you have them):

```bash
# OpenAI (for quest generation)
OPENAI_API_KEY=your-openai-key

# Google Maps
GOOGLE_MAPS_API_KEY=AIzaSyCHMHlOrPPSRULrUf-FqPWHz0Y6PJoPrRk

# Stripe (for payments)
STRIPE_SECRET_KEY=your-stripe-key
STRIPE_PUBLISHABLE_KEY=your-stripe-pub-key
```

**Important:** The `BACKEND_URL` will be automatically set by Railway using their special variable `${{RAILWAY_PUBLIC_DOMAIN}}`. Add this variable:

```bash
BACKEND_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
```

---

## Step 6: Get Your Production URL

1. Go to your backend service in Railway
2. Click **"Settings"** tab
3. Scroll to **"Domains"** section
4. You'll see a URL like: `https://your-app-production-xxxx.up.railway.app`

**Copy this URL** - you'll need it for the next steps!

---

## Step 7: Run Database Migration

Railway needs to run your Prisma migrations:

1. In Railway, go to your backend service
2. Click **"Deployments"** tab
3. Click on the latest deployment
4. Click **"View Logs"**
5. Check if migrations ran automatically (via `postinstall` script)

If migrations didn't run:
1. Go to **"Settings"** → **"Deploy"**
2. Add **Build Command**: `bun install && bunx prisma migrate deploy`

---

## Step 8: Update Google OAuth Settings

Now update Google Cloud Console with your Railway URL:

1. Go to **https://console.cloud.google.com**
2. Navigate to **APIs & Services** → **Credentials**
3. Click your **Web application** OAuth client
4. In **Authorized redirect URIs**, add:

```
https://your-app-production-xxxx.up.railway.app/api/auth/callback/google
```

5. Click **Save**

---

## Step 9: Update Vibecode Environment Variable

In the **Vibecode app**:
1. Go to the **ENV tab**
2. Find `EXPO_PUBLIC_VIBECODE_BACKEND_URL`
3. Update it to your Railway URL:

```
https://your-app-production-xxxx.up.railway.app
```

4. **Restart the app** or refresh to load the new backend URL

---

## Step 10: Test Google OAuth!

1. Open your Vibecode app
2. Go to Login screen
3. Tap **"Continue with Google"**
4. **✨ The popup should now show your Railway domain instead of sandbox.dev!**
5. Complete authentication
6. You should be logged in successfully

---

## 🎉 Success Checklist

After deployment, verify:
- ✅ Railway backend is running (check logs)
- ✅ PostgreSQL database is connected
- ✅ Railway URL is accessible: `https://your-app.up.railway.app/health`
- ✅ Google OAuth redirect URI is updated
- ✅ Vibecode app is using new backend URL
- ✅ Google sign-in shows Railway domain (not sandbox.dev)
- ✅ Authentication works end-to-end

---

## 🌐 Optional: Add Custom Domain

Want to use `api.rejectionhero.com` instead of Railway's URL?

1. In Railway, go to **Settings** → **Domains**
2. Click **"Custom Domain"**
3. Enter: `api.rejectionhero.com`
4. Railway will show you DNS records to add
5. Add these DNS records to your domain:
   ```
   CNAME api railway.app
   ```
6. Wait 5-10 minutes for DNS to propagate
7. Update Google OAuth to use `https://api.rejectionhero.com/api/auth/callback/google`
8. Update Vibecode env to `https://api.rejectionhero.com`

---

## 📊 Monitoring Your Deployment

### Check Backend Health:
```bash
curl https://your-app.up.railway.app/health
```

### View Logs in Railway:
1. Go to your service
2. Click **"Deployments"**
3. Click latest deployment
4. View real-time logs

### Check Database:
1. In Railway, click your PostgreSQL service
2. Go to **"Data"** tab
3. You can query your database directly

---

## 💰 Railway Pricing

**Free Tier:**
- $5 free credit per month
- Perfect for testing and small apps
- Upgrades available if you need more resources

**Pro Plan ($20/mo):**
- $20 of usage credits
- Better performance
- Priority support

---

## 🆘 Troubleshooting

### Deployment Failed?
- Check logs in Railway dashboard
- Ensure `bun start` script works locally
- Verify all environment variables are set

### Database Connection Error?
- Make sure PostgreSQL service is running
- Check `DATABASE_URL` is set automatically
- Verify `DATABASE_PROVIDER=postgresql` is set

### Google OAuth Not Working?
- Verify redirect URI is correct in Google Console
- Check `BACKEND_URL` environment variable
- Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set

### App Can't Connect to Backend?
- Verify Vibecode env variable is updated
- Check Railway service is running
- Test backend URL: `curl https://your-url.up.railway.app/health`

---

## 🚀 You're Live!

Once deployed:
- ✅ Your backend is running on production infrastructure
- ✅ Google OAuth shows your Railway domain
- ✅ PostgreSQL database for production data
- ✅ HTTPS enabled automatically
- ✅ Auto-deployments on git push

**No more "sandbox.dev" in your Google OAuth popup! 🎉**

---

## Next Steps

1. Test all features thoroughly
2. Set up custom domain (optional)
3. Configure monitoring/alerts
4. Deploy frontend to app stores
5. Celebrate! 🎊
