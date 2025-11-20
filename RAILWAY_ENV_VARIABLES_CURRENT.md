# Railway Environment Variables - Current Configuration

## 🔑 Updated Database Password

**New Password:** `Emmanuel1igweh!`

## ✅ Required Railway Variables

### 1. DATABASE_URL (Required)

```env
DATABASE_URL=postgresql://postgres:Emmanuel1igweh!@db.vtevcjqigebtxmkjzdjq.supabase.co:5432/postgres?sslmode=require
```

**Important:**
- ✅ Uses **non-pooler** connection (starts with `db.`)
- ✅ **MUST include** `?sslmode=require` for Supabase SSL
- ✅ Password: `Emmanuel1igweh!`
- ✅ Project ID: `vtevcjqigebtxmkjzdjq`

### 2. DATABASE_PROVIDER (Required)

```env
DATABASE_PROVIDER=postgresql
```

### 3. DIRECT_URL (Optional - for Prisma Client)

If you want to use pooler for regular queries (better performance):

```env
DIRECT_URL=postgresql://postgres.vtevcjqigebtxmkjzdjq:Emmanuel1igweh!@aws-1-us-east-2.pooler.supabase.com:5432/postgres?pgbouncer=true&sslmode=require
```

**Note:** This is optional. If not set, Prisma Client will use `DATABASE_URL`.

## 📋 Complete Railway Variables Checklist

Set these in **Railway → Your Backend Service → Variables**:

```
✅ DATABASE_URL=postgresql://postgres:Emmanuel1igweh!@db.vtevcjqigebtxmkjzdjq.supabase.co:5432/postgres?sslmode=require
✅ DATABASE_PROVIDER=postgresql
✅ DIRECT_URL=postgresql://postgres.vtevcjqigebtxmkjzdjq:Emmanuel1igweh!@aws-1-us-east-2.pooler.supabase.com:5432/postgres?pgbouncer=true&sslmode=require (optional)
✅ BETTER_AUTH_SECRET=<your-secret>
✅ BACKEND_URL=<your-railway-url>
✅ RAILWAY_PUBLIC_DOMAIN=<your-railway-domain>
... (other variables)
```

## 🚀 Next Steps

1. **Update Railway Variables:**
   - Go to Railway Dashboard → Your Backend Service → Variables
   - Update `DATABASE_URL` with the new password above
   - Ensure `DATABASE_PROVIDER=postgresql` is set

2. **Verify Connection:**
   - After deployment, check Railway logs for:
   - `✅ Database connection test successful`
   - `✅ Database schema sync completed successfully`

3. **Sync Schema (if needed):**
   ```bash
   cd /home/user/workspace
   ./sync-supabase-schema.sh
   ```
   This will use the new password automatically.

## ⚠️ Important Notes

- **Password changed:** All documentation and scripts updated to use `Emmanuel1igweh!`
- **SSL required:** All connection strings include `?sslmode=require`
- **No .env files:** Railway variables override any `.env` files (which are gitignored)

## 🔍 Verify in Railway

After setting variables:
1. Railway Dashboard → Service → Variables
2. Verify `DATABASE_URL` matches exactly (no extra spaces/quotes)
3. Check logs after deployment for connection success

