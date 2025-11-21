# Render Quick Start Checklist

## ✅ Pre-Migration Checklist

- [ ] Create Render account at https://render.com
- [ ] Connect GitHub repository to Render
- [ ] Document all environment variables from Railway
- [ ] Backup current Railway configuration (optional)

## 🚀 Step-by-Step Migration

### 1. Create Web Service (5 minutes)

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub repo
4. Configure:
   - **Name**: `rejection-hero-backend`
   - **Region**: Choose closest (Oregon recommended for US)
   - **Branch**: `main`
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `./Dockerfile`
   - **Instance Type**: `Free` (upgrade later if needed)
   - **Health Check Path**: `/health`

### 2. Set Environment Variables (10 minutes)

Copy ALL variables from Railway → Variables tab to Render → Environment tab:

**Critical Variables:**
```
NODE_ENV=production
PORT=3000
BACKEND_URL=https://api.rejectionhero.com
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
BETTER_AUTH_SECRET=...
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=rejection-hero
R2_PUBLIC_URL=https://storage.rejectionhero.com
```

**Optional Variables (copy if you use them):**
- Google OAuth keys
- OpenAI/Perplexity keys
- Stripe keys
- Resend API key
- Google Maps key

### 3. Deploy (5-10 minutes)

- Render will auto-deploy when you save
- Watch logs in Render dashboard
- Wait for "Your service is live" message

### 4. Test (5 minutes)

- [ ] Visit: `https://your-service.onrender.com/health`
- [ ] Should return: `{"status":"ok"}`
- [ ] Test a few API endpoints
- [ ] Check logs for errors

### 5. Set Custom Domain (if using api.rejectionhero.com)

1. Render Dashboard → Settings → Custom Domains
2. Add: `api.rejectionhero.com`
3. Update DNS:
   - **CNAME**: `api` → `your-service.onrender.com`
4. Wait 5-60 minutes for DNS propagation

### 6. Update Frontend (if needed)

- Update `BACKEND_URL` in frontend code if hardcoded
- Or ensure frontend uses environment variable

### 7. Verify Everything Works

- [ ] Health check works
- [ ] Authentication works
- [ ] File uploads work
- [ ] Database queries work
- [ ] All features tested

### 8. Switch Over

- [ ] Keep Railway running temporarily
- [ ] Test Render thoroughly
- [ ] Update DNS (if custom domain)
- [ ] Monitor both services
- [ ] Shut down Railway once confirmed

## 📋 Environment Variables Reference

Copy these from Railway to Render:

### Required
- `NODE_ENV`
- `PORT`
- `BACKEND_URL`
- `DATABASE_URL`
- `DIRECT_URL`
- `BETTER_AUTH_SECRET`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL`

### Optional (if used)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_ANDROID_CLIENT_ID`
- `GOOGLE_IOS_CLIENT_ID`
- `OPENAI_API_KEY`
- `PERPLEXITY_API_KEY`
- `RESEND_API_KEY`
- `GOOGLE_MAPS_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_SUBSCRIPTION_PRICE_ID`
- `STRIPE_TOKEN_PACK_*_PRICE_ID` (all 4)

## 🆘 Troubleshooting

**Build fails?**
- Check Dockerfile is in root
- Verify all dependencies
- Check build logs

**Service won't start?**
- Verify all env vars are set
- Check DATABASE_URL format
- Review startup logs

**Database connection fails?**
- Use non-pooler connection
- Add `?sslmode=require`
- Check database allows Render IPs

**Health check fails?**
- Verify `/health` endpoint exists
- Check service is running
- Review logs

## 📞 Support

- Render Docs: https://render.com/docs
- Render Support: support@render.com

---

**Estimated Total Time**: 30-45 minutes

