# Test Backend Connection - Verify Sign-Up Request Reaches Backend

## Problem

No Railway errors, but sign-up is failing. Need to verify if request reaches backend.

## Step 1: Check Railway Logs for Request

When you try to sign up, check Railway logs for:

```
🔐 [Auth Request] POST /api/auth/sign-up/email
   Full URL: https://api.rejectionhero.com/api/auth/sign-up/email
   Origin: [origin]
   User-Agent: [user-agent]
🔐 [Sign-Up] Email sign-up request received
   Method: POST
   Path: /api/auth/sign-up/email
   Email: [email]
   Name: [name]
```

**If you DON'T see this:**
- Request is NOT reaching the backend
- Check network connection
- Check `EXPO_PUBLIC_VIBECODE_BACKEND_URL` is set
- Check backend URL is correct

**If you DO see this:**
- Request IS reaching the backend
- Check for response logs after this

## Step 2: Test Backend Endpoint Directly

Test if the backend sign-up endpoint works with curl:

```bash
curl -X POST https://api.rejectionhero.com/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -H "Origin: https://your-frontend-origin" \
  -d '{
    "email": "test'$(date +%s)'@example.com",
    "password": "TestPassword123!",
    "name": "Test User"
  }' -v
```

**Expected response:**
- `200 OK` with user data → Backend works, issue is in frontend/app
- `400 Bad Request` → Check error message (validation issue)
- `500 Internal Server Error` → Check Railway logs
- Connection failed → Network/CORS/URL issue

## Step 3: Check Frontend Logs

In your app console/logs, look for:

```
🔐 [SignUp] Starting sign up process...
🔐 [SignUp] Backend URL: [url]
🔐 [Auth Client] Using backend URL: [url]
🔐 [SignUp] Calling authClient.signUp.email...
🔐 [SignUp] Auth result received
🔐 [SignUp] Result has error: [true/false]
```

**What error do you see?**
- `Network error` → Request not reaching backend
- `Sign Up Failed: [message]` → Backend returned error
- `Unexpected error` → Exception during sign-up

## Step 4: Verify Backend URL

Check if `EXPO_PUBLIC_VIBECODE_BACKEND_URL` is set correctly:

**Should be:**
```
https://api.rejectionhero.com
```

**Check in app logs:**
```
🔐 [SignUp] Backend URL: https://api.rejectionhero.com
🔐 [Auth Client] Using backend URL: https://api.rejectionhero.com
```

**If URL is wrong:**
- Check environment variables
- Check app configuration
- Verify backend is accessible

## Step 5: Test Backend Health

Test if backend is reachable:

```bash
curl https://api.rejectionhero.com/health
```

**Expected:** JSON response with status

**If it fails:**
- Backend is down or unreachable
- DNS issue
- Network connectivity issue

## Step 6: Check CORS

If request reaches backend but fails, check CORS:

**Railway logs should show:**
```
🌐 [Auth] Trusted origins: vibecode://, http://localhost:3000, http://localhost:8081, https://api.rejectionhero.com
```

**Check if your origin is in the list:**
- Expo Go: Should be `http://localhost:8081` or similar
- Production app: Should handle `vibecode://` scheme
- Web: Should match your frontend domain

## Quick Diagnostic Test

Run this to test the full flow:

```bash
# Test 1: Backend health
echo "Testing backend health..."
curl -v https://api.rejectionhero.com/health

# Test 2: Sign-up endpoint
echo "Testing sign-up endpoint..."
curl -X POST https://api.rejectionhero.com/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test'$(date +%s)'@example.com",
    "password": "TestPassword123!",
    "name": "Test User"
  }' -v
```

**Check results:**
- Health check works? → Backend is up
- Sign-up works? → Backend endpoint works
- Both fail? → Backend URL issue
- Health works, sign-up fails? → Check Railway logs for error

## What to Check in Railway Logs

After enhanced logging, Railway logs should show:

**When request arrives:**
```
🔐 [Auth Request] POST /api/auth/sign-up/email
   Full URL: https://api.rejectionhero.com/api/auth/sign-up/email
   Origin: [your-origin]
🔐 [Sign-Up] Email sign-up request received
   Email: [email]
   Name: [name]
```

**After processing:**
```
✅ [Sign-Up] Sign-up successful
   ✅ User ID: [id]
   ✅ Email: [email]
```

**Or if error:**
```
❌ [Sign-Up] Sign-up error (400/500):
   [error message]
```

## Questions to Answer

1. **Do you see `🔐 [Auth Request]` in Railway logs?**
   - Yes → Request reaches backend, check response
   - No → Request not reaching backend, check network/URL

2. **What error message shows in the app?**
   - Network error → Check backend URL and connectivity
   - "Sign Up Failed: [message]" → Check Railway logs for that message
   - "Please try again" → Generic error, check Railway logs

3. **Does curl test work?**
   - Yes → Backend works, issue is in app
   - No → Backend issue, check Railway logs

## Next Steps

1. **Try sign-up from app**
2. **Immediately check Railway logs** for `🔐 [Auth Request]` or `🔐 [Sign-Up]`
3. **Check app console** for frontend error logs
4. **Test with curl** to verify backend works
5. **Share the results** - what do you see in each place?

The enhanced logging will show exactly what's happening. Try signing up and immediately check Railway logs - you should see detailed request/response logs.

