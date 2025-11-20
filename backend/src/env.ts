import { z } from "zod";

/**
 * Environment variable schema using Zod
 * This ensures all required environment variables are present and valid
 */
const envSchema = z.object({
  // Server Configuration
  PORT: z.string().optional().default("3000"),
  NODE_ENV: z.string().optional(),

  // Database Configuration
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required").default("file:./prisma/dev.db"),
  DATABASE_PROVIDER: z.enum(["sqlite", "postgresql"]).optional().default("sqlite"),

  // Better Auth Configuration
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),

  // Used for Better Auth and for Expo client access
  BACKEND_URL: z.url("BACKEND_URL must be a valid URL").default("http://localhost:3000"),

  // Google OAuth Configuration
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_ANDROID_CLIENT_ID: z.string().optional(),
  GOOGLE_IOS_CLIENT_ID: z.string().optional(),

  // OpenAI Configuration (for quest generation)
  OPENAI_API_KEY: z.string().optional(),

  // Resend Configuration (for email)
  RESEND_API_KEY: z.string().optional(),

  // Google Maps Configuration
  GOOGLE_MAPS_API_KEY: z.string().optional(),

  // Perplexity AI Configuration
  PERPLEXITY_API_KEY: z.string().optional(),

  // Stripe Configuration
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_SUBSCRIPTION_PRICE_ID: z.string().optional(), // Price ID for monthly subscription
  STRIPE_TOKEN_PACK_10_PRICE_ID: z.string().optional(), // Price ID for 10 tokens
  STRIPE_TOKEN_PACK_25_PRICE_ID: z.string().optional(), // Price ID for 25 tokens
  STRIPE_TOKEN_PACK_50_PRICE_ID: z.string().optional(), // Price ID for 50 tokens
  STRIPE_TOKEN_PACK_100_PRICE_ID: z.string().optional(), // Price ID for 100 tokens
});

/**
 * Validate and parse environment variables
 */
function validateEnv() {
  try {
    const parsed = envSchema.parse(process.env);

    // CRITICAL: Override BACKEND_URL with Railway domain if available
    // This ensures OAuth always uses the correct Railway URL, even if BACKEND_URL is set incorrectly
    if (process.env.RAILWAY_PUBLIC_DOMAIN) {
      const railwayUrl = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
      const originalBackendUrl = parsed.BACKEND_URL;

      // Always use Railway URL when available (override any BACKEND_URL value)
      parsed.BACKEND_URL = railwayUrl;

      console.log(`🚂 [ENV] Railway Public Domain detected: ${process.env.RAILWAY_PUBLIC_DOMAIN}`);

      if (originalBackendUrl && originalBackendUrl !== railwayUrl) {
        if (originalBackendUrl.includes("sandbox.dev")) {
          console.warn(`⚠️  [ENV] BACKEND_URL was set to sandbox URL: ${originalBackendUrl}`);
          console.warn(`⚠️  [ENV] Overriding with Railway URL: ${railwayUrl}`);
        } else {
          console.log(`ℹ️  [ENV] BACKEND_URL was ${originalBackendUrl}, using Railway URL: ${railwayUrl}`);
        }
      }
      console.log(`✅ [ENV] BACKEND_URL set to Railway domain: ${parsed.BACKEND_URL}`);
    } else if (!parsed.BACKEND_URL || parsed.BACKEND_URL === "http://localhost:3000") {
      // Fallback to localhost if not in Railway and no BACKEND_URL set
      parsed.BACKEND_URL = "http://localhost:3000";
      console.log(`🔧 [ENV] No BACKEND_URL or Railway domain, using localhost fallback`);
    } else {
      // Validate BACKEND_URL is a valid URL
      try {
        new URL(parsed.BACKEND_URL);
        console.log(`🌐 [ENV] Using BACKEND_URL from environment: ${parsed.BACKEND_URL}`);
      } catch {
        throw new Error(`BACKEND_URL must be a valid URL: ${parsed.BACKEND_URL}`);
      }
    }

    console.log("✅ Environment variables validated successfully");
    console.log("🔍 OPENAI_API_KEY from process.env:", process.env.OPENAI_API_KEY ? "EXISTS" : "MISSING");
    console.log("🔍 OPENAI_API_KEY in parsed:", parsed.OPENAI_API_KEY ? "EXISTS" : "MISSING");
    console.log(`🌐 [ENV] Final BACKEND_URL: ${parsed.BACKEND_URL}`);

    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Environment variable validation failed:");
      error.issues.forEach((err: any) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
      });
      console.error("\nPlease check your .env file and ensure all required variables are set.");
      process.exit(1);
    }
    throw error;
  }
}

/**
 * Validated and typed environment variables
 */
export const env = validateEnv();

/**
 * Type of the validated environment variables
 */
export type Env = typeof env;

/**
 * Extend process.env with our environment variables
 */
declare global {
  namespace NodeJS {
    interface ProcessEnv extends Env {}
  }
}
