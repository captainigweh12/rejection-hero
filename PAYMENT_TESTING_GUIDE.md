# Payment System Testing Guide

## Backend Server Status
✅ **Server Restarted Successfully**
- Backend URL: `https://preview-cgmxpdeghzpq.share.sandbox.dev`
- Local URL: `http://localhost:3000`
- Stripe keys loaded from `.env`

## Stripe Configuration
✅ **Keys Configured**
- `STRIPE_SECRET_KEY`: ✅ Set (test key)
- `STRIPE_PUBLISHABLE_KEY`: ✅ Set (test key)
- `STRIPE_WEBHOOK_SECRET`: ⚠️ Pending (needs to be set up in Stripe Dashboard)

## Available Payment Endpoints

### 1. Get Subscription Status
```
GET /api/payments/subscription
```
**Requires**: Authentication (user session)
**Returns**: 
- `hasActiveSubscription`: boolean
- `subscription`: subscription details or null

### 2. Create Subscription
```
POST /api/payments/create-subscription
```
**Requires**: Authentication
**Returns**:
- `sessionId`: Stripe checkout session ID
- `url`: Stripe checkout URL (redirect user here)

**Test Card**: `4242 4242 4242 4242`
- Any future expiry date (e.g., 12/25)
- Any 3-digit CVC (e.g., 123)
- Any ZIP code

### 3. Cancel Subscription
```
POST /api/payments/cancel-subscription
```
**Requires**: Authentication + Active subscription
**Returns**: Success message

### 4. Create Token Purchase
```
POST /api/payments/create-token-purchase
Body: { "amount": 10 } // Number of tokens (1-1000)
```
**Requires**: Authentication
**Returns**:
- `sessionId`: Stripe checkout session ID
- `url`: Stripe checkout URL

**Pricing**: $0.10 per token (10 tokens = $1.00)

### 5. Get Token Balance
```
GET /api/payments/tokens
```
**Requires**: Authentication
**Returns**: `{ "tokens": 0 }`

### 6. Webhook Endpoint
```
POST /api/payments/webhook
```
**Requires**: Stripe webhook signature
**Handles**: 
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## Testing Flow

### Test 1: Subscription Creation
1. **In App**: Navigate to "Create Quest" screen
2. **Click**: "Generate with AI" (should show premium badge if not subscribed)
3. **Click**: "Subscribe" button
4. **Expected**: Opens Stripe checkout page
5. **Use Test Card**: `4242 4242 4242 4242`
6. **Complete Payment**: Should redirect back to app
7. **Verify**: 
   - Subscription status shows as active
   - AI quest generation works without premium badge
   - Premium badge disappears

### Test 2: Token Purchase
1. **In App**: Navigate to "Send Quest to Friend"
2. **If no tokens**: Should prompt to purchase tokens
3. **Click**: "Buy Tokens"
4. **Enter**: Amount (e.g., 10 tokens = $1.00)
5. **Complete Payment**: Use test card
6. **Verify**: 
   - Token balance increases
   - Can now send quests to friends

### Test 3: Token Earning
1. **In App**: Start a quest
2. **Complete Quest**: Get required number of "No"s
3. **Verify**: 
   - Quest marked as completed
   - Tokens earned (proportional to NOs collected)
   - Token balance increases in stats

### Test 4: Token Spending
1. **In App**: Navigate to "Send Quest to Friend"
2. **Select**: A quest to share
3. **Send**: Quest to friend
4. **Verify**: 
   - 1 token deducted from balance
   - Quest sent successfully

### Test 5: Subscription Restriction
1. **Cancel Subscription**: (if you have one)
2. **Try AI Quest Generation**: Should show premium badge
3. **Click**: "Generate with AI"
4. **Expected**: Alert prompting to subscribe
5. **Verify**: AI features are blocked

## Webhook Testing

### Manual Webhook Test (Stripe Dashboard)
1. Go to Stripe Dashboard → Webhooks
2. Click on your webhook endpoint
3. Click "Send test webhook"
4. Select event: `checkout.session.completed`
5. Click "Send test webhook"
6. **Check Backend Logs**: Should see webhook received and processed

### Real Webhook Test
1. Complete a test subscription purchase
2. **Check Backend Logs**: Should see webhook event received
3. **Verify Database**: 
   - Subscription record created/updated
   - Status set to "active" or "trialing"

## Expected Behavior

### Subscription Features
- ✅ Users can start for free (basic features)
- ✅ AI quest generation requires subscription
- ✅ Premium badge shown when not subscribed
- ✅ Subscription persists across app restarts
- ✅ Subscription can be canceled (at period end)

### Token System
- ✅ Users earn tokens by completing quests
- ✅ Token amount proportional to NOs collected
- ✅ Users can purchase tokens
- ✅ Sending quests to friends costs 1 token
- ✅ Token balance displayed in stats

## Troubleshooting

### "Stripe not configured" Error
- **Check**: `.env` file has `STRIPE_SECRET_KEY` set
- **Solution**: Restart backend server after adding keys

### Webhook Not Working
- **Check**: `STRIPE_WEBHOOK_SECRET` is set correctly
- **Check**: Webhook URL is correct in Stripe Dashboard
- **Check**: Webhook is enabled and subscribed to correct events
- **Solution**: See `STRIPE_WEBHOOK_SETUP.md`

### Subscription Not Activating
- **Check**: Webhook is receiving events (check Stripe Dashboard)
- **Check**: Backend logs for webhook processing errors
- **Check**: Database connection is working

### Tokens Not Earning
- **Check**: Quest completion logic in `backend/src/routes/quests.ts`
- **Check**: `updateUserStats` is being called
- **Check**: Token transaction records are being created

## Next Steps

1. ✅ **Stripe Keys Added** - Done
2. ⚠️ **Webhook Setup** - Needs to be done in Stripe Dashboard (see `STRIPE_WEBHOOK_SETUP.md`)
3. ✅ **Backend Server Restarted** - Done
4. 🧪 **Test Payment Flow** - Ready to test in app
5. 📊 **Monitor Webhook Events** - Check Stripe Dashboard and backend logs

## Notes

- All payments are in **test mode** using Stripe test keys
- Test cards work without real charges
- Webhook secret is required for production-like testing
- For production, switch to live Stripe keys and update webhook endpoint

