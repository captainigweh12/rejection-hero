# Clear Cache to Fix Sign-Up Errors

## Cache Issues That Could Affect Sign-Up

### 1. Better Auth Cookie Cache

Better Auth uses cookie caching for sessions. If there's stale cache, it could cause issues.

**Location:** `backend/src/auth.ts`
```typescript
cookieCache: {
  enabled: true,
  maxAge: 60 * 60 * 24 * 7, // 7 days
}
```

### 2. Frontend Auth Client Cache

The frontend auth client may cache authentication state.

**Location:** `src/lib/authClient.ts` - Uses Expo SecureStore

### 3. Browser/App Cache

If testing in a browser or app, cached data could interfere.

## How to Clear Cache

### Option 1: Clear Frontend App Cache (Mobile App)

**For Expo/React Native:**
1. **Close the app completely**
2. **Clear app data:**
   - **iOS:** Settings → [App Name] → Delete App (reinstall)
   - **Android:** Settings → Apps → [App Name] → Storage → Clear Data
3. **Or reinstall the app**

**For Expo Go:**
- Shake device → Reload
- Or close and reopen Expo Go

### Option 2: Clear Backend Cache (Railway)

**Railway doesn't cache by default**, but you can:
1. **Redeploy the service:**
   - Railway → Backend Service → Deployments
   - Click "Redeploy" on latest deployment
2. **Or trigger a new deployment:**
   - Make a small commit and push
   - Railway will auto-deploy

### Option 3: Clear Better Auth Session Cache

Better Auth uses cookies for session caching. To clear:

**On the backend (if you have access):**
- Sessions are stored in the database
- You can clear them by deleting session records (not recommended for production)

**On the frontend:**
- Sign out completely
- Clear app data (see Option 1)

## But First: Check the Actual Error!

**Before clearing cache, check Railway logs for the exact error:**

1. **Go to Railway** → Backend Service → Deployments → Latest → Logs
2. **Look for sign-up errors:**
   ```
   🔐 [Sign-Up] Email sign-up request received
   ❌ [Sign-Up] Sign-up error (400/500):
      [error message here]
   ```

3. **Common errors:**
   - `Database connection failed` → Check `DATABASE_URL`
   - `Table does not exist` → Run `bun run db:push`
   - `BETTER_AUTH_SECRET invalid` → Check secret is set
   - `User already exists` → Email already registered
   - `Validation error` → Check input format

## Step-by-Step Troubleshooting

### Step 1: Check Railway Logs

**Most important step!** Check Railway logs for the exact error:

1. Go to Railway → Backend Service
2. Click "Deployments" → Latest deployment
3. Click "View Logs"
4. Look for lines starting with:
   - `🔐 [Sign-Up]`
   - `❌ [Sign-Up]`
   - `❌ [Auth Handler]`

**Copy the error message** - this tells us exactly what's wrong.

### Step 2: Verify Environment Variables

In Railway → Backend Service → Variables, check:

```env
✅ DATABASE_URL=postgresql://neondb_owner:...@ep-withered-field-a4skic0c-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
✅ DATABASE_PROVIDER=postgresql
✅ BETTER_AUTH_SECRET=njqPE5cow9YA4VMClUxbrgIqu6+e3ENx2rui5JMMpU4=
✅ BACKEND_URL=https://api.rejectionhero.com
```

### Step 3: Check Database Connection

Look for these in Railway startup logs:

```
✅ [Auth] Database connection successful
✅ [Auth] User table accessible
✅ [Auth] Account table accessible
✅ [Auth] Session table accessible
```

If you see errors, fix them first.

### Step 4: Clear Frontend Cache (If Needed)

**If the error persists after fixing backend issues:**

1. **Close the app completely**
2. **Clear app data** (see Option 1 above)
3. **Reopen the app**
4. **Try sign-up again**

### Step 5: Test with Fresh User

Try signing up with a **completely new email** that hasn't been used before.

## Common Sign-Up Errors & Fixes

### Error: "User already exists"

**Not a cache issue** - email is already registered.

**Fix:** Use a different email or sign in instead.

### Error: "Database connection failed"

**Not a cache issue** - database connection problem.

**Fix:**
1. Check `DATABASE_URL` in Railway
2. Verify Neon database is accessible
3. Check connection string format

### Error: "Table does not exist"

**Not a cache issue** - database schema missing.

**Fix:**
```bash
DATABASE_URL="..." bun run db:push
```

### Error: "BETTER_AUTH_SECRET invalid"

**Not a cache issue** - secret not set or too short.

**Fix:**
1. Set `BETTER_AUTH_SECRET` in Railway
2. Must be at least 32 characters
3. Redeploy

### Error: "Network error" or "Request failed"

**Could be cache, but more likely:**
- Backend is down
- Network connectivity issue
- CORS issue

**Fix:**
1. Check Railway deployment is running
2. Check backend URL is correct
3. Check network connection

## When Cache Clearing Actually Helps

Cache clearing helps when:
- ✅ App shows stale authentication state
- ✅ App thinks user is logged in but backend says they're not
- ✅ App has cached error messages
- ✅ Frontend auth client has stale session data

Cache clearing **doesn't help** when:
- ❌ Database connection is failing
- ❌ Tables don't exist
- ❌ Environment variables are missing
- ❌ Backend is crashing
- ❌ Validation errors

## Quick Fix Checklist

1. **Check Railway logs** for exact error ← **MOST IMPORTANT**
2. **Verify environment variables** are set correctly
3. **Check database connection** in startup logs
4. **Clear frontend cache** (if error persists)
5. **Try with fresh email** (to rule out "user exists" error)

## What to Share

If you're still getting errors, share:

1. **The exact error message from Railway logs**
2. **Railway startup logs** (showing database connection status)
3. **What happens when you try to sign up** (error message in app)

This will help identify the exact issue!

