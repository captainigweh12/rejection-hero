# Google Play Store Setup Checklist

## ✅ What I Need From You

Please provide the following information so I can complete the setup:

### 1. App Information
- [ ] **App Display Name** (e.g., "Go for No" or "Rejection Hero" - what shows in Play Store)
  - Current: "vibecode" (should we change this?)

- [ ] **Short Description** (80 characters max)
  - Example: "Overcome fear and build confidence through fun social challenges!"

- [ ] **Full Description** (4000 characters max)
  - Describe your app's features, benefits, and what makes it special

### 2. Privacy Policy URL (REQUIRED)
- [ ] **Privacy Policy URL** - Must be publicly accessible
  - Do you have a public URL for your privacy policy?
  - If not, where should I host it? (e.g., `https://rejectionhero.com/privacy-policy`)

### 3. Contact Information
- [ ] **Support Email** (required)
- [ ] **Support Website** (optional)
- [ ] **Support Phone** (optional)

### 4. Assets (You'll Need to Provide)
- [ ] **App Icon** - 512x512px PNG (no transparency)
- [ ] **Feature Graphic** - 1024x500px PNG (for Play Store header)
- [ ] **Screenshots** - At least 2, preferably 4-8 phone screenshots
  - Minimum height: 320px
  - Format: PNG or JPEG, max 8MB each

### 5. EAS Configuration Preference
- [ ] **Preferred Method:**
  - [ ] Use EAS Submit (automatic upload - requires service account setup)
  - [ ] Manual upload (you upload the .aab file yourself in Play Console)

---

## What I'll Automate

Once you provide the above, I'll:
- ✅ Update `app.json` with correct app name and configuration
- ✅ Generate keystore commands (you'll run them)
- ✅ Set up build scripts
- ✅ Configure EAS for production builds
- ✅ Create a deployment script
- ✅ Set up automated submission (if you choose EAS Submit)

---

## Next Steps After You Provide Info

1. **Run keystore generation:**
   ```bash
   eas credentials
   # Select: Android → Production → Generate keystore
   ```

2. **Build production app:**
   ```bash
   npm run build:android:production
   # or
   eas build --platform android --profile production
   ```

3. **Submit to Play Store:**
   ```bash
   npm run submit:android
   # or manual upload in Play Console
   ```

