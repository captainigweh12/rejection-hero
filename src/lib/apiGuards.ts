/**
 * API Guards - Prevent unauthorized API calls
 *
 * This module provides utilities to ensure API requests are only made
 * when the user is properly authenticated. It prevents 401 errors by
 * checking auth status before making requests.
 */

import { useSession } from "@/lib/useSession";

/**
 * Hook to check if user is authenticated
 * Returns true only if user has a valid session
 */
export function useIsAuthenticated() {
  const { data: sessionData, isPending } = useSession();
  return {
    isAuthenticated: !!sessionData?.user,
    isLoading: isPending,
    user: sessionData?.user,
  };
}

/**
 * Hook to guard a query with authentication
 * Returns auth status and should be used in query enabled conditions
 */
export function useAuthGuard() {
  const { isAuthenticated, isLoading } = useIsAuthenticated();

  return {
    /**
     * Use this in the `enabled` condition of useQuery
     * Example: enabled: useAuthGuard().canMakeRequest
     */
    canMakeRequest: isAuthenticated && !isLoading,
    isAuthReady: !isLoading,
    isAuthenticated,
  };
}

/**
 * Type-safe query enabled condition
 * Returns true only when user is authenticated AND not loading
 */
export function createAuthGuardedEnabled(
  sessionData: any,
  additionalCondition: boolean = true
): boolean {
  return !!sessionData?.user && additionalCondition;
}
