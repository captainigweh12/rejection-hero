# 🔧 Fix Keystore and Rebuild

## Issue: Build Failed - Keystore Not Properly Linked

The build tried to generate a new keystore, which suggests the existing keystore might not be properly linked to the production profile.

---

## ✅ Solution: Verify & Relink Keystore

### Step 1: Check Current Credentials

```bash
cd /home/user/workspace
export EXPO_TOKEN=eJICDkelkZFcBBfsMiHWhacRCZZbSU5E5STyP8Lv
npx eas-cli credentials --platform android
```

**Follow prompts:**
1. Select: **Android**
2. Select: **Production**
3. Check if keystore exists
4. If not, create one (or verify it's uploaded)

---

### Step 2: If Keystore Doesn't Exist for Production

Create/link the keystore:

```bash
npx eas-cli credentials --platform android
```

**Follow prompts:**
1. Select: **Android**
2. Select: **Production**
3. Select: **Keystore: Set up a new keystore**
4. Select: **Generate new keystore**
5. Save passwords securely!

**OR if you have the keystore file locally:**
1. Select: **Keystore: Set up a new keystore**
2. Select: **Upload an existing keystore**
3. Upload your `.keystore` or `.jks` file

---

### Step 3: Verify eas.json Configuration

Ensure `eas.json` has:

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle",
        "credentialsSource": "remote"
      }
    }
  }
}
```

This tells EAS to use remote (EAS-managed) credentials.

---

### Step 4: Retry Build

After fixing keystore:

```bash
cd /home/user/workspace
export EXPO_TOKEN=eJICDkelkZFcBBfsMiHWhacRCZZbSU5E5STyP8Lv
npx eas-cli build --platform android --profile production
```

**When prompted: "Generate a new Android Keystore?"**
- If keystore is properly configured, it should NOT ask this
- If it still asks, answer **"No"** or **"N"**

---

## 📋 Common Errors & Fixes

### Error: "Keystore not found"
- **Fix:** Run `npx eas-cli credentials --platform android` and set up keystore for Production profile

### Error: "Credentials mismatch"
- **Fix:** Delete existing credentials and recreate:
  ```bash
  npx eas-cli credentials --platform android
  # → Production → Keystore → Remove keystore
  # Then create new one
  ```

### Error: Build still tries to generate keystore
- **Fix:** Ensure `credentialsSource: "remote"` is in `eas.json` production profile
- Or explicitly configure credentials before building

---

## 🔍 Check Build Logs First

**Before fixing, check what the actual error is:**

1. Visit: https://expo.dev/accounts/captainigweh12/projects/goforno/builds/3cc3b658-a7ee-4be2-bfde-4b398cc84426
2. View the error logs
3. Share the error message so we can fix it precisely

---

## ✅ Next Steps

1. [ ] Check build logs to see exact error
2. [ ] Verify keystore exists for Production profile
3. [ ] Fix keystore configuration if needed
4. [ ] Retry build

---

**Check the logs URL first, then we can fix the specific issue!** 🔍

