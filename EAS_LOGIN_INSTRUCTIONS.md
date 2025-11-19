# EAS Login Instructions

## ⚠️ Important Note

EAS CLI uses **OAuth-based authentication** (browser login), not direct password authentication. Your credentials are: `captainigweh12@gmail.com` / `Goomy.5555`

---

## Option 1: Browser Login (Easiest)

Run this command in your terminal:

```bash
cd /home/user/workspace
npx eas-cli login
```

**What happens:**
1. Browser opens automatically to expo.dev/login
2. Log in with: `captainigweh12@gmail.com` / `Goomy.5555`
3. Authorization completes automatically
4. You're logged in!

**If browser doesn't open:**
- Copy the code shown (e.g., `ABCD-EFGH`)
- Visit https://expo.dev/login
- Enter the code manually
- Log in with your credentials

---

## Option 2: Access Token (For Automation)

1. **Get Access Token:**
   - Go to https://expo.dev
   - Log in with: `captainigweh12@gmail.com` / `Goomy.5555`
   - Go to **Account Settings** → **Access Tokens**
   - Click **Create Token**
   - Copy the token (starts with `exp_...`)

2. **Set Environment Variable:**
   ```bash
   export EXPO_TOKEN=your_token_here
   ```

3. **Verify Login:**
   ```bash
   npx eas-cli whoami
   ```

   Or use the helper script:
   ```bash
   ./login-with-token.sh
   ```

---

## Option 3: Manual Browser Login

1. Visit: https://expo.dev/login
2. Log in with:
   - Email: `captainigweh12@gmail.com`
   - Password: `Goomy.5555`
3. After login, the EAS CLI will detect the session when you run commands

---

## After Login

Once logged in, run:

```bash
# Verify login
npx eas-cli whoami

# Generate keystore
npm run credentials:android

# Build app
npm run build:android:production
```

---

## Troubleshooting

**"Not logged in" error:**
- Try Option 1 (browser login) first
- If that doesn't work, use Option 2 (access token)

**Browser doesn't open:**
- Use Option 3 (manual browser login)
- Or copy/paste the code shown

**Session expired:**
- Re-run `npx eas-cli login`

---

## Ready to Continue?

Once you're logged in (using any of the options above), let me know and I'll help you:
1. Generate the production keystore
2. Build the app bundle
3. Complete the Play Store submission

All configuration files are ready - just need authentication! 🚀

