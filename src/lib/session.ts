import { getSessionCookie } from "better-auth/cookies";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import {
  getAuth,
  type PizzaHubRole,
  resetAuthInstance,
  type SubscriptionPlan,
} from "./auth";
import {
  buildSignInRedirectUrl,
  getDashboardPathForRole,
  isValidPizzaHubRole,
} from "./auth-routes";
import { getMongoClientPromise, resetMongoCache } from "./mongodb";

export interface ServerAuthUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: PizzaHubRole;
  isBlocked: boolean;
  businessName: string;
  subscriptionPlan: SubscriptionPlan;
  subscriptionExpiresAt: Date | null;
  emailVerified: boolean;
  createdAt: Date | null;
}

export interface ServerAuthSession {
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
  };
  user: ServerAuthUser;
}

function toValidDate(raw: unknown): Date | null {
  if (raw instanceof Date) {
    return Number.isNaN(raw.getTime()) ? null : raw;
  }
  if (typeof raw === "string" || typeof raw === "number") {
    const trimmed = typeof raw === "string" ? raw.trim() : raw;
    if (trimmed === "") {
      return null;
    }
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

async function fetchSessionWithRetry(requestHeaders: Headers) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await getMongoClientPromise();
      return await getAuth().api.getSession({
        headers: requestHeaders,
      });
    } catch (error) {
      if (attempt === 0) {
        resetMongoCache();
        resetAuthInstance();
        continue;
      }
      console.error(
        "[PizzaHub Session] Failed to resolve server session:",
        error,
      );
      return null;
    }
  }
  return null;
}

export const getServerSession = cache(
  async (): Promise<ServerAuthSession | null> => {
    const requestHeaders = await headers();
    const rawSession = await fetchSessionWithRetry(requestHeaders);

    if (!rawSession?.session || !rawSession?.user) {
      return null;
    }

    const userRecord = rawSession.user as typeof rawSession.user & {
      role?: unknown;
      isBlocked?: unknown;
      businessName?: unknown;
      subscriptionPlan?: unknown;
      subscriptionExpiresAt?: unknown;
      emailVerified?: unknown;
      createdAt?: unknown;
    };

    const role: PizzaHubRole = isValidPizzaHubRole(userRecord.role)
      ? userRecord.role
      : "customer";

    const subscriptionPlan: SubscriptionPlan =
      userRecord.subscriptionPlan === "premium" ? "premium" : "free";

    const subscriptionExpiresAt = toValidDate(userRecord.subscriptionExpiresAt);
    const createdAt = toValidDate(userRecord.createdAt);
    const sessionExpiresAt =
      toValidDate(rawSession.session.expiresAt) ??
      new Date(Date.now() + 60_000);

    return {
      session: {
        id: rawSession.session.id,
        userId: rawSession.session.userId,
        expiresAt: sessionExpiresAt,
      },
      user: {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        image: userRecord.image ?? null,
        role,
        isBlocked: userRecord.isBlocked === true,
        businessName:
          typeof userRecord.businessName === "string"
            ? userRecord.businessName
            : "",
        subscriptionPlan,
        subscriptionExpiresAt,
        emailVerified: userRecord.emailVerified === true,
        createdAt,
      },
    };
  },
);

export async function requireAuth(
  returnPath = "/dashboard",
): Promise<ServerAuthSession> {
  const requestHeaders = await headers();
  const authSession = await getServerSession();

  if (!authSession) {
    const hasSessionCookie = Boolean(getSessionCookie(requestHeaders));
    redirect(
      buildSignInRedirectUrl(
        returnPath,
        hasSessionCookie ? "session-expired" : undefined,
      ),
    );
  }

  if (authSession.user.isBlocked) {
    redirect(buildSignInRedirectUrl(undefined, "blocked"));
  }

  return authSession;
}

export async function requireRole(
  allowedRoles: readonly PizzaHubRole[],
  returnPath: string,
): Promise<ServerAuthSession> {
  const authSession = await requireAuth(returnPath);

  if (!allowedRoles.includes(authSession.user.role)) {
    redirect(getDashboardPathForRole(authSession.user.role));
  }

  return authSession;
}

export async function resolveDashboardRedirect(): Promise<never> {
  const authSession = await requireAuth("/dashboard");
  redirect(getDashboardPathForRole(authSession.user.role));
}
