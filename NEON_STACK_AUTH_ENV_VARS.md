# Neon Stack Auth Environment Variables

## Stack Auth Configuration

You're using **Stack Auth** (alternative auth provider) with Neon database.

### Environment Variables

#### Stack Auth Keys (for Next.js/Stack Auth)
```env
NEXT_PUBLIC_STACK_PROJECT_ID=393e7e87-18de-4f45-a3c3-692897f84ba6
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=pck_895anp60zdmkrvkg4ryc6xy0pa3nc83x5s1px9c21x3wg
STACK_SECRET_SERVER_KEY=ssk_x5hxfg5pzwah4fms7ajwejbez16wdgd48de77s9v63pf8
```

#### Neon Database Connection
```env
DATABASE_URL=postgresql://neondb_owner:npg_9vudwr7pPfFJ@ep-withered-field-a4skic0c-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
```

## Important: Stack Auth vs Better Auth

**Current Setup:**
- Your backend uses **Better Auth** (configured in `backend/src/auth.ts`)
- Your database is **Neon** (PostgreSQL)

**Stack Auth:**
- Stack Auth is typically used with Next.js applications
- If you're not using Stack Auth, these variables aren't needed
- If you ARE using Stack Auth, you'll need to configure it separately

## Railway Environment Variables

### Required for Current Setup (Better Auth)

Set these in Railway → Backend Service → Variables:

```env
# Database
DATABASE_URL=postgresql://neondb_owner:npg_9vudwr7pPfFJ@ep-withered-field-a4skic0c-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
DATABASE_PROVIDER=postgresql

# Backend URL
BACKEND_URL=https://api.rejectionhero.com

# Better Auth (current auth provider)
BETTER_AUTH_SECRET=your-secret-min-32-chars
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Optional: Stack Auth (if you're using it)

If you're using Stack Auth in addition to Better Auth:

```env
# Stack Auth (if using)
NEXT_PUBLIC_STACK_PROJECT_ID=393e7e87-18de-4f45-a3c3-692897f84ba6
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=pck_895anp60zdmkrvkg4ryc6xy0pa3nc83x5s1px9c21x3wg
STACK_SECRET_SERVER_KEY=ssk_x5hxfg5pzwah4fms7ajwejbez16wdgd48de77s9v63pf8
```

**Note:** `NEXT_PUBLIC_*` variables are for frontend. Railway backend shouldn't use these unless you have a Next.js API route.

## Verification

### 1. Check Current Auth Provider

Your backend uses **Better Auth** (see `backend/src/auth.ts`). 

To verify:
```bash
cd backend
grep -r "better-auth" src/
```

### 2. Check if Stack Auth is Used

To check if Stack Auth is configured anywhere:
```bash
grep -r "stack.*auth\|STACK_\|@stackframejs" . --exclude-dir=node_modules
```

### 3. Verify Database Connection

Test your Neon connection:
```bash
cd backend
DATABASE_URL='postgresql://neondb_owner:npg_9vudwr7pPfFJ@ep-withered-field-a4skic0c-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require' bun run verify:auth-tables
```

## Current Setup Summary

✅ **Database:** Neon PostgreSQL  
✅ **Auth Provider:** Better Auth (in `backend/src/auth.ts`)  
⚠️ **Stack Auth:** Not configured (these env vars are for Next.js/Stack Auth)

## Action Items

### If you're using Better Auth (current setup):

1. ✅ Set `DATABASE_URL` in Railway
2. ✅ Set `BACKEND_URL=https://api.rejectionhero.com` in Railway
3. ✅ Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Railway
4. ✅ Set `BETTER_AUTH_SECRET` in Railway
5. ❌ Stack Auth env vars are NOT needed (unless you're using Stack Auth)

### If you want to use Stack Auth instead:

1. Install Stack Auth:
   ```bash
   bun add @stackframejs/stack
   ```
2. Configure Stack Auth in your backend
3. Set Stack Auth env vars in Railway
4. Update auth configuration

## Recommendation

**For your current setup (Better Auth + Neon):**

Use these Railway environment variables:

```env
DATABASE_URL=postgresql://neondb_owner:npg_9vudwr7pPfFJ@ep-withered-field-a4skic0c-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
DATABASE_PROVIDER=postgresql
BACKEND_URL=https://api.rejectionhero.com
BETTER_AUTH_SECRET=your-secret-min-32-chars
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Don't set Stack Auth variables** unless you're actually using Stack Auth.

## Troubleshooting

### Issue: "Stack Auth not found" errors

**Solution:** You're not using Stack Auth - ignore these errors or remove Stack Auth references.

### Issue: OAuth still failing

**Check:**
1. Better Auth tables exist in Neon (`bun run verify:auth-tables`)
2. `BACKEND_URL` is set correctly in Railway
3. Google Console redirect URI matches
4. `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set

See `GOOGLE_OAUTH_502_FIX.md` for detailed troubleshooting.

