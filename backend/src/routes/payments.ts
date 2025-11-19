import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import Stripe from "stripe";
import { type AppType } from "../types";
import { db } from "../db";
import { env } from "../env";

const paymentsRouter = new Hono<AppType>();

// Initialize Stripe
const stripe = new Stripe(env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-11-17.clover",
});

// ============================================
// GET /api/payments/subscription - Get user's subscription status
// ============================================
paymentsRouter.get("/subscription", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  try {
    const subscription = await db.subscription.findUnique({
      where: { userId: user.id },
    });

    const isActive = subscription?.status === "active" || subscription?.status === "trialing";

    return c.json({
      hasActiveSubscription: isActive,
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            plan: subscription.plan,
            currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() || null,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          }
        : null,
    });
  } catch (error) {
    console.error("Get subscription error:", error);
    return c.json({ message: "Failed to get subscription" }, 500);
  }
});

// ============================================
// POST /api/payments/create-subscription - Create subscription checkout session
// ============================================
paymentsRouter.post("/create-subscription", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  if (!env.STRIPE_SECRET_KEY) {
    return c.json({ message: "Stripe not configured" }, 500);
  }

  try {
    // Get or create Stripe customer
    let subscription = await db.subscription.findUnique({
      where: { userId: user.id },
    });

    let customerId = subscription?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;

      // Create or update subscription record
      subscription = await db.subscription.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          stripeCustomerId: customerId,
          status: "inactive",
        },
        update: {
          stripeCustomerId: customerId,
        },
      });
    }

    // Use stored price ID if available, otherwise create inline price
    const subscriptionPriceId = env.STRIPE_SUBSCRIPTION_PRICE_ID;

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: subscriptionPriceId
        ? [
            {
              price: subscriptionPriceId,
              quantity: 1,
            },
          ]
        : [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: "Rejection Hero Premium",
                  description: "Monthly subscription for AI-powered quest generation",
                },
                recurring: {
                  interval: "month",
                },
                unit_amount: 499, // $4.99
              },
              quantity: 1,
            },
          ],
      success_url: `${env.BACKEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.BACKEND_URL}/payment-cancel`,
      metadata: {
        userId: user.id,
      },
    });

    return c.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Create subscription error:", error);
    return c.json({ message: "Failed to create subscription" }, 500);
  }
});

// ============================================
// POST /api/payments/cancel-subscription - Cancel subscription
// ============================================
paymentsRouter.post("/cancel-subscription", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  try {
    const subscription = await db.subscription.findUnique({
      where: { userId: user.id },
    });

    if (!subscription || !subscription.stripeSubscriptionId) {
      return c.json({ message: "No active subscription found" }, 404);
    }

    // Cancel at period end
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await db.subscription.update({
      where: { userId: user.id },
      data: {
        cancelAtPeriodEnd: true,
      },
    });

    return c.json({ success: true, message: "Subscription will cancel at period end" });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return c.json({ message: "Failed to cancel subscription" }, 500);
  }
});

// ============================================
// POST /api/payments/create-token-purchase - Create token purchase checkout
// ============================================
const createTokenPurchaseRequestSchema = z.object({
  amount: z.number().int().min(1).max(1000), // Number of tokens to buy
});

paymentsRouter.post("/create-token-purchase", zValidator("json", createTokenPurchaseRequestSchema), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  if (!env.STRIPE_SECRET_KEY) {
    return c.json({ message: "Stripe not configured" }, 500);
  }

  try {
    const { amount } = c.req.valid("json");

    // Get or create Stripe customer
    let subscription = await db.subscription.findUnique({
      where: { userId: user.id },
    });

    let customerId = subscription?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;

      subscription = await db.subscription.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          stripeCustomerId: customerId,
          status: "inactive",
        },
        update: {
          stripeCustomerId: customerId,
        },
      });
    }

    // Price: $0.10 per token (10 tokens = $1.00)
    const unitPrice = 10; // $0.10 in cents
    const totalPrice = amount * unitPrice;

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${amount} Quest Tokens`,
              description: "Tokens to send quests to friends",
            },
            unit_amount: unitPrice,
          },
          quantity: amount,
        },
      ],
      success_url: `${env.BACKEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.BACKEND_URL}/payment-cancel`,
      metadata: {
        userId: user.id,
        type: "token_purchase",
        tokenAmount: amount.toString(),
      },
    });

    return c.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Create token purchase error:", error);
    return c.json({ message: "Failed to create token purchase" }, 500);
  }
});

// ============================================
// POST /api/payments/webhook - Stripe webhook handler
// ============================================
paymentsRouter.post("/webhook", async (c) => {
  const signature = c.req.header("stripe-signature");

  if (!signature || !env.STRIPE_WEBHOOK_SECRET) {
    return c.json({ message: "Missing signature or webhook secret" }, 400);
  }

  const body = await c.req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return c.json({ message: `Webhook Error: ${err.message}` }, 400);
  }

  try {
    // Handle subscription events
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.mode === "subscription" && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const userId = session.metadata?.userId || subscription.metadata?.userId;

        if (userId) {
          const subData = subscription as any;
          await db.subscription.upsert({
            where: { userId },
            create: {
              userId,
              stripeCustomerId: subscription.customer as string,
              stripeSubscriptionId: subscription.id,
              status: subscription.status,
              plan: "monthly",
              currentPeriodStart: subData.current_period_start ? new Date(subData.current_period_start * 1000) : null,
              currentPeriodEnd: subData.current_period_end ? new Date(subData.current_period_end * 1000) : null,
              cancelAtPeriodEnd: subData.cancel_at_period_end || false,
            },
            update: {
              stripeCustomerId: subscription.customer as string,
              stripeSubscriptionId: subscription.id,
              status: subscription.status,
              currentPeriodStart: subData.current_period_start ? new Date(subData.current_period_start * 1000) : null,
              currentPeriodEnd: subData.current_period_end ? new Date(subData.current_period_end * 1000) : null,
              cancelAtPeriodEnd: subData.cancel_at_period_end || false,
            },
          });
        }
      } else if (session.mode === "payment" && session.metadata?.type === "token_purchase") {
        // Handle token purchase
        const userId = session.metadata.userId;
        const tokenAmount = parseInt(session.metadata.tokenAmount || "0");

        if (userId && tokenAmount > 0) {
          // Update user stats with tokens
          await db.userStats.update({
            where: { userId },
            data: {
              tokens: {
                increment: tokenAmount,
              },
            },
          });

          // Create transaction record
          await db.tokenTransaction.create({
            data: {
              userId,
              type: "purchase",
              amount: tokenAmount,
              description: `Purchased ${tokenAmount} tokens`,
              stripePaymentIntentId: session.payment_intent as string,
            },
          });
        }
      }
    }

    // Handle subscription updates
    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;

      if (userId) {
        const subData = subscription as any;
        await db.subscription.update({
          where: { userId },
          data: {
            status: subscription.status === "active" ? "active" : subscription.status === "canceled" ? "canceled" : "inactive",
            currentPeriodStart: subData.current_period_start ? new Date(subData.current_period_start * 1000) : null,
            currentPeriodEnd: subData.current_period_end ? new Date(subData.current_period_end * 1000) : null,
            cancelAtPeriodEnd: subData.cancel_at_period_end || false,
            canceledAt: subData.canceled_at ? new Date(subData.canceled_at * 1000) : null,
          },
        });
      }
    }

    return c.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return c.json({ message: "Webhook processing failed" }, 500);
  }
});

// ============================================
// GET /api/payments/tokens - Get user's token balance
// ============================================
paymentsRouter.get("/tokens", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  try {
    const stats = await db.userStats.findUnique({
      where: { userId: user.id },
    });

    return c.json({
      tokens: stats?.tokens || 0,
    });
  } catch (error) {
    console.error("Get tokens error:", error);
    return c.json({ message: "Failed to get tokens" }, 500);
  }
});

export default paymentsRouter;

// Create a separate router for root-level payment redirects
const paymentRedirectRouter = new Hono<AppType>();

// ============================================
// GET /payment-success - Payment success redirect page
// ============================================
paymentRedirectRouter.get("/payment-success", async (c) => {
  const sessionId = c.req.query("session_id");
  const appDeepLink = `vibecode://payment-success${sessionId ? `?session_id=${sessionId}` : ""}`;

  return c.html(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Successful - Rejection Hero</title>
      <meta http-equiv="refresh" content="2;url=${appDeepLink}">
      <script>
        // Try to open app immediately
        window.location.href = "${appDeepLink}";
      </script>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #0A0A0F 0%, #1A1A24 50%, #2A1A34 100%);
          color: white;
        }
        .container {
          text-align: center;
          padding: 40px;
          max-width: 500px;
        }
        .logo {
          font-size: 32px;
          font-weight: bold;
          background: linear-gradient(135deg, #7E3FE4 0%, #00D9FF 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 20px;
        }
        .success-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }
        h1 { font-size: 24px; margin-bottom: 16px; }
        p { font-size: 16px; opacity: 0.8; margin-bottom: 24px; }
        .spinner {
          border: 3px solid rgba(76, 175, 80, 0.3);
          border-top: 3px solid #4CAF50;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #4CAF50 0%, #45A049 100%);
          color: white;
          padding: 14px 32px;
          border-radius: 24px;
          text-decoration: none;
          font-weight: bold;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">🎯 Rejection Hero</div>
        <div class="success-icon">✅</div>
        <h1>Payment Successful!</h1>
        <p>Your subscription has been activated. Redirecting to the app...</p>
        <div class="spinner"></div>
        <p style="font-size: 14px; opacity: 0.6;">If the app doesn't open automatically, click below:</p>
        <a href="${appDeepLink}" class="button">Open in App</a>
        <script>
          // Fallback: if app doesn't open in 2 seconds, show manual link
          setTimeout(function() {
            const button = document.querySelector('.button');
            if (button) button.style.display = 'inline-block';
          }, 2000);
        </script>
      </div>
    </body>
    </html>
  `);
});

// ============================================
// GET /payment-cancel - Payment cancel redirect page
// ============================================
paymentRedirectRouter.get("/payment-cancel", async (c) => {
  const appDeepLink = `vibecode://payment-cancel`;

  return c.html(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Cancelled - Rejection Hero</title>
      <meta http-equiv="refresh" content="2;url=${appDeepLink}">
      <script>
        // Try to open app immediately
        window.location.href = "${appDeepLink}";
      </script>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #0A0A0F 0%, #1A1A24 50%, #2A1A34 100%);
          color: white;
        }
        .container {
          text-align: center;
          padding: 40px;
          max-width: 500px;
        }
        .logo {
          font-size: 32px;
          font-weight: bold;
          background: linear-gradient(135deg, #7E3FE4 0%, #00D9FF 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 20px;
        }
        .cancel-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }
        h1 { font-size: 24px; margin-bottom: 16px; }
        p { font-size: 16px; opacity: 0.8; margin-bottom: 24px; }
        .spinner {
          border: 3px solid rgba(255, 107, 53, 0.3);
          border-top: 3px solid #FF6B35;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #7E3FE4 0%, #5E1FA8 100%);
          color: white;
          padding: 14px 32px;
          border-radius: 24px;
          text-decoration: none;
          font-weight: bold;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">🎯 Rejection Hero</div>
        <div class="cancel-icon">⚠️</div>
        <h1>Payment Cancelled</h1>
        <p>Your payment was cancelled. No charges were made. Redirecting to the app...</p>
        <div class="spinner"></div>
        <p style="font-size: 14px; opacity: 0.6;">If the app doesn't open automatically, click below:</p>
        <a href="${appDeepLink}" class="button">Open in App</a>
        <script>
          // Fallback: if app doesn't open in 2 seconds, show manual link
          setTimeout(function() {
            const button = document.querySelector('.button');
            if (button) button.style.display = 'inline-block';
          }, 2000);
        </script>
      </div>
    </body>
    </html>
  `);
});

export { paymentRedirectRouter };

