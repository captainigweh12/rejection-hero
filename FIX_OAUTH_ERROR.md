# Fix OAuth Error 400: redirect_uri_mismatch

## ❌ Error You're Seeing:
```
Access blocked: This app's request is invalid
Error 400: redirect_uri_mismatch
```

## ✅ Solution: Add Redirect URI to Google Cloud Console

Your backend URL is: `https://preview-csuipnvqjxpr.share.sandbox.dev`

Better Auth automatically uses: `{BACKEND_URL}/api/auth/callback/google`

So the redirect URI should be: `https://preview-csuipnvqjxpr.share.sandbox.dev/api/auth/callback/google`

---

## 🔧 Steps to Fix (Do this in Google Cloud Console):

### 1. Go to Google Cloud Console
- URL: https://console.cloud.google.com
- Navigate to: **APIs & Services** → **Credentials**

### 2. Find Your Web OAuth Client
- Look for Client ID: `94427138884-cc2db90qkmg6dfshccce94ffmt5rpla0.apps.googleusercontent.com`
- Click the **Edit** button (pencil icon)

### 3. Add Authorized JavaScript Origins

In the **"Authorized JavaScript origins"** section, add these 3 URLs:

```
https://preview-csuipnvqjxpr.share.sandbox.dev
https://rejectionhero.com
https://www.rejectionhero.com
```

### 4. Add Authorized Redirect URIs

In the **"Authorized redirect URIs"** section, add these 3 URLs:

```
https://preview-csuipnvqjxpr.share.sandbox.dev/api/auth/callback/google
https://rejectionhero.com/api/auth/callback/google
https://www.rejectionhero.com/api/auth/callback/google
```

**IMPORTANT:** Make sure to include `/api/auth/callback/google` at the end!

### 5. Save Changes
- Click **"Save"** at the bottom
- Wait 2-3 minutes for Google to propagate the changes

---

## 📋 Quick Copy-Paste Reference

**Authorized JavaScript origins:**
```
https://preview-csuipnvqjxpr.share.sandbox.dev
https://rejectionhero.com
https://www.rejectionhero.com
```

**Authorized redirect URIs:**
```
https://preview-csuipnvqjxpr.share.sandbox.dev/api/auth/callback/google
https://rejectionhero.com/api/auth/callback/google
https://www.rejectionhero.com/api/auth/callback/google
```

---

## 🧪 After Fixing:

1. ✅ Wait 2-3 minutes for changes to take effect
2. ✅ Close your app completely
3. ✅ Reopen the app
4. ✅ Try "Continue with Google" again

**It should work now!**

---

## 📸 Visual Guide

When editing your OAuth Client in Google Cloud Console, it should look like this:

```
Application type: Web application
Name: Go for No - Web

Authorized JavaScript origins:
  1. https://preview-csuipnvqjxpr.share.sandbox.dev
  2. https://rejectionhero.com
  3. https://www.rejectionhero.com

Authorized redirect URIs:
  1. https://preview-csuipnvqjxpr.share.sandbox.dev/api/auth/callback/google
  2. https://rejectionhero.com/api/auth/callback/google
  3. https://www.rejectionhero.com/api/auth/callback/google

[Save]
```

---

## Why This Happened

Google OAuth requires you to **whitelist** all URLs that can:
1. Initiate OAuth requests (JavaScript origins)
2. Receive OAuth callbacks (redirect URIs)

When you created the Web OAuth Client, you only added `rejectionhero.com` URLs, but your Vibecode sandbox is using `preview-csuipnvqjxpr.share.sandbox.dev` as the backend URL.

Once you add the sandbox URL to Google Console, OAuth will work perfectly!

---

## Need Help?

If you still see errors after adding the URIs:
1. Check that the URLs are **exactly** as shown above (no trailing slashes, correct protocol)
2. Wait a few minutes for Google to update
3. Clear your browser cache or try in incognito mode
4. Check backend logs for any other errors
