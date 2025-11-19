# Google Play Store Publishing Guide

Complete guide to publish your app to Google Play Store.

## Prerequisites

### 1. Google Play Console Account
**Cost:** One-time registration fee of $25 (lifetime)

**How to Get It:**
1. Go to [play.google.com/console](https://play.google.com/console)
2. Sign in with a Google account
3. Accept the Developer Distribution Agreement
4. Pay the $25 registration fee (one-time, lifetime)
5. Complete your developer profile

**What You'll Need:**
- Google account (Gmail)
- Credit card for the $25 registration fee
- Developer name (can be personal or business name)

---

## Step 1: App Signing Setup

### Option A: Using EAS (Recommended - Expo Managed)

**1. Install EAS CLI (if not already installed)**
```bash
npm install -g eas-cli
```

**2. Login to Expo**
```bash
eas login
```

**3. Configure EAS Build (if not done already)**
```bash
eas build:configure
```

**4. Generate Android Production Keystore**
```bash
eas credentials
```

Then follow the prompts:
- Select **Android**
- Select **Production**
- Select **Keystore: Set up a new keystore**
- Select **Generate new keystore**

**5. Get Your SHA-1 Fingerprint (Required for Google OAuth)**
```bash
eas credentials
```
Then select:
- **Android**
- **Production**
- **Keystore**
- **Show fingerprints**

**Important:** Save your SHA-1 fingerprint - you'll need it for:
- Google OAuth Android client configuration
- Google Play App Signing setup

---

## Step 2: Configure Your App for Production

### Update `app.json`

Verify your app configuration:

```json
{
  "expo": {
    "name": "Go for No",
    "slug": "goforno",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.vibecode.goforno"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.vibecode.goforno",
      "versionCode": 1,
      "permissions": [
        "CAMERA",
        "RECORD_AUDIO",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    "plugins": [
      "expo-router",
      "expo-location",
      "expo-image-picker",
      "expo-av"
    ]
  }
}
```

**Key Points:**
- `android.package` must match your Google OAuth Android client
- `android.versionCode` must increment with each release (1, 2, 3...)
- `version` should follow semantic versioning (1.0.0, 1.0.1, etc.)

---

## Step 3: Build Production App Bundle

### Create Production Build

```bash
# Build Android App Bundle (required for Play Store)
eas build --platform android --profile production
```

**What This Does:**
- Creates a signed `.aab` (Android App Bundle) file
- Uploads it to EAS servers
- Takes 10-20 minutes to complete

**After Build Completes:**
- Download the `.aab` file from the EAS dashboard
- Or use `eas build:download` to download locally

---

## Step 4: Google Play Console Setup

### 1. Create Your App

1. Go to [play.google.com/console](https://play.google.com/console)
2. Click **Create app**
3. Fill in the form:
   - **App name:** Go for No (or your app name)
   - **Default language:** English (United States)
   - **App or game:** App
   - **Free or paid:** Free (or Paid if applicable)
   - **Privacy Policy URL:** Required - must be publicly accessible
   - Check the declarations
   - Click **Create app**

### 2. Complete Store Listing

**Required Information:**
- **App name:** Go for No
- **Short description:** (80 characters max)
  - Example: "Overcome fear and build confidence through fun social challenges and quests!"
  
- **Full description:** (4000 characters max)
  - Describe your app's features, benefits, and value proposition
  - Include relevant keywords for discoverability

- **App icon:** 512x512px PNG (no transparency)
- **Feature graphic:** 1024x500px PNG
- **Screenshots:** 
  - Phone: At least 2 (max 8), min 320px height
  - Tablet: Optional but recommended
  - Format: PNG or JPEG, max 8MB each

- **Privacy Policy URL:** **REQUIRED**
  - Must be publicly accessible
  - Example: `https://rejectionhero.com/privacy-policy`
  - Must cover:
    - Data collection practices
    - Data usage
    - Third-party services (Google OAuth, etc.)
    - User rights

- **Contact details:**
  - Email address
  - Phone number (optional)
  - Website (optional)

**Optional but Recommended:**
- Video URL (YouTube)
- Promotional text (80 characters)
- Category
- Tags

### 3. Set Up App Content Rating

1. Click **Content rating** in the left menu
2. Complete the questionnaire about your app's content
3. Submit for rating
4. Wait for rating (usually instant for simple apps)

### 4. Set Up Pricing & Distribution

1. Click **Pricing & distribution** in the left menu
2. Select:
   - **Free** or set price
   - Countries where app will be available
   - Content guidelines compliance
   - US export laws compliance
3. Click **Save**

---

## Step 5: Upload Your App Bundle

### Method 1: Using EAS Submit (Recommended)

**1. Configure Service Account**

You need a Google Play Console API service account:

1. In Google Play Console, go to **Settings** → **API access**
2. Click **Create new service account**
3. Follow the Google Cloud Console link
4. Create a service account
5. Return to Play Console and grant access
6. Download the JSON key file
7. Save it securely (e.g., `google-play-api-key.json`)

**2. Update `eas.json`**

```json
{
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-play-api-key.json",
        "track": "internal"  // or "alpha", "beta", "production"
      }
    }
  }
}
```

**3. Submit Build**

```bash
# Submit the latest build
eas submit --platform android --latest

# Or submit a specific build ID
eas submit --platform android --id BUILD_ID
```

### Method 2: Manual Upload

1. Go to Google Play Console
2. Click **Production** (or Internal testing / Closed testing / Open testing)
3. Click **Create new release**
4. Upload your `.aab` file (downloaded from EAS)
5. Add **Release name:** (e.g., "1.0.0")
6. Add **Release notes:** What's new in this version
7. Review and roll out

---

## Step 6: Complete App Release Checklist

### Before Publishing

- [ ] App tested on multiple Android devices
- [ ] All features working correctly
- [ ] No crashes or major bugs
- [ ] Privacy policy published and accessible
- [ ] Store listing complete
- [ ] App icon and graphics uploaded
- [ ] Content rating completed
- [ ] Pricing & distribution set
- [ ] Target audience defined

### Data Safety Section (REQUIRED)

Google Play now requires a Data Safety section:

1. Go to **App content** → **Data safety**
2. Declare:
   - **Data collection:** What data you collect (if any)
   - **Data sharing:** Whether data is shared with third parties
   - **Security practices:** Data encryption, etc.
   - **Data deletion:** How users can request data deletion

**Common Declarations for Your App:**
- ✅ Collects: Email (for account), location (if used)
- ✅ Shared with: Google (OAuth), Stripe (payments)
- ✅ Security: Data encrypted in transit (HTTPS)

---

## Step 7: Release Your App

### Internal Testing (Recommended First Step)

1. Create an **Internal testing** track
2. Upload build
3. Add testers (up to 100 internal testers)
4. Share testing link
5. Test thoroughly

### Production Release

1. Go to **Production** track
2. Click **Create new release**
3. Upload your `.aab` file
4. Add release notes
5. Click **Review release**
6. Review all information
7. Click **Start rollout to Production**

**First Release:**
- Review can take up to 7 days
- Subsequent updates: Usually within a few hours

---

## Step 8: Google OAuth Setup (For Android)

### Add SHA-1 to Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Find your Android OAuth client
5. Click **Edit**
6. Add **Package name:** `com.vibecode.goforno`
7. Add **SHA-1 certificate fingerprint:** (from EAS credentials)
8. Click **Save**

**Get SHA-1:**
```bash
eas credentials
# Then: Android → Production → Keystore → Show fingerprints
```

---

## Ongoing Maintenance

### Updating Your App

1. **Update version in `app.json`:**
   ```json
   {
     "version": "1.0.1",  // Increment
     "android": {
       "versionCode": 2  // Increment
     }
   }
   ```

2. **Build new version:**
   ```bash
   eas build --platform android --profile production
   ```

3. **Submit update:**
   ```bash
   eas submit --platform android --latest
   ```

4. **Or manually upload** in Play Console

---

## Troubleshooting

### Common Issues

**"App signing is not configured"**
- Make sure you've generated keystore via `eas credentials`
- Check that production build profile uses proper signing

**"API access denied"**
- Verify service account has proper permissions in Play Console
- Check that JSON key file path is correct in `eas.json`

**"SHA-1 mismatch"**
- Regenerate SHA-1: `eas credentials` → Show fingerprints
- Update Google Cloud Console OAuth client with new SHA-1

**"Version code already exists"**
- Increment `versionCode` in `app.json`
- Rebuild app

**"Privacy policy required"**
- Must have publicly accessible privacy policy URL
- Add it in Store listing

---

## Required Assets Checklist

### Store Listing Assets

- [ ] **App Icon:** 512x512px PNG (no transparency)
- [ ] **Feature Graphic:** 1024x500px PNG
- [ ] **Phone Screenshots:** 2-8 images (min 320px height)
- [ ] **Tablet Screenshots:** Optional but recommended
- [ ] **Privacy Policy:** Publicly accessible URL

### App Assets (in `app.json`)

- [ ] **Icon:** 1024x1024px (will be resized)
- [ ] **Splash Screen:** 1284x2778px (iPhone 13 Pro Max)
- [ ] **Adaptive Icon:** 
  - Foreground: 1024x1024px
  - Background: 1024x1024px (or solid color)

---

## Quick Reference Commands

```bash
# Setup
eas login
eas build:configure
eas credentials  # Generate keystore

# Build
eas build --platform android --profile production

# Submit
eas submit --platform android --latest

# Check status
eas build:list
```

---

## Next Steps

1. ✅ Complete Google Play Console registration ($25)
2. ✅ Generate production keystore via EAS
3. ✅ Get SHA-1 fingerprint
4. ✅ Configure app.json with correct package/version
5. ✅ Build production app bundle
6. ✅ Complete Play Console store listing
7. ✅ Upload app bundle
8. ✅ Submit for review
9. ✅ Publish!

---

## Resources

- [Google Play Console](https://play.google.com/console)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [Android App Bundle Guide](https://developer.android.com/guide/app-bundle)
- [Google Play Policy Center](https://play.google.com/about/developer-content-policy/)

---

## Support

If you encounter issues:
1. Check [Expo Discord](https://chat.expo.dev/)
2. Review [EAS Build troubleshooting](https://docs.expo.dev/build/troubleshooting/)
3. Check [Google Play Console Help](https://support.google.com/googleplay/android-developer)

