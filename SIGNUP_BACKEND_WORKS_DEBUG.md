# Sign-Up Error Debugging - Backend Works

## ✅ Confirmed: Backend Works!

**Curl test results:**
```bash
curl -X POST https://api.rejectionhero.com/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPassword123!","name":"Test User"}'
```

**Result:**
```json
{
  "token": "VvCc94bNVzAAoGuStWRZYXV0t3x1i66p",
  "user": {
    "id": "J2eEU70HRmuBJKpHcLx3oOHwn7nEnPJA",
    "email": "test1763687095@example.com",
    "name": "Test User",
    "emailVerified": false,
    "createdAt": "2025-11-21T01:04:56.078Z"
  }
}
```

**This proves:**
- ✅ Backend is working
- ✅ Sign-up endpoint works
- ✅ Database is accessible (user was created)
- ✅ Better Auth is configured correctly
- ✅ SSL certificate works
- ✅ Domain works

**So the issue is in the app, not the backend!**

## Problem: App Can't Connect or Error Handling

Since backend works via curl but app shows errors, the issue is likely:

1. **App can't connect to backend** (network/CORS/URL issue)
2. **Frontend error handling** (Better Auth client error)
3. **Session handling** (sign-up succeeds but session fetch fails)
4. **Auth client configuration** (baseURL or plugin issue)

## Step 1: Check App Console Logs

When you try to sign up from the app, check the console/logs for:

**Expected logs:**
```
🔐 [SignUp] Starting sign up process...
🔐 [SignUp] Backend URL: https://api.rejectionhero.com
🔐 [Auth Client] Using backend URL: https://api.rejectionhero.com
🔐 [SignUp] Calling authClient.signUp.email...
🔐 [SignUp] Auth result received
🔐 [SignUp] Result has error: false
🔐 [SignUp] Result has data: true
🔐 [SignUp] Sign up successful!
```

**If you see error logs:**
```
🔐 [SignUp] Result has error: true
🔐 [SignUp] Error details: {...}
```

**What error do you see?** Share the exact error message.

## Step 2: Check Railway Logs for Request

Even though backend works, check if the app request reaches the backend:

**When you try sign-up from app, check Railway logs for:**
```
🔐 [Auth Request] POST /api/auth/sign-up/email
   Full URL: https://api.rejectionhero.com/api/auth/sign-up/email
   Origin: [your-app-origin]
🔐 [Sign-Up] Email sign-up request received
   Email: [email]
   Name: [name]
```

**If you DON'T see this:**
- Request not reaching backend from app
- Check `EXPO_PUBLIC_VIBECODE_BACKEND_URL` in app
- Check network connection from app
- Check CORS settings

**If you DO see this:**
- Request reaches backend
- Check response status in logs
- Check if user was created in database

## Step 3: Verify App Environment Variables

**Check if `EXPO_PUBLIC_VIBECODE_BACKEND_URL` is set in your app:**

**Option 1: Check app configuration**
- Wherever your app environment variables are set
- Should be: `EXPO_PUBLIC_VIBECODE_BACKEND_URL=https://api.rejectionhero.com`

**Option 2: Check app logs**
- App should log: `🔐 [SignUp] Backend URL: https://api.rejectionhero.com`
- If it shows something else or `undefined`, the env var isn't set

**Option 3: In Expo/Vibecode**
- Check environment variables in your deployment platform
- Should include: `EXPO_PUBLIC_VIBECODE_BACKEND_URL=https://api.rejectionhero.com`

## Step 4: Test Different Scenarios

### Test 1: Clear App Cache

1. **Close app completely**
2. **Clear app data:**
   - iOS: Settings → [App] → Delete App
   - Android: Settings → Apps → [App] → Clear Data
3. **Reinstall/Reload app**
4. **Try sign-up again**

### Test 2: Use Different Email

Try signing up with a **completely new email** that hasn't been used before.

**If "user already exists" error:**
- Expected - email is already registered
- Try a different email

### Test 3: Check Network

**From the app, can you:**
- Access other backend endpoints?
- See any data from the backend?
- Connect to `https://api.rejectionhero.com` at all?

**If not:**
- Network connectivity issue
- DNS issue
- Firewall/VPN blocking connection

## Common Issues When Backend Works

### Issue 1: App Can't Connect

**Symptoms:**
- No Railway logs when trying sign-up
- App shows "Network error" or "Connection failed"
- App console shows fetch/network error

**Causes:**
- `EXPO_PUBLIC_VIBECODE_BACKEND_URL` not set in app
- Backend URL incorrect in app
- Network connectivity issue from app
- CORS blocking request

**Fix:**
1. Check `EXPO_PUBLIC_VIBECODE_BACKEND_URL` is set
2. Verify it's `https://api.rejectionhero.com`
3. Test network from app
4. Check CORS settings in Better Auth

### Issue 2: Better Auth Client Error

**Symptoms:**
- Request reaches backend (see logs)
- App shows error from Better Auth client
- App console shows Better Auth error

**Causes:**
- Auth client baseURL incorrect
- Better Auth plugin configuration issue
- Session handling error

**Fix:**
1. Check auth client baseURL matches backend URL
2. Verify Better Auth plugins are configured
3. Check session handling logic

### Issue 3: Session Fetch Fails After Sign-Up

**Symptoms:**
- Sign-up succeeds (see success logs)
- User created in database
- But app can't log in or fetch session

**Causes:**
- Session token not stored correctly
- Session refetch logic failing
- Cookie/session storage issue

**Fix:**
1. Check session refetch logic in sign-up handler
2. Verify SecureStore is working
3. Check Better Auth session configuration

## What to Check

1. **App console logs** - What error do you see?
2. **Railway logs** - Does request reach backend from app?
3. **Environment variables** - Is `EXPO_PUBLIC_VIBECODE_BACKEND_URL` set?
4. **Network** - Can app reach backend at all?

## Next Steps

**Since backend works, we need to diagnose the app:**

1. **Try sign-up from app**
2. **Check app console/logs** - What error shows?
3. **Check Railway logs** - Does `🔐 [Auth Request]` appear?
4. **Share the exact error message** from the app

The enhanced logging will show exactly what's happening. Try signing up and check:

- **App console:** What error appears?
- **Railway logs:** Does request reach backend?
- **Error message:** What does the user see?

Once we see the actual error from the app, we can fix it!

