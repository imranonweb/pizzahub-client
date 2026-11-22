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

export async function getAuthToken(): Promise<string | null> {
  const { data, error } = await authClient.token();
  if (error || !data?.token) {
    return null;
  }
  return data.token;
}
