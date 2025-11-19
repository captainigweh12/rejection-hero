# 📦 Finding & Uploading Your .aab File

## 🔍 Where is the .aab File?

### Option 1: EAS Dashboard (Recommended)

1. **Go to EAS Builds Dashboard:**
   - URL: https://expo.dev/accounts/captainigweh12/projects/goforno/builds

2. **Find Your Build:**
   - Look for Android builds (Production profile)
   - Find the build with status: **"Finished"** or **"Ready"**

3. **Download .aab File:**
   - Click on the build to view details
   - Click **"Download"** button
   - Save as: `rejection-hero.aab` (or any name you prefer)
   - Save to an easy location like `Downloads/` or `Desktop/`

---

### Option 2: Via Terminal (If Build ID Known)

```bash
cd /home/user/workspace
export EXPO_TOKEN=eJICDkelkZFcBBfsMiHWhacRCZZbSU5E5STyP8Lv

# List builds to find your build ID
npx eas-cli build:list --platform android

# View specific build (replace [BUILD_ID] with actual ID)
npx eas-cli build:view [BUILD_ID]

# The output will show a download URL
# Use curl or wget to download:
curl -o rejection-hero.aab "[DOWNLOAD_URL]"
```

---

### Option 3: Check Your Downloads Folder

If you already downloaded it:
- Check your **Downloads** folder
- Look for files ending in `.aab`
- Or check recent files in your file manager

---

## 📤 How to Upload to Google Play Store

### Prerequisites

1. ✅ .aab file downloaded to your computer
2. ✅ Google Play Console account
3. ✅ App created in Play Console (if not, see below)

---

### Step 1: Create App in Play Console (If Not Done)

1. Go to: https://play.google.com/console
2. Click **"Create app"**
3. Fill in:
   - **App name:** Rejection HERO
   - **Default language:** English (United States)
   - **App or game:** App
   - **Free or paid:** Free
   - Check declarations
   - Click **"Create app"**

---

### Step 2: Complete Store Listing (Required Before Upload)

**Go to:** Store listing (left sidebar)

**Fill in:**

**App name:** Rejection HERO

**Short description (80 chars):**
```
No more fear of rejection, embrace the No's and use it to build confidence
```

**Full description:**
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

**Assets Needed:**
- App Icon: 512x512px PNG (no transparency)
- Feature Graphic: 1024x500px PNG
- Screenshots: 2-8 phone screenshots (min 320px height, PNG/JPEG, max 8MB each)

**Save** your store listing.

---

### Step 3: Complete Required Sections

**Content Rating:**
1. Go to **App content** → **Content rating**
2. Complete questionnaire about your app
3. Submit for rating

**Data Safety:**
1. Go to **App content** → **Data safety**
2. Declare:
   - ✅ Email (for account)
   - ✅ Location (with permission)
   - ✅ Camera/Photos (with permission)
   - ✅ Device information
   - ✅ Analytics data
3. Data sharing:
   - ✅ Google (OAuth)
   - ✅ Stripe (payments)
4. Security: ✅ Data encrypted in transit (HTTPS)
5. **Save**

**Pricing & Distribution:**
1. Go to **Pricing & distribution**
2. Select: **Free**
3. Select countries (or "All countries")
4. Check compliance boxes
5. **Save**

---

### Step 4: Upload .aab File

1. **Go to Production:**
   - In Play Console, click **"Production"** (left sidebar)
   - Or go to: **Release** → **Production**

2. **Create New Release:**
   - Click **"Create new release"** button

3. **Upload .aab File:**
   - Click **"Browse files"** or **"Upload"**
   - Navigate to where you saved your `.aab` file
   - Select: `rejection-hero.aab` (or your filename)
   - Wait for upload to complete (may take a few minutes)

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
   - Click **"Save"** button
   - Then click **"Review release"**

---

### Step 5: Review & Submit

1. **Review Release:**
   - Check all information is correct
   - Verify store listing is complete
   - Ensure required sections are done

2. **Start Rollout:**
   - Click **"Start rollout to Production"**
   - Confirm submission

3. **Submitted!** 🎉
   - Your app is now in review
   - First review can take up to 7 days

---

## 📊 Track Your Submission

**In Play Console:**
- Go to **Production** → **Releases**
- See status: "Pending review", "In review", "Published", etc.

**Check for issues:**
- Google may request changes
- Check email for notifications
- Address any issues in Play Console

---

## 🔐 Update Google OAuth (Important!)

After upload, update your Google OAuth Android client:

1. **Get SHA-1 Fingerprint:**
   ```bash
   cd /home/user/workspace
   export EXPO_TOKEN=eJICDkelkZFcBBfsMiHWhacRCZZbSU5E5STyP8Lv
   npx eas-cli credentials --platform android
   # → Select: Production
   # → Select: Keystore
   # → Select: Show fingerprints
   # → Copy SHA-1 fingerprint
   ```

2. **Update Google Cloud Console:**
   - Go to: https://console.cloud.google.com
   - **APIs & Services** → **Credentials**
   - Find your Android OAuth client
   - Click **Edit**
   - Add:
     - **Package name:** `com.vibecode.goforno`
     - **SHA-1 certificate fingerprint:** (paste from step 1)
   - Click **Save**

---

## 🔗 Quick Links

- **EAS Builds:** https://expo.dev/accounts/captainigweh12/projects/goforno/builds
- **Play Console:** https://play.google.com/console
- **Google Cloud:** https://console.cloud.google.com
- **Privacy Policy:** https://rejectionheros.com/privacy-policy

---

## ✅ Upload Checklist

- [ ] Download .aab file from EAS dashboard
- [ ] Create app in Play Console
- [ ] Complete store listing
- [ ] Complete content rating
- [ ] Complete data safety
- [ ] Complete pricing & distribution
- [ ] Upload .aab file
- [ ] Add release notes
- [ ] Review release
- [ ] Submit to production
- [ ] Update Google OAuth with SHA-1

---

**Good luck with your submission!** 🚀

