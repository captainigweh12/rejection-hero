# Fix Google OAuth 502 Error

## Problem

Getting a 502 error when signing in with Google OAuth:
- Error occurs in `LoginWithEmailPassword.tsx` (line 270)
- Backend returns 502 status code
- OAuth callback is failing

## Root Causes

The 502 error indicates the backend is crashing during the OAuth callback. Common causes:

1. **Better Auth tables missing in Neon**
   - Better Auth requires `user`, `session`, `account`, `verification` tables
   - If tables don't exist, database operations will fail

2. **Incorrect BACKEND_URL configuration**
   - OAuth redirect URI must match Google Console configuration
   - Must be `https://api.rejectionhero.com/api/auth/callback/google`

3. **Missing environment variables**
   - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` must be set in Railway
   - `BACKEND_URL` must be set to `https://api.rejectionhero.com`

4. **Google Console redirect URI mismatch**
   - Redirect URI in Google Console must match backend configuration

## Solution

### Step 1: Verify Better Auth Tables Exist

Run the verification script:

```bash
cd backend
bun run scripts/verify-better-auth-tables.ts
```

**Expected output:**
```
✅ Table "user" exists
✅ Table "session" exists
✅ Table "account" exists
✅ Table "verification" exists
✅ All Better Auth tables exist!
```

**If tables are missing:**
```bash
bun run db:push
```

This will create all missing tables in Neon.

### Step 2: Verify Railway Environment Variables

In Railway → Backend Service → Variables, ensure these are set:

```env
✅ BACKEND_URL=https://api.rejectionhero.com
✅ DATABASE_URL=postgresql://neondb_owner:...@ep-withered-field-a4skic0c.us-east-1.aws.neon.tech/neondb?sslmode=require
✅ GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
✅ GOOGLE_CLIENT_SECRET=your-client-secret
✅ BETTER_AUTH_SECRET=your-secret-min-32-chars
✅ DATABASE_PROVIDER=postgresql
```

**Critical:** `BACKEND_URL` must be exactly `https://api.rejectionhero.com` (not Railway URL).

### Step 3: Verify Google Cloud Console Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Find your OAuth 2.0 Client ID (Web client)
3. Verify **Authorized JavaScript origins:**
   ```
   https://api.rejectionhero.com
   ```
4. Verify **Authorized redirect URIs:**
   ```
   https://api.rejectionhero.com/api/auth/callback/google
   ```

**The redirect URI must match exactly!**

### Step 4: Check Railway Logs

After setting environment variables, check Railway logs:

**Expected logs:**
```
🌐 [ENV] Using explicitly set BACKEND_URL: https://api.rejectionhero.com
✅ [Auth] Better Auth initialized
🔗 [Auth] Base URL: https://api.rejectionhero.com
🔑 [Auth] Google OAuth: Enabled ✅
🔗 [Auth] Google OAuth Redirect URI: https://api.rejectionhero.com/api/auth/callback/google
✅ [Auth] OAuth redirect URI is using production URL
```

**If you see errors:**
- `❌ [Auth] ERROR: OAuth redirect URI is using sandbox URL` → Set `BACKEND_URL` in Railway
- `⚠️ [Auth] Google OAuth credentials not configured` → Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

### Step 5: Test OAuth Flow

1. **Trigger OAuth sign-in from app**
2. **Check Railway logs for:**
   ```
   🔐 [OAuth] Google callback received
      URL: https://api.rejectionhero.com/api/auth/callback/google?code=...
      Method: GET
   🔐 [OAuth] Google callback response: 200
   ```

3. **If you see errors:**
   - Check the error message in logs
   - Common errors:
     - `redirect_uri_mismatch` → Fix Google Console redirect URI
     - `P2021` (table does not exist) → Run `bun run db:push`
     - `PrismaClientInitializationError` → Check `DATABASE_URL`

## How Better Auth Works with Neon

**Important Understanding:**

1. **Neon is just the database** - it stores user data, sessions, accounts
2. **Better Auth is the library** - it handles OAuth logic in your Railway backend
3. **Google OAuth is the provider** - Google handles authentication

**Flow:**
```
User clicks "Sign in with Google"
  ↓
Frontend calls: authClient.signIn.social({ provider: "google" })
  ↓
Better Auth redirects to: https://accounts.google.com/oauth/authorize
  ↓
User authenticates with Google
  ↓
Google redirects to: https://api.rejectionhero.com/api/auth/callback/google?code=...
  ↓
Railway backend receives callback
  ↓
Better Auth exchanges code for tokens
  ↓
Better Auth creates/updates user in Neon (user table)
  ↓
Better Auth creates session in Neon (session table)
  ↓
Better Auth creates account in Neon (account table)
  ↓
Backend returns session to frontend
  ↓
User is logged in
```

**Database Tables Used:**
- `user` - User profile data
- `session` - Active user sessions
- `account` - OAuth provider account data (Google tokens, etc.)
- `verification` - Email verification tokens, etc.

## Troubleshooting

### Issue: Still getting 502 error

**Check Railway logs:**
1. Open Railway → Backend Service → Deployments → Latest → Logs
2. Look for errors during OAuth callback
3. Common errors:
   - Database connection errors → Check `DATABASE_URL`
   - Table not found → Run `bun run db:push`
   - OAuth configuration error → Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

### Issue: redirect_uri_mismatch

**Symptoms:**
- OAuth flow starts but fails at Google redirect
- Error: "redirect_uri_mismatch"

**Fix:**
1. Check Railway logs for actual redirect URI being used
2. Verify Google Console has exact redirect URI:
   ```
   https://api.rejectionhero.com/api/auth/callback/google
   ```
3. Wait 2-3 minutes for Google to update
4. Try again

### Issue: Tables don't exist

**Symptoms:**
- Error: `P2021: The table "user" does not exist`
- Verification script shows missing tables

**Fix:**
```bash
cd backend
DATABASE_URL="your-neon-url" bun run db:push
```

Or set `DATABASE_URL` in Railway and redeploy (it will auto-run on startup).

### Issue: Database connection fails

**Symptoms:**
- Error: `PrismaClientInitializationError: Can't reach database server`

**Fix:**
1. Verify `DATABASE_URL` in Railway is correct
2. Ensure it includes `?sslmode=require`
3. Test connection:
   ```bash
   cd backend
   DATABASE_URL="your-neon-url" bun run scripts/verify-better-auth-tables.ts
   ```

## Verification Checklist

Before testing OAuth:

- [ ] Better Auth tables exist in Neon (`user`, `session`, `account`, `verification`)
- [ ] `BACKEND_URL=https://api.rejectionhero.com` in Railway
- [ ] `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` set in Railway
- [ ] `DATABASE_URL` points to Neon with `?sslmode=require`
- [ ] Google Console redirect URI matches exactly
- [ ] Railway logs show correct OAuth configuration
- [ ] Frontend has `EXPO_PUBLIC_VIBECODE_BACKEND_URL=https://api.rejectionhero.com`

## Summary

**The fix is:**
1. ✅ Ensure Better Auth tables exist in Neon
2. ✅ Set `BACKEND_URL=https://api.rejectionhero.com` in Railway
3. ✅ Configure Google Console redirect URI correctly
4. ✅ Verify all environment variables are set

**Neon is just the database** - it doesn't "handle OAuth". Better Auth (running on Railway) handles OAuth and stores data in Neon.

Once these are configured correctly, OAuth should work!
