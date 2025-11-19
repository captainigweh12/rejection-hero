# Stripe Products Setup Guide

This guide will help you set up Stripe products for Rejection Hero.

## Step 1: Run the Setup Script

Run the script to create all products and prices in your Stripe account:

```bash
cd backend
bun run scripts/setup-stripe-products.ts
```

This will create:
- **Monthly Subscription Product** ($4.99/month)
- **Token Pack Products**:
  - 10 Tokens ($1.00)
  - 25 Tokens ($2.25 - 10% discount)
  - 50 Tokens ($4.00 - 20% discount)
  - 100 Tokens ($7.50 - 25% discount)

## Step 2: Add Price IDs to Environment Variables

After running the script, you'll see output with Product IDs and Price IDs. Add these to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Product Price IDs (from setup script output)
STRIPE_SUBSCRIPTION_PRICE_ID=price_xxxxx
STRIPE_TOKEN_PACK_10_PRICE_ID=price_xxxxx
STRIPE_TOKEN_PACK_25_PRICE_ID=price_xxxxx
STRIPE_TOKEN_PACK_50_PRICE_ID=price_xxxxx
STRIPE_TOKEN_PACK_100_PRICE_ID=price_xxxxx
```

## Step 3: Verify Products in Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/products)
2. Verify all products are created
3. Check that prices are set correctly

## Step 4: Test Payment Flows

1. **Test Subscription**:
   - Use test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any CVC

2. **Test Token Purchase**:
   - Same test card
   - Verify tokens are added to user account

## Notes

- The payment routes will use Price IDs if available, otherwise they'll create inline prices
- This ensures compatibility with both test and production environments
- Price IDs are required for App Store and Google Play in-app purchases

