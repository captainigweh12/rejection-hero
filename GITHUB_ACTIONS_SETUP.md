# ✅ GitHub Actions Workflows - EAS Automation

## 🎯 What's Been Set Up

Two GitHub Actions workflows have been created to automate your EAS builds:

### 1. **Production Workflow** (Auto-build + Auto-submit)
- **File:** `.github/workflows/eas-android-production.yml`
- **Triggers:**
  - ✅ Automatically on push to `main` branch
  - ✅ Manual trigger via GitHub Actions UI
- **What it does:**
  - Builds Android production app bundle
  - Automatically submits to Google Play (internal track)

### 2. **Preview Workflow** (Build only, manual)
- **File:** `.github/workflows/eas-android-preview.yml`
- **Triggers:**
  - ✅ Manual trigger only (workflow_dispatch)
- **What it does:**
  - Builds Android preview app bundle
  - Does NOT submit to Play Store

---

## 🔐 Required GitHub Secrets

**Before these workflows will work, add these secrets in GitHub:**

### 1. Go to GitHub Repository
**Settings → Secrets and variables → Actions → New repository secret**

### 2. Add These Secrets

#### `EXPO_TOKEN`
- **Value:** `eJICDkelkZFcBBfsMiHWhacRCZZbSU5E5STyP8Lv`
- **Description:** Your Expo/EAS access token

#### `GOOGLE_SERVICE_ACCOUNT_KEY`
- **Value:** The entire contents of your Google Play service account JSON file
- **Description:** Google Play API credentials for automated submission
- **How to get:**
  1. Download the service account JSON file from Google Play Console
  2. Open the file in a text editor
  3. Copy the entire JSON content
  4. Paste as the secret value

---

## 🚀 How to Use

### Production Build + Submit (Automatic)

**Trigger automatically:**
```bash
# Just push to main branch
git add .
git commit -m "Update app"
git push origin main
```

**Or trigger manually:**
1. Go to **GitHub → Actions**
2. Select **"EAS Android Production Build & Submit"**
3. Click **"Run workflow"**
4. Select branch: `main`
5. Click **"Run workflow"**

**What happens:**
1. ✅ Builds Android production app bundle on EAS
2. ✅ Automatically submits to Google Play (internal track)
3. ✅ You'll see progress in GitHub Actions tab

---

### Preview Build (Manual Only)

**To trigger:**
1. Go to **GitHub → Actions**
2. Select **"EAS Android Preview Build"**
3. Click **"Run workflow"**
4. Select branch (usually `main`)
5. Click **"Run workflow"**

**What happens:**
1. ✅ Builds Android preview app bundle
2. ✅ Build is available in EAS dashboard
3. ❌ Does NOT submit to Play Store

---

## 📝 Configuration Notes

### Production Workflow
- **Build Profile:** `production` (from `eas.json`)
- **Submit Track:** `internal` (can be changed to `alpha`, `beta`, or `production`)
- **Triggers on changes to:**
  - `app/**`
  - `src/**`
  - `package.json`
  - `bun.lock`
  - `eas.json`
  - `app.json`

### Preview Workflow
- **Build Profile:** `preview` (from `eas.json`)
- **No submission** - build only

---

## 🔧 Customization Options

### Change Submit Track

In `.github/workflows/eas-android-production.yml`, change:
```yaml
--track internal
```

To:
- `--track alpha` - Alpha testing track
- `--track beta` - Beta testing track  
- `--track production` - Production release (requires review)

### Add More Trigger Paths

Add more paths to trigger builds:
```yaml
paths:
  - "app/**"
  - "src/**"
  - "backend/**"  # Add this
  - "shared/**"   # Add this
```

### Change Bun Version

Update the Bun version in both workflows:
```yaml
bun-version: "1.2.19"  # Update to latest
```

---

## ✅ Pre-Flight Checklist

Before using these workflows:

- [ ] `EXPO_TOKEN` secret added to GitHub
- [ ] `GOOGLE_SERVICE_ACCOUNT_KEY` secret added to GitHub
- [ ] Google Play service account has **Release** permission
- [ ] `eas.json` has `production` profile configured
- [ ] `eas.json` has `preview` profile configured (if using preview workflow)
- [ ] App package name in `app.json` matches Play Console
- [ ] Workflow files committed and pushed to repository

---

## 🐛 Troubleshooting

### Workflow Fails: "EXPO_TOKEN not found"
- ✅ Check GitHub Secrets → Actions
- ✅ Verify secret name is exactly `EXPO_TOKEN`

### Workflow Fails: "Google service account key invalid"
- ✅ Check `GOOGLE_SERVICE_ACCOUNT_KEY` secret contains full JSON
- ✅ Verify service account has correct permissions in Play Console

### Build Succeeds but Submit Fails
- ✅ Check `GOOGLE_APPLICATION_CREDENTIALS` is set correctly
- ✅ Verify service account JSON file format is valid
- ✅ Check Play Console → Users & permissions

### Build Not Triggering
- ✅ Check branch name is `main`
- ✅ Verify files changed match `paths` in workflow
- ✅ Check GitHub Actions tab for any errors

---

## 📊 Monitoring

**View workflow runs:**
1. Go to **GitHub → Actions** tab
2. See all workflow runs and their status
3. Click on a run to see detailed logs

**View EAS builds:**
1. Go to https://expo.dev/accounts/captainigweh12/projects/goforno/builds
2. See all builds (including those from GitHub Actions)

---

## 🎯 Next Steps

1. **Add GitHub Secrets** (see above)
2. **Commit and push workflows:**
   ```bash
   git add .github/workflows/
   git commit -m "Add EAS GitHub Actions workflows"
   git push origin main
   ```
3. **Test the workflow:**
   - Make a small change
   - Push to `main`
   - Watch it build and submit automatically!

---

**Your EAS workflows are ready! Just add the GitHub secrets and you're good to go!** 🚀

