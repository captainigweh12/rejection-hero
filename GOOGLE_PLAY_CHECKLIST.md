# Google Play Store Submission Checklist

## ✅ Configuration Complete

### App Information
- ✅ **App Name:** Rejection HERO
- ✅ **Short Description:** "No more fear of rejection, embrace the No's and use it to build confidence"
- ✅ **Support Email:** captainigweh12@gmail.com
- ✅ **Package Name:** com.vibecode.goforno
- ✅ **Privacy Policy URL:** https://rejectionheros.com/privacy-policy

### Files Ready
- ✅ `app.json` - Configured with correct name and package
- ✅ `eas.json` - Production build and submit profiles ready
- ✅ Privacy policy HTML - Created and hosted
- ✅ NPM scripts - Build and submit commands ready

---

## 📋 Remaining Steps

### 1. Generate Production Keystore ⏳

```bash
# Login to Expo
eas login

# Generate production keystore
npm run credentials:android
# Or: eas credentials --platform android
```

**Steps:**
1. Select **Android**
2. Select **Production**
3. Select **Keystore: Set up a new keystore**
4. Select **Generate new keystore**
5. **SAVE PASSWORDS SECURELY!** ⚠️

**Get SHA-1 Fingerprint:**
```bash
eas credentials --platform android
# → Production → Keystore → Show fingerprints
```
**Save SHA-1** - needed for Google OAuth Android client

---

### 2. Build Production App Bundle ⏳

```bash
npm run build:android:production
# Or: eas build --platform android --profile production
```

**Wait Time:** 10-20 minutes

**After Build:**
- Note the build ID
- Download URL available in EAS dashboard

---

### 3. Create App in Google Play Console ⏳

1. Go to [play.google.com/console](https://play.google.com/console)
2. Click **"Create app"**
3. Fill in:
   - **App name:** Rejection HERO
   - **Default language:** English (United States)
   - **App or game:** App
   - **Free or paid:** Free
   - Check declarations
   - Click **"Create app"**

---

### 4. Complete Store Listing ⏳

**Required Information:**

**App name:** Rejection HERO

**Short description (80 chars):**
```
No more fear of rejection, embrace the No's and use it to build confidence
```

**Full description (4000 chars):**
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

**Privacy Policy URL:** ✅ https://rejectionheros.com/privacy-policy

**Contact Email:** captainigweh12@gmail.com

**Assets Needed:**
- [ ] App Icon: 512x512px PNG (no transparency)
- [ ] Feature Graphic: 1024x500px PNG
- [ ] Screenshots: 2-8 phone screenshots (min 320px height, PNG/JPEG, max 8MB each)

---

### 5. Complete Required Sections ⏳

**Content Rating:**
- [ ] Go to **Content rating**
- [ ] Complete questionnaire
- [ ] Submit for rating

**Data Safety:**
- [ ] Go to **App content** → **Data safety**
- [ ] Declare data collection:
  - ✅ Email (for account)
  - ✅ Location (with permission)
  - ✅ Camera/Photos (with permission)
  - ✅ Device information
  - ✅ Analytics data
- [ ] Data sharing:
  - ✅ Google (OAuth)
  - ✅ Stripe (payments)
- [ ] Security: ✅ Data encrypted in transit (HTTPS)
- [ ] Save

**Pricing & Distribution:**
- [ ] Go to **Pricing & distribution**
- [ ] Select: **Free**
- [ ] Select countries
- [ ] Check compliance boxes
- [ ] Save

---

### 6. Set Up EAS Submit (Optional - for automated publishing) ⏳

**Option A: Manual Upload (Simpler for first time)**
- [ ] Download `.aab` file from EAS dashboard
- [ ] Go to Play Console → Production (or Internal testing)
- [ ] Click **"Create new release"**
- [ ] Upload `.aab` file
- [ ] Add release notes
- [ ] Review and roll out

**Option B: Automated via EAS Submit**
- [ ] Go to Play Console → Settings → API access
- [ ] Create new service account
- [ ] Follow Google Cloud Console link
- [ ] Create service account with Editor role
- [ ] Return to Play Console and grant access
- [ ] Download JSON key file
- [ ] Save as `google-play-api-key.json` in project root
- [ ] Run: `npm run submit:android`

---

### 7. Upload & Publish ⏳

**For Manual Upload:**
1. [ ] Download `.aab` from EAS dashboard
2. [ ] Go to Play Console → Production
3. [ ] Click **"Create new release"**
4. [ ] Upload `.aab` file
5. [ ] Add release notes:
   ```
   Initial release of Rejection HERO!
   - AI-powered quest generation
   - Social community features
   - Progress tracking
   - Badge verification system
   ```
6. [ ] Click **"Review release"**
7. [ ] Review all information
8. [ ] Click **"Start rollout to Production"**

**Review Time:**
- First release: Up to 7 days
- Updates: Usually within a few hours

---

### 8. Update Google OAuth Android Client ⏳

**After getting SHA-1 from Step 1:**

1. [ ] Go to [Google Cloud Console](https://console.cloud.google.com)
2. [ ] Select your project
3. [ ] Go to **APIs & Services** → **Credentials**
4. [ ] Find Android OAuth client
5. [ ] Click **Edit**
6. [ ] Add:
   - **Package name:** `com.vibecode.goforno`
   - **SHA-1 certificate fingerprint:** (from Step 1)
7. [ ] Click **Save**

---

## ✅ Quick Command Reference

```bash
# Login
eas login

# Generate keystore
npm run credentials:android

# Get SHA-1
eas credentials --platform android
# → Production → Keystore → Show fingerprints

# Build production
npm run build:android:production

# Submit to Play Store (if service account set up)
npm run submit:android

# Check build status
eas build:list
```

---

## 🎯 Current Status

✅ **Ready:**
- App configuration
- Privacy Policy URL: https://rejectionheros.com/privacy-policy
- Support email configured
- EAS build configuration
- Documentation complete

⏳ **Next Actions:**
1. Generate production keystore
2. Build production app bundle
3. Create app in Play Console
4. Complete store listing
5. Upload and publish!

---

## 📞 Need Help?

All configuration is complete. Just follow the steps above to:
1. Generate the keystore
2. Build your app
3. Submit to Play Store

Good luck with your launch! 🚀

