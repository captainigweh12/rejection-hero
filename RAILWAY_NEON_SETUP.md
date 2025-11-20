# Railway + Neon Database Setup

## Quick Setup

### Required Railway Variables

In Railway → Backend Service → Variables:

```env
DATABASE_URL=postgresql://[user]:[password]@[endpoint].neon.tech/neondb?sslmode=require
DATABASE_PROVIDER=postgresql
```

### Get Your Neon Connection String

1. Go to **Neon Console** → Your Project
2. Click **Connection Details**
3. Copy the **Connection string** (URI format)
4. Should look like:
   ```
   postgresql://[user]:[password]@[endpoint].neon.tech/neondb?sslmode=require
   ```

### Railway Auto-Deployment

Railway automatically:
- ✅ Tests connection on deployment
- ✅ Runs `prisma db push` to sync schema
- ✅ Verifies tables were created
- ✅ Starts server only if successful

**No manual setup needed!**

## Connection String Format

Neon connection strings:
- **Format:** `postgresql://[user]:[password]@[endpoint].neon.tech/neondb?sslmode=require`
- **Endpoint:** Usually like `ep-cool-darkness-123456.us-east-2.aws.neon.tech`
- **Database:** Usually `neondb` (default) or your custom name
- **SSL:** Always include `?sslmode=require`

## Optional: Pooled Connection

For better performance, you can use a pooled connection for Prisma Client:

```env
DIRECT_URL=postgresql://[user]:[password]@[endpoint-pooler].neon.tech/neondb?sslmode=require
```

Get this from Neon Console → Connection Details → Pooled connection.

## Expected Railway Logs (Success)

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

### "Can't reach database server"

**Fix:**
1. Verify `DATABASE_URL` matches Neon connection string exactly
2. Ensure `?sslmode=require` is included
3. Check credentials are correct

### Connection Timeout

**Fix:**
1. Verify endpoint is correct
2. Check Neon project is active (not paused)
3. Ensure SSL mode is set

## See Also

- `NEON_DATABASE_SETUP.md` - Complete Neon setup guide
- `.github/workflows/neon-branches.yml` - PR branching workflow

