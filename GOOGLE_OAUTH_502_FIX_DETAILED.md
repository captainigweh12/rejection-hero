# Google OAuth 502 Error Fix - Detailed Diagnosis

## ❌ Error You're Seeing

```
[Google OAuth] Sign-in error: {"status":502,"statusText":""}
```

**502 Bad Gateway** means the backend received the OAuth callback but failed to process it.

## What's Happening

1. **User clicks "Continue with Google"**
2. **App redirects to Google** ✅
3. **Google authenticates user** ✅
4. **Google redirects to:** `https://api.rejectionhero.com/api/auth/callback/google` ✅
5. **Backend receives callback** ✅
6. **Backend crashes or fails during processing** ❌ → **502 Error**

## Step 1: Check Railway Logs

**When you try Google sign-in, check Railway logs immediately:**

Look for:
```
🔐 [Auth Request] GET /api/auth/callback/google
   Full URL: https://api.rejectionhero.com/api/auth/callback/google
🔐 [OAuth] Google callback received
   URL: [callback URL]
   Query: [query parameters]
```

**Then look for:**
```
❌ [Auth Handler] Error in auth handler:
   Path: /api/auth/callback/google
   Error: [what error?]
```

**Or:**
```
❌ [OAuth] Google callback error (502):
   [error message]
```

**Share the exact error message from Railway logs!**

## Step 2: Common Causes of 502 During OAuth

### Cause 1: Database Connection Fails During OAuth

**Symptoms:**
- Railway logs show: `Database connection failed`
- Error includes: `Can't reach database`

**Fix:**
1. Check `DATABASE_URL` in Railway → Variables
2. Verify Neon database is accessible
3. Check database connection in startup logs

### Cause 2: Missing Database Tables

**Symptoms:**
- Railway logs show: `Table does not exist`
- Error code: `P2021`

**Fix:**
```bash
# Ensure schema is synced
cd backend
DATABASE_URL="..." bun run db:push
```

### Cause 3: OAuth Redirect URI Mismatch

**Symptoms:**
- Railway logs show: `redirect_uri_mismatch` or `invalid_grant`
- Error mentions redirect URI

**Fix:**
1. Go to Google Cloud Console → Credentials
2. Find your OAuth 2.0 Client ID
3. Add redirect URI: `https://api.rejectionhero.com/api/auth/callback/google`
4. Wait 2-3 minutes for changes to propagate

### Cause 4: Invalid OAuth Credentials

**Symptoms:**
- Railway logs show: `invalid_client` or `unauthorized_client`
- Error mentions client ID/secret

**Fix:**
1. Check `GOOGLE_CLIENT_ID` in Railway → Variables
2. Check `GOOGLE_CLIENT_SECRET` in Railway → Variables
3. Verify they match Google Cloud Console
4. Redeploy after updating

### Cause 5: Better Auth Configuration Issue

**Symptoms:**
- Railway logs show: `Better Auth error`
- Error mentions Better Auth configuration

**Fix:**
1. Check `BETTER_AUTH_SECRET` is set (min 32 characters)
2. Check `BACKEND_URL` is set correctly: `https://api.rejectionhero.com`
3. Verify Better Auth tables exist

### Cause 6: Backend Crashes During Processing

**Symptoms:**
- Railway logs show uncaught exception
- Error stack trace

**Fix:**
- Check the stack trace in Railway logs
- Identify the failing code
- Fix the issue

## Step 3: Verify OAuth Configuration

### In Railway → Variables

Check these are set:
```env
✅ GOOGLE_CLIENT_ID=971632613679-a4smd8ok9p1ue2jvajhcbvt0510cvb60.apps.googleusercontent.com
✅ GOOGLE_CLIENT_SECRET=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
✅ BACKEND_URL=https://api.rejectionhero.com
✅ BETTER_AUTH_SECRET=[your-secret-min-32-chars]
✅ DATABASE_URL=postgresql://neondb_owner:...@ep-withered-field-a4skic0c-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### In Google Cloud Console

1. **Go to:** https://console.cloud.google.com/apis/credentials
2. **Find:** OAuth 2.0 Client ID
3. **Check Authorized redirect URIs:**
   ```
   https://api.rejectionhero.com/api/auth/callback/google
   ```
4. **Must match exactly!** (including `/api/auth/callback/google`)

## Step 4: Check Railway Startup Logs

When Railway starts, you should see:

```
✅ [Auth] Database connection successful
✅ [Auth] User table accessible
✅ [Auth] Account table accessible
✅ [Auth] Session table accessible
✅ [Auth] Google OAuth credentials configured
✅ [Auth] Better Auth initialized
🔗 [Auth] Google OAuth Redirect URI: https://api.rejectionhero.com/api/auth/callback/google
```

**If you see errors:**
- Fix them before trying OAuth
- Database/table issues will cause 502 during OAuth

## Step 5: Test OAuth Flow Manually

After fixing configuration, test:

1. **Try Google sign-in from app**
2. **Immediately check Railway logs**
3. **Look for callback request:**
   ```
   🔐 [Auth Request] GET /api/auth/callback/google
   ```
4. **Check response:**
   ```
   ✅ [OAuth] Google callback successful
   ```
   **Or:**
   ```
   ❌ [OAuth] Google callback error: [error]
   ```

## What to Share

To fix this, we need:

1. **Railway logs when you try Google sign-in**
   - Copy the error from Railway logs
   - Look for `❌ [Auth Handler]` or `❌ [OAuth]` messages

2. **Railway startup logs**
   - Check if database connection works
   - Check if Better Auth initializes successfully

3. **Railway variables**
   - Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
   - Verify `BACKEND_URL` is `https://api.rejectionhero.com`

4. **Google Console redirect URI**
   - Verify it matches exactly: `https://api.rejectionhero.com/api/auth/callback/google`

## Quick Fix Checklist

- [ ] Check Railway logs for exact error
- [ ] Verify `DATABASE_URL` is correct and accessible
- [ ] Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- [ ] Verify `BACKEND_URL` is `https://api.rejectionhero.com`
- [ ] Verify redirect URI in Google Console matches exactly
- [ ] Check Railway startup logs for database/table errors
- [ ] Try sign-in again and check Railway logs immediately

The enhanced error logging will now show exactly what's failing. Try Google sign-in and share the Railway logs - they'll show the exact error causing the 502!

