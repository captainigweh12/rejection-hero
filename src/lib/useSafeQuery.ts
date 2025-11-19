/**
 * Safe Query Hook - Prevents 401 errors by guarding queries with authentication
 *
 * This hook wraps React Query's useQuery and automatically disables the query
 * if the user is not authenticated, preventing 401 unauthorized errors.
 */

import { useQuery, type UseQueryOptions, type UseQueryResult } from "@tanstack/react-query";
import { useSession } from "@/lib/useSession";

interface SafeQueryOptions<TData, TError> extends Omit<UseQueryOptions<TData, TError>, "enabled"> {
  enabled?: boolean;
  requireAuth?: boolean; // Set to false to allow unauthenticated requests (default: true)
}

/**
 * Safe wrapper around useQuery that automatically guards with authentication
 *
 * Usage:
 * const { data } = useSafeQuery<ProfileResponse>({
 *   queryKey: ["profile"],
 *   queryFn: () => api.get("/api/profile"),
 *   requireAuth: true, // Default - only runs when authenticated
 * });
 */
export function useSafeQuery<
  TData = unknown,
  TError = Error,
>(
  options: SafeQueryOptions<TData, TError>
): UseQueryResult<TData, TError> {
  const { data: sessionData } = useSession();
  const { requireAuth = true, enabled = true, ...restOptions } = options;

  // Only enable query if:
  // 1. User is authenticated (if requireAuth is true)
  // 2. All other enabled conditions are met
  const shouldEnable = requireAuth ? !!sessionData?.user && enabled : enabled;

  return useQuery<TData, TError>({
    ...restOptions,
    enabled: shouldEnable,
  } as UseQueryOptions<TData, TError>);
}
