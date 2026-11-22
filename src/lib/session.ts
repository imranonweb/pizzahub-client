import { getSessionCookie } from "better-auth/cookies";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth, type PizzaHubRole, type SubscriptionPlan } from "./auth";
import {
  buildSignInRedirectUrl,
  getDashboardPathForRole,
  isValidPizzaHubRole,
} from "./auth-routes";

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
}

export interface ServerAuthSession {
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
  };
  user: ServerAuthUser;
}

export const getServerSession = cache(
  async (): Promise<ServerAuthSession | null> => {
    const requestHeaders = await headers();
    const rawSession = await auth.api.getSession({
      headers: requestHeaders,
    });

    if (!rawSession?.session || !rawSession?.user) {
      return null;
    }

    const userRecord = rawSession.user as typeof rawSession.user & {
      role?: unknown;
      isBlocked?: unknown;
      businessName?: unknown;
      subscriptionPlan?: unknown;
      subscriptionExpiresAt?: unknown;
    };

    const role: PizzaHubRole = isValidPizzaHubRole(userRecord.role)
      ? userRecord.role
      : "customer";

    const subscriptionPlan: SubscriptionPlan =
      userRecord.subscriptionPlan === "premium" ? "premium" : "free";

    const subscriptionExpiresAt =
      userRecord.subscriptionExpiresAt instanceof Date
        ? userRecord.subscriptionExpiresAt
        : typeof userRecord.subscriptionExpiresAt === "string"
          ? new Date(userRecord.subscriptionExpiresAt)
          : null;

    return {
      session: {
        id: rawSession.session.id,
        userId: rawSession.session.userId,
        expiresAt: new Date(rawSession.session.expiresAt),
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
