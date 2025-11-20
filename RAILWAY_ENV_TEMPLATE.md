# Environment Variables for Railway Deployment

## Copy-Paste These Into Railway

Go to your Railway service → Variables tab → Add these one by one:

---

## Required Variables (MUST SET)

```
NODE_ENV=production
PORT=3000
DATABASE_PROVIDER=postgresql
```

---

## Authentication (MUST SET - Replace the secret!)

```
BETTER_AUTH_SECRET=CHANGE-THIS-TO-A-RANDOM-32-CHARACTER-STRING-NOW
```

**Generate a secure secret:**
```bash
# Run this locally to generate a secure secret:
openssl rand -base64 32
```

---

## Backend URL (MUST SET)

```
BACKEND_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
```

**Note:** Railway will automatically replace `${{RAILWAY_PUBLIC_DOMAIN}}` with your actual domain.

---

## Google OAuth (Copy from your current .env)

```
GOOGLE_CLIENT_ID=94427138884-cc2db90qkmg6dfshccce94ffmt5rpla0.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_IOS_CLIENT_ID=94427138884-vp4hj04sfr29fndq917iau9alpiv52e6.apps.googleusercontent.com
```

---

## Optional - OpenAI (for quest generation)

```
OPENAI_API_KEY=your-openai-api-key-here
```

---

## Optional - Google Maps

```
GOOGLE_MAPS_API_KEY=AIzaSyCHMHlOrPPSRULrUf-FqPWHz0Y6PJoPrRk
```

---

## Optional - Stripe (for payments)

```
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
STRIPE_SUBSCRIPTION_PRICE_ID=your-subscription-price-id
```

---

## Optional - GoHighLevel (for bug reports)

```
GOHIGHLEVEL_API_KEY=your-gohighlevel-api-key
GOHIGHLEVEL_LOCATION_ID=your-location-id
```

---

## Optional - Perplexity AI

```
PERPLEXITY_API_KEY=your-perplexity-api-key
```

---

## Database Connection

**DO NOT SET THIS MANUALLY!**

Railway automatically sets `DATABASE_URL` when you add a PostgreSQL database to your project. It looks like:

```
DATABASE_URL=postgresql://postgres:password@hostname:5432/railway
```

If for some reason it's not set automatically, you can find it in your PostgreSQL service → Connect tab.

---

## Quick Setup Checklist

When setting up variables in Railway:

1. ✅ Set `NODE_ENV=production`
2. ✅ Set `PORT=3000`
3. ✅ Set `DATABASE_PROVIDER=postgresql`
4. ✅ Generate and set `BETTER_AUTH_SECRET` (32+ characters)
5. ✅ Set `BACKEND_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}`
6. ✅ Copy your Google OAuth credentials
7. ✅ Add optional API keys as needed
8. ✅ Verify `DATABASE_URL` is set automatically by Railway

---

## After Setting Variables

1. Railway will automatically redeploy your service
2. Wait 1-2 minutes for the deployment to complete
3. Check logs to verify everything started correctly
4. Test your backend health endpoint

---

## Environment Variable Best Practices

### Security:
- ✅ Never commit `.env` files to git
- ✅ Use different secrets for dev vs production
- ✅ Rotate secrets regularly
- ✅ Use Railway's encrypted variable storage

### Organization:
- ✅ Group related variables together
- ✅ Use descriptive names
- ✅ Document what each variable does
- ✅ Keep a secure backup of production secrets
