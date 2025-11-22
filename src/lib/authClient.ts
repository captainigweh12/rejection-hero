import { expoClient } from "@better-auth/expo/client";
import { emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

// Ensure the backend URL has the protocol prefix
const getBackendURL = () => {
  // PRODUCTION: Always use production URL
  const PRODUCTION_URL = "https://api.rejectionhero.com";
  const url = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL as string;

  // Always use production URL in production builds
  // In development, allow localhost fallback if env var is not set
  if (__DEV__ && url && !url.includes("sandbox.dev") && url.startsWith("http")) {
    // If URL doesn't start with http:// or https://, add https://
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return `https://${url}`;
    }
    return url;
  }

  // Production: always use production URL
  return PRODUCTION_URL;
};

const backendURL = getBackendURL();

if (!backendURL) {
  console.error("❌ [Auth Client] EXPO_PUBLIC_VIBECODE_BACKEND_URL is not set!");
  console.error("   Please set EXPO_PUBLIC_VIBECODE_BACKEND_URL in your environment variables");
}

export const authClient = createAuthClient({
  baseURL: backendURL,
  plugins: [
    emailOTPClient(),
    expoClient({
      scheme: "vibecode",
      storagePrefix: process.env.EXPO_PUBLIC_VIBECODE_PROJECT_ID as string,
      storage: SecureStore,
    }),
  ],
});

// Log auth client configuration
console.log("🔐 [Auth Client] Initialized");
console.log(`   Base URL: ${backendURL}`);
console.log(`   Scheme: vibecode`);
console.log(`   Storage: SecureStore`);
