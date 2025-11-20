# Railway Backend URL Configuration

## Backend URL Setup

Your backend is accessible at: **`https://api.rejectionhero.com`**

This is a CNAME redirect pointing to your main Railway deployment.

## Configuration

### Railway Environment Variables

In Railway → Backend Service → Variables:

#### Option 1: Let Railway Auto-Detect (Recommended)

**Do NOT set `BACKEND_URL` in Railway variables.**

Railway will automatically use `RAILWAY_PUBLIC_DOMAIN`, but since you have a CNAME:

1. **Set `BACKEND_URL` explicitly:**
   ```env
   BACKEND_URL=https://api.rejectionhero.com
   ```

2. **Or set `RAILWAY_PUBLIC_DOMAIN`:**
   ```env
   RAILWAY_PUBLIC_DOMAIN=api.rejectionhero.com
   ```

**Recommended:** Set `BACKEND_URL=https://api.rejectionhero.com` explicitly for clarity.

### Required Variables

```
✅ BACKEND_URL=https://api.rejectionhero.com
✅ DATABASE_URL=postgresql://neondb_owner:...@ep-withered-field-a4skic0c.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
✅ DATABASE_PROVIDER=postgresql
✅ GOOGLE_CLIENT_ID=your-client-id
✅ GOOGLE_CLIENT_SECRET=your-client-secret
✅ BETTER_AUTH_SECRET=your-secret
... (other variables)
```

## OAuth Configuration

### Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Find your OAuth 2.0 Client ID (Web client)
3. Add **Authorized JavaScript origins:**
   ```
   https://api.rejectionhero.com
   ```

4. Add **Authorized redirect URIs:**
   ```
   https://api.rejectionhero.com/api/auth/callback/google
   ```

**IMPORTANT:** The redirect URI must be exactly:
```
https://api.rejectionhero.com/api/auth/callback/google
```

### What Happens

When `BACKEND_URL=https://api.rejectionhero.com` is set:

1. **Better Auth** will use this as the base URL
2. **OAuth redirect URI** will be: `https://api.rejectionhero.com/api/auth/callback/google`
3. **CNAME** will redirect requests to Railway
4. **Railway** will process the request normally

## Frontend Configuration

In your Expo app (or wherever frontend env vars are set):

```env
EXPO_PUBLIC_VIBECODE_BACKEND_URL=https://api.rejectionhero.com
```

This tells your frontend to call the API at `https://api.rejectionhero.com`.

## How It Works

```
User → api.rejectionhero.com (CNAME) → Railway Deployment
                                            ↓
                                    Backend processes request
                                            ↓
                                    Returns response to user
```

## Verification

After setting `BACKEND_URL` in Railway, check logs for:

```
✅ [ENV] BACKEND_URL set to: https://api.rejectionhero.com
🔗 [Auth] Google OAuth Redirect URI: https://api.rejectionhero.com/api/auth/callback/google
✅ [Auth] OAuth redirect URI is using production URL
```

## CNAME Setup (DNS)

Your DNS should have:

```
Type: CNAME
Name: api
Value: your-railway-app.up.railway.app
TTL: 300 (or your preference)
```

## Troubleshooting

### Issue: OAuth Still Uses Railway Domain

**Check:**
1. Is `BACKEND_URL` set in Railway variables?
2. Is `RAILWAY_PUBLIC_DOMAIN` set? (It might override `BACKEND_URL`)

**Solution:**
- Set `BACKEND_URL=https://api.rejectionhero.com` explicitly
- Remove `RAILWAY_PUBLIC_DOMAIN` if it's causing issues

### Issue: redirect_uri_mismatch

**Check:**
1. Google Console has `https://api.rejectionhero.com/api/auth/callback/google`
2. Railway logs show correct redirect URI

**Solution:**
- Add redirect URI to Google Console
- Wait 2-3 minutes for Google to update
- Verify Railway logs show correct URL

### Issue: CNAME Not Working

**Check:**
1. DNS records are correct
2. CNAME points to Railway domain
3. SSL certificate is valid (Railway auto-provisions)

**Solution:**
- Verify DNS with: `dig api.rejectionhero.com CNAME`
- Check Railway custom domain settings
- Wait for SSL certificate provisioning

## Summary

✅ **Backend URL:** `https://api.rejectionhero.com`
✅ **Railway Variable:** `BACKEND_URL=https://api.rejectionhero.com`
✅ **OAuth Redirect:** `https://api.rejectionhero.com/api/auth/callback/google`
✅ **Frontend Variable:** `EXPO_PUBLIC_VIBECODE_BACKEND_URL=https://api.rejectionhero.com`

Everything should now work with your custom domain!

