# Sign-Up Error Diagnosis Steps

## Current Status

✅ **Backend works** (curl test succeeded - user created in Neon)  
❌ **App sign-up still fails**

Since backend works but app doesn't, we need to identify the exact error.

## Step 1: Check App Console/Logs

**When you try to sign up from the app, what error appears in the app console/logs?**

Look for these logs:
```
🔐 [SignUp] Starting sign up process...
🔐 [SignUp] Backend URL: [what does this show?]
🔐 [Auth Client] Using backend URL: [what does this show?]
🔐 [SignUp] Calling authClient.signUp.email...
🔐 [SignUp] Auth result received
🔐 [SignUp] Result has error: [true or false?]
```

**If you see error logs:**
```
🔐 [SignUp] Sign up error: [what error?]
🔐 [SignUp] Error details: [what details?]
```

**Share the exact error message you see!**

## Step 2: Check Railway Logs for Request

**When you try sign-up from the app, check Railway logs immediately:**

Do you see:
```
🔐 [Auth Request] POST /api/auth/sign-up/email
   Full URL: https://api.rejectionhero.com/api/auth/sign-up/email
   Origin: [your-origin]
🔐 [Sign-Up] Email sign-up request received
   Email: [email]
   Name: [name]
```

**If you DON'T see this:**
- Request not reaching backend from app
- Check `EXPO_PUBLIC_VIBECODE_BACKEND_URL` is set
- Check network connection from app
- Check CORS settings

**If you DO see this:**
- Request reaches backend
- Check response status in logs
- Check if response shows success or error

## Step 3: Test Backend Endpoint

Run this to test the backend endpoint:

```bash
cd backend
BACKEND_URL="https://api.rejectionhero.com" bun run test:signup
```

This will:
- Test sign-up endpoint directly
- Verify user creation in database
- Show detailed response data
- Help identify if issue is backend or app

## Step 4: Check App Environment Variables

**Verify `EXPO_PUBLIC_VIBECODE_BACKEND_URL` is set in your app:**

**Where to check:**
- Expo/Vibecode environment variables
- App configuration files
- Build-time environment

**Should be:**
```
EXPO_PUBLIC_VIBECODE_BACKEND_URL=https://api.rejectionhero.com
```

**Check app logs to verify:**
```
🔐 [SignUp] Backend URL: https://api.rejectionhero.com
🔐 [Auth Client] Using backend URL: https://api.rejectionhero.com
```

**If it shows `undefined` or something else:**
- Environment variable not set
- Set it in your app environment configuration

## Step 5: Verify User Data is Created

After attempting sign-up, verify if user was actually created:

```bash
cd backend
DATABASE_URL="postgresql://neondb_owner:npg_9vudwr7pPfFJ@ep-withered-field-a4skic0c-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require" bun run verify:signup "user@example.com"
```

**If user exists:**
- Sign-up actually worked!
- Issue might be session handling or navigation
- Check frontend error handling

**If user doesn't exist:**
- Sign-up failed
- Check Railway logs for error
- Check Better Auth configuration

## Common App-Side Issues

### Issue 1: Environment Variable Not Set

**Symptoms:**
- App logs show `Backend URL: undefined`
- Network errors in app
- Request never reaches backend

**Fix:**
1. Set `EXPO_PUBLIC_VIBECODE_BACKEND_URL=https://api.rejectionhero.com` in app environment
2. Restart app
3. Verify logs show correct URL

### Issue 2: CORS Error

**Symptoms:**
- Request reaches backend (see Railway logs)
- Error shows CORS-related message
- Browser/app blocks request

**Fix:**
1. Check Better Auth `trustedOrigins` includes your app origin
2. Check CORS settings in backend
3. Verify origin matches in Railway logs

### Issue 3: Better Auth Client Error

**Symptoms:**
- Request reaches backend
- Backend returns success
- App shows error from Better Auth client
- App console shows Better Auth error

**Fix:**
1. Check auth client baseURL matches backend
2. Verify Better Auth plugins configured
3. Check session handling logic

### Issue 4: Session Fetch Fails After Sign-Up

**Symptoms:**
- Sign-up succeeds (user created)
- App can't fetch session
- App thinks sign-up failed

**Fix:**
1. Check session refetch logic in sign-up handler
2. Verify SecureStore is working
3. Check Better Auth session configuration

## What We Need to Know

To fix the issue, we need:

1. **What error message shows in the app?**
   - Share exact error message from app
   - Not just "sign up error" - the specific message

2. **What do Railway logs show?**
   - Does `🔐 [Auth Request]` appear when you try sign-up?
   - What response status is logged?
   - Any error messages in Railway logs?

3. **What do app console logs show?**
   - What backend URL does the app use?
   - What error appears from Better Auth client?
   - Any network errors?

4. **Was user actually created?**
   - Check database with verification script
   - Verify if user exists even if app shows error

## Quick Test Commands

### Test Backend Endpoint
```bash
cd backend
BACKEND_URL="https://api.rejectionhero.com" bun run test:signup
```

### Verify User Created
```bash
DATABASE_URL="postgresql://neondb_owner:npg_9vudwr7pPfFJ@ep-withered-field-a4skic0c-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require" bun run verify:signup "email@example.com"
```

### Test Backend Health
```bash
curl https://api.rejectionhero.com/health
```

## Next Steps

1. **Try sign-up from app**
2. **Check app console immediately** - What error shows?
3. **Check Railway logs immediately** - Does request appear?
4. **Run test script** - Verify backend endpoint works
5. **Share results** - What did you see in each place?

The enhanced logging will show exactly what's happening. Try signing up and share:

- **App console:** What error appears?
- **Railway logs:** Does `🔐 [Auth Request]` appear?
- **Error message:** What does the user see?

Once we see the actual error, we can fix it!

