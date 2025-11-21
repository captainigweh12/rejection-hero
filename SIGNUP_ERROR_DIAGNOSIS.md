# Sign-Up Error Diagnosis Guide

## Problem

Sign-up errors are preventing user data from being saved to Neon database.

## Enhanced Error Logging

The backend now has enhanced error logging that will show:

1. **Database connection status** on startup
2. **Better Auth table verification** on startup
3. **Detailed sign-up request/response logging**
4. **Specific error type detection** (database, table, validation, etc.)

## Check Railway Logs

After a sign-up attempt, check Railway logs for:

### ✅ Success Indicators

```
✅ [Auth] Database connection successful
✅ [Auth] User table accessible
✅ [Auth] Account table accessible
✅ [Auth] Session table accessible
🔐 [Sign-Up] Email sign-up request received
✅ [Sign-Up] Sign-up successful - user should be created in database
   ✅ User ID: [id]
   ✅ Email: [email]
```

### ❌ Error Indicators

#### Database Connection Error

```
❌ [Auth] Cannot reach database server!
   Check DATABASE_URL in Railway environment variables
```

**Fix:**
1. Verify `DATABASE_URL` is set in Railway
2. Check connection string format
3. Ensure database is accessible

#### Missing Tables Error

```
❌ [Auth] User table does not exist!
   Run: bun run db:push
```

**Fix:**
```bash
# In Railway, the schema should sync automatically on deploy
# But if tables are missing, verify with:
DATABASE_URL="your-url" bun run verify:auth-tables
```

#### Sign-Up Error

```
❌ [Sign-Up] Sign-up error (400/500):
   [error message]
```

**Common errors:**
- `User already exists` → Email already registered
- `Database connection failed` → Check DATABASE_URL
- `Table does not exist` → Run db:push
- `Validation error` → Check input format

## Verification Steps

### Step 1: Check Database Connection

Look for these in Railway startup logs:

```
✅ [Auth] Database connection successful
✅ [Auth] User table accessible
✅ [Auth] Account table accessible
✅ [Auth] Session table accessible
```

If you see errors, fix them before testing sign-up.

### Step 2: Test Sign-Up

1. Attempt sign-up from app
2. Check Railway logs immediately after
3. Look for sign-up request/response logs

### Step 3: Verify User Was Created

After successful sign-up, verify data exists:

```bash
cd backend
DATABASE_URL="postgresql://..." bun run verify:signup "user@example.com"
```

Should show:
```
✅ User found: user@example.com
✅ Account records: 1
✅ Profile exists (or will be auto-created)
```

## Common Issues & Fixes

### Issue: Database Connection Failed

**Symptoms:**
- `❌ [Auth] Cannot reach database server!`
- `P1001: Can't reach database server`

**Fix:**
1. Check `DATABASE_URL` in Railway → Variables
2. Ensure it includes `?sslmode=require` for Neon
3. Verify connection string format:
   ```
   postgresql://user:password@host:port/database?sslmode=require
   ```

### Issue: Tables Don't Exist

**Symptoms:**
- `❌ [Auth] User table does not exist!`
- `P2021: Table does not exist`

**Fix:**
1. Check Railway deployment logs for schema sync
2. Verify tables exist:
   ```bash
   DATABASE_URL="..." bun run verify:auth-tables
   ```
3. If missing, schema should sync on deploy, but you can manually push:
   ```bash
   DATABASE_URL="..." bun run db:push
   ```

### Issue: User Already Exists

**Symptoms:**
- `❌ [Sign-Up] Sign-up error (400)`
- Error mentions "unique constraint" or "already exists"

**Fix:**
- This is expected - user with that email already exists
- User should sign in instead

### Issue: Better Auth Configuration Error

**Symptoms:**
- `❌ [Auth] BETTER_AUTH_SECRET is invalid`
- `❌ [Auth] DATABASE_URL is invalid`

**Fix:**
1. Check Railway → Variables:
   - `BETTER_AUTH_SECRET` must be at least 32 characters
   - `DATABASE_URL` must be valid PostgreSQL connection string
2. Redeploy after fixing

## Required Environment Variables

Ensure these are set in Railway:

```env
✅ DATABASE_URL=postgresql://neondb_owner:...@ep-withered-field-a4skic0c-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
✅ DATABASE_PROVIDER=postgresql
✅ BETTER_AUTH_SECRET=your-secret-min-32-chars
✅ BACKEND_URL=https://api.rejectionhero.com
```

## Testing Sign-Up Flow

### 1. Check Startup Logs

After Railway deployment, check logs for:

```
✅ [Auth] Database connection successful
✅ [Auth] User table accessible
✅ [Auth] Account table accessible
✅ [Auth] Session table accessible
✅ [Auth] Better Auth initialized
```

### 2. Attempt Sign-Up

From the app, try to sign up with a new email.

### 3. Check Sign-Up Logs

Look for:

```
🔐 [Sign-Up] Email sign-up request received
   Email: test@example.com
   Name: Test User
✅ [Sign-Up] Sign-up successful - user should be created in database
   ✅ User ID: [id]
   ✅ Email: test@example.com
```

### 4. Verify Data

```bash
DATABASE_URL="..." bun run verify:signup "test@example.com"
```

## Next Steps

1. **Check Railway logs** for the exact error message
2. **Verify environment variables** are set correctly
3. **Test database connection** with verification script
4. **Check Better Auth tables** exist
5. **Review error logs** for specific error type

The enhanced logging will show exactly what's failing. Check Railway logs after the next sign-up attempt to see the specific error.

