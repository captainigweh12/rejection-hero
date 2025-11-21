# Railway Environment Variables Setup

## ⚠️ IMPORTANT: You're Using Better Auth, NOT Stack Auth

**Your codebase uses Better Auth**, not Stack Auth. The Neon Auth interface is showing Stack Auth variables, but **you don't need those**.

## What You're Actually Using

✅ **Better Auth** (configured in `backend/src/auth.ts`)  
✅ **Neon PostgreSQL** (as the database for Better Auth)

❌ **Stack Auth** - NOT used (those variables are for a different auth system)

## Railway Environment Variables

### ✅ Required Variables (Set These in Railway)

In Railway → Backend Service → Variables, set these:

```env
# Database (from Neon - this is all you need from Neon)
DATABASE_URL=postgresql://neondb_owner:npg_9vudwr7pPfFJ@ep-withered-field-a4skic0c-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
DATABASE_PROVIDER=postgresql

# Backend URL
BACKEND_URL=https://api.rejectionhero.com

# Better Auth Configuration (your current auth system)
BETTER_AUTH_SECRET=your-secret-min-32-characters-here
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### ❌ Do NOT Set These (Stack Auth - Not Used)

**Do NOT add these to Railway** - you're not using Stack Auth:

```env
# ❌ DON'T ADD THESE - You're using Better Auth, not Stack Auth
NEXT_PUBLIC_STACK_PROJECT_ID=393e7e87-18de-4f45-a3c3-692897f84ba6
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=pck_895anp60zdmkrvkg4ryc6xy0pa3nc83x5s1px9c21x3wg
STACK_SECRET_SERVER_KEY=ssk_x5hxfg5pzwah4fms7ajwejbez16wdgd48de77s9v63pf8
```

## How Your Auth Works

### Better Auth Flow (What You're Using)

```
1. User signs in with Google OAuth
   ↓
2. Better Auth (on Railway) handles OAuth callback
   ↓
3. Better Auth stores user data in Neon (DATABASE_URL)
   ↓
4. Better Auth creates session in Neon
   ↓
5. User is authenticated
```

### Stack Auth Flow (What You're NOT Using)

```
1. User signs in with Stack Auth
   ↓
2. Stack Auth handles authentication
   ↓
3. Uses STACK_SECRET_SERVER_KEY, etc.
   ↓
❌ This is NOT what your codebase uses
```

## What Neon Provides

**Neon only provides the database** (`DATABASE_URL`). It doesn't handle authentication:

- ✅ **Use:** `DATABASE_URL` from Neon
- ❌ **Don't use:** Stack Auth variables (unless you switch to Stack Auth)

## Verification

### Check Your Auth Provider

Your backend uses Better Auth:
```bash
cd backend
grep -r "better-auth" src/
```

You'll see:
- `backend/src/auth.ts` - Better Auth configuration
- `src/lib/authClient.ts` - Better Auth client
- `backend/package.json` - `better-auth` dependency

**No Stack Auth anywhere!**

### Check Railway Variables

In Railway → Backend Service → Variables, you should have:

✅ **Required:**
- `DATABASE_URL` (from Neon)
- `DATABASE_PROVIDER=postgresql`
- `BACKEND_URL=https://api.rejectionhero.com`
- `BETTER_AUTH_SECRET` (your secret)
- `GOOGLE_CLIENT_ID` (your Google OAuth client ID)
- `GOOGLE_CLIENT_SECRET` (your Google OAuth secret)

❌ **NOT Needed:**
- `NEXT_PUBLIC_STACK_PROJECT_ID`
- `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY`
- `STACK_SECRET_SERVER_KEY`

## Summary

**What Neon is showing you:**
- Stack Auth variables (for Stack Auth users)
- `DATABASE_URL` (for everyone)

**What you need:**
- ✅ `DATABASE_URL` from Neon (this is the only thing you need from Neon)
- ✅ Better Auth variables (configured separately, not from Neon)

**You're using:**
- ✅ Better Auth (configured in `backend/src/auth.ts`)
- ✅ Neon PostgreSQL (via `DATABASE_URL`)

**You're NOT using:**
- ❌ Stack Auth (ignore those variables from Neon interface)

## Next Steps

1. ✅ Copy `DATABASE_URL` from Neon interface to Railway
2. ✅ Set `DATABASE_PROVIDER=postgresql` in Railway
3. ✅ Set Better Auth variables in Railway (not from Neon)
4. ❌ Ignore Stack Auth variables (they're not for your setup)

## Quick Reference

| Variable | Source | Required? | For |
|----------|--------|-----------|-----|
| `DATABASE_URL` | Neon | ✅ Yes | Database connection |
| `DATABASE_PROVIDER` | You set | ✅ Yes | PostgreSQL |
| `BACKEND_URL` | You set | ✅ Yes | OAuth redirects |
| `BETTER_AUTH_SECRET` | You generate | ✅ Yes | Better Auth |
| `GOOGLE_CLIENT_ID` | Google Console | ✅ Yes | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Google Console | ✅ Yes | Google OAuth |
| `NEXT_PUBLIC_STACK_*` | Neon (Stack Auth) | ❌ No | Stack Auth (not used) |
| `STACK_SECRET_*` | Neon (Stack Auth) | ❌ No | Stack Auth (not used) |

