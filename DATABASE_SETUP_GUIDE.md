# Database Setup Guide for Railway + Supabase

## Problem Diagnosis

The errors you're seeing indicate that **Prisma is connected to a database where tables don't exist**:

1. `⚠️ [Quest Time Warnings] user_quest table does not exist yet` - Scheduled tasks gracefully handling missing tables
2. `PrismaClientKnownRequestError: The table public.user_stats does not exist` - Prisma queries failing

**Root Cause:** The database schema migrations (`prisma db push`) are either:
- Not running on deployment
- Running but failing silently
- Pointing at the wrong database

## Solution

### Step 1: Configure Railway Environment Variables

In Railway → Your Backend Service → Variables / Environment:

#### Required Variables:

1. **`DATABASE_URL`** (for schema migrations - use NON-POOLER)
   ```
   postgresql://postgres:Goomy5555@db.vtevcjqigebtxmkjzdjq.supabase.co:5432/postgres
   ```
   - ⚠️ **IMPORTANT:** Use the **non-pooler** connection (starts with `db.`)
   - This is used for `prisma db push` (schema operations)
   - Pooler connections (`aws-1-us-east-2.pooler.supabase.com`) can cause schema sync failures

2. **`DIRECT_URL`** (optional, for Prisma Client - can use pooler)
   ```
   postgresql://postgres.vtevcjqigebtxmkjzdjq:Goomy5555@aws-1-us-east-2.pooler.supabase.com:5432/postgres?pgbouncer=true
   ```
   - This is used by Prisma Client for regular queries
   - Pooler is fine here (better for connection pooling)
   - If not set, Prisma will use `DATABASE_URL`

3. **`DATABASE_PROVIDER`**
   ```
   postgresql
   ```

#### Why Two URLs?

- **`DATABASE_URL`** (non-pooler): Used for schema migrations and admin operations
  - Schema operations need a direct connection
  - Pooler can interfere with migrations
  
- **`DIRECT_URL`** (pooler OK): Used by Prisma Client for queries
  - Connection pooling improves performance
  - Safe for regular database queries

### Step 2: Remove Conflicting .env Files

⚠️ **Check your repository for `.env` files:**

```bash
# Check if .env exists in repo
ls -la backend/.env
ls -la .env
```

**If `.env` files exist in the repo:**
- Remove `DATABASE_URL` from them (or remove the files entirely)
- Railway environment variables will override them anyway
- Having them in the repo can cause confusion

### Step 3: Verify Current Setup

**In Supabase Dashboard:**
1. Go to Table Editor
2. Check if these tables exist:
   - `user_quest`
   - `user_stats`
   - `user`
   - `account`
   - `session`

**If tables DON'T exist:**
- Schema migrations haven't run yet
- This is expected for first-time setup

**If tables DO exist but you still see errors:**
- Railway might be connecting to a different database
- Check that `DATABASE_URL` in Railway matches Supabase project

### Step 4: How Schema Sync Works

The Dockerfile startup script (`start.sh`) automatically:
1. ✅ Checks `DATABASE_URL` is set
2. ✅ Detects if using pooler vs non-pooler connection
3. ✅ Runs `bun run db:push` (which runs `prisma db push`)
4. ✅ Verifies tables were created (`user_quest`, `user_stats`, `user`)
5. ✅ Starts the server only if schema sync succeeds

**What `prisma db push` does:**
- Reads `backend/prisma/schema.prisma`
- Generates PostgreSQL-compatible SQL
- Creates/updates tables in Supabase
- **Note:** We use `db push` instead of `migrate deploy` because:
  - The existing migration file is SQLite-specific
  - `db push` generates fresh PostgreSQL SQL from schema.prisma

### Step 5: Deploy and Verify

1. **Set Railway variables** (from Step 1)
2. **Trigger a new deployment** (or wait for auto-deploy)
3. **Check Railway logs** for:

   **✅ Success:**
   ```
   🚀 Starting Backend Service...
   📊 DATABASE_URL is set: YES
   📡 Using DATABASE_URL for schema sync (non-pooler detected)
   🔄 Syncing database schema with Prisma db push...
   ✅ Database schema sync completed successfully
   ✅ user_quest table exists
   ✅ user_stats table exists
   ✅ user table exists
   🚀 Starting server...
   ```

   **❌ Failure:**
   ```
   ❌ Database schema sync failed!
   ❌ Exit code: [number]
   🔍 Troubleshooting:
     1. Verify DATABASE_URL is correct in Railway
     2. Use non-pooler connection...
   ```

4. **Verify in Supabase:**
   - Tables should now exist
   - Check Table Editor shows all tables

### Step 6: Manual Schema Sync (if needed)

If automatic sync fails, you can manually run:

```bash
# From your local machine (temporarily)
export DATABASE_URL="postgresql://postgres:Goomy5555@db.vtevcjqigebtxmkjzdjq.supabase.co:5432/postgres"
cd backend
bunx prisma db push --accept-data-loss --skip-generate
```

Then verify in Supabase Table Editor.

## Troubleshooting

### "The table public.user_quest does not exist"
- **Cause:** Schema sync hasn't run or failed
- **Fix:** Check Railway logs, verify `DATABASE_URL` is correct, ensure it's non-pooler

### "Can't reach database server"
- **Cause:** Wrong connection string or credentials
- **Fix:** Verify `DATABASE_URL` format matches Supabase exactly

### Schema sync succeeds but tables still missing
- **Cause:** Connected to wrong database
- **Fix:** Verify `DATABASE_URL` matches your Supabase project ID

### Prisma env var conflict warnings
- **Cause:** Multiple `.env` files or conflicting variables
- **Fix:** Remove `DATABASE_URL` from `.env` files in repo, use Railway variables only

## Current Package.json Scripts

```json
{
  "scripts": {
    "db:push": "prisma db push --accept-data-loss --skip-generate",
    "db:migrate": "prisma migrate deploy",
    "db:setup": "bun run postinstall && bun run db:push",
    "start": "NODE_ENV=production bun run src/index.ts"
  }
}
```

## Railway Start Command

The Dockerfile automatically runs:
```bash
/app/backend/start.sh
```

Which:
1. Runs `bun run db:push` (schema sync)
2. Verifies tables exist
3. Runs `bun run start` (server)

**No manual configuration needed** - just set the environment variables!

