# Railway + Supabase PostgreSQL Setup

## ✅ Correct Connection Setup for Railway (IPv4-only)

Railway uses IPv4 networks, so you **must** use Supabase's **Shared Connection Pooler** (not the direct connection).

### 1. Railway Environment Variables

Set these in your Railway project:

#### DATABASE_URL (for regular connections)
```
DATABASE_URL="postgresql://postgres.vtevcjqigebtxmkjzdjq:Goomy5555@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

#### DIRECT_URL (for migrations - Prisma db push)
```
DIRECT_URL="postgresql://postgres.vtevcjqigebtxmkjzdjq:Goomy5555@aws-1-us-east-2.pooler.supabase.com:5432/postgres"
```

### 2. Important Notes

- **DATABASE_URL** uses port **6543** with `pgbouncer=true` for connection pooling (regular queries)
- **DIRECT_URL** uses port **5432** for direct connections (required for `prisma db push`)
- Both use the **Shared Pooler** hostname: `aws-1-us-east-2.pooler.supabase.com`
- The Shared Pooler supports both IPv4 and IPv6, making it compatible with Railway

### 3. Why This Setup?

- Railway is IPv4-only
- Supabase's direct connection (`db.vtevcjqigebtxmkjzdjq.supabase.co`) is NOT IPv4 compatible
- The Shared Pooler (`aws-1-us-east-2.pooler.supabase.com`) IS IPv4 compatible
- Prisma requires `DIRECT_URL` for schema migrations (`prisma db push`)

### 4. Current Prisma Schema

The schema is configured to use:
- `DATABASE_URL` for regular queries
- `DIRECT_URL` for migrations (if set)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### 5. Startup Process

The Dockerfile startup script will:
1. Use `DIRECT_URL` for `prisma db push` if available
2. Fall back to `DATABASE_URL` if `DIRECT_URL` is not set
3. Create all tables before starting the server
4. Exit with error if schema sync fails

### 6. Verify Setup

After deployment, check Railway logs for:
- ✅ "Database schema synced successfully"
- ✅ "Starting server..."
- ❌ No "P2021" errors (table does not exist)

### 7. Connection String Format

Replace `[YOUR-PASSWORD]` with your actual database password: `Goomy5555`

```
# Regular connections (pooled)
postgresql://postgres.vtevcjqigebtxmkjzdjq:Goomy5555@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true

# Direct connections (migrations)
postgresql://postgres.vtevcjqigebtxmkjzdjq:Goomy5555@aws-1-us-east-2.pooler.supabase.com:5432/postgres
```

## ⚠️ Common Mistakes

1. ❌ Using `db.vtevcjqigebtxmkjzdjq.supabase.co` (NOT IPv4 compatible)
2. ❌ Missing `DIRECT_URL` (migrations will fail)
3. ❌ Using port 5432 for `DATABASE_URL` (should use 6543 for pooling)
4. ❌ Forgetting `pgbouncer=true` parameter

## ✅ Correct Setup Checklist

- [ ] `DATABASE_URL` uses Shared Pooler (port 6543, `pgbouncer=true`)
- [ ] `DIRECT_URL` uses Shared Pooler direct (port 5432)
- [ ] Prisma schema uses `postgresql` provider
- [ ] Both connection strings use `aws-1-us-east-2.pooler.supabase.com`
- [ ] Password is correctly set in both URLs

