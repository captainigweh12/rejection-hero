# Neon Database Setup Guide

## Overview

This project uses **Neon** as the PostgreSQL database provider instead of Supabase.

Neon provides:
- ✅ Serverless PostgreSQL
- ✅ Automatic branching for PRs (via GitHub Actions)
- ✅ Connection pooling
- ✅ Better performance for serverless applications

## Railway Configuration

### Required Environment Variables

In Railway → Backend Service → Variables:

```env
DATABASE_URL=postgresql://[user]:[password]@[hostname]/[dbname]?sslmode=require
DATABASE_PROVIDER=postgresql
```

**Format:**
- Neon provides connection strings in your dashboard
- Typically: `postgresql://[user]:[password]@[neon-host].neon.tech/[dbname]?sslmode=require`
- Always include `?sslmode=require` for SSL

### Where to Find Your Neon Connection String

1. Go to **Neon Console** → Your Project
2. Click on **Connection Details**
3. Copy the **Connection string** (URI format)
4. It should look like:
   ```
   postgresql://[user]:[password]@[endpoint].neon.tech/neondb?sslmode=require
   ```

### Optional: DIRECT_URL (for Prisma Client)

If you want to use a pooled connection for Prisma Client:

```env
DIRECT_URL=postgresql://[user]:[password]@[endpoint-pooler].neon.tech/neondb?sslmode=require
```

Neon provides both pooled and non-pooled connections. Use:
- **Non-pooled** (`DATABASE_URL`) for migrations/schema operations
- **Pooled** (`DIRECT_URL`) for regular queries (better performance)

## GitHub Actions - PR Branching

The project includes a GitHub Actions workflow that automatically:
- ✅ Creates a Neon branch for each PR
- ✅ Runs migrations on the PR branch
- ✅ Deletes the branch when PR is closed

### Setup Required

1. **GitHub Variables:**
   - Go to GitHub → Repository → Settings → Secrets and variables → Actions
   - Add variable: `NEON_PROJECT_ID` (your Neon project ID)

2. **GitHub Secrets:**
   - Add secret: `NEON_API_KEY` (from Neon Console → Settings → API keys)

3. **Workflow Location:**
   - `.github/workflows/neon-branches.yml`

### How It Works

1. **PR Opened/Updated:**
   - Creates a new Neon branch: `preview/pr-{number}-{branch-name}`
   - Runs `prisma db push` on that branch
   - Branch expires after 14 days

2. **PR Closed:**
   - Automatically deletes the Neon branch
   - Cleans up resources

## Local Development

### Sync Schema to Neon

I've created a sync script:

```bash
cd /home/user/workspace
./sync-neon-schema.sh
```

Or manually:

```bash
cd backend
export DATABASE_URL="postgresql://[user]:[password]@[hostname]/[dbname]?sslmode=require"
bunx prisma db push --accept-data-loss --skip-generate
```

### Connection String Format

Neon connection strings look like:

```
postgresql://[user]:[password]@[endpoint].neon.tech/neondb?sslmode=require
```

**Components:**
- `[user]` - Database user (usually same as project)
- `[password]` - Database password
- `[endpoint]` - Your Neon endpoint (e.g., `ep-cool-darkness-123456.us-east-2.aws.neon.tech`)
- `neondb` - Default database name (or your custom database)
- `?sslmode=require` - SSL connection (required)

## Migration from Supabase

If you were previously using Supabase:

### Changes Required:

1. **Update Railway `DATABASE_URL`:**
   - Replace Supabase connection string with Neon connection string
   - Get it from Neon Console → Connection Details

2. **Remove Supabase-specific config:**
   - No changes needed in Prisma schema (still PostgreSQL)
   - Connection string format is the same

3. **Update GitHub Actions:**
   - Already set up in `.github/workflows/neon-branches.yml`
   - Just add `NEON_PROJECT_ID` variable and `NEON_API_KEY` secret

## Prisma Schema

Your Prisma schema remains unchanged (still PostgreSQL):

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

## Deployment

### Railway Auto-Deployment

Railway automatically:
1. ✅ Reads `DATABASE_URL` from environment variables
2. ✅ Runs `prisma db push` on deployment (via Dockerfile)
3. ✅ Tests connection before starting server
4. ✅ Verifies tables were created

**No manual migrations needed!**

### Manual Schema Sync

If you need to manually sync schema:

```bash
cd backend
export DATABASE_URL="postgresql://[user]:[password]@[hostname]/[dbname]?sslmode=require"
bunx prisma db push --accept-data-loss --skip-generate
```

## Troubleshooting

### "Can't reach database server"

**Fix:**
1. Verify `DATABASE_URL` in Railway matches Neon connection string exactly
2. Ensure `?sslmode=require` is included
3. Check Neon project is active (not paused)

### Connection Timeout

**Fix:**
1. Use pooled connection for regular queries
2. Check Neon region matches your Railway region
3. Verify network connectivity

### Schema Sync Fails

**Fix:**
1. Use non-pooled connection for `prisma db push`
2. Check connection string format
3. Verify credentials are correct

## Differences from Supabase

| Feature | Supabase | Neon |
|---------|----------|------|
| Connection Format | `db.{project}.supabase.co` | `{endpoint}.neon.tech` |
| Pooling | Separate pooler URL | Built-in pooling |
| Branching | Manual | Automatic (via GitHub Actions) |
| SSL | `?sslmode=require` | `?sslmode=require` |
| Database Name | `postgres` | `neondb` (default) |

## Quick Reference

**Railway Variables:**
```
DATABASE_URL=postgresql://[user]:[password]@[endpoint].neon.tech/neondb?sslmode=require
DATABASE_PROVIDER=postgresql
```

**GitHub Secrets:**
```
NEON_API_KEY=<your-neon-api-key>
```

**GitHub Variables:**
```
NEON_PROJECT_ID=<your-neon-project-id>
```

## Next Steps

1. ✅ Get Neon connection string from Neon Console
2. ✅ Update Railway `DATABASE_URL` with Neon connection string
3. ✅ Set up GitHub Actions (add `NEON_PROJECT_ID` and `NEON_API_KEY`)
4. ✅ Deploy and verify tables are created
5. ✅ Check Neon Console to see your database

