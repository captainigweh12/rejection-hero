# 🚀 EAS Workflow Commands Reference

Quick reference for all EAS build and submit commands.

---

## 🔧 Setup Commands

### Save Google Play Service Account Key

```bash
cd ~/workspace
mkdir -p secrets
cat > secrets/google-play-service-account.json << 'EOF'
[Paste your entire JSON key content here]
EOF
chmod 600 secrets/google-play-service-account.json
```

### Set Expo Token (Temporary)

```bash
export EXPO_TOKEN='eJICDkelkZFcBBfsMiHWhacRCZZbSU5E5STyP8Lv'
```

### Set Expo Token (Permanent - Add to ~/.bashrc)

```bash
echo 'export EXPO_TOKEN="eJICDkelkZFcBBfsMiHWhacRCZZbSU5E5STyP8Lv"' >> ~/.bashrc
source ~/.bashrc
```

---

## 📦 Android Build & Submit Commands

### Build + Submit (One Command)

```bash
cd ~/workspace
export EXPO_TOKEN='eJICDkelkZFcBBfsMiHWhacRCZZbSU5E5STyP8Lv'
./scripts/build-and-submit.sh
```

### Build Only (No Submit)

```bash
cd ~/workspace
export EXPO_TOKEN='eJICDkelkZFcBBfsMiHWhacRCZZbSU5E5STyP8Lv'
./scripts/build-only.sh          # Production profile
./scripts/build-only.sh preview  # Preview profile
```

### Submit Latest Build

```bash
cd ~/workspace
export EXPO_TOKEN='eJICDkelkZFcBBfsMiHWhacRCZZbSU5E5STyP8Lv'
./scripts/submit-latest.sh
```

### Direct EAS Commands (Android)

```bash
cd ~/workspace
export EXPO_TOKEN='eJICDkelkZFcBBfsMiHWhacRCZZbSU5E5STyP8Lv'

# Build + auto-submit
eas build --platform android --profile production --non-interactive --auto-submit

# Build only
eas build --platform android --profile production --non-interactive

# Submit latest
eas submit --platform android --profile production --latest --non-interactive
```

---

## 🍎 iOS Build & Submit Commands

### Setup iOS Workflow (First Time)

```bash
cd ~/workspace
./scripts/setup-ios-workflow.sh
```

### Build + Submit iOS (One Command)

```bash
cd ~/workspace
export EXPO_TOKEN='eJICDkelkZFcBBfsMiHWhacRCZZbSU5E5STyP8Lv'
./scripts/build-and-submit-ios.sh
```

### Build iOS Only (No Submit)

```bash
cd ~/workspace
export EXPO_TOKEN='eJICDkelkZFcBBfsMiHWhacRCZZbSU5E5STyP8Lv'
./scripts/build-ios.sh          # Production profile
./scripts/build-ios.sh preview  # Preview profile
```

### Submit Latest iOS Build

```bash
cd ~/workspace
export EXPO_TOKEN='eJICDkelkZFcBBfsMiHWhacRCZZbSU5E5STyP8Lv'
./scripts/submit-ios.sh
```

### Direct EAS Commands (iOS)

```bash
cd ~/workspace
export EXPO_TOKEN='eJICDkelkZFcBBfsMiHWhacRCZZbSU5E5STyP8Lv'

# Build + auto-submit
eas build --platform ios --profile production --non-interactive --auto-submit

# Build only
eas build --platform ios --profile production --non-interactive

# Submit latest
eas submit --platform ios --profile production --latest --non-interactive
```

---

## 🔍 Verification Commands

### Check Service Account Key

```bash
# Verify key exists
ls -la secrets/google-play-service-account.json

# Verify JSON is valid (optional, requires jq)
cat secrets/google-play-service-account.json | jq .project_id
```

### Check EAS Configuration

```bash
# View Android submit configuration
grep -A 3 "serviceAccountKeyPath" eas.json

# View iOS submit configuration
grep -A 3 "ascAppId" eas.json
```

### Check EAS Connection

```bash
export EXPO_TOKEN='eJICDkelkZFcBBfsMiHWhacRCZZbSU5E5STyP8Lv'
eas whoami
```

### List All Builds

```bash
export EXPO_TOKEN='eJICDkelkZFcBBfsMiHWhacRCZZbSU5E5STyP8Lv'
eas build:list --platform android
eas build:list --platform ios
```

---

## 🔄 Git Workflow Commands

### Standard Commit & Push

```bash
cd ~/workspace
git add .
git commit -m "Your commit message"
git push origin main
```

**Note:** After each commit, you'll be prompted about iOS workflow setup if it's not already configured.

### Commit Without iOS Prompt

If you want to commit without the iOS prompt, set:

```bash
export SKIP_IOS_PROMPT=1
git commit -m "Your commit message"
```

---

## 📊 Monitoring Commands

### View Build Status

```bash
export EXPO_TOKEN='eJICDkelkZFcBBfsMiHWhacRCZZbSU5E5STyP8Lv'

# List recent builds
eas build:list --platform android --limit 5
eas build:list --platform ios --limit 5

# View specific build
eas build:view [BUILD_ID]
```

### View Submission Status

```bash
export EXPO_TOKEN='eJICDkelkZFcBBfsMiHWhacRCZZbSU5E5STyP8Lv'

# List recent submissions
eas submit:list --platform android --limit 5
eas submit:list --platform ios --limit 5

# View specific submission
eas submit:view [SUBMISSION_ID]
```

---

## 🔧 Helper Scripts Reference

All helper scripts are in the `scripts/` directory:

| Script | Purpose | Usage |
|--------|---------|-------|
| `setup-service-account.sh` | Save Google Play service account key | `./scripts/setup-service-account.sh` |
| `setup-ios-workflow.sh` | Set up iOS workflow | `./scripts/setup-ios-workflow.sh` |
| `build-and-submit.sh` | Build + submit Android | `./scripts/build-and-submit.sh` |
| `build-only.sh` | Build Android only | `./scripts/build-only.sh [profile]` |
| `submit-latest.sh` | Submit latest Android build | `./scripts/submit-latest.sh` |
| `build-and-submit-ios.sh` | Build + submit iOS | `./scripts/build-and-submit-ios.sh` |
| `build-ios.sh` | Build iOS only | `./scripts/build-ios.sh [profile]` |
| `submit-ios.sh` | Submit latest iOS build | `./scripts/submit-ios.sh` |

---

## 📝 Common Workflows

### Daily Workflow: Build + Submit Android

```bash
cd ~/workspace
export EXPO_TOKEN='eJICDkelkZFcBBfsMiHWhacRCZZbSU5E5STyP8Lv'
./scripts/build-and-submit.sh
```

### Test Build Before Submit

```bash
cd ~/workspace
export EXPO_TOKEN='eJICDkelkZFcBBfsMiHWhacRCZZbSU5E5STyP8Lv'

# Build
./scripts/build-only.sh

# Review build in EAS dashboard, then submit
./scripts/submit-latest.sh
```

### Full Release (Android + iOS)

```bash
cd ~/workspace
export EXPO_TOKEN='eJICDkelkZFcBBfsMiHWhacRCZZbSU5E5STyP8Lv'

# Android
./scripts/build-and-submit.sh

# iOS
./scripts/build-and-submit-ios.sh
```

---

## 🔗 Useful Links

- **EAS Dashboard:** https://expo.dev/accounts/captainigweh12/projects/goforno/builds
- **Google Play Console:** https://play.google.com/console/developers
- **App Store Connect:** https://appstoreconnect.apple.com

---

## 💡 Tips

1. **Set EXPO_TOKEN permanently** - Add to `~/.bashrc` to avoid typing it every time
2. **Use helper scripts** - They handle configuration and error checking automatically
3. **Test builds first** - Use `build-only.sh` to test before submitting
4. **Check build status** - Use `eas build:list` to see recent builds
5. **iOS setup prompt** - After commits, you'll be asked about iOS workflow setup

---

**All commands ready to use!** 🚀

