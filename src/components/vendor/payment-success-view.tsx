"use client";

import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Crown,
  RotateCw,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuthSession } from "@/components/providers/session-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchVendorSubscription,
  type VendorSubscriptionSummaryResponse,
} from "@/lib/subscription-api";
import { getSubscriptionStatusDetails } from "@/lib/subscription-plans";
import { cn } from "@/lib/utils";

const MAX_AUTO_VERIFICATION_CHECKS = 3;
const RECHECK_INTERVAL_MS = 2500;

export function PaymentSuccessView({ sessionId }: { sessionId?: string }) {
  const { refreshSession } = useAuthSession();
  const [summary, setSummary] =
    useState<VendorSubscriptionSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [recheckAttempts, setRecheckAttempts] = useState(0);

  const verifyWithBackend = useCallback(
    async (isBackground = false) => {
      if (isBackground) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const res = await fetchVendorSubscription();
        setSummary(res);
        await refreshSession();
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [refreshSession],
  );

  useEffect(() => {
    void verifyWithBackend(false);
  }, [verifyWithBackend]);

  const subscription = summary?.subscription ?? null;
  const isBackendLive = summary?.source === "live";
  const isConfirmedPremium =
    isBackendLive &&
    subscription?.plan === "premium" &&
    !subscription.isExpired;

  // Poll briefly if webhook is still processing right after Stripe redirect
  useEffect(() => {
    if (
      isLoading ||
      !isBackendLive ||
      isConfirmedPremium ||
      recheckAttempts >= MAX_AUTO_VERIFICATION_CHECKS
    ) {
      return;
    }

    const timer = setTimeout(() => {
      setRecheckAttempts((n) => n + 1);
      void verifyWithBackend(true);
    }, RECHECK_INTERVAL_MS);

    return () => clearTimeout(timer);
  }, [
    isLoading,
    isBackendLive,
    isConfirmedPremium,
    recheckAttempts,
    verifyWithBackend,
  ]);

  const statusInfo = getSubscriptionStatusDetails({
    subscriptionPlan: subscription?.plan ?? "free",
    subscriptionExpiresAt: subscription?.subscriptionExpiresAt ?? null,
    subscriptionStatus: subscription?.status ?? null,
    cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd,
  });

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-14 sm:px-6 lg:py-20">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-xs sm:p-10">
        {isLoading ? (
          <div className="space-y-4 text-center" aria-busy="true">
            <Skeleton className="mx-auto size-14 rounded-2xl" />
            <Skeleton className="mx-auto h-7 w-64 rounded-lg" />
            <Skeleton className="mx-auto h-16 w-full max-w-md rounded-xl" />
          </div>
        ) : !isBackendLive ? (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertCircle className="size-7" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Unable to verify subscription status
              </h1>
              <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
                {summary?.notice ||
                  "We could not contact the PizzaHub backend to confirm your subscription."}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                type="button"
                disabled={isRefreshing}
                onClick={() => void verifyWithBackend(true)}
                className="h-10 rounded-xl px-5 font-semibold"
              >
                <RotateCw
                  className={cn("size-4", isRefreshing && "animate-spin")}
                  aria-hidden="true"
                />
                Retry Verification
              </Button>
              <Link
                href="/dashboard/vendor/subscription"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-10 rounded-xl bg-card px-5",
                )}
              >
                Go to Subscription Settings
              </Link>
            </div>
          </div>
        ) : isConfirmedPremium ? (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-600/15 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-8" aria-hidden="true" />
            </div>

            <div className="space-y-2">
              <Badge className="gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                <Crown className="size-3.5" aria-hidden="true" />
                {statusInfo.statusLabel}
              </Badge>
              <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                PizzaHub Premium Activated
              </h1>
              <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
                Your Stripe checkout payment has been confirmed by our webhook
                processor. Your kitchen now has unlimited active menu listings
                and Verified Premium storefront placement.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-muted/30 p-4 text-left text-xs space-y-2">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Active Plan</span>
                <span className="font-semibold text-foreground">
                  {statusInfo.planLabel}
                </span>
              </div>
              {statusInfo.formattedExpiry ? (
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">
                    Current Period Ends
                  </span>
                  <span className="font-semibold text-foreground">
                    {statusInfo.formattedExpiry}
                  </span>
                </div>
              ) : null}
              {sessionId ? (
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Checkout Ref</span>
                  <span className="truncate font-mono text-[11px] text-muted-foreground max-w-48">
                    {sessionId}
                  </span>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link
                href="/dashboard/vendor/menu"
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "h-10 rounded-xl px-5 font-semibold",
                )}
              >
                <UtensilsCrossed className="size-4" aria-hidden="true" />
                Manage Kitchen Menu
              </Link>
              <Link
                href="/dashboard/vendor/subscription"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-10 rounded-xl bg-card px-5",
                )}
              >
                View Subscription Details
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Clock className="size-7" aria-hidden="true" />
            </div>

            <div className="space-y-2">
              <Badge
                variant="secondary"
                className="rounded-full px-3 py-1 text-xs font-semibold"
              >
                Awaiting Webhook Confirmation
              </Badge>
              <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Confirming Your Subscription
              </h1>
              <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
                We received your return from Stripe Checkout. Premium access is
                activated automatically as soon as the backend receives
                Stripe&apos;s verified payment webhook.
              </p>
            </div>

            <Alert className="rounded-2xl border-border bg-muted/40 text-left">
              <AlertCircle className="size-4 text-primary" aria-hidden="true" />
              <AlertTitle className="text-xs font-semibold">
                Current Backend Plan: {statusInfo.planLabel} (
                {statusInfo.statusLabel})
              </AlertTitle>
              <AlertDescription className="text-xs text-muted-foreground">
                If your payment just completed, webhook delivery typically
                finishes within a few seconds. Click Refresh Status below to
                check again.
              </AlertDescription>
            </Alert>

            <div className="flex flex-wrap justify-center gap-3">
              <Button
                type="button"
                disabled={isRefreshing}
                onClick={() => void verifyWithBackend(true)}
                className="h-10 rounded-xl px-5 font-semibold"
              >
                <RotateCw
                  className={cn("size-4", isRefreshing && "animate-spin")}
                  aria-hidden="true"
                />
                {isRefreshing ? "Checking Status..." : "Refresh Status"}
              </Button>
              <Link
                href="/dashboard/vendor/subscription"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-10 rounded-xl bg-card px-5",
                )}
              >
                Back to Subscription Settings
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
