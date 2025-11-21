# Migration Guide: Railway → Render

This guide will help you migrate your backend from Railway to Render.

## Why Render?

- **Better Free Tier**: Render's free tier doesn't sleep as aggressively as Railway
- **More Reliable**: Better uptime and performance
- **Easy Setup**: Simple Dockerfile-based deployment
- **Better Monitoring**: Built-in logs and metrics

## Prerequisites

1. A Render account (sign up at https://render.com)
2. Your GitHub repository connected to Render
3. All environment variables documented (see below)

## Step 1: Create a New Web Service on Render

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select the repository: `rejection-hero` (or your repo name)
5. Configure the service:
   - **Name**: `rejection-hero-backend`
   - **Region**: Choose closest to your users (Oregon, Frankfurt, Singapore, etc.)
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: Leave empty (or `backend` if you want to deploy from subdirectory)
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `./Dockerfile`
   - **Docker Context**: `.` (root directory)
   - **Instance Type**: `Free` (or upgrade to Starter/Standard for better performance)
   - **Health Check Path**: `/health`

## Step 2: Configure Environment Variables

In the Render dashboard, go to your service → **Environment** tab and add all these variables:

### Required Variables

```bash
# Server
NODE_ENV=production
PORT=3000
BACKEND_URL=https://api.rejectionhero.com

# Database (from Railway/Neon)
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
DIRECT_URL=postgresql://user:password@host:5432/dbname?sslmode=require  # Non-pooler connection

# Authentication
BETTER_AUTH_SECRET=your-secret-key-here-min-32-chars

# R2 Storage (Cloudflare)
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=rejection-hero
R2_PUBLIC_URL=https://storage.rejectionhero.com

# Optional: OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_ANDROID_CLIENT_ID=your-android-client-id
GOOGLE_IOS_CLIENT_ID=your-ios-client-id

# Optional: AI Services
OPENAI_API_KEY=your-openai-key
PERPLEXITY_API_KEY=your-perplexity-key

# Optional: Email
RESEND_API_KEY=your-resend-key

# Optional: Maps
GOOGLE_MAPS_API_KEY=your-maps-key

# Optional: Stripe
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable
STRIPE_WEBHOOK_SECRET=your-webhook-secret
STRIPE_SUBSCRIPTION_PRICE_ID=price_xxx
STRIPE_TOKEN_PACK_10_PRICE_ID=price_xxx
STRIPE_TOKEN_PACK_25_PRICE_ID=price_xxx
STRIPE_TOKEN_PACK_50_PRICE_ID=price_xxx
STRIPE_TOKEN_PACK_100_PRICE_ID=price_xxx
```

### How to Get Your Railway Environment Variables

1. Go to your Railway project dashboard
2. Click on your backend service
3. Go to **Variables** tab
4. Copy each variable value
5. Paste into Render's Environment section

## Step 3: Update DNS/Custom Domain

If you're using a custom domain (`api.rejectionhero.com`):

1. In Render dashboard → Your service → **Settings** → **Custom Domains**
2. Add your domain: `api.rejectionhero.com`
3. Render will provide DNS records to add:
   - **CNAME**: `api.rejectionhero.com` → `your-service.onrender.com`
   - Or **A Record**: Point to Render's IP (if provided)

4. Update your DNS provider (Cloudflare, etc.) with the new records
5. Wait for DNS propagation (5-60 minutes)

## Step 4: Deploy

1. Render will automatically deploy when you:
   - Push the `render.yaml` file to your repo, OR
   - Manually trigger a deploy from the dashboard

2. Monitor the deployment:
   - Go to **Logs** tab in Render dashboard
   - Watch for successful build and startup
   - Check that `/health` endpoint responds

## Step 5: Verify Deployment

1. **Health Check**: Visit `https://your-service.onrender.com/health`
   - Should return: `{ "status": "ok" }`

2. **Test API Endpoints**:
   ```bash
   curl https://your-service.onrender.com/api/health
   ```

3. **Check Logs**: Ensure no errors in Render logs

## Step 6: Update Frontend (if needed)

If your frontend has a hardcoded backend URL, update it:

1. Check `src/lib/api.ts` or similar files
2. Update `BACKEND_URL` to point to Render service
3. Or use environment variable that points to `https://api.rejectionhero.com` (if custom domain is set up)

## Step 7: Test Everything

- [ ] Health endpoint works
- [ ] Authentication works
- [ ] File uploads work (R2)
- [ ] Database queries work
- [ ] All API endpoints respond correctly

## Step 8: Switch Traffic (Optional)

If you want zero downtime:

1. Keep Railway running temporarily
2. Test Render service thoroughly
3. Update DNS to point to Render
4. Wait for DNS propagation
5. Monitor both services
6. Once confirmed, shut down Railway

## Troubleshooting

### Build Fails

- Check Dockerfile is in root directory
- Verify all dependencies in `package.json`
- Check build logs for specific errors

### Service Won't Start

- Check environment variables are all set
- Verify `DATABASE_URL` is correct
- Check health check path is `/health`
- Review startup logs

### Database Connection Issues

- Ensure `DATABASE_URL` uses non-pooler connection for migrations
- Verify SSL mode: `?sslmode=require`
- Check database allows connections from Render IPs

### R2 Upload Issues

- Verify all R2 environment variables are set
- Check `R2_PUBLIC_URL` is correct (should be custom domain, not S3 endpoint)
- Review R2 logs in Render dashboard

## Render vs Railway Differences

| Feature | Railway | Render |
|---------|---------|--------|
| Free Tier Sleep | Yes (after 5 min inactivity) | Yes (after 15 min inactivity) |
| Build Time | ~5-10 min | ~5-10 min |
| Custom Domain | ✅ | ✅ |
| Environment Vars | ✅ | ✅ |
| Logs | ✅ | ✅ |
| Health Checks | ✅ | ✅ |
| Auto Deploy | ✅ | ✅ |

## Cost Comparison

- **Free Tier**: Both free, but Render's free tier is more generous
- **Paid Plans**: 
  - Railway: $5/month (Starter)
  - Render: $7/month (Starter) - but better performance

## Support

- Render Docs: https://render.com/docs
- Render Support: support@render.com
- Render Discord: https://render.com/discord

## Next Steps After Migration

1. ✅ Update any documentation with new backend URL
2. ✅ Update CI/CD if you have any
3. ✅ Monitor Render dashboard for first few days
4. ✅ Set up alerts in Render (if on paid plan)
5. ✅ Consider upgrading to Starter plan for better performance

---

**Note**: The `render.yaml` file in the repo is optional. You can configure everything through the Render dashboard if you prefer.

