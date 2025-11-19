/**
 * API Interceptor - Global authentication error handler
 *
 * This module intercepts all API errors and handles 401s gracefully
 * by automatically clearing the session and redirecting to login.
 */

import { queryClient } from "@/lib/queryClient";
import { authClient } from "@/lib/authClient";

/**
 * Global 401 error handler
 * Call this during app initialization to set up global error handling
 */
export function setupAPIErrorInterceptor() {
  // Set up query error handler
  const originalDefaultErrorHandler = queryClient.getDefaultOptions().queries?.retry;

  queryClient.setDefaultOptions({
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 401 - sign out instead
        if (error?.status === 401 || error?.message?.includes("401")) {
          console.warn("🔐 [API] Detected 401 - clearing session");
          handleUnauthorized();
          return false;
        }

        // For other errors, use default retry logic (max 2 retries)
        return failureCount < 2;
      },
      // Stale time - data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // GC time - cached data is garbage collected after 10 minutes of inactivity
      gcTime: 10 * 60 * 1000,
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry on 401
        if (error?.status === 401 || error?.message?.includes("401")) {
          console.warn("🔐 [API] Detected 401 in mutation - clearing session");
          handleUnauthorized();
          return false;
        }

        // For other errors, retry once
        return failureCount < 1;
      },
    },
  });
}

/**
 * Handle unauthorized (401) response
 * Clears user session and redirects to login
 */
async function handleUnauthorized() {
  try {
    // Clear all queries to force refresh when user logs back in
    queryClient.clear();

    // Sign out the user
    await authClient.signOut();

    console.log("🔐 [API] User signed out due to 401 error");
  } catch (error) {
    console.error("❌ [API] Error handling 401:", error);
  }
}

/**
 * Export for use in error handlers
 */
export { handleUnauthorized };
