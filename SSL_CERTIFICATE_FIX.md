# SSL Certificate Fix for api.rejectionhero.com

## Problem

SSL certificate error when connecting to `api.rejectionhero.com`:

```
curl: (60) SSL: no alternative certificate subject name matches target host name 'api.rejectionhero.com'
```

This means the SSL certificate doesn't include `api.rejectionhero.com` in its Subject Alternative Name (SAN).

## Impact

**This SSL certificate issue could be causing your sign-up errors!**

- App can't connect to backend (SSL validation fails)
- Requests are rejected before reaching the backend
- No Railway errors (connection fails at SSL level)

## Quick Test (Bypass SSL)

Test if backend works with SSL bypass:

```bash
# Test health endpoint
curl -k https://api.rejectionhero.com/health

# Test sign-up endpoint
curl -k -X POST https://api.rejectionhero.com/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "name": "Test User"
  }'
```

**If `-k` (insecure) works:**
- Backend is functional
- Issue is SSL certificate configuration
- Need to fix certificate in Railway

**If `-k` also fails:**
- Different issue (backend might be down, network issue, etc.)

## Fix: Configure Custom Domain in Railway

### Step 1: Add Custom Domain in Railway

1. **Go to Railway** → Your Backend Service → Settings → Networking
2. **Click "Add Custom Domain"** or "Generate Domain"
3. **Enter:** `api.rejectionhero.com`
4. **Click "Add"**

Railway will:
- Provision SSL certificate automatically
- Configure DNS records
- Set up HTTPS

### Step 2: Configure DNS CNAME

In your DNS provider (wherever `rejectionhero.com` is hosted):

**Add CNAME record:**
```
Type: CNAME
Name: api
Value: [Railway-provided-domain].up.railway.app
TTL: 300
```

**Example:**
```
api.rejectionhero.com → your-app-production.up.railway.app
```

### Step 3: Wait for SSL Certificate

Railway automatically provisions SSL certificates via Let's Encrypt. This can take:
- **5-15 minutes** for certificate provisioning
- **Up to 48 hours** for DNS propagation (usually much faster)

### Step 4: Verify SSL Certificate

After provisioning, test:

```bash
curl -v https://api.rejectionhero.com/health 2>&1 | grep -i "subject:\|issuer:\|CN="
```

Should show:
```
* subject: CN=api.rejectionhero.com
* issuer: C=US; O=Let's Encrypt
```

Or test with browser:
- Go to `https://api.rejectionhero.com/health`
- Click the lock icon → Certificate
- Should show `api.rejectionhero.com` as Common Name

## Alternative: Use Railway Domain Temporarily

If you need to test immediately while SSL is provisioning:

**Option 1: Use Railway domain in app**
- Set `EXPO_PUBLIC_VIBECODE_BACKEND_URL` to Railway domain (e.g., `https://your-app.up.railway.app`)
- Railway domains have valid SSL certificates

**Option 2: Update Google OAuth redirect URI**
- Temporarily add Railway domain to Google Console
- Use Railway domain for OAuth until SSL is fixed

**Then switch back to `api.rejectionhero.com` once SSL is working.**

## Check Railway Custom Domain Status

In Railway → Backend Service → Networking:

**Status should show:**
- ✅ `api.rejectionhero.com` - Active
- SSL Certificate: Valid
- DNS: Configured

**If it shows:**
- ⚠️ Pending → Waiting for DNS/SSL provisioning
- ❌ Error → Check DNS configuration

## Common Issues

### Issue: Certificate doesn't match domain

**Symptoms:**
- SSL error in curl/browser
- Certificate shows different domain

**Fix:**
1. Ensure custom domain is added in Railway
2. Verify DNS CNAME is correct
3. Wait for certificate provisioning
4. Clear DNS cache if needed

### Issue: Certificate not provisioned

**Symptoms:**
- Custom domain added but SSL fails
- Certificate shows Railway domain instead

**Fix:**
1. Check Railway → Networking → Custom Domains
2. Verify domain status is "Active"
3. Wait 10-15 minutes for Let's Encrypt provisioning
4. Redeploy if needed

### Issue: DNS not configured

**Symptoms:**
- Railway can't verify domain ownership
- SSL certificate fails to provision

**Fix:**
1. Ensure CNAME record exists in DNS
2. Verify CNAME points to Railway domain
3. Wait for DNS propagation (check with `dig api.rejectionhero.com CNAME`)

## Testing After Fix

### Test 1: SSL Certificate

```bash
curl -v https://api.rejectionhero.com/health 2>&1 | grep -E "subject:|issuer:|CN="
```

Should show `CN=api.rejectionhero.com`.

### Test 2: Health Endpoint

```bash
curl https://api.rejectionhero.com/health
```

Should return JSON health check response (no SSL errors).

### Test 3: Sign-Up Endpoint

```bash
curl -X POST https://api.rejectionhero.com/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test'$(date +%s)'@example.com",
    "password": "TestPassword123!",
    "name": "Test User"
  }'
```

Should return user data or validation error (no SSL errors).

## App Configuration

After SSL is fixed, ensure app uses `https://api.rejectionhero.com`:

**In app environment:**
```
EXPO_PUBLIC_VIBECODE_BACKEND_URL=https://api.rejectionhero.com
```

**In Railway:**
```
BACKEND_URL=https://api.rejectionhero.com
```

## Summary

**The SSL certificate error is likely causing your sign-up errors!**

**Steps to fix:**
1. ✅ Add `api.rejectionhero.com` as custom domain in Railway
2. ✅ Configure DNS CNAME record
3. ✅ Wait for SSL certificate provisioning (5-15 min)
4. ✅ Verify certificate is valid
5. ✅ Test sign-up again

**While waiting:**
- Test with `curl -k` to verify backend works
- Use Railway domain temporarily if needed

Once SSL is fixed, sign-up should work! The enhanced logging will show requests reaching the backend once SSL is properly configured.

