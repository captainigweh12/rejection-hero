# Privacy Policy Public URL Setup via GoHighLevel

## Option 1: Use GoHighLevel Site Builder (Recommended)

### Step 1: Get Privacy Policy HTML

Call this API endpoint to get the HTML:
```bash
# From your backend server
POST /api/gohighlevel/publish-privacy-policy
```

Or create the HTML manually from `backend/src/legal/privacy-policy.md`

### Step 2: Create Site in GoHighLevel

1. **Log into GoHighLevel**
   - Go to your GoHighLevel dashboard

2. **Create New Site:**
   - Navigate to **Sites** → **Create New Site**
   - Choose template: **"Blank"** or **"Custom HTML"**

3. **Add Privacy Policy Content:**
   - If using Site Builder: Add an HTML block and paste the HTML
   - If using Custom HTML: Replace the default HTML with your privacy policy HTML

4. **Configure Settings:**
   - Page Title: "Privacy Policy - Rejection Hero"
   - Page Slug: "privacy-policy"
   - Make it **Public** (not password protected)

5. **Publish Site:**
   - Click **"Publish"**
   - Copy the public URL
   - Example: `https://yourdomain.gohighlevel.com/privacy-policy`
   - Or: `https://sites.gohighlevel.com/your-site/privacy-policy`

### Step 3: Test the URL

- Open the URL in a browser
- Verify it's publicly accessible (no login required)
- Make sure it displays the privacy policy correctly

### Step 4: Use in Play Console

- Copy the URL
- Use it in Google Play Console as your Privacy Policy URL

---

## Option 2: Use GoHighLevel Funnel Builder

1. **Create New Funnel:**
   - Go to **Funnels** → **Create New Funnel**

2. **Add Page:**
   - Add a simple "Thank You" or "Custom" page
   - Name it "Privacy Policy"

3. **Add HTML Block:**
   - Drag an HTML block onto the page
   - Paste your privacy policy HTML

4. **Publish:**
   - Publish the funnel
   - Get the public URL
   - Use this URL in Play Console

---

## Option 3: Use Existing Domain (Alternative)

If you have your own domain (e.g., rejectionhero.com):

1. **Host the HTML file:**
   - Upload privacy-policy.html to your web server
   - Place at: `https://rejectionhero.com/privacy-policy.html`

2. **Or create a simple page:**
   - Use your hosting provider's page builder
   - Create a privacy policy page
   - Use that URL

---

## Privacy Policy Content

The privacy policy is located at:
- **File:** `backend/src/legal/privacy-policy.md`
- **Contact Email:** captainigweh12@gmail.com (already updated)

The policy includes:
- Information collection practices
- How data is used
- Third-party services (Google OAuth, Stripe)
- User rights
- Contact information

---

## Testing

Once you have the URL:

1. **Test Accessibility:**
   ```bash
   curl https://your-privacy-policy-url.com
   ```
   Should return HTML content (no authentication required)

2. **Test in Browser:**
   - Open in incognito/private window
   - Should load without login
   - Content should be readable

3. **Verify Contact Info:**
   - Check that email `captainigweh12@gmail.com` appears
   - Links should work

---

## Quick HTML Template

If you need to create the HTML manually, here's a basic template:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy - Rejection Hero</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            line-height: 1.6;
        }
        h1 { color: #FF6B35; }
        h2 { color: #0099FF; }
        a { color: #FF6B35; }
    </style>
</head>
<body>
    <!-- Paste your privacy policy content here -->
    <h1>Privacy Policy</h1>
    <!-- Content from privacy-policy.md -->
    <p>For questions, contact: <a href="mailto:captainigweh12@gmail.com">captainigweh12@gmail.com</a></p>
</body>
</html>
```

---

## Next Steps

Once you have the public URL:

1. ✅ Save the URL
2. ✅ Use it in Google Play Console Store Listing
3. ✅ Verify it's accessible
4. ✅ Test all links work
5. ✅ Ready for Play Store submission!

---

## Troubleshooting

**Issue: Site requires login**
- Solution: Make sure the site/page is set to "Public" in GoHighLevel settings

**Issue: Can't create site in GoHighLevel**
- Solution: Check your GoHighLevel plan includes Sites feature
- Alternative: Use Option 3 (your own domain)

**Issue: URL not working**
- Solution: Wait a few minutes after publishing (DNS propagation)
- Verify the page is actually published, not just saved as draft

