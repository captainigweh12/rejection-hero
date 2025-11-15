# Google OAuth Testing Guide for Go for No App

## Quick Start: Get OAuth Working in 3 Steps

### Step 1: Add Environment Variables
Go to the **ENV tab** in Vibecode app and add these 4 variables:

```
GOOGLE_CLIENT_ID=94427138884-cc2db90qkmg6dfshccce94ffmt5rpla0.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=94427138884-cc2db90qkmg6dfshccce94ffmt5rpla0.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=94427138884-vp4hj04sfr29fndq917iau9alpiv52e6.apps.googleusercontent.com
```

### Step 2: Refresh the App
- Close and reopen the Vibecode app
- The environment variables will automatically reload

### Step 3: Test Google OAuth
1. Tap the **"Continue with Google"** button on the login screen
2. Google login page should appear
3. Sign in with your Google account
4. You should be redirected back to the app
5. Account created and logged in!

---

## Detailed Testing Checklist

### ✅ Pre-Testing Verification

- [ ] Environment variables added in ENV tab (all 4 variables)
- [ ] App refreshed after adding variables
- [ ] You have an active Google account
- [ ] Internet connection is active
- [ ] Backend server running (should be automatic on port 3000)

### ✅ Test Case 1: Google OAuth Sign-In

**Steps:**
1. Open the app on your phone/simulator
2. You should see the login screen with:
   - Email/Password login form
   - "Continue with Google" button
3. Tap "Continue with Google"
4. Verify: Google login page appears

**Expected Result:**
- ✅ Redirected to Google OAuth consent screen
- ✅ Can sign in with your Google account

### ✅ Test Case 2: Account Creation via OAuth

**Steps:**
1. Complete Google OAuth sign-in flow
2. Return to app

**Expected Result:**
- ✅ User account created in database
- ✅ Logged in automatically
- ✅ Shown "Signed in as: [Your Name]" message
- ✅ Logout button appears

### ✅ Test Case 3: Session Persistence

**Steps:**
1. Sign in with Google
2. Close the app
3. Reopen the app

**Expected Result:**
- ✅ Still logged in
- ✅ Session persists (should see "Signed in as" instead of login screen)

### ✅ Test Case 4: Sign Out

**Steps:**
1. While logged in, tap the "Sign Out" button
2. Close and reopen app

**Expected Result:**
- ✅ Logged out successfully
- ✅ Login screen appears on reopen

---

## How OAuth Works in Your App

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Go for No App                        │
└────────────────────┬────────────────────────────────────────┘
                     │
         1. User taps "Continue with Google"
                     │
                     ▼
     ┌──────────────────────────────────┐
     │   Better Auth (authClient)        │
     │   - Opens OAuth flow              │
     │   - Uses iOS Client ID or Web ID  │
     └─────────────┬──────────────────────┘
                   │
         2. Opens Google OAuth Screen
                   │
                   ▼
     ┌──────────────────────────────────┐
     │   Google OAuth Server             │
     │   - User signs in with Google     │
     │   - Gives permission              │
     └─────────────┬──────────────────────┘
                   │
         3. Returns authorization code
                   │
                   ▼
     ┌──────────────────────────────────┐
     │   Your Backend (Better Auth)      │
     │   - Exchanges code for tokens     │
     │   - Creates/finds user in DB      │
     │   - Returns session               │
     └─────────────┬──────────────────────┘
                   │
         4. User logged in!
                   │
                   ▼
     ┌──────────────────────────────────┐
     │   App shows "Signed in as..."     │
     │   User can now access full app    │
     └──────────────────────────────────┘
```

---

## Environment Variables Explained

### Backend Variables
- `GOOGLE_CLIENT_ID` - Tells Google who you are (Web OAuth)
- `GOOGLE_CLIENT_SECRET` - Private key for backend (never expose this!)

### Frontend Variables
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` - For web version
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` - For iOS app

---

## Troubleshooting Common Issues

### ❌ Problem: "Google Sign-In failed" Error

**Possible Causes:**
1. Environment variables not added
2. Environment variables not reloaded (didn't refresh app)
3. Backend URL is incorrect
4. Client ID doesn't match Google Console

**Solutions:**
1. Check ENV tab has all 4 variables
2. Close app completely and reopen
3. Check backend logs for errors
4. Verify Client IDs in Google Console match README.md

### ❌ Problem: Redirected to Google but infinite loop

**Possible Causes:**
1. Callback URL doesn't match Google Console
2. Backend URL incorrect in app configuration
3. OAuth callback handler not working

**Solutions:**
1. Check `vibecode://auth/callback` in app.json matches Google Console
2. Verify `EXPO_PUBLIC_VIBECODE_BACKEND_URL` is set correctly
3. Check backend logs: `/home/user/workspace/backend/server.log`

### ❌ Problem: "Invalid client" Error from Google

**Possible Causes:**
1. Client ID is wrong
2. Client Secret is wrong
3. Bundle ID doesn't match

**Solutions:**
1. Double-check all credentials in Google Cloud Console
2. Verify bundle ID: `com.vibecode.goforno`
3. Copy credentials exactly (no spaces!)

### ❌ Problem: Can see "Continue with Google" button but it doesn't work

**Possible Causes:**
1. Backend server not running
2. Backend URL not configured
3. Better Auth not initialized

**Solutions:**
1. Check backend is running (port 3000)
2. View app logs in LOGS tab for errors
3. Check `server.log` file for backend errors

---

## Checking Logs for Debugging

### Frontend Logs
- Go to **LOGS tab** in Vibecode app
- Look for messages starting with:
  - `Google Sign-In Error:`
  - `[Auth] Better Auth`
  - Any red error messages

### Backend Logs
- Check `/home/user/workspace/backend/server.log`
- Look for:
  - `🔐 [Auth] Initializing Better Auth...`
  - `🔑 [Auth] Google OAuth: Enabled`
  - Any error messages about authentication

---

## Database Verification

After successful OAuth sign-in:

1. Go to **CLOUD tab** in Vibecode app
2. Open Prisma Studio (port 3001)
3. Check **User** table
4. You should see:
   - Your name from Google account
   - Your email from Google account
   - Created timestamp
   - OAuth provider information

---

## Your Current Configuration

✅ **iOS:**
- Bundle ID: `com.vibecode.goforno`
- Client ID: `94427138884-vp4hj04sfr29fndq917iau9alpiv52e6.apps.googleusercontent.com`
- Configured in app.json with URL schemes

✅ **Web:**
- Domain: `rejectionhero.com`
- Client ID: `94427138884-cc2db90qkmg6dfshccce94ffmt5rpla0.apps.googleusercontent.com`
- Configured in Google Cloud Console

✅ **Login UI:**
- Located at: `src/components/LoginWithEmailPassword.tsx`
- Shows "Continue with Google" button
- Handles both OAuth and email/password auth

---

## Next Steps After OAuth Works

1. ✅ Test OAuth sign-in (what we're doing now)
2. User profiles with OAuth data
3. Email verification (optional)
4. Two-factor authentication (optional)
5. Android OAuth (when ready)

---

## Support & Resources

- **Better Auth Docs:** https://www.better-auth.com/docs
- **Expo Auth Docs:** https://docs.expo.dev/guides/authentication/
- **Google OAuth Docs:** https://developers.google.com/identity/protocols/oauth2
- **Check app logs:** LOGS tab in Vibecode app

---

## Quick Reference Card

| Item | Value |
|------|-------|
| OAuth Scheme | `vibecode://` |
| Callback URL | `vibecode://auth/callback` |
| iOS Bundle ID | `com.vibecode.goforno` |
| Web Domain | `rejectionhero.com` |
| Backend URL | `https://[UNIQUE_ID].share.sandbox.dev/` or similar |
| Frontend Port | `8081` |
| Backend Port | `3000` |
| Login Component | `src/components/LoginWithEmailPassword.tsx` |

---

**Ready to test? Follow the 3 steps at the top and try signing in with Google!**
