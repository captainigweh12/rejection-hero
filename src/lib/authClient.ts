import { expoClient } from "@better-auth/expo/client";
import { emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

// Ensure the backend URL has the protocol prefix
// IMPORTANT: Always use production URL for authClient to prevent OAuth redirect_uri_mismatch errors
// OAuth redirect URI must match what's configured in Google Console (production URL)
const getBackendURL = () => {
  const PRODUCTION_URL = "https://api.rejectionhero.com";

  // Always use production URL for auth client to ensure OAuth works correctly
  // The redirect URI must match what's configured in Google Cloud Console
  // Even if API calls use sandbox URL, OAuth must use production
  console.log(`🔐 [Auth Client] Using production URL for OAuth: ${PRODUCTION_URL}`);
  console.log(`⚠️  [Auth Client] Note: OAuth requires production URL to match Google Console configuration`);
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
