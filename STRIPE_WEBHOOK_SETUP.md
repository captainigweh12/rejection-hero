# Stripe Webhook Setup Guide

## Backend URL
Your backend URL is: `https://preview-cgmxpdeghzpq.share.sandbox.dev`

## Webhook Endpoint
The webhook endpoint is: `https://preview-cgmxpdeghzpq.share.sandbox.dev/api/payments/webhook`

## Setup Steps

### 1. Go to Stripe Dashboard
1. Navigate to [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks)
2. Make sure you're in **Test Mode** (toggle in the top right)
3. Click **"Add endpoint"** or **"Add webhook"**

### 2. Configure the Webhook
1. **Endpoint URL**: 
   ```
   https://preview-cgmxpdeghzpq.share.sandbox.dev/api/payments/webhook
   ```

2. **Description** (optional):
   ```
   Rejection Hero - Payment webhook for subscriptions and token purchases
   ```

3. **Events to listen to**: Select these events:
   - `checkout.session.completed` - When a payment or subscription is completed
   - `customer.subscription.updated` - When a subscription is updated
   - `customer.subscription.deleted` - When a subscription is canceled/deleted

### 3. Get the Webhook Secret
1. After creating the webhook, click on it to view details
2. Find the **"Signing secret"** section
3. Click **"Reveal"** to show the secret (starts with `whsec_...`)
4. Copy the entire secret

### 4. Add to Environment Variables
Add the webhook secret to your backend `.env` file:

```bash
STRIPE_WEBHOOK_SECRET=whsec_your_actual_secret_here
```

### 5. Restart Backend Server
After adding the webhook secret, restart your backend server to load the new environment variable.

## Testing the Webhook

### Test Mode
Stripe provides a test webhook endpoint for development. You can:
1. Go to the webhook in Stripe Dashboard
2. Click **"Send test webhook"**
3. Select an event type (e.g., `checkout.session.completed`)
4. Click **"Send test webhook"**

### Manual Testing
1. Create a test subscription in your app
2. Use Stripe test card: `4242 4242 4242 4242`
3. Any future expiry date and CVC
4. Check your backend logs to see if the webhook was received

## Webhook Events Handled

### `checkout.session.completed`
- **Subscription**: Creates/updates subscription record in database
- **Token Purchase**: Adds tokens to user's account and creates transaction record

### `customer.subscription.updated`
- Updates subscription status, period dates, and cancellation status

### `customer.subscription.deleted`
- Marks subscription as canceled in database

## Troubleshooting

### Webhook Not Receiving Events
1. Check that the webhook URL is correct and accessible
2. Verify the webhook secret is set correctly in `.env`
3. Check backend logs for webhook errors
4. Ensure the webhook is enabled in Stripe Dashboard

### Signature Verification Failed
- Make sure `STRIPE_WEBHOOK_SECRET` matches the signing secret from Stripe Dashboard
- The secret should start with `whsec_`

### Events Not Processing
- Check backend logs for specific error messages
- Verify database connection is working
- Ensure user IDs in metadata are valid

## Production Setup

When moving to production:
1. Switch to **Live Mode** in Stripe Dashboard
2. Create a new webhook endpoint with your production backend URL
3. Update `STRIPE_WEBHOOK_SECRET` in production environment
4. Update `STRIPE_SECRET_KEY` to use live keys (starts with `sk_live_...`)

