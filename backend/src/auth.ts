import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { env } from "./env";
import { db } from "./db";

// ============================================
// Better Auth Configuration
// ============================================
// Better Auth handles all authentication flows for the application
// Endpoints are automatically mounted at /api/auth/* in index.ts
//
// Available endpoints:
//   - POST /api/auth/sign-up/email       - Sign up with email/password
//   - POST /api/auth/sign-in/email       - Sign in with email/password
//   - POST /api/auth/sign-out            - Sign out current session
//   - GET  /api/auth/session             - Get current session
//   - GET  /api/auth/callback/google     - Google OAuth callback
//   - And many more... (see Better Auth docs)
//
// This configuration includes:
//   - Prisma adapter for database (SQLite/PostgreSQL)
//   - Expo plugin for React Native support
//   - Email/password authentication
//   - Google OAuth authentication
//   - Trusted origins for CORS
//   - Production domain: api.rejectionhero.com
console.log("🔐 [Auth] Initializing Better Auth...");

// Test database connection before initializing Better Auth
async function testDatabaseConnection() {
  try {
    console.log("🔍 [Auth] Testing database connection...");
    await db.$connect();
    console.log("✅ [Auth] Database connection successful");
    
    // Test if Better Auth tables exist
    try {
      await db.user.findFirst({ take: 1 });
      console.log("✅ [Auth] User table accessible");
    } catch (error: any) {
      if (error?.code === "P2021") {
        console.error("❌ [Auth] User table does not exist!");
        console.error("   Run: bun run db:push");
        throw new Error("Better Auth tables missing - run db:push");
      }
      throw error;
    }
    
    try {
      await db.account.findFirst({ take: 1 });
      console.log("✅ [Auth] Account table accessible");
    } catch (error: any) {
      if (error?.code === "P2021") {
        console.error("❌ [Auth] Account table does not exist!");
        console.error("   Run: bun run db:push");
        throw new Error("Better Auth tables missing - run db:push");
      }
      throw error;
    }
    
    try {
      await db.session.findFirst({ take: 1 });
      console.log("✅ [Auth] Session table accessible");
    } catch (error: any) {
      if (error?.code === "P2021") {
        console.error("❌ [Auth] Session table does not exist!");
        console.error("   Run: bun run db:push");
        throw new Error("Better Auth tables missing - run db:push");
      }
      throw error;
    }
    
    return true;
  } catch (error: any) {
    if (error?.code === "P1001" || error?.message?.includes("Can't reach database")) {
      console.error("❌ [Auth] Cannot reach database server!");
      console.error("   Check DATABASE_URL in Railway environment variables");
      console.error(`   Current DATABASE_URL: ${process.env.DATABASE_URL ? "SET" : "NOT SET"}`);
      throw new Error("Database connection failed - check DATABASE_URL");
    }
    throw error;
  }
}

// Test database connection (non-blocking, but log errors)
testDatabaseConnection().catch((error) => {
  console.error("❌ [Auth] Database connection test failed:", error.message);
  console.error("   Better Auth may not work correctly until database is accessible");
});

// Validate Google OAuth configuration
if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
  console.warn("⚠️ [Auth] Google OAuth credentials not configured. Google sign-in will not work.");
  console.warn("⚠️ [Auth] Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.");
} else {
  console.log("✅ [Auth] Google OAuth credentials configured");
  console.log(`🔑 [Auth] Google Client ID: ${env.GOOGLE_CLIENT_ID.substring(0, 20)}...`);
}

// Validate Better Auth configuration
if (!env.BETTER_AUTH_SECRET || env.BETTER_AUTH_SECRET.length < 32) {
  console.error("❌ [Auth] BETTER_AUTH_SECRET is invalid or too short!");
  console.error("   BETTER_AUTH_SECRET must be at least 32 characters");
  throw new Error("BETTER_AUTH_SECRET is invalid");
}

if (!env.DATABASE_URL || (!env.DATABASE_URL.startsWith("postgresql://") && !env.DATABASE_URL.startsWith("postgres://") && !env.DATABASE_URL.startsWith("file:"))) {
  console.error("❌ [Auth] DATABASE_URL is invalid!");
  console.error(`   Current value: ${env.DATABASE_URL ? "SET" : "NOT SET"}`);
  console.error("   DATABASE_URL must start with postgresql://, postgres://, or file:");
  throw new Error("DATABASE_URL is invalid");
}

console.log(`📊 [Auth] Database provider: ${env.DATABASE_PROVIDER || "postgresql"}`);
console.log(`📊 [Auth] DATABASE_URL: ${env.DATABASE_URL.substring(0, 30)}...`);

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: env.DATABASE_PROVIDER || "postgresql",
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BACKEND_URL,
  plugins: [expo()],
  trustedOrigins: [
    "vibecode://", // Expo app scheme
    "http://localhost:3000",
    "http://localhost:8081",
    env.BACKEND_URL,
  ],
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      redirectURI: `${env.BACKEND_URL}/api/auth/callback/google`,
      scope: ["openid", "profile", "email"], // Explicitly request these scopes for better compatibility
    },
  } : undefined,
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  },
});
console.log("✅ [Auth] Better Auth initialized");
console.log(`🔗 [Auth] Base URL: ${env.BACKEND_URL}`);
console.log(`🌐 [Auth] Trusted origins: ${auth.options.trustedOrigins?.join(", ")}`);
console.log(`🔑 [Auth] Google OAuth: ${env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? "Enabled ✅" : "Disabled ⚠️"}`);
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  const redirectURI = `${env.BACKEND_URL}/api/auth/callback/google`;
  console.log(`🔗 [Auth] Google OAuth Redirect URI: ${redirectURI}`);
  
  // Verify production URL is being used
  if (!redirectURI.includes("api.rejectionhero.com")) {
    console.error(`❌ [Auth] ERROR: OAuth redirect URI is not using production URL: ${redirectURI}`);
    console.error(`❌ [Auth] Expected: https://api.rejectionhero.com/api/auth/callback/google`);
    console.error(`❌ [Auth] Please ensure BACKEND_URL is set to production domain: https://api.rejectionhero.com`);
  } else {
    console.log(`✅ [Auth] OAuth redirect URI is using production URL: ${redirectURI}`);
  }
  
  console.log(`⚠️  [Auth] IMPORTANT: Make sure this URL is added to Google Cloud Console OAuth credentials!`);
  console.log(`⚠️  [Auth] Go to: https://console.cloud.google.com/apis/credentials`);
  console.log(`⚠️  [Auth] Add to "Authorized redirect URIs": ${redirectURI}`);
}
console.log(`🔐 [Auth] Session expires in: 7 days`);
