# Generate BETTER_AUTH_SECRET for Railway

## How to Generate BETTER_AUTH_SECRET

The `BETTER_AUTH_SECRET` must be **at least 32 characters** long and should be a random, secure string.

### Option 1: Using OpenSSL (Recommended)

```bash
openssl rand -base64 32
```

This will generate a 44-character base64-encoded string (safe for environment variables).

### Option 2: Using Node.js/Bun

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Or with Bun:
```bash
bun -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Option 3: Using Online Generator

1. Go to: https://generate-secret.vercel.app/32 (or similar secure generator)
2. Copy the generated secret
3. **Note:** Make sure it's at least 32 characters

### Option 4: Manual (Not Recommended)

You can create a random string manually, but it's less secure:
- Use a password manager's random password generator
- Ensure it's at least 32 characters
- Use a mix of letters, numbers, and symbols

## Example Generated Secret

A valid secret looks like this:
```
K8x3mP9qR2vN5wL7sT1uY4zA6bC0dE8fG3hI9jJ5kL2mN6oP7qR4sT8uV1wX
```

**Length:** 64 characters (more than sufficient)

## Set in Railway

1. **Go to Railway** → Your Backend Service → Variables
2. **Add/Update variable:**
   - **Key:** `BETTER_AUTH_SECRET`
   - **Value:** `[paste your generated secret]`
3. **Save**
4. **Redeploy** (Railway will automatically redeploy when you save variables)

## Verify It's Set

After setting it in Railway, check the deployment logs:

**Success:**
```
✅ [Auth] Better Auth initialized
✅ [Auth] Database connection successful
```

**Error (if secret is invalid):**
```
❌ [Auth] BETTER_AUTH_SECRET is invalid or too short!
   BETTER_AUTH_SECRET must be at least 32 characters
```

## Important Notes

1. **Never commit `BETTER_AUTH_SECRET` to git**
   - It should only be in Railway environment variables
   - Not in `.env` files in the repository
   - Not in code

2. **Keep it secure**
   - Don't share it publicly
   - Don't log it in application logs
   - Rotate it if it's ever exposed

3. **If you lose it:**
   - Generate a new one
   - Set it in Railway
   - **All existing sessions will be invalidated** (users will need to sign in again)
   - This is okay for production - users will just need to re-authenticate

4. **Production vs Development**
   - Use different secrets for development and production
   - Never use the same secret across environments

## Quick Generate Command

Copy and paste this command to generate a secure secret:

```bash
openssl rand -base64 32
```

Then copy the output and paste it into Railway as `BETTER_AUTH_SECRET`.

## Current Status

If you're seeing this error in Railway logs:
```
❌ [Auth] BETTER_AUTH_SECRET is invalid or too short!
```

It means:
1. `BETTER_AUTH_SECRET` is not set in Railway, OR
2. `BETTER_AUTH_SECRET` is less than 32 characters, OR
3. `BETTER_AUTH_SECRET` is empty

**Fix:** Generate a new secret using one of the methods above and set it in Railway.

