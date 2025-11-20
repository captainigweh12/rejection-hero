# Railway Neon Configuration - Your Current Setup

## Your Neon Connection Details

Based on your connection string:
- **Endpoint:** `ep-withered-field-a4skic0c.us-east-1.aws.neon.tech`
- **Pooler Endpoint:** `ep-withered-field-a4skic0c-pooler.us-east-1.aws.neon.tech`
- **User:** `neondb_owner`
- **Password:** `npg_9vudwr7pPfFJ`
- **Database:** `neondb`
- **Region:** `us-east-1`

## Railway Variables Configuration

### Required Variables

In Railway → Backend Service → Variables, set:

#### 1. DATABASE_URL (for migrations - use NON-POOLER)

```env
DATABASE_URL=postgresql://neondb_owner:npg_9vudwr7pPfFJ@ep-withered-field-a4skic0c.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**Important:** 
- Use the **non-pooler** endpoint (without `-pooler` in the hostname)
- Required for `prisma db push` and schema operations
- Includes both `sslmode=require` and `channel_binding=require`

#### 2. DATABASE_PROVIDER

```env
DATABASE_PROVIDER=postgresql
```

#### 3. DIRECT_URL (optional - for Prisma Client - use POOLER)

```env
DIRECT_URL=postgresql://neondb_owner:npg_9vudwr7pPfFJ@ep-withered-field-a4skic0c-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**Note:** This is optional. If not set, Prisma Client will use `DATABASE_URL`. The pooler provides better performance for regular queries.

## Connection String Format

### For Migrations (DATABASE_URL)
```
postgresql://neondb_owner:npg_9vudwr7pPfFJ@ep-withered-field-a4skic0c.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```
- **No `-pooler`** in the endpoint
- Direct connection for schema operations

### For Queries (DIRECT_URL - optional)
```
postgresql://neondb_owner:npg_9vudwr7pPfFJ@ep-withered-field-a4skic0c-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```
- **Has `-pooler`** in the endpoint
- Connection pooling for better performance

## Complete Railway Variables Checklist

```
✅ DATABASE_URL=postgresql://neondb_owner:npg_9vudwr7pPfFJ@ep-withered-field-a4skic0c.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
✅ DATABASE_PROVIDER=postgresql
✅ DIRECT_URL=postgresql://neondb_owner:npg_9vudwr7pPfFJ@ep-withered-field-a4skic0c-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require (optional)
✅ BETTER_AUTH_SECRET=<your-secret>
✅ BACKEND_URL=<your-railway-url>
... (other variables)
```

## Quick Setup Steps

1. **Copy the DATABASE_URL above** (non-pooler version)
2. **Go to Railway** → Your Backend Service → Variables
3. **Set DATABASE_URL** with the non-pooler connection string
4. **Set DATABASE_PROVIDER=postgresql**
5. **Optionally set DIRECT_URL** with the pooler connection string
6. **Deploy** - Railway will automatically sync schema

## Testing Connection Locally (Optional)

If you want to test the connection locally:

```bash
cd /home/user/workspace
export DATABASE_URL="postgresql://neondb_owner:npg_9vudwr7pPfFJ@ep-withered-field-a4skic0c.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
./sync-neon-schema.sh
```

Or manually:
```bash
cd backend
export DATABASE_URL="postgresql://neondb_owner:npg_9vudwr7pPfFJ@ep-withered-field-a4skic0c.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
bunx prisma db push --accept-data-loss --skip-generate
```

## Expected Railway Logs (Success)

After deployment with correct `DATABASE_URL`:

```
🔍 Checking environment variables...
📊 DATABASE_URL is set: YES
📡 Using DATABASE_URL for schema sync
🔍 Testing database connection...
✅ Database connection test successful
🔄 Syncing database schema with Prisma db push...
✅ Database schema sync completed successfully
✅ user_quest table exists
✅ user_stats table exists
✅ user table exists
🚀 Starting server...
```

## Troubleshooting

### If Connection Fails

1. **Verify endpoint** - Make sure you're using the non-pooler for `DATABASE_URL`
2. **Check credentials** - User: `neondb_owner`, Password: `npg_9vudwr7pPfFJ`
3. **Verify SSL params** - Must include `sslmode=require&channel_binding=require`
4. **Check Neon Console** - Ensure project is active (not paused)

### Get Non-Pooler Connection String

If you need the non-pooler connection string:
1. Go to **Neon Console** → Your Project
2. Click **Connection Details**
3. Look for **Non-pooled connection** or **Direct connection**
4. Copy that connection string

The difference:
- **Pooler:** `ep-withered-field-a4skic0c-pooler.us-east-1.aws.neon.tech`
- **Non-pooler:** `ep-withered-field-a4skic0c.us-east-1.aws.neon.tech` (no `-pooler`)

## Security Note

⚠️ **Never commit these credentials to git!** They're already in `.gitignore`, but make sure:
- Only set in Railway Variables (not in `.env` files in repo)
- Railway variables are encrypted at rest
- Use Neon's connection pooling for better security

