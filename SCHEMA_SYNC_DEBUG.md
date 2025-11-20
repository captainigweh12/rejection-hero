# Database Schema Sync Debugging

## Current Issue

The warnings `⚠️ [Quest Time Warnings] user_quest table does not exist yet, skipping...` indicate that:
- ✅ Scheduled tasks are working correctly (gracefully handling missing tables)
- ❌ Database schema sync (`prisma db push`) hasn't completed successfully yet

## What to Check in Railway Logs

Look for these messages in your Railway deployment logs:

### Successful Schema Sync Should Show:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Starting Backend Service...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 Checking database connection...
📊 DATABASE_URL is set: YES
📊 DIRECT_URL is set: YES
🔗 Testing database connection...
🔄 Syncing database schema with Prisma...
📡 Using DIRECT_URL for migrations...
   Connection: postgresql://postgres.vtevcjqigebtxmkjzdjq:***@aws-1-us-east-2.pooler.supabase.com:5432/postgres
✅ Database schema sync completed successfully
🔍 Verifying tables were created...
✅ user_quest table exists
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Starting server...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### If Schema Sync Fails, You'll See:
```
❌ Database schema sync failed!
❌ Exit code: [number]
❌ Check DATABASE_URL and DIRECT_URL are correct
❌ Check database is accessible and credentials are valid
```

## Common Issues

### 1. DIRECT_URL Not Set or Incorrect
**Symptoms:** 
- Schema sync uses DATABASE_URL instead
- May fail due to connection pooler limitations

**Fix:**
- Ensure `DIRECT_URL` is set in Railway
- Format: `postgresql://postgres.vtevcjqigebtxmkjzdjq:Goomy5555@aws-1-us-east-2.pooler.supabase.com:5432/postgres`

### 2. Connection Failed
**Symptoms:**
- Connection test fails
- Schema sync exits with error code

**Fix:**
- Verify credentials are correct
- Check if connection string uses Shared Pooler (required for IPv4)
- Ensure database is accessible from Railway

### 3. Schema Already Exists
**Symptoms:**
- Tables partially exist
- Sync completes but some tables missing

**Fix:**
- The `--accept-data-loss` flag should handle this
- Check if there are schema conflicts

### 4. Prisma Client Not Generated
**Symptoms:**
- Import errors
- Prisma client not found

**Fix:**
- This should be handled by `bun run postinstall` in Dockerfile
- Ensure Prisma schema is correct

## Verification Steps

1. **Check Railway Logs:**
   - Go to Railway dashboard
   - Click on your service
   - View "Logs" tab
   - Look for startup messages

2. **Verify Tables Exist:**
   - Check Supabase dashboard
   - Go to Table Editor
   - Look for `user_quest`, `user`, `quest`, etc.

3. **Test Connection:**
   - Can manually run `prisma db push` locally with same DATABASE_URL
   - Should work if connection strings are correct

## Next Steps

1. ✅ Improved startup script with verbose logging (deployed)
2. ⏳ Wait for new deployment
3. ⏳ Check Railway logs for detailed output
4. ⏳ Verify tables are created
5. ⏳ Confirm warnings stop appearing

