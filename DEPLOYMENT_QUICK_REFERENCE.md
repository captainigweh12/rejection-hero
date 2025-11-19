# Production Deployment - Quick Reference Checklist

## Google OAuth Setup for rejectionhero.com

### ✅ Step 1: Add Redirect URIs to Google Console
Go to [Google Cloud Console](https://console.cloud.google.com):
1. Select your project
2. **APIs & Services** → **Credentials**
3. Click your **OAuth 2.0 Client ID**
4. Under **Authorized redirect URIs**, add:
   ```
   https://rejectionhero.com/api/auth/callback/google
   https://preview-cqrfqnxgqjum.share.sandbox.dev/api/auth/callback/google
   http://localhost:3000/api/auth/callback/google
   ```
5. **Save**

### ✅ Step 2: Environment Variables

**Backend `.env` file:**
```bash
BACKEND_URL=https://rejectionhero.com
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
DATABASE_URL=postgresql://user:password@host:5432/rejectionhero
BETTER_AUTH_SECRET=your-secret-min-32-chars
```

### ✅ Step 3: Database Migration

```bash
cd /home/user/workspace/backend
bunx prisma migrate deploy
```

### ✅ Step 4: Verify Configuration

The OAuth redirect URI is automatically built from `BACKEND_URL`:
```typescript
// Already configured in /backend/src/auth.ts
redirectURI: `${env.BACKEND_URL}/api/auth/callback/google`
```

So when deployed:
- **Development**: `https://preview-cqrfqnxgqjum.share.sandbox.dev/api/auth/callback/google`
- **Production**: `https://rejectionhero.com/api/auth/callback/google`
- **Local**: `http://localhost:3000/api/auth/callback/google`

### ✅ Step 5: Deploy Backend

Option A - Traditional Server:
```bash
cd /home/user/workspace/backend
bun install --production
bun start
```

Option B - Docker:
```bash
docker build -t rejectionhero-backend .
docker push your-registry/rejectionhero-backend
```

Option C - Platform (Vercel/Railway/Heroku):
- Connect your Git repo
- Set environment variables in dashboard
- Deploy

### ✅ Step 6: Test OAuth Flow

1. Open app on iOS/Android
2. Click "Sign in with Google"
3. Verify callback to `https://rejectionhero.com/api/auth/callback/google`
4. Verify session created

### ✅ Step 7: SSL/TLS Certificate

```bash
# Using Let's Encrypt (free)
sudo certbot certonly --standalone -d rejectionhero.com
```

### ✅ Step 8: Reverse Proxy (Nginx)

```nginx
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

## Key Files to Review

- **Main Guide**: `/PRODUCTION_DEPLOYMENT_GUIDE.md`
- **Auth Best Practices**: `/AUTH_BEST_PRACTICES.md`
- **Backend Config**: `/backend/src/auth.ts`
- **Environment Template**: `/backend/src/env.ts`

## Important Points

✅ **OAuth Redirect URI**: `https://rejectionhero.com/api/auth/callback/google`

✅ **Backend URL**: Must be set to `https://rejectionhero.com` in production

✅ **HTTPS Required**: OAuth won't work without HTTPS

✅ **All 3 URIs Needed**: Add all three (production, sandbox, localhost) to Google Console for flexibility

✅ **No Code Changes**: Everything is configured via environment variables

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized on OAuth | Check `BACKEND_URL` and redirect URI in Google Console |
| CORS errors | Verify `rejectionhero.com` in CORS whitelist |
| Database errors | Check `DATABASE_URL` and PostgreSQL connection |
| SSL certificate errors | Renew with `certbot renew` |

## Next Steps

1. ✅ Add redirect URIs to Google Console (if not done)
2. Set production environment variables
3. Set up PostgreSQL database
4. Deploy backend to production server
5. Test OAuth flow
6. Deploy frontend app

---

**Full Deployment Guide**: See `/PRODUCTION_DEPLOYMENT_GUIDE.md`
