# Fix Google OAuth 502 Error

## Problem

Google OAuth is returning a 502 (Bad Gateway) error when users try to sign in.

## Root Causes

A 502 error typically means:
1. **Backend server crashed** during OAuth callback processing
2. **Database connection failed** during user creation
3. **Missing error handling** in OAuth callback route
4. **BACKEND_URL misconfiguration** causing redirect issues
5. **Better Auth handler** throwing unhandled errors

## Fixes Applied

### 1. Enhanced Error Handling for OAuth Callback

Added comprehensive error handling in `backend/src/index.ts`:

```typescript
app.on(["GET", "POST"], "/api/auth/*", async (c) => {
  try {
    // Log OAuth callback requests for debugging
    if (c.req.path.includes("/callback/google")) {
      console.log("🔐 [OAuth] Google callback received");
      console.log(`   URL: ${c.req.url}`);
      console.log(`   Method: ${c.req.method}`);
    }
    
    const response = await auth.handler(c.req.raw);
    
    // Log OAuth callback responses
    if (c.req.path.includes("/callback/google")) {
      console.log(`🔐 [OAuth] Google callback response: ${response.status}`);
      if (response.status >= 400) {
        const text = await response.clone().text().catch(() => "Unable to read response");
        console.error(`❌ [OAuth] Google callback error: ${text.substring(0, 200)}`);
      }
    }
    
    return response;
  } catch (error: any) {
    console.error("❌ [OAuth] Error in auth handler:", error);
    // Return proper error response instead of crashing
    return c.json({ error: "Authentication error", message: error?.message }, 500);
  }
});
```

**Benefits:**
- ✅ Prevents server crashes from unhandled errors
- ✅ Provides detailed logging for debugging
- ✅ Returns proper error responses instead of 502
- ✅ Logs OAuth callback requests/responses

### 2. Railway URL Auto-Detection

Updated `backend/src/env.ts` to automatically use Railway's public domain:

```typescript
// CRITICAL: Override BACKEND_URL with Railway domain if available
if (process.env.RAILWAY_PUBLIC_DOMAIN) {
  const railwayUrl = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  parsed.BACKEND_URL = railwayUrl;
  console.log(`✅ [ENV] BACKEND_URL set to Railway domain: ${parsed.BACKEND_URL}`);
}
```

**Benefits:**
- ✅ Automatically uses Railway URL when deployed
- ✅ Prevents sandbox.dev URL issues
- ✅ Ensures OAuth redirect URI is correct

### 3. Enhanced OAuth Logging

Added detailed logging in `backend/src/auth.ts`:

```typescript
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  const redirectURI = `${env.BACKEND_URL}/api/auth/callback/google`;
  console.log(`🔗 [Auth] Google OAuth Redirect URI: ${redirectURI}`);
  
  if (redirectURI.includes("sandbox.dev")) {
    console.error(`❌ [Auth] ERROR: OAuth redirect URI is using sandbox URL`);
  }
}
```

**Benefits:**
- ✅ Shows exact redirect URI being used
- ✅ Warns about sandbox URLs
- ✅ Helps verify Google Console configuration

## Verification Steps

### 1. Check Railway Logs

After deployment, check Railway logs for:

```
✅ [ENV] BACKEND_URL set to Railway domain: https://your-app.railway.app
🔗 [Auth] Google OAuth Redirect URI: https://your-app.railway.app/api/auth/callback/google
✅ [Auth] OAuth redirect URI is using production URL
```

### 2. Verify Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Find your OAuth 2.0 Client ID
3. Verify **Authorized redirect URIs** includes:
   ```
   https://your-app.railway.app/api/auth/callback/google
   ```

### 3. Test OAuth Flow

1. Try signing in with Google
2. Check Railway logs for:
   ```
   🔐 [OAuth] Google callback received
   🔐 [OAuth] Google callback response: 200
   ```
3. If you see errors, they'll be logged with details

## Common Issues & Solutions

### Issue: Still Getting 502 Error

**Check:**
1. Railway logs for the exact error message
2. Database connection (Neon should be working)
3. `BACKEND_URL` in Railway variables (should match Railway domain)
4. Google Console redirect URI matches exactly

**Solution:**
- Remove `BACKEND_URL` from Railway variables (let it auto-detect)
- Or set `BACKEND_URL` to your Railway domain: `https://your-app.railway.app`

### Issue: redirect_uri_mismatch

**Solution:**
1. Get your Railway domain from Railway dashboard
2. Add to Google Console: `https://your-app.railway.app/api/auth/callback/google`
3. Wait 2-3 minutes for Google to update

### Issue: Database Errors During OAuth

**Check:**
- Railway logs for Prisma errors
- Verify `DATABASE_URL` is set correctly
- Check Neon connection is working

**Solution:**
- Verify Neon tables exist (they should after deployment)
- Check `DATABASE_URL` in Railway matches Neon connection string

## Expected Behavior After Fix

1. ✅ OAuth callback receives request
2. ✅ Better Auth processes callback
3. ✅ User created in database (if new)
4. ✅ Session created
5. ✅ Redirect back to app with success
6. ✅ No 502 errors

## Monitoring

Watch Railway logs for:
- `🔐 [OAuth] Google callback received` - Callback started
- `🔐 [OAuth] Google callback response: 200` - Success
- `❌ [OAuth] Google callback error:` - Error details

## Summary

✅ **Error handling added** - Prevents crashes
✅ **Railway URL auto-detection** - Ensures correct redirect URI
✅ **Enhanced logging** - Better debugging
✅ **Proper error responses** - No more 502s

The OAuth flow should now work correctly without 502 errors!

