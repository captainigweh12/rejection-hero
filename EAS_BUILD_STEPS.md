# EAS Build Steps - Play Store Publishing

## Current Status

✅ **Moderation Features**: Complete and ready
✅ **EAS Configuration**: Ready (`eas.json` configured)
✅ **App Configuration**: Ready (`app.json` configured)
⏳ **EAS Login**: Required - needs manual authentication
⏳ **Keystore**: Will be generated after login
⏳ **Build**: Will start after keystore generation

---

## Step-by-Step Instructions

### Step 1: Login to EAS (Required)

EAS login requires interactive authentication. Run this command in your terminal:

```bash
cd /home/user/workspace
npx eas-cli login
```

**What to expect:**
1. The command will open your browser automatically, OR
2. It will display a code like `ABCD-EFGH` for you to enter at `https://expo.dev/login`

**After login:**
- Verify with: `npx eas-cli whoami`
- You should see your Expo username

---

### Step 2: Generate Production Keystore

Once logged in, generate the production keystore:

```bash
npx eas-cli credentials --platform android
```

**Follow these prompts:**
1. Select: **Android**
2. Select: **Production** (not development or preview)
3. Select: **Keystore: Set up a new keystore**
4. Select: **Generate new keystore**

**IMPORTANT**: Save these credentials securely! You'll need them for updates:
- Keystore password
- Key password (may be the same)
- Store them in a password manager

**After generation:**
- Get SHA-1 fingerprint (needed for Google OAuth):
  ```bash
  npx eas-cli credentials --platform android
  # → Select: Production → Keystore → Show fingerprints
  ```
- Save the SHA-1 fingerprint - you'll need it for Google OAuth Android client

---

### Step 3: Build Production App Bundle

Once the keystore is generated, build the production app:

```bash
npm run build:android:production
# Or: npx eas-cli build --platform android --profile production
```

**What happens:**
- EAS will upload your code to Expo's servers
- Build will take 10-20 minutes
- You'll get a download URL when complete

**After build:**
- Note the build ID
- Download the `.aab` file from the EAS dashboard
- URL will be provided in the terminal

---

### Step 4: Update Google OAuth Android Client

After getting the SHA-1 fingerprint from Step 2:

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

### Step 5: Create App in Google Play Console

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

### Step 6: Complete Store Listing

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

**Privacy Policy URL:** https://rejectionheros.com/privacy-policy

**Contact Email:** captainigweh12@gmail.com

**Assets Needed:**
- App Icon: 512x512px PNG (no transparency)
- Feature Graphic: 1024x500px PNG
- Screenshots: 2-8 phone screenshots (min 320px height, PNG/JPEG, max 8MB each)

---

### Step 7: Complete Required Sections

**Content Rating:**
- Go to **Content rating**
- Complete questionnaire
- Submit for rating

**Data Safety:**
- Go to **App content** → **Data safety**
- Declare data collection:
  - ✅ Email (for account)
  - ✅ Location (with permission)
  - ✅ Camera/Photos (with permission)
  - ✅ Device information
  - ✅ Analytics data
- Data sharing:
  - ✅ Google (OAuth)
  - ✅ Stripe (payments)
- Security: ✅ Data encrypted in transit (HTTPS)
- Save

**Pricing & Distribution:**
- Go to **Pricing & distribution**
- Select: **Free**
- Select countries
- Check compliance boxes
- Save

---

### Step 8: Upload & Publish

1. Go to Play Console → Production
2. Click **"Create new release"**
3. Upload `.aab` file (downloaded from EAS)
4. Add release notes:
   ```
   Initial release of Rejection HERO!
   - AI-powered quest generation
   - Social community features
   - Progress tracking
   - Badge verification system
   - User blocking and reporting
   - Chat moderation
   ```
5. Click **"Review release"**
6. Review all information
7. Click **"Start rollout to Production"**

**Review Time:**
- First release: Up to 7 days
- Updates: Usually within a few hours

---

## Quick Command Reference

```bash
# Check login status
npx eas-cli whoami

# Login (interactive)
npx eas-cli login

# Generate keystore
npx eas-cli credentials --platform android
# → Android → Production → Generate keystore

# Get SHA-1
npx eas-cli credentials --platform android
# → Production → Keystore → Show fingerprints

# Build production
npm run build:android:production
# Or: npx eas-cli build --platform android --profile production

# Check build status
npx eas-cli build:list
```

---

## Troubleshooting

### "Not logged in" error
- Run: `npx eas-cli login`
- Follow browser authentication

### "No keystore found" error
- Run: `npx eas-cli credentials --platform android`
- Select Production and generate keystore

### Build fails
- Check `eas.json` configuration
- Verify `app.json` is correct
- Check EAS dashboard for error logs

### Can't find SHA-1
- Run: `npx eas-cli credentials --platform android`
- Navigate to: Production → Keystore → Show fingerprints

---

## Next Steps

1. ✅ Run `npx eas-cli login` (manual)
2. ✅ Generate keystore
3. ✅ Build app bundle
4. ✅ Update Google OAuth
5. ✅ Submit to Play Store

All configuration is complete - just need to authenticate and build! 🚀

