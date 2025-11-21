# Sign-Up Data Verification Guide

## Problem

Users are reporting errors during sign-up. Need to verify that data is actually being saved to the Neon database.

## Sign-Up Flow

1. **Frontend** calls `authClient.signUp.email()` → Better Auth endpoint
2. **Better Auth** creates user in database via Prisma adapter
3. **Better Auth** creates account record (authentication data)
4. **Better Auth** creates session record (login session)
5. **App** fetches profile → Backend auto-creates profile if missing
6. **App** fetches stats → Backend auto-creates user_stats if missing

## Verification Script

Run this to verify sign-up data:

```bash
# Verify all users (last 10)
cd backend
bun run verify:signup

# Verify specific user by email
bun run verify:signup "user@example.com"
```

**What it checks:**
- ✅ User record exists
- ✅ Account record exists (Better Auth)
- ✅ Session records exist (if logged in)
- ✅ Profile record exists (auto-created)
- ✅ user_stats record exists (auto-created)

## Common Issues

### Issue: User not created

**Symptoms:**
- Verification script shows "User not found"
- Sign-up appears successful but user can't log in

**Possible causes:**
1. Database connection failed during sign-up
2. Better Auth configuration issue
3. Missing Better Auth tables

**Fix:**
1. Check Railway logs for database errors
2. Verify `DATABASE_URL` is set correctly
3. Run `bun run verify:auth-tables` to check tables exist

### Issue: Account record missing

**Symptoms:**
- User exists but no account record
- User can't authenticate

**Possible causes:**
1. Better Auth Prisma adapter issue
2. Database transaction failed

**Fix:**
1. Check Railway logs for Better Auth errors
2. Verify `BETTER_AUTH_SECRET` is set
3. Check if Better Auth tables exist

### Issue: Profile not created

**Symptoms:**
- User exists but profile is missing
- App shows 404 or error when fetching profile

**Current behavior:**
- Profile is **auto-created** when user first accesses `/api/profile`
- This is intentional - profile creation happens lazily

**Fix:**
- Profile will be auto-created on first profile fetch
- If it's not, check Railway logs for profile creation errors

### Issue: user_stats not created

**Symptoms:**
- User exists but no user_stats record
- App shows error when fetching stats

**Current behavior:**
- Stats are **auto-created** when user first accesses `/api/stats`
- This is intentional - stats creation happens lazily

**Fix:**
- Stats will be auto-created on first stats fetch
- If it's not, check Railway logs for stats creation errors

## Railway Logs to Check

### During Sign-Up

Look for these log messages:

**Success:**
```
✅ [Auth] Better Auth initialized
✅ User created in database
✅ Account created
✅ Session created
```

**Errors:**
```
❌ [Auth] Database connection failed
❌ [Auth] User creation failed
❌ Table does not exist
❌ PrismaClientInitializationError
```

### After Sign-Up (Profile Fetch)

Look for:
```
📝 Creating default profile for user [id] ([email])
✅ [Profile] Successfully fetched profile
⚠️ Failed to sync user to GoHighLevel (non-blocking)
```

### Database Connection Errors

Common errors:
- `P1001: Can't reach database server` → Check `DATABASE_URL`
- `P2021: Table does not exist` → Run `bun run db:push`
- `PrismaClientInitializationError` → Database connection issue

## Manual Verification

### 1. Check Database Connection

```bash
cd backend
DATABASE_URL="your-neon-url" bun run verify:auth-tables
```

Should show:
```
✅ Table "user" exists
✅ Table "account" exists
✅ Table "session" exists
✅ Table "verification" exists
```

### 2. Check User Data

```bash
cd backend
DATABASE_URL="your-neon-url" bun run verify:signup "user@example.com"
```

Should show:
```
✅ User found: user@example.com
✅ Account records: 1
✅ Profile exists
✅ User stats exist
```

### 3. Test Sign-Up Endpoint

```bash
curl -X POST https://api.rejectionhero.com/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "name": "Test User"
  }'
```

Check response:
- `200 OK` → Sign-up successful
- `400` or `500` → Check error message

### 4. Check Railway Deployment

1. Go to Railway → Backend Service → Deployments
2. Check latest deployment logs
3. Look for:
   - Database connection errors
   - Better Auth initialization
   - Sign-up endpoint errors

## Required Environment Variables

Ensure these are set in Railway:

```env
✅ DATABASE_URL=postgresql://neondb_owner:...@ep-withered-field-a4skic0c-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
✅ DATABASE_PROVIDER=postgresql
✅ BETTER_AUTH_SECRET=your-secret-min-32-chars
✅ BACKEND_URL=https://api.rejectionhero.com
```

## Troubleshooting Steps

1. **Verify Better Auth tables exist:**
   ```bash
   bun run verify:auth-tables
   ```

2. **Check Railway logs** for sign-up errors

3. **Verify specific user data:**
   ```bash
   bun run verify:signup "user@example.com"
   ```

4. **Check database connection:**
   - Verify `DATABASE_URL` in Railway
   - Test connection manually if needed

5. **Verify Better Auth configuration:**
   - Check `BETTER_AUTH_SECRET` is set
   - Check `BACKEND_URL` is correct
   - Verify Better Auth tables exist

## Expected Behavior

**After successful sign-up:**
1. ✅ User record created in Neon
2. ✅ Account record created (Better Auth)
3. ✅ Session created (user is logged in)
4. ⏳ Profile created on first `/api/profile` fetch
5. ⏳ user_stats created on first `/api/stats` fetch

**If profile/stats are missing:**
- This is normal - they're created lazily
- First app access to profile/stats will create them
- Check Railway logs if they don't auto-create

## Summary

✅ **Required immediately:**
- User record (Better Auth creates this)
- Account record (Better Auth creates this)
- Session record (Better Auth creates this)

⏳ **Created lazily:**
- Profile (auto-created on first profile fetch)
- user_stats (auto-created on first stats fetch)

**If sign-up is failing:**
1. Check Railway logs for errors
2. Run `bun run verify:auth-tables` to verify tables exist
3. Run `bun run verify:signup "email"` to check user data
4. Verify environment variables are set correctly

