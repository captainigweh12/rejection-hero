# Expo Go Setup & Testing Guide

## ✅ Changes Made

### 1. **Conditional New Architecture**
- Created `app.config.js` that automatically disables new architecture when running in Expo Go
- New architecture is only enabled for production standalone builds
- This ensures Expo Go compatibility without affecting iOS setup

### 2. **Android Build Fixes**
- Added `expo-build-properties` plugin with Android-specific configurations:
  - Disabled ProGuard and resource shrinking (prevents crashes)
  - Added packaging options to handle duplicate native libraries
  - Set proper SDK versions (compileSdk: 34, targetSdk: 34, minSdk: 23)

### 3. **Error Handling Improvements**
- Updated API client to handle missing backend URL gracefully
- Added fallback to localhost for development
- Prevents app crashes when environment variables are missing

### 4. **Expo Go Build Profile**
- Added `expo-go` profile in `eas.json` for testing
- Configured to disable new architecture and use APK builds

---

## 🚀 Testing with Expo Go

### Option 1: Direct Expo Go (Recommended for Quick Testing)

1. **Start the development server:**
   ```bash
   npm run start:expo-go
   # or
   expo start --go
   ```

2. **Scan QR code with Expo Go app:**
   - Install Expo Go from Play Store (Android) or App Store (iOS)
   - Open Expo Go and scan the QR code from terminal
   - The app will load in Expo Go

**Note:** Some features may be limited in Expo Go if they require custom native modules.

### Option 2: Build APK for Testing

1. **Build Expo Go compatible APK:**
   ```bash
   npm run build:android:expo-go
   # or
   eas build --platform android --profile expo-go
   ```

2. **Install on device:**
   - Download the APK from EAS build page
   - Install on Android device
   - This build has new architecture disabled and is optimized for compatibility

---

## 🔧 Development Workflow

### For Quick Testing (Expo Go):
```bash
npm run start:expo-go
```

### For Preview Build (APK):
```bash
npm run build:android:preview
```

### For Production Build:
```bash
npm run build:android:production
```

---

## ⚠️ Important Notes

1. **New Architecture:**
   - Automatically disabled in Expo Go
   - Enabled in production builds
   - iOS setup is NOT affected

2. **Environment Variables:**
   - Make sure `EXPO_PUBLIC_VIBECODE_BACKEND_URL` is set
   - For local development, it falls back to `http://localhost:3000`
   - Check `.env` file or set in EAS secrets

3. **Android Crashes:**
   - Build properties have been configured to prevent common crashes
   - ProGuard is disabled to avoid obfuscation issues
   - Native library conflicts are handled via packaging options

4. **Limitations in Expo Go:**
   - Some custom native modules may not work
   - Features requiring custom native code need a development build
   - Use `development` profile for full native module support

---

## 🐛 Troubleshooting

### App crashes on Android:
1. Check that build properties are applied (check `app.json` plugins section)
2. Verify minSdkVersion is compatible (23+)
3. Check logs: `adb logcat | grep -i error`

### Expo Go not loading:
1. Ensure `newArchEnabled` is false (handled automatically)
2. Check backend URL is accessible
3. Verify no incompatible native modules are used

### Build fails:
1. Run `npm install` to ensure dependencies are up to date
2. Check `eas.json` configuration
3. Verify environment variables are set in EAS secrets

---

## 📱 Testing Checklist

- [ ] App loads in Expo Go without crashes
- [ ] Backend connection works
- [ ] Authentication flows work
- [ ] Core features are accessible
- [ ] No console errors related to missing modules
- [ ] Android build completes successfully
- [ ] APK installs and runs on device

---

## 🔗 Resources

- [Expo Go Documentation](https://docs.expo.dev/workflow/expo-go/)
- [EAS Build Profiles](https://docs.expo.dev/build/eas-json/)
- [Android Build Properties](https://docs.expo.dev/guides/config-plugins/#expo-build-properties)

