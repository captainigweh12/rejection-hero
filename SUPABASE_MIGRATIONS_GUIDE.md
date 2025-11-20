# Supabase Migrations Guide

## Understanding Your Setup

You're using **Prisma ORM** with **Supabase PostgreSQL** as the database. This means:

- **Prisma** manages your schema (`backend/prisma/schema.prisma`)
- **Prisma** generates migrations from your schema
- **Supabase** provides the PostgreSQL database
- **Prisma db push** syncs your schema to Supabase

You don't need Supabase CLI migrations - Prisma handles everything!

## Current Setup (Recommended)

### How It Works

1. **Define schema** in `backend/prisma/schema.prisma`
2. **Run `prisma db push`** to sync schema to Supabase
3. **Prisma generates** PostgreSQL-compatible SQL automatically
4. **Tables created** in Supabase

### Sync Schema to Supabase

I've created a script to help you:

```bash
cd /home/user/workspace
./sync-supabase-schema.sh
```

This script:
- ✅ Connects to your Supabase database
- ✅ Tests connection first
- ✅ Runs `prisma db push` to sync schema
- ✅ Verifies tables were created
- ✅ Shows helpful error messages if it fails

### Manual Sync (Alternative)

If you prefer to run manually:

```bash
cd backend

# Set DATABASE_URL with Supabase connection
export DATABASE_URL="postgresql://postgres:Goomy5555@db.vtevcjqigebtxmkjzdjq.supabase.co:5432/postgres?sslmode=require"

# Push schema to Supabase
bunx prisma db push --accept-data-loss --skip-generate
```

## Railway Deployment (Automatic)

The Dockerfile automatically runs `prisma db push` on every deployment:

1. **Railway deploys** your code
2. **Startup script** runs `prisma db push`
3. **Schema synced** to Supabase automatically
4. **Server starts** with up-to-date schema

**No manual migrations needed!**

## Supabase CLI vs Prisma

### Option 1: Use Prisma (Current - Recommended)

**Pros:**
- ✅ Type-safe database client
- ✅ Automatic schema generation
- ✅ Works seamlessly with your codebase
- ✅ Already integrated with Railway

**Cons:**
- ⚠️  No native Supabase migrations (but not needed)

**How to use:**
```bash
# Sync schema
./sync-supabase-schema.sh

# Or manually
export DATABASE_URL="postgresql://postgres:Goomy5555@db.vtevcjqigebtxmkjzdjq.supabase.co:5432/postgres?sslmode=require"
cd backend
bunx prisma db push
```

### Option 2: Use Supabase CLI Migrations

**Pros:**
- ✅ Native Supabase tooling
- ✅ Version-controlled SQL migrations
- ✅ Can use Supabase-specific features

**Cons:**
- ⚠️  Requires switching from Prisma migrations
- ⚠️  Loses type-safe Prisma client (unless you use both)
- ⚠️  More complex setup

**How to use (if you want this):**
```bash
# Install Supabase CLI
npm install -g supabase

# Link to project
supabase link --project-ref vtevcjqigebtxmkjzdjq

# Create migration from Prisma schema
supabase db diff -f new-migration

# Or create empty migration
supabase migration new new-migration

# Push migrations
supabase db push
```

## Recommended Approach

**Stick with Prisma** because:
1. Your codebase already uses Prisma
2. Railway deployment is already configured
3. Type-safe database client
4. Simpler workflow

**Use the sync script** to manually sync schema:
```bash
./sync-supabase-schema.sh
```

## Quick Reference

### Check Supabase Tables

1. Go to **Supabase Dashboard** → **Table Editor**
2. Should see: `user`, `user_quest`, `user_stats`, etc.

### Verify Connection String

In Railway → Variables:
```
DATABASE_URL=postgresql://postgres:Goomy5555@db.vtevcjqigebtxmkjzdjq.supabase.co:5432/postgres?sslmode=require
```

### Sync Schema Locally

```bash
cd /home/user/workspace
./sync-supabase-schema.sh
```

### Deploy to Railway

Just push to git - Railway will:
1. Build Docker image
2. Run `prisma db push` automatically
3. Start server

## Troubleshooting

### "Can't reach database server"

**Fix:**
1. Verify connection string in Railway
2. Ensure `?sslmode=require` is present
3. Check Supabase password is correct

### "Table does not exist"

**Fix:**
1. Run `./sync-supabase-schema.sh` manually
2. Check Railway logs for schema sync errors
3. Verify `DATABASE_URL` in Railway is correct

### Prisma env var conflicts

**Fix:**
1. Remove `DATABASE_URL` from any `.env` files in repo
2. Ensure Railway variables are single source of truth
3. Check `.gitignore` includes `.env` files

## Summary

**You don't need Supabase CLI migrations!**

- ✅ Use `prisma db push` (via sync script or Railway)
- ✅ Prisma handles schema management
- ✅ Railway auto-syncs on deployment
- ✅ Type-safe database access via Prisma Client

**Quick sync command:**
```bash
./sync-supabase-schema.sh
```

