# 📤 Upload .aab File to Google Play Store

## 📍 Finding Your .aab File

The `.aab` (Android App Bundle) file is built by EAS and stored on Expo's servers. You need to download it first.

---

## 🔍 Check Build Status & Download

### Step 1: List Your Builds

```bash
cd /home/user/workspace
export EXPO_TOKEN=eJICDkelkZFcBBfsMiHWhacRCZZbSU5E5STyP8Lv
npx eas-cli build:list --platform android
```

This will show:
- Build ID
- Status (finished, in progress, etc.)
- Download URL (if completed)

---

### Step 2: View Specific Build

If you have a build ID:

```bash
npx eas-cli build:view [BUILD_ID]
```

This shows:
- Build details
- Download URL
- Status

---

### Step 3: Download .aab File

**Option A: Via Browser (Easiest)**
1. Go to: https://expo.dev/accounts/captainigweh12/projects/goforno/builds
2. Find your latest Android build
3. Click on it to view details
4. Click **"Download"** button
5. Save the `.aab` file to your computer

**Option B: Via Terminal**
```bash
# If download URL is provided in build:list output
curl -o rejection-hero.aab "[DOWNLOAD_URL]"
```

---

## 📱 Upload to Google Play Console

### Prerequisites

1. ✅ Google Play Console account
2. ✅ App created in Play Console (or create it now)
3. ✅ .aab file downloaded

---

### Step 1: Create App in Play Console (If Not Done)

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

### Step 2: Complete Store Listing

Before uploading, complete the store listing:

**Required Information:**

**App name:** Rejection HERO

**Short description (80 chars max):**
```
No more fear of rejection, embrace the No's and use it to build confidence
```

**Full description (4000 chars max):**
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
• User Blocking & Reporting - Safe community experience
• Chat Moderation - Maintained by admin team
• Privacy-Focused - Your data is secure and private

Whether you're building confidence in sales, dating, social situations, 
or entrepreneurship, Rejection HERO provides a safe space to practice 
and grow. Every "No" is a step toward your next "Yes"!

Start your journey today and embrace the power of rejection! 🎯
```

**Privacy Policy URL:** https://rejectionheros.com/privacy-policy

**Contact Email:** captainigweh12@gmail.com

**App Icon:** 512x512px PNG (no transparency)
**Feature Graphic:** 1024x500px PNG
**Screenshots:** 2-8 phone screenshots (min 320px height)

---

### Step 3: Complete Required Sections

**Content Rating:**
1. Go to **App content** → **Content rating**
2. Complete questionnaire
3. Submit for rating

**Data Safety:**
1. Go to **App content** → **Data safety**
2. Declare data collection:
   - ✅ Email (for account)
   - ✅ Location (with permission)
   - ✅ Camera/Photos (with permission)
   - ✅ Device information
   - ✅ Analytics data
3. Data sharing:
   - ✅ Google (OAuth)
   - ✅ Stripe (payments)
4. Security: ✅ Data encrypted in transit (HTTPS)
5. Save

**Pricing & Distribution:**
1. Go to **Pricing & distribution**
2. Select: **Free**
3. Select countries
4. Check compliance boxes
5. Save

---

### Step 4: Upload .aab File

1. Go to **Production** (left sidebar)
2. Click **"Create new release"**
3. **Upload .aab file:**
   - Click **"Browse files"** or drag & drop
   - Select your `.aab` file (e.g., `rejection-hero.aab`)
   - Wait for upload to complete

4. **Add Release Notes:**
   ```
   Initial release of Rejection HERO!
   - AI-powered quest generation
   - Social community features
   - Progress tracking
   - Badge verification system
   - User blocking and reporting
   - Chat moderation
   ```

5. **Review:**
   - Check app size
   - Review permissions
   - Verify version number

6. **Save:**
   - Click **"Save"**
   - Then click **"Review release"**

---

### Step 5: Review & Submit

1. **Review Release:**
   - Check all information
   - Verify store listing is complete
   - Ensure all required sections are done

2. **Submit:**
   - Click **"Start rollout to Production"**
   - Confirm submission

---

## ⏱️ Review Timeline

- **First release:** Up to 7 days for Google review
- **Updates:** Usually within a few hours to 2 days

---

## 🔐 Update Google OAuth (Important!)

After getting SHA-1 fingerprint from EAS:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. **APIs & Services** → **Credentials**
4. Find Android OAuth client → **Edit**
5. Add:
   - **Package name:** `com.vibecode.goforno`
   - **SHA-1 certificate fingerprint:** (from EAS credentials)
6. Click **Save**

**Get SHA-1:**
```bash
npx eas-cli credentials --platform android
# → Production → Keystore → Show fingerprints
```

---

## 📊 Track Submission Status

In Play Console:
- Go to **Production** → **Releases**
- Check status: "Pending review", "In review", "Published", etc.
- Review any issues or requests from Google

---

## 🔗 Helpful Links

- **EAS Builds:** https://expo.dev/accounts/captainigweh12/projects/goforno/builds
- **Google Play Console:** https://play.google.com/console
- **Google Cloud Console:** https://console.cloud.google.com
- **Privacy Policy:** https://rejectionheros.com/privacy-policy

---

## ✅ Checklist

- [ ] Download .aab file from EAS builds page
- [ ] Create app in Play Console (if not done)
- [ ] Complete store listing
- [ ] Complete content rating
- [ ] Complete data safety section
- [ ] Complete pricing & distribution
- [ ] Upload .aab file
- [ ] Add release notes
- [ ] Review release
- [ ] Submit to production
- [ ] Update Google OAuth with SHA-1
- [ ] Wait for review

---

Good luck with your submission! 🚀

