import { ApiClientError } from "./api-client";
import { clearAuthTokenCache, getAuthToken } from "./auth-client";

export const TOKEN_UNAVAILABLE_NOTICE =
  "Unable to verify your API session token. Please refresh or sign out and sign in again.";

/**
 * Resolves Bearer Authorization headers using the coalesced Better Auth JWT helper.
 */
export async function getBearerHeaders(): Promise<Record<
  string,
  string
> | null> {
  const token = await getAuthToken();
  if (!token) {
    return null;
  }
  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Formats an API error into a user-friendly notice while invalidating any stale
 * cached JWT on 401 responses so a retry issues a fresh token.
 */
export function resolveApiUnavailableNotice(
  error: unknown,
  unavailableFallback: string,
): string {
  if (error instanceof ApiClientError) {
    if (error.status === 401) {
      clearAuthTokenCache();
      return (
        error.message ||
        "Your API session token was rejected. Please refresh or sign in again."
      );
    }

    if (error.isRouteNotFound || error.isNetworkError) {
      return unavailableFallback;
    }

    return error.message || unavailableFallback;
  }

  return error instanceof Error && error.message
    ? error.message
    : unavailableFallback;
}
