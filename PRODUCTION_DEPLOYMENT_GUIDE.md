# Production Deployment Guide for rejectionhero.com

## Overview
This guide covers everything needed to deploy the Vibecode app to production at `rejectionhero.com`.

## 1. Pre-Deployment Checklist

### Frontend Requirements
- [ ] All TypeScript errors resolved (except react-native-maps third-party)
- [ ] Environment variables configured
- [ ] Build passes without warnings
- [ ] All screens tested on iOS and Android

### Backend Requirements
- [ ] Database migrations complete
- [ ] Environment variables configured
- [ ] API endpoints tested
- [ ] Error handling verified

### Security
- [ ] HTTPS enabled on rejectionhero.com
- [ ] SSL certificate valid
- [ ] CORS configured correctly
- [ ] Secrets not committed to git

---

## 2. Environment Variables Setup

### Backend (.env)

```bash
# Server
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@db-host:5432/rejectionhero
DATABASE_PROVIDER=postgresql

# Authentication
BETTER_AUTH_SECRET=your-secret-key-min-32-characters-long
BACKEND_URL=https://rejectionhero.com

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_ANDROID_CLIENT_ID=your-android-client-id
GOOGLE_IOS_CLIENT_ID=your-ios-client-id

# OpenAI (for quest generation)
OPENAI_API_KEY=sk-...

# Resend (for emails)
RESEND_API_KEY=re_...

# GoHighLevel (for bug reports)
GOHIGHLEVEL_API_KEY=your-api-key
GOHIGHLEVEL_LOCATION_ID=your-location-id

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_SUBSCRIPTION_PRICE_ID=price_...
STRIPE_TOKEN_PACK_10_PRICE_ID=price_...
STRIPE_TOKEN_PACK_25_PRICE_ID=price_...
STRIPE_TOKEN_PACK_50_PRICE_ID=price_...
STRIPE_TOKEN_PACK_100_PRICE_ID=price_...

# Google Maps
GOOGLE_MAPS_API_KEY=your-key

# Perplexity AI
PERPLEXITY_API_KEY=your-key
```

### Frontend (.env or App.json)

```bash
# EXPO_PUBLIC_VIBECODE_BACKEND_URL is automatically set by Vibecode reverse proxy
# EXPO_PUBLIC_VIBECODE_PROJECT_ID is automatically set by Vibecode
```

---

## 3. Google OAuth Configuration

### Add Redirect URIs to Google Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project → **APIs & Services** → **Credentials**
3. Click your OAuth 2.0 Client ID
4. Add these **Authorized redirect URIs**:

```
https://rejectionhero.com/api/auth/callback/google
https://preview-cqrfqnxgqjum.share.sandbox.dev/api/auth/callback/google
http://localhost:3000/api/auth/callback/google
```

5. Click **Save**

### Verify Callback Endpoint

The redirect URI should point to:
```
https://rejectionhero.com/api/auth/callback/google
```

This is automatically configured in `/backend/src/auth.ts`:
```typescript
redirectURI: `${env.BACKEND_URL}/api/auth/callback/google`
```

---

## 4. Database Setup

### PostgreSQL Setup (Recommended for Production)

Instead of SQLite, use PostgreSQL:

```bash
# Create database
createdb rejectionhero

# Set connection string
DATABASE_URL=postgresql://username:password@localhost:5432/rejectionhero
```

### Run Migrations

```bash
cd /home/user/workspace/backend

# Apply all migrations
bunx prisma migrate deploy

# Verify migrations
bunx prisma migrate status
```

### Seed Data (Optional)

```bash
# If you have seed scripts
bunx prisma db seed
```

---

## 5. Backend Deployment

### Option A: Deploy to Traditional Server

```bash
cd /home/user/workspace/backend

# Install dependencies
bun install --production

# Build
bun build

# Start
bun start
```

### Option B: Deploy to Docker

Create `Dockerfile`:
```dockerfile
FROM oven/bun:latest

WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --production

COPY . .

EXPOSE 3000

CMD ["bun", "start"]
```

Build and push:
```bash
docker build -t rejectionhero-backend:latest .
docker push your-registry/rejectionhero-backend:latest
```

### Option C: Deploy to Vercel/Railway/Heroku

These platforms support Bun natively. Set environment variables in their dashboard.

---

## 6. Frontend Deployment

### Build APK/IOS Apps

```bash
# Android
eas build --platform android --release

# iOS
eas build --platform ios --release
```

### EAS Submit (to App Stores)

```bash
# Android
eas submit --platform android --latest

# iOS
eas submit --platform ios --latest
```

### App Store Configuration

**Android Google Play:**
- Sign-in method: OAuth 2.0
- Redirect URI: `https://rejectionhero.com/api/auth/callback/google`

**iOS App Store:**
- Same OAuth configuration
- URL scheme: `rejectionhero://`

---

## 7. SSL/TLS Certificate

### Using Let's Encrypt (Free)

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --standalone -d rejectionhero.com

# Auto-renew
sudo systemctl enable certbot.timer
```

### Configure HTTPS

```bash
# Nginx configuration
server {
    listen 443 ssl http2;
    server_name rejectionhero.com;

    ssl_certificate /etc/letsencrypt/live/rejectionhero.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rejectionhero.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name rejectionhero.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 8. CORS Configuration

Update `/backend/src/index.ts` for production:

```typescript
app.use("/*", cors({
  origin: [
    "https://rejectionhero.com",
    "https://www.rejectionhero.com",
  ],
  credentials: true,
}));
```

---

## 9. Monitoring & Logging

### Set Up Monitoring

```bash
# PM2 (Process Manager)
npm install -g pm2

# Start with PM2
pm2 start "bun start" --name "rejectionhero-backend"
pm2 save
pm2 startup

# Monitor
pm2 monit
```

### Check Logs

```bash
# Backend logs
tail -f /home/user/workspace/backend/server.log

# App logs (in production)
pm2 logs rejectionhero-backend
```

---

## 10. Testing Production

### Test API Endpoints

```bash
# Test profile endpoint
curl https://rejectionhero.com/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test health check
curl https://rejectionhero.com/api/health
```

### Test OAuth Flow

1. Open app on iOS/Android
2. Click "Sign in with Google"
3. Verify redirect to `https://rejectionhero.com/api/auth/callback/google`
4. Verify session created successfully

### Test Database

```bash
# Connect to production DB
psql postgresql://user:password@db-host:5432/rejectionhero

# Check tables
\dt

# Run test query
SELECT COUNT(*) FROM "User";
```

---

## 11. Backup & Recovery

### Automated Backups

```bash
# Daily PostgreSQL backup
0 2 * * * pg_dump rejectionhero > /backups/rejectionhero-$(date +\%Y\%m\%d).sql
```

### Restore from Backup

```bash
# Restore database
psql rejectionhero < /backups/rejectionhero-20240101.sql
```

---

## 12. Performance Optimization

### Database Indexing

```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_profile_user_id ON "Profile"("userId");
CREATE INDEX idx_stats_user_id ON "UserStats"("userId");
CREATE INDEX idx_livestream_user_id ON "LiveStream"("userId");
```

### Caching Strategy

Already implemented in `src/lib/queryClient.ts`:
- 5-minute stale time
- 10-minute garbage collection time

### Database Connection Pool

```bash
# In production, use connection pooling
DATABASE_URL=postgresql://user:password@db-host:5432/rejectionhero?schema=public&sslmode=require&connection_limit=10
```

---

## 13. Error Handling & Alerts

### Alert Setup

Monitor these critical errors:
- 401 Unauthorized (now prevented by auth guards)
- 500 Internal Server Error
- Database connection errors
- API rate limiting

### Sentry Integration (Optional)

```typescript
// In backend
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
  tracesSampleRate: 1.0,
});
```

---

## 14. Deployment Checklist

### Pre-Deployment
- [ ] All code committed and pushed
- [ ] Tests passing
- [ ] Environment variables set
- [ ] Database migrations ready
- [ ] SSL certificate valid

### During Deployment
- [ ] Backend health check passing
- [ ] Database connected
- [ ] OAuth configured
- [ ] API endpoints responding
- [ ] Logs clean

### Post-Deployment
- [ ] Frontend app connects to backend
- [ ] Google OAuth working
- [ ] User can sign up/sign in
- [ ] All major features tested
- [ ] Monitoring alerts active

---

## 15. Troubleshooting

### Common Issues

**Issue: 401 Unauthorized on OAuth callback**
- Check `BACKEND_URL` environment variable
- Verify redirect URI in Google Console
- Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct

**Issue: Database connection refused**
- Check `DATABASE_URL` is correct
- Verify PostgreSQL is running
- Check firewall rules

**Issue: CORS errors**
- Verify `rejectionhero.com` is in CORS whitelist
- Check request headers
- Ensure credentials flag is set

**Issue: SSL certificate errors**
- Verify certificate is not expired
- Check certificate is bound to correct domain
- Renew with Let's Encrypt if needed

---

## 16. Maintenance

### Regular Tasks

**Daily:**
- Monitor error logs
- Check API response times
- Verify backups completed

**Weekly:**
- Review user feedback
- Check database size
- Monitor server resources

**Monthly:**
- Update dependencies
- Review security logs
- Analyze performance metrics

---

## 17. Rollback Plan

If issues occur after deployment:

```bash
# Stop current version
pm2 stop rejectionhero-backend

# Restore previous database backup
psql rejectionhero < /backups/rejectionhero-previous.sql

# Deploy previous version
git checkout previous-tag
bun install --production
pm2 start "bun start" --name "rejectionhero-backend"
```

---

## 18. Contact & Support

For deployment issues:
1. Check `/home/user/workspace/backend/server.log`
2. Review environment variables
3. Verify all services running
4. Check database connectivity

---

**Last Updated:** 2025-11-19
**Status:** Ready for production deployment to rejectionhero.com
