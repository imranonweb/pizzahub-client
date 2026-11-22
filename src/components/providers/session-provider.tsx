"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
} from "react";
import type { PizzaHubRole, SubscriptionPlan } from "@/lib/auth";
import { authClient, useSession } from "@/lib/auth-client";
import { isValidPizzaHubRole } from "@/lib/auth-routes";

export interface ClientSessionUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: PizzaHubRole;
  isBlocked: boolean;
  businessName: string;
  subscriptionPlan: SubscriptionPlan;
  subscriptionExpiresAt: Date | null;
}

export interface SessionContextValue {
  session: NonNullable<ReturnType<typeof useSession>["data"]>["session"] | null;
  user: ClientSessionUser | null;
  role: PizzaHubRole | null;
  isBlocked: boolean;
  isLoading: boolean;
  isRefetching: boolean;
  isAuthenticated: boolean;
  error: ReturnType<typeof useSession>["error"];
  refreshSession: () => Promise<void>;
  signOut: (redirectTo?: string) => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data, isPending, isRefetching, error, refetch } = useSession();

  const normalizedUser = useMemo<ClientSessionUser | null>(() => {
    const rawUser = data?.user;
    if (!rawUser) {
      return null;
    }

    const extra = rawUser as typeof rawUser & {
      role?: unknown;
      isBlocked?: unknown;
      businessName?: unknown;
      subscriptionPlan?: unknown;
      subscriptionExpiresAt?: unknown;
    };

    const role: PizzaHubRole = isValidPizzaHubRole(extra.role)
      ? extra.role
      : "customer";

    const subscriptionPlan: SubscriptionPlan =
      extra.subscriptionPlan === "premium" ? "premium" : "free";

    const subscriptionExpiresAt =
      extra.subscriptionExpiresAt instanceof Date
        ? extra.subscriptionExpiresAt
        : typeof extra.subscriptionExpiresAt === "string"
          ? new Date(extra.subscriptionExpiresAt)
          : null;

    return {
      id: rawUser.id,
      name: rawUser.name,
      email: rawUser.email,
      image: rawUser.image,
      role,
      isBlocked: extra.isBlocked === true,
      businessName:
        typeof extra.businessName === "string" ? extra.businessName : "",
      subscriptionPlan,
      subscriptionExpiresAt,
    };
  }, [data?.user]);

  const refreshSession = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleSignOut = useCallback(
    async (redirectTo = "/sign-in") => {
      await authClient.signOut();
      await refetch();
      router.refresh();
      router.push(redirectTo);
    },
    [refetch, router],
  );

  const value = useMemo<SessionContextValue>(() => {
    const activeSession = data?.session ?? null;
    const isBlocked = normalizedUser?.isBlocked === true;
    const isAuthenticated = Boolean(
      activeSession && normalizedUser && !isBlocked,
    );

    return {
      session: activeSession,
      user: normalizedUser,
      role: normalizedUser?.role ?? null,
      isBlocked,
      isLoading: isPending,
      isRefetching,
      isAuthenticated,
      error,
      refreshSession,
      signOut: handleSignOut,
    };
  }, [
    data?.session,
    normalizedUser,
    isPending,
    isRefetching,
    error,
    refreshSession,
    handleSignOut,
  ]);

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useAuthSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useAuthSession must be used within a SessionProvider.");
  }
  return ctx;
}
