# Railway Custom Domain Setup for api.rejectionhero.com

## Problem

SSL certificate error and "Application not found" when accessing `api.rejectionhero.com`:

```
curl: (60) SSL: no alternative certificate subject name matches target host name 'api.rejectionhero.com'
{"status":"error","code":404,"message":"Application not found"}
```

This means the custom domain `api.rejectionhero.com` is **not configured in Railway**.

## Fix: Add Custom Domain in Railway

### Step 1: Add Custom Domain

1. **Go to Railway Dashboard**
2. **Select your Backend Service**
3. **Click "Settings" tab**
4. **Click "Networking"** (or "Domains")
5. **Click "Add Custom Domain"** or "Generate Domain"

### Step 2: Enter Domain

Enter:
```
api.rejectionhero.com
```

**Important:** Don't include `https://` - just the domain name.

### Step 3: Configure DNS (CNAME)

Railway will show you the target domain. Configure DNS:

**In your DNS provider** (wherever `rejectionhero.com` DNS is managed):

**Add CNAME record:**
```
Type: CNAME
Name: api
Value: [Railway-shown-domain].up.railway.app
TTL: 300 (or 3600)
```

**Example:**
```
api.rejectionhero.com → your-app-production-xxxxx.up.railway.app
```

### Step 4: Wait for Provisioning

Railway will:
1. ✅ Verify DNS (can take 1-15 minutes)
2. ✅ Provision SSL certificate (via Let's Encrypt, 5-15 minutes)
3. ✅ Configure HTTPS

**Total time: 5-30 minutes**

### Step 5: Verify

After provisioning completes, test:

```bash
# Should work without SSL errors
curl https://api.rejectionhero.com/health
```

**Expected:**
```json
{"status":"ok","timestamp":"..."}
```

## Railway Domain vs Custom Domain

### Before (Railway Default Domain)
```
https://your-app-production-xxxxx.up.railway.app
```
- ✅ Has valid SSL certificate
- ✅ Works immediately
- ⚠️ Random domain name

### After (Custom Domain)
```
https://api.rejectionhero.com
```
- ✅ Clean domain name
- ✅ Requires DNS + SSL provisioning
- ⚠️ Takes 5-30 minutes to set up

## Temporary Solution: Use Railway Domain

While custom domain is being set up, you can:

**Option 1: Use Railway Domain in App**

Set in app environment:
```env
EXPO_PUBLIC_VIBECODE_BACKEND_URL=https://your-app-production-xxxxx.up.railway.app
```

And in Railway:
```env
BACKEND_URL=https://your-app-production-xxxxx.up.railway.app
```

**Option 2: Get Railway Domain**

1. Railway → Backend Service → Settings → Networking
2. Find "Default Domain" or "Public Domain"
3. Copy the domain (e.g., `your-app-production-xxxxx.up.railway.app`)
4. Use this until custom domain is ready

## Check Railway Deployment Status

### Verify Service is Running

1. Railway → Backend Service → Deployments
2. Check latest deployment:
   - ✅ Status: "Active" or "Success"
   - ✅ Should show deployment time
   - ✅ Should show logs

### Verify Custom Domain

1. Railway → Backend Service → Settings → Networking
2. Check "Custom Domains":
   - ✅ Should show `api.rejectionhero.com`
   - ✅ Status: "Active" (not "Pending" or "Error")
   - ✅ SSL Certificate: "Valid"

**If custom domain shows "Pending":**
- Waiting for DNS verification
- Waiting for SSL provisioning
- Wait 5-30 minutes

**If custom domain shows "Error":**
- DNS not configured correctly
- Check CNAME record
- Verify DNS propagation

## DNS Verification

Check if DNS is configured:

```bash
# Check CNAME record
dig api.rejectionhero.com CNAME +short
```

**Expected output:**
```
your-app-production-xxxxx.up.railway.app.
```

**If it shows nothing:**
- CNAME record not configured
- Wait for DNS propagation (can take up to 48 hours, usually faster)

## SSL Certificate Verification

After provisioning, verify SSL:

```bash
# Check SSL certificate
openssl s_client -connect api.rejectionhero.com:443 -servername api.rejectionhero.com < /dev/null 2>/dev/null | openssl x509 -noout -subject -issuer
```

**Expected:**
```
subject=CN = api.rejectionhero.com
issuer=C = US, O = Let's Encrypt, CN = R3
```

## Testing After Setup

### Test 1: Health Endpoint

```bash
curl https://api.rejectionhero.com/health
```

Should return:
```json
{"status":"ok"}
```

### Test 2: Sign-Up Endpoint

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

## Common Issues

### Issue: "Application not found"

**Symptoms:**
- `{"status":"error","code":404,"message":"Application not found"}`

**Causes:**
1. Custom domain not added in Railway
2. Service not running/deployed
3. Wrong Railway service connected to domain

**Fix:**
1. Add custom domain in Railway
2. Ensure backend service is deployed
3. Verify service is running (check deployments)

### Issue: SSL Certificate Error

**Symptoms:**
- `SSL: no alternative certificate subject name matches`

**Causes:**
1. Custom domain added but SSL not provisioned yet
2. DNS not configured correctly
3. Certificate for wrong domain

**Fix:**
1. Wait for SSL provisioning (5-15 minutes)
2. Verify DNS CNAME is correct
3. Check Railway → Networking shows domain as "Active"

### Issue: DNS Not Propagated

**Symptoms:**
- Custom domain shows "Pending" in Railway
- DNS query returns nothing

**Fix:**
1. Verify CNAME record is correct
2. Wait for DNS propagation (can take up to 48 hours)
3. Check DNS with `dig` or online DNS checker

## Quick Action Plan

1. **Go to Railway** → Backend Service → Settings → Networking
2. **Add custom domain:** `api.rejectionhero.com`
3. **Configure DNS CNAME** (use Railway-provided target)
4. **Wait 5-30 minutes** for DNS + SSL provisioning
5. **Test with curl** to verify it works
6. **Update environment variables** if needed
7. **Test sign-up** from app

## Summary

**The "Application not found" error means `api.rejectionhero.com` isn't configured in Railway!**

**Steps:**
1. ✅ Add custom domain in Railway
2. ✅ Configure DNS CNAME
3. ✅ Wait for SSL provisioning
4. ✅ Verify with curl
5. ✅ Test sign-up from app

Once custom domain is configured and SSL is provisioned, `api.rejectionhero.com` will work and sign-up should work!

