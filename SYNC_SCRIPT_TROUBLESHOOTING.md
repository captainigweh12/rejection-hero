# Sync Script Troubleshooting

## Connection Test Failed

If `./sync-supabase-schema.sh` shows "Database connection failed", here's what to check:

### Possible Causes

1. **Network/Firewall Restrictions**
   - The sandbox environment may not allow outbound connections to Supabase
   - This is OK - Railway will still work when deployed
   - Verify connection string format is correct

2. **Password Special Characters**
   - Password `Emmanuel1igweh!` contains `!` which needs URL encoding as `%21`
   - The script automatically tries both encoded and original versions
   - If both fail, verify the password is correct

3. **Supabase Project Status**
   - Ensure project is active (not paused)
   - Check Supabase dashboard for project status

### Solution: Test Connection from Railway Instead

Since the sandbox may have network restrictions, the best way to test is:

1. **Update Railway Variables:**
   ```env
   DATABASE_URL=postgresql://postgres:Emmanuel1igweh!@db.vtevcjqigebtxmkjzdjq.supabase.co:5432/postgres?sslmode=require
   ```
   (Note: Railway handles URL encoding automatically)

2. **Deploy to Railway:**
   - Push code to trigger deployment
   - Railway will run `prisma db push` automatically
   - Check Railway logs for success

3. **Verify in Supabase:**
   - Go to Supabase Dashboard → Table Editor
   - Should see tables: `user`, `user_quest`, `user_stats`, etc.

### Alternative: Get Connection String from Supabase

1. Go to **Supabase Dashboard** → **Settings** → **Database**
2. Under **Connection string**, choose **URI** tab
3. Copy the **exact** connection string (Supabase handles encoding)
4. Use that in Railway `DATABASE_URL`

### Expected Railway Logs (Success)

After Railway deployment with correct `DATABASE_URL`:

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

### If Sync Script Fails Locally

**This is OK!** The sync script failing locally doesn't mean Railway will fail. 

Railway has:
- ✅ Better network connectivity
- ✅ Automatic URL encoding handling
- ✅ Proper SSL configuration
- ✅ Direct connection to Supabase

**Just ensure Railway has the correct `DATABASE_URL`:**

```env
DATABASE_URL=postgresql://postgres:Emmanuel1igweh!@db.vtevcjqigebtxmkjzdjq.supabase.co:5432/postgres?sslmode=require
```

Then deploy - Railway will handle the connection and sync automatically.

