# Google OAuth Setup Guide

## Current Status

Your Google OAuth implementation is **working correctly** in the Vibecode sandbox environment. However, during development, the OAuth flow shows "sandbox.dev" in the iOS/Android popup because Vibecode's infrastructure proxies OAuth requests through their sandbox domain.

### Current Configuration
- **Backend URL**: `https://preview-nagkkyofmizn.share.sandbox.dev`
- **Google OAuth**: ✅ Enabled and functional
- **Callback URL**: `vibecode://auth/callback` (correct for mobile)
- **Client IDs**: Configured for Web, iOS, and Android

---

## Why You See "sandbox.dev" in the OAuth Popup

When you click "Continue with Google" on iOS/Android, the popup shows:
```
"vibecode" Wants to Use "sandbox.dev" to Sign In
```

This is **expected behavior** during development because:

1. Your app's OAuth flow is initiated from a URL on `sandbox.dev`
2. iOS/Android show the domain that initiates the OAuth request
3. This is NOT a security issue - it's normal for sandbox environments
4. Your actual app credentials are still being used (Google recognizes your app)

---

## What You Need to Do for Production

To fix this so the popup shows your actual domain (`rejectionhero.com`), follow these steps:

### Step 1: Update Your Backend URL to rejectionhero.com

Once you have your `rejectionhero.com` domain set up with a production backend:

**In Vibecode App Settings / Environment Variables:**
- Update `BACKEND_URL` from `https://preview-nagkkyofmizn.share.sandbox.dev` to `https://rejectionhero.com`
- Update `EXPO_PUBLIC_VIBECODE_BACKEND_URL` to `https://rejectionhero.com`

**In Backend `.env` file:**
```
BACKEND_URL=https://rejectionhero.com
```

### Step 2: Update Google Cloud Console OAuth Settings

Go to [Google Cloud Console](https://console.cloud.google.com) and update your OAuth 2.0 credentials:

**For Web Client (ID: `94427138884-cc2db90qkmg6dfshccce94ffmt5rpla0.apps.googleusercontent.com`):**
1. Open Credentials → OAuth 2.0 Client IDs → Web Client
2. Update **Authorized JavaScript origins**:
   ```
   https://rejectionhero.com
   https://www.rejectionhero.com
   https://preview-nagkkyofmizn.share.sandbox.dev (keep for development)
   ```
3. Update **Authorized redirect URIs**:
   ```
   https://rejectionhero.com/api/auth/callback/google
   https://www.rejectionhero.com/api/auth/callback/google
   https://preview-nagkkyofmizn.share.sandbox.dev/api/auth/callback/google (keep for development)
   ```

**For iOS Client (ID: `94427138884-vp4hj04sfr29fndq917iau9alpiv52e6.apps.googleusercontent.com`):**
- This uses deep linking (`vibecode://auth/callback`), so no URI changes needed
- Just ensure the app is built with the correct client ID

**For Android Client:**
- Once you generate the client ID via EAS (replacing `pending-generate-with-eas`):
- Configure package name and SHA-1 certificate fingerprint in Google Cloud Console

### Step 3: Rebuild Your App

After updating the backend URL and Google Cloud configuration:

```bash
# Rebuild the app with the new backend URL
eas build --platform ios --build-profile preview
eas build --platform android --build-profile preview
```

### Step 4: Deploy Backend to rejectionhero.com

Ensure your backend is running on `https://rejectionhero.com` with:
- SSL/TLS certificate (Let's Encrypt recommended)
- All routes properly forwarded
- Better Auth configured with the new base URL

---

## In Sandbox (Current State)

You can safely test Google OAuth as-is. The flow works correctly:

1. ✅ "Continue with Google" opens Google login
2. ✅ Login completes successfully
3. ✅ Callback reaches the app via deep link
4. ✅ Session is established
5. ✅ User is logged in

The only cosmetic issue is the "sandbox.dev" text, which is **completely normal** and **will disappear automatically** once deployed to production.

---

## Testing Google OAuth Locally

To verify everything is working:

1. Open the app login screen
2. Tap "Continue with Google"
3. Complete Google authentication
4. You should be redirected back to the app
5. Check logs for: `🔐 [OAuth] Auth callback received`
6. You should be automatically logged in

---

## Current Google OAuth Configuration

### Client IDs
| Platform | Client ID | Status |
|----------|-----------|--------|
| Web | `94427138884-cc2db90qkmg6dfshccce94ffmt5rpla0.apps.googleusercontent.com` | ✅ Active |
| iOS | `94427138884-vp4hj04sfr29fndq917iau9alpiv52e6.apps.googleusercontent.com` | ✅ Active |
| Android | `pending-generate-with-eas` | ⚠️ Needs EAS generation |

### Backend Configuration
```typescript
// /home/user/workspace/backend/src/auth.ts
socialProviders: {
  google: {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    redirectURI: `${env.BACKEND_URL}/api/auth/callback/google`,
    scope: ["openid", "profile", "email"],
  },
}
```

### Frontend Configuration
```typescript
// /home/user/workspace/src/lib/authClient.ts
authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL,
  plugins: [
    expoClient({
      scheme: "vibecode",
      // Uses deep link: vibecode://auth/callback
    }),
  ],
})
```

---

## Troubleshooting

### "vibecode" wants to use "sandbox.dev" (Normal during development)
- **Why**: OAuth is proxied through Vibecode's sandbox infrastructure
- **Solution**: Deploy to production with your own domain
- **Workaround**: None needed - this is expected behavior

### Google login fails with "not configured" error
- Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in backend `.env`
- Verify backend logs show: `✅ [Auth] Google OAuth credentials configured`
- Ensure the client ID is valid in Google Cloud Console

### Deep link not triggering after OAuth
- Verify `vibecode://` scheme is registered in `app.json`
- Check `App.tsx` has `LoginModalScreen: "auth/callback"` in deep linking config
- Ensure `handleGoogleSignIn` in `LoginWithEmailPassword.tsx` is logging the flow

### Session not established after OAuth
- Check frontend logs for: `🔐 [Google OAuth] Session refetch completed`
- Verify backend logs show session was created
- Check that `refetch()` is being called in the session hook

---

## Summary

✅ **Your Google OAuth is working correctly** in sandbox mode
⚠️ **The "sandbox.dev" popup is expected** and will disappear in production
🚀 **To fix it**: Deploy your backend to `rejectionhero.com` and update Google Cloud OAuth settings

For now, you can safely ignore the "sandbox.dev" text - it's just a cosmetic indicator that you're in the sandbox environment.
