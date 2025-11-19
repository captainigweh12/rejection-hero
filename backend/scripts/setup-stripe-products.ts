import Stripe from "stripe";
import { env } from "../src/env";

/**
 * Script to create Stripe products and prices for the app
 * Run this once to set up products in your Stripe account
 */
async function setupStripeProducts() {
  if (!env.STRIPE_SECRET_KEY) {
    console.error("❌ STRIPE_SECRET_KEY not found in environment variables");
    process.exit(1);
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-11-17.clover",
  });

  try {
    console.log("🔄 Setting up Stripe products...\n");

    // 1. Create Monthly Subscription Product
    console.log("📦 Creating Monthly Subscription Product...");
    const subscriptionProduct = await stripe.products.create({
      name: "Rejection Hero Premium",
      description: "Monthly subscription for AI-powered quest generation and premium features",
      metadata: {
        type: "subscription",
        plan: "monthly",
      },
    });

    // Create price for monthly subscription ($4.99/month)
    const subscriptionPrice = await stripe.prices.create({
      product: subscriptionProduct.id,
      unit_amount: 499, // $4.99 in cents
      currency: "usd",
      recurring: {
        interval: "month",
      },
      metadata: {
        plan: "monthly",
      },
    });

    console.log("✅ Monthly Subscription Product created:");
    console.log(`   Product ID: ${subscriptionProduct.id}`);
    console.log(`   Price ID: ${subscriptionPrice.id}`);
    console.log(`   Price: $4.99/month\n`);

    // 2. Create Token Pack Products
    const tokenPacks = [
      { name: "10 Quest Tokens", amount: 10, price: 100 }, // $1.00
      { name: "25 Quest Tokens", amount: 25, price: 225 }, // $2.25 (10% discount)
      { name: "50 Quest Tokens", amount: 50, price: 400 }, // $4.00 (20% discount)
      { name: "100 Quest Tokens", amount: 100, price: 750 }, // $7.50 (25% discount)
    ];

    console.log("📦 Creating Token Pack Products...");
    const tokenProducts: Array<{ productId: string; priceId: string; name: string; amount: number; price: number }> = [];

    for (const pack of tokenPacks) {
      const product = await stripe.products.create({
        name: pack.name,
        description: `Purchase ${pack.amount} tokens to send quests to friends`,
        metadata: {
          type: "token_pack",
          tokenAmount: pack.amount.toString(),
        },
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: pack.price,
        currency: "usd",
        metadata: {
          type: "token_pack",
          tokenAmount: pack.amount.toString(),
        },
      });

      tokenProducts.push({
        productId: product.id,
        priceId: price.id,
        name: pack.name,
        amount: pack.amount,
        price: pack.price,
      });

      console.log(`✅ ${pack.name} created:`);
      console.log(`   Product ID: ${product.id}`);
      console.log(`   Price ID: ${price.id}`);
      console.log(`   Price: $${(pack.price / 100).toFixed(2)} for ${pack.amount} tokens\n`);
    }

    console.log("\n✅ All Stripe products created successfully!\n");
    console.log("📋 Summary:");
    console.log(`   Subscription Product: ${subscriptionProduct.id}`);
    console.log(`   Subscription Price: ${subscriptionPrice.id}`);
    console.log(`   Token Products: ${tokenProducts.length} packs created\n`);

    console.log("💡 Next steps:");
    console.log("   1. Update your payment routes to use these Price IDs");
    console.log("   2. Store the Price IDs in your environment variables or database");
    console.log("   3. Update the frontend to use these products\n");

    // Save to a config file (optional)
    const config = {
      subscription: {
        productId: subscriptionProduct.id,
        priceId: subscriptionPrice.id,
        amount: 499,
        currency: "usd",
        interval: "month",
      },
      tokenPacks: tokenProducts.map((tp) => ({
        productId: tp.productId,
        priceId: tp.priceId,
        name: tp.name,
        amount: tp.amount,
        price: tp.price,
      })),
    };

    console.log("📄 Configuration JSON:");
    console.log(JSON.stringify(config, null, 2));

    return config;
  } catch (error) {
    console.error("❌ Error setting up Stripe products:", error);
    process.exit(1);
  }
}

setupStripeProducts();

