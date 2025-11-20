# ✅ EAS Submit Setup for SSH/Server Environment

## 🎯 Overview

This guide sets up automated EAS submissions directly from your SSH server, without needing GitHub Actions.

**What you'll get:**
- ✅ Automated build and submit workflows
- ✅ Helper scripts for easy commands
- ✅ Secure storage of Google Play service account key
- ✅ One-command build + submit

---

## 🔐 Step 1: Save Your Google Play Service Account Key

### Option A: Using the Setup Script (Recommended)

Run the setup script to guide you through saving your JSON key:

```bash
cd ~/workspace
./scripts/setup-service-account.sh
```

The script will:
- Create the `secrets/` directory
- Guide you through saving the key securely
- Set correct permissions
- Add `secrets/` to `.gitignore`

### Option B: Manual Setup

```bash
cd ~/workspace
mkdir -p secrets
chmod 700 secrets

# Save your JSON key
cat > secrets/google-play-service-account.json << 'EOF'
[Paste your entire JSON key content here]
EOF

# Set secure permissions
chmod 600 secrets/google-play-service-account.json
```

**⚠️ IMPORTANT:** 
- Replace `[Paste your entire JSON key content here]` with the actual JSON content
- The `EOF` marker must be on its own line
- After pasting, press Enter, type `EOF`, then press Enter again

---

## ✅ Step 2: Verify eas.json Configuration

Your `eas.json` is already configured to use the service account key:

```json
{
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./secrets/google-play-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

✅ **This is already set up!** The path points to your service account key.

---

## 🚀 Step 3: Set Your Expo Token

Set your Expo token for this session:

```bash
export EXPO_TOKEN='eJICDkelkZFcBBfsMiHWhacRCZZbSU5E5STyP8Lv'
```

**Or add it to your `~/.bashrc` or `~/.zshrc`** to make it permanent:

```bash
echo 'export EXPO_TOKEN="eJICDkelkZFcBBfsMiHWhacRCZZbSU5E5STyP8Lv"' >> ~/.bashrc
source ~/.bashrc
```

---

## 📦 Usage: Helper Scripts

Three helper scripts are available for easy building and submitting:

### 1. Build + Submit in One Command

**File:** `scripts/build-and-submit.sh`

```bash
cd ~/workspace
./scripts/build-and-submit.sh
```

**What it does:**
- ✅ Builds Android production app bundle
- ✅ Automatically submits to Google Play (internal track)
- ✅ One command, fully automated

---

### 2. Build Only (No Submit)

**File:** `scripts/build-only.sh`

```bash
cd ~/workspace
./scripts/build-only.sh          # Uses 'production' profile
./scripts/build-only.sh preview  # Uses 'preview' profile
```

**What it does:**
- ✅ Builds Android app bundle
- ❌ Does NOT submit (use for testing)
- ✅ Build available in EAS dashboard

---

### 3. Submit Latest Build

**File:** `scripts/submit-latest.sh`

```bash
cd ~/workspace
./scripts/submit-latest.sh
```

**What it does:**
- ✅ Submits the latest successful EAS build
- ✅ Uses production submit profile
- ✅ Sends to internal track on Google Play

---

## 🎯 Workflow Examples

### Scenario 1: Build and Submit Automatically

```bash
cd ~/workspace
export EXPO_TOKEN='eJICDkelkZFcBBfsMiHWhacRCZZbSU5E5STyP8Lv'
./scripts/build-and-submit.sh
```

**Result:** App is built and submitted to Google Play automatically.

---

### Scenario 2: Build First, Submit Later

```bash
# Step 1: Build
cd ~/workspace
export EXPO_TOKEN='eJICDkelkZFcBBfsMiHWhacRCZZbSU5E5STyP8Lv'
./scripts/build-only.sh

# Step 2: Review build in EAS dashboard, then submit
./scripts/submit-latest.sh
```

**Result:** You can review the build before submitting.

---

### Scenario 3: Direct EAS Commands

If you prefer direct EAS CLI commands:

```bash
cd ~/workspace
export EXPO_TOKEN='eJICDkelkZFcBBfsMiHWhacRCZZbSU5E5STyP8Lv'

# Build + auto-submit
eas build --platform android --profile production --non-interactive --auto-submit

# Or build then submit separately
eas build --platform android --profile production --non-interactive
eas submit --platform android --profile production --latest --non-interactive
```

---

## 📝 Configuration Details

### Service Account Key Location

- **Path:** `./secrets/google-play-service-account.json`
- **Permissions:** `600` (owner read/write only)
- **Git:** Ignored (in `.gitignore`)

### Submit Configuration

- **Track:** `internal` (Internal testing in Google Play)
- **Profile:** `production`
- **Platform:** Android only (iOS configured but not active)

### Change Submit Track

To change where builds are submitted, edit `eas.json`:

```json
{
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./secrets/google-play-service-account.json",
        "track": "alpha"  // or "beta" or "production"
      }
    }
  }
}
```

**Available tracks:**
- `internal` - Internal testing (no review)
- `alpha` - Alpha testing track
- `beta` - Beta testing track
- `production` - Production release (requires review)

---

## ✅ Pre-Flight Checklist

Before your first submit:

- [ ] Service account key saved to `secrets/google-play-service-account.json`
- [ ] Key permissions set: `chmod 600 secrets/google-play-service-account.json`
- [ ] `eas.json` configured with correct path (✅ already done)
- [ ] `EXPO_TOKEN` environment variable set
- [ ] Service account has **Release** permission in Play Console
- [ ] App package name matches Play Console (`com.vibecode.goforno`)

---

## 🔍 Verification

### Check Service Account Key

```bash
# Verify key exists and has correct permissions
ls -la secrets/google-play-service-account.json

# Should show: -rw------- (600 permissions)

# Verify JSON is valid (optional)
cat secrets/google-play-service-account.json | jq .project_id
```

### Check EAS Configuration

```bash
# Verify eas.json has correct path
grep -A 3 "serviceAccountKeyPath" eas.json

# Should show: "./secrets/google-play-service-account.json"
```

### Test EAS Connection

```bash
export EXPO_TOKEN='eJICDkelkZFcBBfsMiHWhacRCZZbSU5E5STyP8Lv'
eas whoami

# Should show your Expo username
```

---

## 🐛 Troubleshooting

### Error: "Service account key not found"

**Solution:**
1. Verify key exists: `ls -la secrets/google-play-service-account.json`
2. Check path in `eas.json` matches actual file location
3. Ensure you're in the `~/workspace` directory when running commands

### Error: "Invalid service account key"

**Solution:**
1. Verify JSON is valid: `cat secrets/google-play-service-account.json | jq .`
2. Check you copied the ENTIRE JSON content (including opening/closing braces)
3. Ensure no extra characters or formatting issues

### Error: "Permission denied" in Play Console

**Solution:**
1. Check service account has **Release** permission in Google Play Console
2. Verify service account email in Play Console → Users & permissions
3. Ensure service account JSON is from the correct Google Cloud project

### Error: "EXPO_TOKEN not set"

**Solution:**
```bash
export EXPO_TOKEN='eJICDkelkZFcBBfsMiHWhacRCZZbSU5E5STyP8Lv'

# Or add to ~/.bashrc for persistence
echo 'export EXPO_TOKEN="eJICDkelkZFcBBfsMiHWhacRCZZbSU5E5STyP8Lv"' >> ~/.bashrc
source ~/.bashrc
```

---

## 📊 Monitoring

### View Builds

**EAS Dashboard:**
https://expo.dev/accounts/captainigweh12/projects/goforno/builds

### View Submissions

**Google Play Console:**
https://play.google.com/console/developers

Navigate to: **Rejection HERO** → **Releases** → **Internal testing**

---

## 🎯 Quick Start

**Complete setup in 3 commands:**

```bash
cd ~/workspace

# 1. Save your service account key (paste JSON when prompted)
cat > secrets/google-play-service-account.json << 'EOF'
[Paste your JSON key here]
EOF
chmod 600 secrets/google-play-service-account.json

# 2. Set Expo token
export EXPO_TOKEN='eJICDkelkZFcBBfsMiHWhacRCZZbSU5E5STyP8Lv'

# 3. Build and submit!
./scripts/build-and-submit.sh
```

---

**Your EAS submit setup is ready! Just save your service account key and you're good to go!** 🚀

