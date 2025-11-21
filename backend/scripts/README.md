# Backend Scripts

## Available Scripts

### verify-signup-data.ts

Verify if user data is saved to Neon after sign-up.

**Usage:**

```bash
# Check all users (last 10)
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require" bun run verify:signup

# Check specific user by email
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require" bun run verify:signup "user@example.com"
```

**What it checks:**
- ✅ User record exists
- ✅ Account record exists (Better Auth)
- ✅ Session records exist
- ✅ Profile record exists
- ✅ user_stats record exists

**Example with Neon:**
```bash
DATABASE_URL="postgresql://neondb_owner:npg_9vudwr7pPfFJ@ep-withered-field-a4skic0c-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require" bun run verify:signup
```

### verify-better-auth-tables.ts

Verify Better Auth tables exist in Neon.

**Usage:**

```bash
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require" bun run verify:auth-tables
```

**What it checks:**
- ✅ `user` table exists
- ✅ `session` table exists
- ✅ `account` table exists
- ✅ `verification` table exists

## Setting DATABASE_URL

### Option 1: Inline (Recommended)

```bash
DATABASE_URL="postgresql://..." bun run verify:signup
```

### Option 2: Export in shell

```bash
export DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
bun run verify:signup
```

### Option 3: Create .env file

Create `.env` in `backend/` directory:

```env
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
```

Then run:

```bash
cd backend
bun run verify:signup
```

**Note:** `.env` files are gitignored for security.

## Railway Environment Variables

To get DATABASE_URL from Railway:

1. Go to Railway → Backend Service → Variables
2. Copy `DATABASE_URL` value
3. Use it in the command:

```bash
DATABASE_URL="[paste-from-railway]" bun run verify:signup
```

## Troubleshooting

### Error: DATABASE_URL not set

**Fix:** Set DATABASE_URL before running the script:

```bash
DATABASE_URL="postgresql://..." bun run verify:signup
```

### Error: URL must start with postgresql://

**Fix:** Ensure DATABASE_URL starts with `postgresql://` or `postgres://`

### Error: Cannot reach database server

**Fix:** 
- Check DATABASE_URL is correct
- Ensure database is accessible from your network
- Check firewall/VPN settings

### Error: Table does not exist

**Fix:** Run schema sync:

```bash
DATABASE_URL="postgresql://..." bun run db:push
```

