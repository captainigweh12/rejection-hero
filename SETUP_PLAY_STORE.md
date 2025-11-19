# Google Play Store Setup - Information Needed

## ✅ What I've Already Done

1. ✅ Updated `app.json`:
   - Set app name to "Go for No"
   - Added `versionCode: 1` for Android
   - Added adaptive icon configuration
   - Configured package name: `com.vibecode.goforno`

2. ✅ Updated `eas.json`:
   - Production build configured for app-bundle
   - Submit configuration ready

3. ✅ Added npm scripts:
   - `npm run build:android:production` - Build production app
   - `npm run submit:android` - Submit to Play Store
   - `npm run credentials:android` - Manage credentials

---

## 📋 What I Need From You

### 1. **App Store Listing Information** (Required)

Please provide:

- **App Name**: (Currently "Go for No" - confirm or change)
- **Short Description** (80 characters max):
  ```
  Example: "Overcome fear and build confidence through fun social challenges!"
  ```
- **Full Description** (4000 characters max):
  ```
  Describe your app's features, benefits, and what makes it special.
  Include keywords for discoverability.
  ```
- **Support Email**: (Required - appears in Play Store)
- **Support Website** (optional)
- **Privacy Policy URL**: (REQUIRED - must be publicly accessible)
  - Example: `https://rejectionhero.com/privacy-policy`
  - I see you have privacy policy files in `backend/src/legal/` - do you have a public URL?

### 2. **Assets** (You'll upload these in Play Console)

Prepare these images:

- [ ] **App Icon**: 512x512px PNG (no transparency)
  - Can use your existing icon from `assets/` - resize to 512x512
  
- [ ] **Feature Graphic**: 1024x500px PNG
  - Header graphic for Play Store listing
  
- [ ] **Screenshots**: 2-8 images
  - Phone screenshots (min height: 320px)
  - PNG or JPEG, max 8MB each
  - Show your app's best features

### 3. **Build & Deploy Choice**

Choose your preferred method:

**Option A: EAS Submit (Automated)**
- [ ] I want to use automated submission via `eas submit`
- Requires: Google Play Console service account setup
- I can guide you through this

**Option B: Manual Upload**
- [ ] I'll upload the .aab file manually in Play Console
- Simpler for first-time setup

---

## 🚀 Next Steps (Once You Provide Info)

### Step 1: Generate Production Keystore

Run this command (you'll need to be logged into Expo):

```bash
# Make sure you're logged in
eas login

# Generate production keystore
npm run credentials:android
# Or: eas credentials --platform android
```

Then select:
- **Android**
- **Production**
- **Keystore: Set up a new keystore**
- **Generate new keystore**

**Important:** This will prompt for keystore passwords. Save them securely - you'll need them for updates!

After generating, get your SHA-1 fingerprint:
```bash
eas credentials --platform android
# Select: Production → Keystore → Show fingerprints
```

Save the SHA-1 - you'll need it for Google OAuth Android client configuration.

### Step 2: Build Production App Bundle

```bash
npm run build:android:production
# Or: eas build --platform android --profile production
```

This will:
- Create a signed `.aab` (Android App Bundle) file
- Upload to EAS servers
- Take 10-20 minutes

### Step 3: Set Up Google Play Console

1. **Create App in Play Console:**
   - Go to [play.google.com/console](https://play.google.com/console)
   - Click "Create app"
   - Fill in app name, default language, app type
   - **Package name must be:** `com.vibecode.goforno`

2. **Complete Store Listing:**
   - Add app name, description (use info you provide)
   - Upload app icon (512x512px)
   - Upload feature graphic (1024x500px)
   - Upload screenshots
   - Add privacy policy URL

3. **Complete Required Sections:**
   - Content rating (questionnaire)
   - Data Safety section (declare data collection)
   - Pricing & Distribution

### Step 4: Upload & Publish

**If using EAS Submit:**
```bash
npm run submit:android
```

**If uploading manually:**
1. Download `.aab` from EAS dashboard
2. Go to Play Console → Production (or Internal testing)
3. Click "Create new release"
4. Upload `.aab` file
5. Add release notes
6. Review and roll out

---

## 📝 Quick Reference

**Get SHA-1 Fingerprint:**
```bash
eas credentials --platform android
# Production → Keystore → Show fingerprints
```

**Build Production:**
```bash
npm run build:android:production
```

**Submit to Play Store:**
```bash
npm run submit:android
```

**Check Build Status:**
```bash
eas build:list
```

---

## 🆘 Need Help?

Once you provide the information above, I can:
- Help you generate the keystore
- Create store listing text if needed
- Set up service account for automated submission
- Walk through Play Console setup

Just let me know what you need!

