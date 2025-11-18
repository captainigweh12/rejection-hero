import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import Stripe from "stripe";
import { type AppType } from "../types";
import { db } from "../db";
import { env } from "../env";

const paymentsRouter = new Hono<AppType>();

// Initialize Stripe
const stripe = new Stripe(env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acacia",
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

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
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
paymentsRouter.post("/create-token-purchase", zValidator("json", (z) =>
  z.object({
    amount: z.number().int().min(1).max(1000), // Number of tokens to buy
  })
), async (c) => {
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
          await db.subscription.upsert({
            where: { userId },
            create: {
              userId,
              stripeCustomerId: subscription.customer as string,
              stripeSubscriptionId: subscription.id,
              status: subscription.status,
              plan: "monthly",
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
            update: {
              stripeCustomerId: subscription.customer as string,
              stripeSubscriptionId: subscription.id,
              status: subscription.status,
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
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
        await db.subscription.update({
          where: { userId },
          data: {
            status: subscription.status === "active" ? "active" : subscription.status === "canceled" ? "canceled" : "inactive",
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
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

