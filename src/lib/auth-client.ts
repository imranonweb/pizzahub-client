import { inferAdditionalFields, jwtClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

function normalizeOriginUrl(rawUrl?: string): string | undefined {
  const trimmed = rawUrl?.trim();
  if (!trimmed) {
    return undefined;
  }

  const withProtocol =
    trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;

  return withProtocol.replace(/\/+$/, "");
}

export function getAuthClientBaseUrl(): string {
  const envUrl = normalizeOriginUrl(process.env.NEXT_PUBLIC_BETTER_AUTH_URL);
  if (envUrl) {
    return envUrl;
  }

  if (typeof window !== "undefined") {
    return window.location.origin.replace(/\/+$/, "");
  }

  const vercelOrigin =
    normalizeOriginUrl(process.env.NEXT_PUBLIC_VERCEL_URL) ||
    normalizeOriginUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
    normalizeOriginUrl(process.env.VERCEL_URL);

  if (vercelOrigin) {
    return vercelOrigin;
  }

  return "http://localhost:3000";
}

export const authClient = createAuthClient({
  baseURL: getAuthClientBaseUrl(),
  plugins: [
    inferAdditionalFields({
      user: {
        role: {
          type: "string",
          required: false,
          defaultValue: "customer",
          input: true,
        },
        isBlocked: {
          type: "boolean",
          required: false,
          defaultValue: false,
          input: false,
        },
        businessName: {
          type: "string",
          required: false,
          defaultValue: "",
          input: true,
        },
        subscriptionPlan: {
          type: "string",
          required: false,
          defaultValue: "free",
          input: false,
        },
        subscriptionExpiresAt: {
          type: "date",
          required: false,
          defaultValue: null,
          input: false,
        },
      },
    }),
    jwtClient(),
  ],
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;

export async function signInWithGoogle(callbackURL = "/dashboard") {
  return authClient.signIn.social({
    provider: "google",
    callbackURL,
  });
}

let cachedToken: { value: string; expiresAtMs: number } | null = null;
let inFlightTokenRequest: Promise<string | null> | null = null;

function readJwtExpiryMs(token: string): number {
  const fallbackExpiry = Date.now() + 2 * 60_000;
  try {
    const parts = token.split(".");
    if (parts.length !== 3 || !parts[1]) {
      return fallbackExpiry;
    }
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const payload = JSON.parse(atob(padded)) as { exp?: unknown };
    if (typeof payload.exp === "number" && Number.isFinite(payload.exp)) {
      return payload.exp * 1000;
    }
  } catch {
    // Fall back to a conservative short TTL if payload decoding fails.
  }
  return fallbackExpiry;
}

export function clearAuthTokenCache(): void {
  cachedToken = null;
  inFlightTokenRequest = null;
}

export async function getAuthToken(options?: {
  forceRefresh?: boolean;
}): Promise<string | null> {
  if (!options?.forceRefresh && cachedToken) {
    // Keep a 45s safety margin before expiration so API calls never send an about-to-expire JWT.
    if (Date.now() + 45_000 < cachedToken.expiresAtMs) {
      return cachedToken.value;
    }
    cachedToken = null;
  }

  if (options?.forceRefresh) {
    cachedToken = null;
  }

  if (inFlightTokenRequest) {
    return inFlightTokenRequest;
  }

  inFlightTokenRequest = (async () => {
    try {
      const { data, error } = await authClient.token();
      if (error || !data?.token) {
        cachedToken = null;
        return null;
      }

      cachedToken = {
        value: data.token,
        expiresAtMs: readJwtExpiryMs(data.token),
      };
      return data.token;
    } catch {
      cachedToken = null;
      return null;
    } finally {
      inFlightTokenRequest = null;
    }
  })();

  return inFlightTokenRequest;
}
