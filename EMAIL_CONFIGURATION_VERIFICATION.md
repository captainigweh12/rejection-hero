# Email Configuration Verification

## Email System Overview

Your app uses **two email systems**:

1. **Resend API** (Primary) - For password resets, admin emails, policy emails
2. **GoHighLevel API** (Optional) - For welcome emails on sign-up and CRM integration

## ✅ Required: Resend API Configuration

### Railway Environment Variables

Set this in Railway → Backend Service → Variables:

```env
RESEND_API_KEY=your-resend-api-key-here
```

**Where emails are sent via Resend:**
- ✅ Password reset emails (`/api/auth/forgot-password`)
- ✅ Policy acceptance emails
- ✅ Admin emails (`/api/admin/send-email`)
- ✅ Bug report notifications
- ✅ Support ticket emails

### Resend Setup

1. **Sign up at [Resend](https://resend.com)**
2. **Get your API key** from dashboard
3. **Add domain** `rejectionhero.com` to Resend (for custom "from" addresses)
4. **Verify DNS** records (SPF, DKIM) in Resend dashboard

**Email service code:** `backend/src/services/email.ts`

## ⚠️ Optional: GoHighLevel API Configuration

### Railway Environment Variables

Set these in Railway → Backend Service → Variables (if using GoHighLevel):

```env
GOHIGHLEVEL_API_KEY=your-gohighlevel-api-key
GOHIGHLEVEL_LOCATION_ID=your-location-id
```

**Where emails are sent via GoHighLevel:**
- ✅ Welcome emails on sign-up (automatically)
- ✅ Group invitation emails
- ✅ CRM contact creation

**Note:** GoHighLevel is **optional**. If not configured, sign-up will still work, but welcome emails won't be sent.

**Email service code:** `backend/src/services/gohighlevel.ts`

## Neon Data API (Not Required)

**The Neon Data API URL you provided is NOT needed for your current setup:**

```
https://ep-withered-field-a4skic0c.apirest.us-east-1.aws.neon.tech/neondb/rest/v1
```

**Why?**
- Better Auth uses Prisma, which connects directly via `DATABASE_URL`
- Prisma doesn't use REST APIs - it uses PostgreSQL connection strings
- The Neon Data API is for direct REST queries, not for Better Auth

**You only need:**
```env
DATABASE_URL=postgresql://neondb_owner:npg_9vudwr7pPfFJ@ep-withered-field-a4skic0c-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
```

## Email Flow on Sign-Up

### When User Signs Up:

1. **Better Auth creates user** in Neon database
2. **GoHighLevel sync** (if configured):
   - Creates contact in GoHighLevel CRM
   - Sends welcome email via GoHighLevel API
   - **If GoHighLevel not configured:** Sign-up still works, just no welcome email
3. **Profile creation** happens automatically

**Code:** `backend/src/services/gohighlevel.ts` → `syncNewUserToGoHighLevel()`

**This is called from:** Better Auth hooks (if configured) or manual calls

## Verification Checklist

### ✅ Required for Email to Work

- [ ] `RESEND_API_KEY` set in Railway
- [ ] Resend account created
- [ ] Domain `rejectionhero.com` added to Resend (optional, for custom from addresses)
- [ ] `DATABASE_URL` set in Railway (for storing users)

### ⚠️ Optional (for welcome emails on sign-up)

- [ ] `GOHIGHLEVEL_API_KEY` set in Railway
- [ ] `GOHIGHLEVEL_LOCATION_ID` set in Railway
- [ ] GoHighLevel API permissions configured

### ✅ Not Required

- [ ] Neon Data API URL (you don't need this)
- [ ] Stack Auth variables (you use Better Auth)

## Testing Email Configuration

### Test Resend API

```bash
# Check if RESEND_API_KEY is set
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer YOUR_RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "noreply@rejectionhero.com",
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<p>Test email from Rejection Hero</p>"
  }'
```

### Test Sign-Up Email

1. **Create a new user** via app
2. **Check Railway logs** for:
   ```
   ✅ [GoHighLevel] User synced and welcome email sent!
   ```
   or
   ```
   ⚠️ [GoHighLevel] User synced but email sending failed
   ```

### Test Password Reset Email

1. **Request password reset** via `/api/auth/forgot-password`
2. **Check Railway logs** for:
   ```
   ✅ [Email] Email sent successfully: [email-id]
   ```
3. **Check user's email inbox** for password reset link

## Common Issues

### Issue: No welcome emails on sign-up

**Possible causes:**
1. GoHighLevel not configured → This is **optional**, sign-up still works
2. GoHighLevel API key invalid
3. GoHighLevel API permissions missing

**Solution:**
- Check Railway logs for GoHighLevel errors
- Verify `GOHIGHLEVEL_API_KEY` is set
- If you want welcome emails, configure GoHighLevel
- If not, sign-up will still work fine without them

### Issue: Password reset emails not working

**Possible causes:**
1. `RESEND_API_KEY` not set
2. Resend API key invalid
3. Domain not verified in Resend

**Solution:**
- Check Railway logs: `⚠️ [Email] RESEND_API_KEY not configured`
- Verify `RESEND_API_KEY` in Railway
- Test Resend API key manually

### Issue: Email service errors

**Check Railway logs for:**
```
❌ [Email] Resend API Error: [error message]
```

**Common errors:**
- `Invalid API key` → Check `RESEND_API_KEY` in Railway
- `Domain not verified` → Add domain in Resend dashboard
- `Rate limit exceeded` → Resend free tier has limits

## Railway Environment Variables Summary

### Required for Emails

```env
# Resend API (for password resets, admin emails)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx

# Database (required for everything)
DATABASE_URL=postgresql://neondb_owner:npg_9vudwr7pPfFJ@ep-withered-field-a4skic0c-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
DATABASE_PROVIDER=postgresql
```

### Optional for Welcome Emails on Sign-Up

```env
# GoHighLevel (for CRM and welcome emails)
GOHIGHLEVEL_API_KEY=your-gohighlevel-api-key
GOHIGHLEVEL_LOCATION_ID=your-location-id
```

### Not Needed

```env
# ❌ Neon Data API - Not needed (Prisma uses DATABASE_URL directly)
# ❌ Stack Auth variables - You use Better Auth
```

## Code Reference

- **Resend email service:** `backend/src/services/email.ts`
- **GoHighLevel email service:** `backend/src/services/gohighlevel.ts`
- **Password reset:** `backend/src/routes/auth.ts`
- **Admin emails:** `backend/src/routes/admin.ts`
- **Policy emails:** `backend/src/routes/policies.ts`

## Summary

✅ **Email on sign-up:** Uses GoHighLevel (optional) - if not configured, sign-up still works  
✅ **Password reset emails:** Uses Resend API (required for password resets to work)  
✅ **Admin/user emails:** Uses Resend API  
✅ **Neon Data API:** NOT needed - Prisma uses `DATABASE_URL` directly  
✅ **Better Auth tables:** Must exist in Neon (verify with `bun run verify:auth-tables`)

**Priority:**
1. Set `RESEND_API_KEY` in Railway (required for password resets)
2. Verify `DATABASE_URL` is set correctly
3. Optionally set GoHighLevel for welcome emails on sign-up

