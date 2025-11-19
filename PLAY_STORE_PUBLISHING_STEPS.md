# Google Play Store Publishing - Step-by-Step Guide

## ✅ Configuration Complete!

Your app is now configured with:
- **App Name:** Rejection HERO
- **Short Description:** "No more fear of rejection, embrace the No's and use it to build confidence"
- **Support Email:** captainigweh12@gmail.com
- **Package Name:** com.vibecode.goforno
- **Privacy Policy URL:** ✅ https://rejectionheros.com/privacy-policy

---

## Step 1: ✅ Privacy Policy URL Ready!

**Your Privacy Policy URL:** https://rejectionheros.com/privacy-policy

✅ This URL is publicly accessible and ready to use in Google Play Console!

**When filling out Play Console:**
- Go to **Store Listing** → **Privacy Policy**
- Enter: `https://rejectionheros.com/privacy-policy`
- Save

---

## Step 2: Generate Production Keystore

Run these commands:

```bash
# Make sure you're logged into Expo
eas login

# Generate production keystore for Android
eas credentials --platform android
```

**Follow these prompts:**
1. Select **Android**
2. Select **Production**
3. Select **Keystore: Set up a new keystore**
4. Select **Generate new keystore**
5. Save the passwords securely - you'll need them for updates!

**After generating, get your SHA-1 fingerprint:**
```bash
eas credentials --platform android
# Select: Production → Keystore → Show fingerprints
```

**Save the SHA-1** - you'll need it for:
- Google OAuth Android client configuration
- Play Console app signing

---

## Step 3: Build Production App Bundle

```bash
# Build Android App Bundle (.aab) for Play Store
npm run build:android:production

# Or manually:
eas build --platform android --profile production
```

**This will:**
- Create a signed `.aab` file
- Upload to EAS servers
- Take 10-20 minutes

**After build completes:**
- Note the build ID
- Download URL will be available in EAS dashboard

---

## Step 4: Set Up Google Play Console

### 1. Create Your App

1. Go to [play.google.com/console](https://play.google.com/console)
2. Click **"Create app"**
3. Fill in:
   - **App name:** Rejection HERO
   - **Default language:** English (United States)
   - **App or game:** App
   - **Free or paid:** Free
   - Check the declarations
   - Click **"Create app"**

### 2. Complete Store Listing

**Required Information:**

- **App name:** Rejection HERO
- **Short description (80 chars max):**
  ```
  No more fear of rejection, embrace the No's and use it to build confidence
  ```
  
- **Full description (4000 chars max):** 
  ```
  Rejection HERO helps you overcome the fear of rejection through fun, 
  engaging social challenges and quests. Build confidence, expand your 
  comfort zone, and turn "No's" into growth opportunities.
  
  Features:
  • AI-Powered Quest Generation - Personalized challenges tailored to your goals
  • Social Community - Connect with others on the same journey
  • Progress Tracking - Monitor your growth and celebrate milestones
  • Live Streaming - Share your journey and inspire others
  • Group Quests - Complete challenges with friends
  • Badge System - Earn verification badges for authentic quest completion
  • Privacy-Focused - Your data is secure and private
  
  Whether you're building confidence in sales, dating, social situations, 
  or entrepreneurship, Rejection HERO provides a safe space to practice 
  and grow. Every "No" is a step toward your next "Yes"!
  
  Start your journey today and embrace the power of rejection! 🎯
  ```

- **Privacy Policy URL:** ✅ https://rejectionheros.com/privacy-policy
  - ✅ **PUBLICLY ACCESSIBLE** - Ready to use!

- **App Icon:** 512x512px PNG (no transparency)
  - Upload from `assets/icon.png` (resize to 512x512)

- **Feature Graphic:** 1024x500px PNG
  - Create a header graphic for Play Store

- **Screenshots:** 2-8 phone screenshots
  - Minimum height: 320px
  - PNG or JPEG, max 8MB each
  - Show your app's best features

- **Contact Details:**
  - **Email:** captainigweh12@gmail.com
  - **Website:** (optional)
  - **Phone:** (optional)

### 3. Complete Required Sections

**Content Rating:**
1. Click **"Content rating"** in left menu
2. Complete the questionnaire
3. Submit for rating (usually instant)

**Data Safety:**
1. Go to **"App content"** → **"Data safety"**
2. Declare data collection:
   - ✅ Email (for account)
   - ✅ Location (if used, with permission)
   - ✅ Camera/Photos (with permission)
   - ✅ Device information
   - ✅ Analytics data
3. Data sharing:
   - ✅ Google (OAuth)
   - ✅ Stripe (payments)
   - ✅ Other third-party services
4. Security practices:
   - ✅ Data encrypted in transit (HTTPS)
5. Save

**Pricing & Distribution:**
1. Go to **"Pricing & distribution"**
2. Select:
   - ✅ **Free**
   - ✅ Countries (select all or specific)
   - ✅ Content guidelines compliance
   - ✅ US export laws compliance
3. Click **"Save"**

---

## Step 5: Set Up EAS Submit (Automated Publishing)

### 1. Create Service Account in Google Play Console

1. Go to Google Play Console
2. Go to **Settings** → **API access**
3. Click **"Create new service account"**
4. Follow the Google Cloud Console link
5. Create a service account:
   - Name: "EAS Submit Service Account"
   - Role: Basic → Editor
6. Go back to Play Console
7. Grant access to the service account
8. Download the JSON key file
9. Save it as `google-play-api-key.json` in project root

### 2. Update eas.json

The file is already configured, just update the path:

```json
{
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-play-api-key.json",
        "track": "internal"  // Start with "internal", then "production"
      }
    }
  }
}
```

**Important:** Add `google-play-api-key.json` to `.gitignore` (already done)

### 3. Submit Build

```bash
# Submit the latest build to Play Store
npm run submit:android

# Or manually:
eas submit --platform android --latest
```

**This will:**
- Upload your `.aab` file to Play Console
- Create a new release in the selected track (internal/production)
- Ready for review!

---

## Step 6: Review and Publish

1. Go to Play Console
2. Go to **Production** (or **Internal testing** for first test)
3. Review the release
4. Add release notes:
   ```
   Initial release of Rejection HERO!
   - AI-powered quest generation
   - Social community features
   - Progress tracking
   - Badge verification system
   ```
5. Click **"Review release"**
6. Review all information
7. Click **"Start rollout to Production"**

**First Release Review:**
- Can take up to 7 days
- Subsequent updates: Usually within a few hours

---

## Step 7: Update Google OAuth (After Getting SHA-1)

Once you have your SHA-1 fingerprint from Step 2:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Find your Android OAuth client
5. Click **Edit**
6. Add:
   - **Package name:** `com.vibecode.goforno`
   - **SHA-1 certificate fingerprint:** (from Step 2)
7. Click **Save**

---

## Quick Reference Commands

```bash
# Login to Expo
eas login

# Generate keystore
eas credentials --platform android

# Get SHA-1 fingerprint
eas credentials --platform android
# → Production → Keystore → Show fingerprints

# Build production
npm run build:android:production

# Submit to Play Store
npm run submit:android

# Check build status
eas build:list
```

---

## Checklist

- [ ] Privacy Policy URL created (via GoHighLevel)
- [ ] Production keystore generated
- [ ] SHA-1 fingerprint saved
- [ ] Production app bundle built
- [ ] App created in Play Console
- [ ] Store listing completed
- [ ] Content rating completed
- [ ] Data Safety section completed
- [ ] Service account created and JSON key downloaded
- [ ] Build submitted via EAS
- [ ] Google OAuth updated with SHA-1
- [ ] App published to Play Store!

---

## Need Help?

If you encounter issues:
1. Check EAS build status: `eas build:list`
2. Review Play Console messages
3. Check build logs in EAS dashboard
4. Verify all required sections are completed in Play Console

Good luck with your launch! 🚀

