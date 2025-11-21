# Sign-Up Error with No Railway Errors - Debugging Guide

## Problem

User is getting a sign-up error, but Railway logs show no errors. This suggests:

1. **Request not reaching backend** (network/CORS issue)
2. **Frontend error** (client-side validation or auth client issue)
3. **Silent failure** (Better Auth rejecting before our logging)
4. **Cached error** (frontend showing stale error)

## Step 1: Verify Request Reaches Backend

Check Railway logs for this line when sign-up is attempted:

```
🔐 [Sign-Up] Email sign-up request received
```

**If you DON'T see this:**
- Request is not reaching the backend
- Check network connection
- Check `EXPO_PUBLIC_VIBECODE_BACKEND_URL` is correct
- Check CORS settings

**If you DO see this:**
- Request is reaching backend
- Check for response logs after this line

## Step 2: Check Frontend Error

The frontend logs detailed error information. Check the app console/logs for:

```
🔐 [SignUp] Starting sign up process...
🔐 [SignUp] Backend URL: [url]
🔐 [SignUp] Calling authClient.signUp.email...
🔐 [SignUp] Auth result: [result]
🔐 [SignUp] Sign up error: [error details]
```

**Look for:**
- What error message is shown
- What status code (if any)
- Network error vs validation error

## Step 3: Check Network Connection

### Verify Backend URL

In your app, check:
1. Is `EXPO_PUBLIC_VIBECODE_BACKEND_URL` set correctly?
2. Does it point to `https://api.rejectionhero.com`?
3. Can you reach the backend from the app?

### Test Backend Reachability

From your device/app, try:
```
https://api.rejectionhero.com/health
```

Should return a health check response.

## Step 4: Check CORS Settings

Better Auth is configured with `trustedOrigins`. Verify:

1. **Backend logs should show:**
   ```
   🌐 [Auth] Trusted origins: vibecode://, http://localhost:3000, http://localhost:8081, https://api.rejectionhero.com
   ```

2. **If using Expo Go or development:**
   - Ensure `http://localhost:8081` is in trusted origins
   - Or your dev server URL

3. **If using production app:**
   - Ensure `vibecode://` scheme is in trusted origins

## Step 5: Check Auth Client Configuration

The frontend auth client is in `src/lib/authClient.ts`. Verify:

1. **Backend URL is correct:**
   - Should match `EXPO_PUBLIC_VIBECODE_BACKEND_URL`
   - Should start with `https://` or `http://`

2. **Expo plugin is configured:**
   - Uses `expoClient` plugin
   - Uses `SecureStore` for storage
   - Scheme is `vibecode://`

## Step 6: Test Sign-Up Endpoint Directly

Test the backend endpoint directly (bypassing app):

```bash
curl -X POST https://api.rejectionhero.com/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "name": "Test User"
  }'
```

**Expected response:**
- `200 OK` with user data → Backend works, issue is in app
- `400 Bad Request` → Check error message
- `500 Internal Server Error` → Check Railway logs
- Connection failed → Network/CORS issue

## Step 7: Check for Silent Errors

Better Auth might reject requests silently. Check:

1. **Request validation:**
   - Email format valid?
   - Password meets requirements?
   - Name provided?

2. **Better Auth logs:**
   - Any warnings in Railway logs?
   - Any Better Auth initialization errors?

## Common Issues When No Railway Errors

### Issue 1: Request Never Reaches Backend

**Symptoms:**
- No `🔐 [Sign-Up] Email sign-up request received` in logs
- Frontend shows network error

**Causes:**
- `EXPO_PUBLIC_VIBECODE_BACKEND_URL` not set
- Backend URL incorrect
- Network connectivity issue
- CORS blocking request

**Fix:**
1. Check `EXPO_PUBLIC_VIBECODE_BACKEND_URL` is set in app
2. Verify backend URL is correct
3. Test backend reachability
4. Check CORS settings

### Issue 2: Frontend Error Handling

**Symptoms:**
- Request reaches backend (see logs)
- No error in Railway
- Frontend shows error

**Causes:**
- Frontend interpreting response as error
- Auth client error handling
- Session fetch failing

**Fix:**
1. Check frontend console logs
2. Check `result.error` in sign-up handler
3. Verify session refetch logic

### Issue 3: Better Auth Silent Rejection

**Symptoms:**
- Request reaches backend
- Better Auth returns error response
- Our logging doesn't catch it

**Causes:**
- Better Auth validation failing
- Database connection issue (silent)
- Configuration issue

**Fix:**
1. Check Better Auth response status
2. Verify database connection on startup
3. Check Better Auth configuration

## Debugging Checklist

- [ ] Check Railway logs for `🔐 [Sign-Up] Email sign-up request received`
- [ ] Check frontend console for error messages
- [ ] Verify `EXPO_PUBLIC_VIBECODE_BACKEND_URL` is set correctly
- [ ] Test backend health endpoint: `https://api.rejectionhero.com/health`
- [ ] Test sign-up endpoint directly with curl
- [ ] Check CORS settings in Better Auth
- [ ] Verify auth client configuration
- [ ] Check if request reaches backend at all
- [ ] Check frontend error message details

## What Error Message Do You See?

**In the app, what exactly happens when you try to sign up?**

1. **Error popup?** What does it say?
2. **No response?** Does the loading spinner just keep spinning?
3. **Success but can't log in?** Does it say "success" but then fails?

**Please share:**
- The exact error message shown in the app
- What happens (popup, spinner, etc.)
- Any console logs from the frontend

This will help identify if it's:
- Frontend validation error
- Network error
- Backend error (even if not logged)
- Session/authentication issue

## Quick Test

Try this curl command to test if backend sign-up works:

```bash
curl -X POST https://api.rejectionhero.com/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test'$(date +%s)'@example.com",
    "password": "TestPassword123!",
    "name": "Test User"
  }' -v
```

**Check the response:**
- If it works → Issue is in frontend/app
- If it fails → Issue is in backend (check error message)

## Next Steps

1. **Check Railway logs** for `🔐 [Sign-Up]` messages when you try to sign up
2. **Check frontend console** for error messages
3. **Test backend endpoint** with curl
4. **Share the exact error** you see in the app

Without seeing the actual error, it's hard to diagnose. The enhanced logging should help - try signing up and immediately check Railway logs for any messages starting with `🔐 [Sign-Up]`.

