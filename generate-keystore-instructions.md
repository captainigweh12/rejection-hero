# Generate Production Android Keystore for Go for No App

## Recommended Method: Use EAS (Expo Application Services)

### Step 1: Install EAS CLI (if not already installed)
```bash
npm install -g eas-cli
```

### Step 2: Login to Expo
```bash
eas login
```

### Step 3: Configure EAS Build
```bash
eas build:configure
```

### Step 4: Generate Android Keystore
```bash
eas credentials
```

Then select:
- Android
- Production
- Keystore: Set up a new keystore
- Generate new keystore

### Step 5: Get SHA-1 Fingerprint
```bash
eas credentials
```

Then select:
- Android
- Production  
- Keystore
- Show fingerprints

This will display your SHA-1 and SHA-256 fingerprints.

---

## Alternative: Manual Keystore Generation (Requires Java)

If you prefer to generate the keystore manually on your local machine:

### Step 1: Generate the Keystore
```bash
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore goforno-release.keystore \
  -alias goforno-key-alias \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass YOUR_KEYSTORE_PASSWORD \
  -keypass YOUR_KEY_PASSWORD \
  -dname "CN=Go for No, OU=Mobile, O=Vibecode, L=City, ST=State, C=US"
```

**IMPORTANT:** 
- Replace `YOUR_KEYSTORE_PASSWORD` and `YOUR_KEY_PASSWORD` with strong passwords
- Save these passwords securely - you'll need them for every app update!

### Step 2: Extract SHA-1 Fingerprint
```bash
keytool -list -v \
  -keystore goforno-release.keystore \
  -alias goforno-key-alias \
  -storepass YOUR_KEYSTORE_PASSWORD \
  -keypass YOUR_KEY_PASSWORD
```

Look for the line starting with `SHA1:` under "Certificate fingerprints"

### Step 3: Upload to EAS (Recommended)
```bash
eas credentials
```

Then select:
- Android
- Production
- Keystore: Use an existing keystore
- Upload your goforno-release.keystore file

---

## For Google OAuth Configuration

Once you have your SHA-1 fingerprint, use these values:

**Android OAuth Client:**
- Application type: Android
- Package name: `com.vibecode.goforno`
- SHA-1 certificate fingerprint: [Your generated SHA-1]

**iOS OAuth Client:**
- Application type: iOS  
- Bundle ID: `com.vibecode.goforno`

**Web OAuth Client:**
- Application type: Web application
- Authorized JavaScript origins: Your production domain
- Authorized redirect URIs: `https://[your-domain]/auth/callback`

---

## Quick Development Testing

For immediate development/testing, you can use Expo Go's SHA-1:
```
SHA-1: E7:0B:99:9F:8C:5C:E6:35:2F:15:96:3D:5F:8A:8B:0D:8A:5E:5C:5D
```

But remember to update with your production SHA-1 before release!
