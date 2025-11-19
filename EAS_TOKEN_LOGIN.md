# Alternative EAS Authentication Method

## Using Access Token (Recommended)

EAS CLI supports token-based authentication which is better for automation. Here's how to set it up:

### Step 1: Get Your Expo Access Token

1. Go to [expo.dev](https://expo.dev)
2. Log in with your credentials:
   - Email: captainigweh12@gmail.com
   - Password: Goomy.5555
3. Go to **Account Settings** → **Access Tokens**
4. Create a new access token
5. Copy the token (starts with `exp_...`)

### Step 2: Set Environment Variable

Once you have the token, set it as an environment variable:

```bash
export EXPO_TOKEN=your_token_here
```

Or add to your `.env` file (make sure `.env` is in `.gitignore`):

```bash
EXPO_TOKEN=your_token_here
```

### Step 3: Verify Login

```bash
npx eas-cli whoami
```

If it shows your username, you're logged in!

---

## Using the Helper Script

I've created a helper script, but EAS login typically requires browser interaction:

```bash
./eas-login-helper.sh
```

However, this will still likely open a browser or require manual code entry.

---

## Recommended: Manual Login

Since EAS uses OAuth, the easiest method is still:

```bash
cd /home/user/workspace
npx eas-cli login
```

Then:
1. Browser will open automatically, OR
2. Copy the code shown and paste at https://expo.dev/login

Once logged in, I can help with the rest of the build process!

