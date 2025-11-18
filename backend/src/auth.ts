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
console.log("🔐 [Auth] Initializing Better Auth...");

// Validate Google OAuth configuration
if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
  console.warn("⚠️ [Auth] Google OAuth credentials not configured. Google sign-in will not work.");
  console.warn("⚠️ [Auth] Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.");
} else {
  console.log("✅ [Auth] Google OAuth credentials configured");
  console.log(`🔑 [Auth] Google Client ID: ${env.GOOGLE_CLIENT_ID.substring(0, 20)}...`);
}

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: env.DATABASE_PROVIDER || "sqlite",
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
console.log(`🔐 [Auth] Session expires in: 7 days`);
