import { expoClient } from "@better-auth/expo/client";
import { emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

// Ensure the backend URL has the protocol prefix
const getBackendURL = () => {
  let url = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL as string;

  // If URL doesn't start with http:// or https://, add https://
  if (url && !url.startsWith("http://") && !url.startsWith("https://")) {
    console.warn(`⚠️ [Auth Client] Backend URL missing protocol: ${url}`);
    url = `https://${url}`;
    console.log(`✅ [Auth Client] Added https:// prefix: ${url}`);
  }

  console.log(`🔐 [Auth Client] Using backend URL: ${url}`);
  return url;
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
