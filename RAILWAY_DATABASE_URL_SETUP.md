# Railway DATABASE_URL Setup - Exact Configuration

## 🎯 The Problem

```
PrismaClientInitializationError: 
Can't reach database server at `db.vtevcjqigebtxmkjzdjq.supabase.co:5432`
```

This means Prisma **cannot connect** to Supabase from Railway.

## 🔧 The Solution

### Step 1: Get the Exact Supabase Connection String

1. Go to **Supabase Dashboard** → Your Project → **Settings** → **Database**
2. Under **Connection string**, choose **URI** tab
3. Copy the **Node.js** connection string (direct connection, NOT pooler)
4. It should look like:

```
postgresql://postgres:[YOUR-PASSWORD]@db.vtevcjqigebtxmkjzdjq.supabase.co:5432/postgres
```

**For your project, it should be:**

```
postgresql://postgres:Goomy5555@db.vtevcjqigebtxmkjzdjq.supabase.co:5432/postgres?sslmode=require
```

**⚠️ CRITICAL:** Make sure it includes `?sslmode=require` at the end!

### Step 2: Set in Railway (EXACT FORMAT)

1. Go to **Railway Dashboard** → Your Backend Service
2. Click on **Variables** tab
3. Set `DATABASE_URL` to:

```env
DATABASE_URL=postgresql://postgres:Goomy5555@db.vtevcjqigebtxmkjzdjq.supabase.co:5432/postgres?sslmode=require
```

**Important:**
- ✅ Use the **direct connection** (starts with `db.`, not `aws-1-us-east-2.pooler`)
- ✅ **MUST include** `?sslmode=require` for Supabase SSL
- ✅ Copy exactly, no extra spaces or quotes
- ✅ Verify password is correct (`Goomy5555`)

### Step 3: Remove Conflicting Variables

**Check Railway Variables for:**

- ❌ **No duplicate `DATABASE_URL`** (remove any extras)
- ❌ **No `DB_URL`** or similar (remove if present)
- ❌ **No `.env` file in repo** with `DATABASE_URL` (Prisma will warn if found)

**Check your repo:**
```bash
cd /home/user/workspace
find . -name ".env" -not -path "*/node_modules/*" -not -path "*/.git/*"
```

If `.env` files exist with `DATABASE_URL`, either:
- Remove that line from the file, or
- Rename to `.env.local` so it's not used in production

### Step 4: Set DATABASE_PROVIDER

```env
DATABASE_PROVIDER=postgresql
```

### Step 5: Optional - Set DIRECT_URL (for Prisma Client)

If you want to use pooler for regular queries (better performance):

```env
DIRECT_URL=postgresql://postgres.vtevcjqigebtxmkjzdjq:Goomy5555@aws-1-us-east-2.pooler.supabase.com:5432/postgres?pgbouncer=true&sslmode=require
```

This is **optional**. If not set, Prisma Client will use `DATABASE_URL`.

## 📋 Complete Railway Variables Checklist

```
✅ DATABASE_URL=postgresql://postgres:Goomy5555@db.vtevcjqigebtxmkjzdjq.supabase.co:5432/postgres?sslmode=require
✅ DATABASE_PROVIDER=postgresql
✅ DIRECT_URL=postgresql://postgres.vtevcjqigebtxmkjzdjq:Goomy5555@aws-1-us-east-2.pooler.supabase.com:5432/postgres?pgbouncer=true&sslmode=require (optional)
✅ BETTER_AUTH_SECRET=<your-secret>
✅ BACKEND_URL=<your-railway-url>
... (other variables)
```

## 🔍 Verification Steps

### 1. Check Railway Variables

After setting variables:
- Railway Dashboard → Service → Variables
- Verify `DATABASE_URL` is exactly as shown above
- No extra spaces or quotes

### 2. Trigger Deployment

- Push a commit, or
- Railway Dashboard → Service → Deployments → Redeploy

### 3. Watch Deployment Logs

Look for these **success messages**:

```
🔍 Checking environment variables...
📊 DATABASE_URL is set: YES
📡 Using DATABASE_URL for schema sync (non-pooler detected)
🔍 Testing database connection...
✅ Database connection test successful
🔄 Syncing database schema with Prisma db push...
✅ Database schema sync completed successfully
✅ user_quest table exists
✅ user_stats table exists
✅ user table exists
🚀 Starting server...
```

**If you see:**
```
❌ Database connection test failed!
❌ Can't reach database server
```

Then:
1. Double-check `DATABASE_URL` in Railway matches exactly
2. Verify password is correct
3. Check Supabase network settings allow Railway IPs
4. Ensure `?sslmode=require` is present

### 4. Verify in Supabase

1. Go to **Supabase Dashboard** → **Table Editor**
2. Should see:
   - `user`
   - `user_quest`
   - `user_stats`
   - `account`
   - `session`
   - ... (all other tables)

## 🚨 Common Issues

### Issue: "Can't reach database server"

**Causes:**
- Missing `?sslmode=require` in connection string
- Wrong password
- Wrong host (should be `db.`, not `aws-1-us-east-2.pooler`)
- Supabase network restrictions

**Fix:**
- Ensure connection string format is exactly correct
- Verify password matches Supabase
- Check Supabase → Settings → Database → Network access

### Issue: Prisma env var conflicts

**Cause:**
- Multiple `.env` files with `DATABASE_URL`
- Railway variables conflicting with repo `.env` files

**Fix:**
- Remove `DATABASE_URL` from any `.env` files in repo
- Ensure Railway variables are the single source of truth
- Check `.gitignore` includes `.env` files

### Issue: Connection works but tables don't exist

**Cause:**
- Schema sync (`prisma db push`) failed silently
- Connection to wrong database

**Fix:**
- Check logs for "Database schema sync completed successfully"
- Verify `DATABASE_URL` connects to correct Supabase project
- Manually run: `bunx prisma db push` with same `DATABASE_URL`

## 📝 What Changed in Dockerfile

The startup script now:
1. ✅ **Automatically adds `sslmode=require`** if missing from PostgreSQL URLs
2. ✅ **Tests connection** before attempting schema sync
3. ✅ **Better error messages** showing exact connection string format needed
4. ✅ **Verifies SSL** is configured correctly

## 🎯 Expected Result

After fixing `DATABASE_URL` in Railway:
- ✅ Connection test passes
- ✅ Schema sync completes successfully
- ✅ Tables created in Supabase
- ✅ No more "Can't reach database server" errors
- ✅ No more "table does not exist" errors
- ✅ App runs successfully

## 📞 Need Help?

If connection still fails after setting correct `DATABASE_URL`:
1. Check Railway status page for outages
2. Verify Supabase project is active (not paused)
3. Test connection locally with same `DATABASE_URL`
4. Check Supabase → Settings → Database → Connection pooling settings

