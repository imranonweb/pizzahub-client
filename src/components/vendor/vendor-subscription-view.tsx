"use client";

import {
  AlertCircle,
  Check,
  Clock,
  CreditCard,
  Crown,
  ExternalLink,
  FileText,
  Loader2,
  RotateCw,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuthSession } from "@/components/providers/session-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import {
  createVendorBillingPortalSession,
  fetchVendorSubscription,
  formatCurrencyAmountFromCents,
  type VendorSubscriptionSummaryResponse,
  verifyVendorCheckoutSession,
} from "@/lib/subscription-api";
import {
  FREE_PLAN_ACTIVE_ITEM_LIMIT,
  FREE_PLAN_MONTHLY_PRICE,
  getPremiumMonthlyPrice,
  getSubscriptionStatusDetails,
} from "@/lib/subscription-plans";
import {
  createEmptyVendorMenuStats,
  fetchVendorMenuItems,
  type VendorMenuListResponse,
} from "@/lib/vendor-menu-api";
import { UpgradePlanDialog } from "./upgrade-plan-dialog";
import { useVendorProfile } from "./vendor-dashboard-shell";

function formatTxDate(iso: string | null): string {
  if (!iso) return "—";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

export function VendorSubscriptionView() {
  const user = useVendorProfile();
  const { refreshSession } = useAuthSession();

  const [menuData, setMenuData] = useState<VendorMenuListResponse | null>(null);
  const [subData, setSubData] =
    useState<VendorSubscriptionSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [menuRes, initialSubRes] = await Promise.all([
        fetchVendorMenuItems(),
        fetchVendorSubscription(),
      ]);
      let subRes = initialSubRes;
      if (subRes.source === "live" && subRes.subscription?.plan !== "premium") {
        const verified = await verifyVendorCheckoutSession();
        if (verified.reconciled) {
          subRes = await fetchVendorSubscription();
        }
      }
      setMenuData(menuRes);
      setSubData(subRes);
      if (subRes.source === "unavailable" && subRes.notice) {
        setErrorMessage(subRes.notice);
      }
      await refreshSession();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load vendor subscription data.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [refreshSession]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleOpenBillingPortal = async () => {
    if (isOpeningPortal) return;
    setIsOpeningPortal(true);
    try {
      const res = await createVendorBillingPortalSession();
      if (!res.ok || !res.url) {
        toast.add({
          title: "Billing Portal Unavailable",
          description: res.message,
          type: "warning",
        });
        setIsOpeningPortal(false);
        return;
      }

      window.location.assign(res.url);
    } catch (error) {
      toast.add({
        title: "Billing Portal Error",
        description:
          error instanceof Error
            ? error.message
            : "Unable to open Stripe Customer Portal.",
        type: "error",
      });
      setIsOpeningPortal(false);
    }
  };

  const isMenuLive = menuData?.source === "live";
  const liveSub = subData?.source === "live" ? subData.subscription : null;
  const isSubLive = liveSub !== null;
  const stats = menuData?.stats ?? createEmptyVendorMenuStats();

  const effectivePlan = liveSub ? liveSub.plan : user.subscriptionPlan;
  const effectiveExpiresAt = liveSub
    ? liveSub.subscriptionExpiresAt
    : user.subscriptionExpiresAt;
  const effectiveStatus = liveSub ? liveSub.status : null;
  const cancelAtPeriodEnd = liveSub ? liveSub.cancelAtPeriodEnd : false;
  const hasBillingCustomer = liveSub ? liveSub.hasBillingCustomer : false;

  const backendPremiumPlan = subData?.plans.find((p) => p.id === "premium");
  const premiumPrice =
    typeof backendPremiumPlan?.price === "number"
      ? backendPremiumPlan.price
      : getPremiumMonthlyPrice();

  const isPremium = effectivePlan === "premium";
  const activeUsageValue = isMenuLive ? stats.active : 0;
  const remainingFreeSlots = Math.max(
    0,
    FREE_PLAN_ACTIVE_ITEM_LIMIT - activeUsageValue,
  );
  const freeUsagePercent = isMenuLive
    ? Math.min(
        100,
        Math.round((activeUsageValue / FREE_PLAN_ACTIVE_ITEM_LIMIT) * 100),
      )
    : 0;

  const statusInfo = getSubscriptionStatusDetails({
    subscriptionPlan: effectivePlan,
    subscriptionExpiresAt: effectiveExpiresAt,
    subscriptionStatus: effectiveStatus,
    cancelAtPeriodEnd,
  });

  const transactions = subData?.recentTransactions ?? [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border/70 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-heading text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-3xl">
              Vendor Subscription & Capacity
            </h1>
            {isPremium ? (
              <Badge className="gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                <Crown className="size-3.5" aria-hidden="true" />
                Premium Plan
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              >
                <Sparkles
                  className="size-3.5 text-primary"
                  aria-hidden="true"
                />
                Free Kitchen Tier
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground sm:text-base">
            Track active menu item capacity, manage your Stripe billing
            subscription, and review transactions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={() => void loadData()}
            className="h-10 rounded-xl bg-card px-3.5 font-medium"
          >
            <RotateCw
              className={isLoading ? "size-4 animate-spin" : "size-4"}
              aria-hidden="true"
            />
            Refresh
          </Button>
          <Button
            render={<Link href="/pricing" />}
            variant="outline"
            size="sm"
            className="h-10 rounded-xl bg-card px-3.5 font-medium"
          >
            <Sparkles className="size-4 text-primary" aria-hidden="true" />
            Compare All Plans
          </Button>
        </div>
      </div>

      {/* Status-specific alerts */}
      {statusInfo.isPaymentFailed ? (
        <Alert variant="destructive" className="rounded-2xl p-4">
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertTitle>Subscription Payment Failed</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>
              We could not process your latest Premium renewal payment. Update
              your payment method in Stripe to restore unlimited listings.
            </span>
            {hasBillingCustomer ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isOpeningPortal}
                onClick={() => void handleOpenBillingPortal()}
                className="rounded-xl bg-background text-foreground"
              >
                Update Payment Method
              </Button>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : statusInfo.isCancelling ? (
        <Alert className="rounded-2xl border-amber-500/35 bg-amber-500/10">
          <Clock className="size-4 text-amber-600" aria-hidden="true" />
          <AlertTitle className="font-semibold text-foreground">
            Cancellation Scheduled
          </AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground sm:text-sm">
            Your Premium kitchen benefits remain active until{" "}
            <strong className="text-foreground">
              {statusInfo.formattedExpiry ?? "the end of the billing period"}
            </strong>
            . You can renew or re-activate anytime from the Stripe Billing
            Portal.
          </AlertDescription>
        </Alert>
      ) : statusInfo.isExpired ? (
        <Alert className="rounded-2xl border-border bg-muted/40">
          <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
          <AlertTitle className="font-semibold text-foreground">
            Premium Subscription Expired
          </AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground sm:text-sm">
            Your previous Premium period ended{" "}
            {statusInfo.formattedExpiry
              ? `on ${statusInfo.formattedExpiry}`
              : ""}
            . Your account is currently on the Free tier (max{" "}
            {FREE_PLAN_ACTIVE_ITEM_LIMIT} active items).
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Error state if subscription/menu fetch fails */}
      {errorMessage ? (
        <Alert variant="destructive" className="rounded-2xl p-4">
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertTitle>Subscription service notice</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>{errorMessage}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadData()}
              className="rounded-xl bg-background text-foreground"
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Plan Details & Capacity Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* CURRENT PLAN CARD */}
        <section
          aria-labelledby="current-plan-heading"
          className="flex flex-col justify-between gap-6 rounded-3xl border border-border bg-card p-6 shadow-2xs sm:p-7 lg:col-span-6"
        >
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Current Kitchen Plan
              </span>
              <Badge
                variant={statusInfo.badgeVariant}
                className="rounded-full px-3 py-1 text-xs font-semibold"
              >
                {statusInfo.statusLabel}
              </Badge>
            </div>

            <div className="space-y-1">
              <h2
                id="current-plan-heading"
                className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
              >
                {statusInfo.planLabel}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {isPremium
                  ? "Unlimited active menu listings with priority discovery placement and Verified Premium badge."
                  : `Basic vendor kitchen tier with up to ${FREE_PLAN_ACTIVE_ITEM_LIMIT} active menu items visible to neighborhood customers.`}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <div className="flex items-baseline gap-2">
                <span className="font-heading text-3xl font-extrabold text-foreground tabular-nums">
                  ${isPremium ? premiumPrice : FREE_PLAN_MONTHLY_PRICE}
                </span>
                <span className="text-xs text-muted-foreground">/ month</span>
                <span className="ml-auto text-xs font-medium text-muted-foreground">
                  {isPremium ? "Monthly Stripe billing" : "Free forever tier"}
                </span>
              </div>

              <div className="mt-4 space-y-2 border-t border-border/70 pt-3 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Billing Cycle</span>
                  <span className="font-medium text-foreground">
                    {isPremium ? "Monthly" : "None"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Expiration / Renewal Date</span>
                  <span className="font-medium text-foreground">
                    {statusInfo.formattedExpiry
                      ? statusInfo.formattedExpiry
                      : isPremium
                        ? "Active"
                        : "Ongoing · No expiration"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Storefront Status</span>
                  <span className="font-medium text-foreground">
                    {isPremium
                      ? "Verified Premium Kitchen"
                      : "Standard Kitchen"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-border/70 pt-5">
            {isPremium && !cancelAtPeriodEnd ? (
              hasBillingCustomer ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isOpeningPortal}
                  onClick={() => void handleOpenBillingPortal()}
                  className="h-10 flex-1 rounded-xl bg-background font-medium"
                >
                  {isOpeningPortal ? (
                    <>
                      <Loader2
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                      Opening Portal...
                    </>
                  ) : (
                    <>
                      <CreditCard className="size-4" aria-hidden="true" />
                      Manage Billing in Stripe
                      <ExternalLink className="size-3.5" aria-hidden="true" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  disabled
                  className="h-10 flex-1 rounded-xl bg-muted text-muted-foreground"
                >
                  Active Premium Account
                </Button>
              )
            ) : (
              <Button
                type="button"
                onClick={() => setUpgradeDialogOpen(true)}
                className="h-10 flex-1 rounded-xl font-semibold shadow-xs"
              >
                <Crown className="size-4" aria-hidden="true" />
                {cancelAtPeriodEnd
                  ? "Renew Premium Plan"
                  : "Upgrade to Premium"}
              </Button>
            )}

            <Button
              render={<Link href="/pricing" />}
              variant="outline"
              className="h-10 rounded-xl bg-card px-4 font-medium"
            >
              Compare Plans
            </Button>
          </div>
        </section>

        {/* ACTIVE LISTING CAPACITY CARD */}
        <section
          aria-labelledby="capacity-heading"
          className="flex flex-col justify-between gap-6 rounded-3xl border border-border bg-card p-6 shadow-2xs sm:p-7 lg:col-span-6"
        >
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Listing Usage & Capacity
              </span>
              {isPremium ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <Check className="size-3.5" aria-hidden="true" />
                  Unlimited Cap
                </span>
              ) : (
                <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                  Limit: {FREE_PLAN_ACTIVE_ITEM_LIMIT} active items
                </span>
              )}
            </div>

            <div className="space-y-1">
              <h2
                id="capacity-heading"
                className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
              >
                Active Menu Slots
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Only approved pizzas in Active status appear on the public
                storefront. Inactive pizzas remain safely saved in your kitchen
                catalog.
              </p>
            </div>

            {isPremium ? (
              <div className="space-y-4 rounded-2xl border border-primary/30 bg-primary/5 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">
                    Premium Active Listings
                  </span>
                  <Badge className="rounded-full bg-primary px-2.5 py-0.5 text-xs text-primary-foreground">
                    Unlimited
                  </Badge>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Your kitchen has no cap on active approved pizzas. You
                  currently have{" "}
                  <strong className="text-foreground tabular-nums">
                    {isMenuLive ? stats.active : "—"}
                  </strong>{" "}
                  active dishes visible to customers on the public menu.
                </p>
              </div>
            ) : (
              <div className="space-y-4 rounded-2xl border border-border bg-muted/30 p-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">
                    Active capacity usage
                  </span>
                  <span className="font-heading text-base font-bold text-foreground tabular-nums">
                    {isMenuLive
                      ? `${stats.active} / ${FREE_PLAN_ACTIVE_ITEM_LIMIT}`
                      : `0 / ${FREE_PLAN_ACTIVE_ITEM_LIMIT}`}
                  </span>
                </div>

                <Progress value={freeUsagePercent} className="h-2.5 bg-muted" />

                <div className="text-xs leading-relaxed text-muted-foreground">
                  {isMenuLive ? (
                    remainingFreeSlots > 0 ? (
                      <p>
                        You have{" "}
                        <strong className="text-foreground">
                          {remainingFreeSlots}
                        </strong>{" "}
                        active {remainingFreeSlots === 1 ? "slot" : "slots"}{" "}
                        remaining. You can deactivate any active dish to make
                        room for new specialties.
                      </p>
                    ) : (
                      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-900 dark:text-amber-200">
                        <p className="font-semibold">
                          Free plan active limit reached (3/3)
                        </p>
                        <p className="mt-0.5 text-xs opacity-90">
                          Deactivate an active dish on your menu manager to
                          activate another, or upgrade to Premium for unlimited
                          active listings.
                        </p>
                      </div>
                    )
                  ) : (
                    <p>
                      Free vendor accounts can keep up to{" "}
                      {FREE_PLAN_ACTIVE_ITEM_LIMIT} active approved menu items
                      simultaneously.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-border/70 pt-5">
            <Button
              render={<Link href="/dashboard/vendor/menu" />}
              variant="outline"
              className="h-10 flex-1 rounded-xl bg-card font-medium"
            >
              <UtensilsCrossed className="size-4" aria-hidden="true" />
              Manage Menu Items
            </Button>
            <Button
              render={<Link href="/dashboard/vendor/add" />}
              className="h-10 rounded-xl px-4 font-semibold"
            >
              Add Pizza
            </Button>
          </div>
        </section>
      </div>

      {/* Live Billing History & Stripe Customer Portal Controls */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* BILLING & INVOICE HISTORY */}
        <section
          aria-labelledby="history-heading"
          className="rounded-3xl border border-border bg-card p-6 shadow-2xs sm:p-7"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <FileText className="size-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="history-heading"
                className="font-heading text-lg font-semibold text-foreground"
              >
                Billing & Transaction History
              </h2>
              <p className="text-xs text-muted-foreground">
                Recent Stripe checkout events, renewals, and subscription
                updates.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="mt-6 space-y-3">
              <Skeleton className="h-14 rounded-xl" />
              <Skeleton className="h-14 rounded-xl" />
            </div>
          ) : !isSubLive ? (
            <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
              <AlertCircle
                className="size-8 text-muted-foreground/60"
                aria-hidden="true"
              />
              <h3 className="mt-3 text-sm font-semibold text-foreground">
                Billing History Unavailable
              </h3>
              <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
                Could not retrieve transaction history from the server right
                now.
              </p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
              <Clock
                className="size-8 text-muted-foreground/60"
                aria-hidden="true"
              />
              <h3 className="mt-3 text-sm font-semibold text-foreground">
                No Billing Transactions Yet
              </h3>
              <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
                Your Stripe payment confirmations and monthly renewal records
                will appear here once you subscribe.
              </p>
            </div>
          ) : (
            <div className="mt-6 divide-y divide-border/70 rounded-2xl border border-border bg-background/60">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold capitalize text-foreground">
                        {tx.plan} Plan
                      </span>
                      <Badge
                        variant={
                          tx.status === "paid" || tx.status === "active"
                            ? "default"
                            : tx.status === "failed"
                              ? "destructive"
                              : "secondary"
                        }
                        className="rounded-full px-2 py-0 text-[10px] capitalize"
                      >
                        {tx.status}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {formatTxDate(tx.createdAt)}
                      {tx.stripeSubscriptionId
                        ? ` · Sub ${tx.stripeSubscriptionId.slice(0, 14)}...`
                        : ""}
                    </p>
                  </div>

                  <span className="font-heading text-sm font-bold text-foreground tabular-nums">
                    {formatCurrencyAmountFromCents(tx.amount, tx.currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* PAYMENT METHOD & CANCELLATION */}
        <section
          aria-labelledby="payment-controls-heading"
          className="rounded-3xl border border-border bg-card p-6 shadow-2xs sm:p-7"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <CreditCard className="size-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="payment-controls-heading"
                className="font-heading text-lg font-semibold text-foreground"
              >
                Payment Method & Portal Controls
              </h2>
              <p className="text-xs text-muted-foreground">
                Card management, invoices, and cancellation via Stripe Customer
                Portal.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4 rounded-2xl border border-border bg-muted/20 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground">
                Stripe Billing Profile:
              </span>
              <span className="font-medium text-foreground">
                {hasBillingCustomer
                  ? "Connected to Stripe"
                  : "Created on first upgrade"}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground">Renewal Status:</span>
              <span className="font-medium text-foreground">
                {cancelAtPeriodEnd
                  ? "Ends at billing period close"
                  : isPremium
                    ? "Auto-renews monthly"
                    : "Not applicable (Free)"}
              </span>
            </div>

            <div className="flex flex-wrap gap-2.5 border-t border-border/70 pt-4">
              {hasBillingCustomer ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isOpeningPortal}
                  onClick={() => void handleOpenBillingPortal()}
                  className="h-9 rounded-xl bg-card text-xs font-medium"
                >
                  {isOpeningPortal ? (
                    <>
                      <Loader2
                        className="size-3.5 animate-spin"
                        aria-hidden="true"
                      />
                      Opening Stripe Portal...
                    </>
                  ) : (
                    <>
                      <CreditCard className="size-3.5" aria-hidden="true" />
                      Open Stripe Customer Portal
                      <ExternalLink className="size-3" aria-hidden="true" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setUpgradeDialogOpen(true)}
                  className="h-9 rounded-xl text-xs font-semibold"
                >
                  <Crown className="size-3.5" aria-hidden="true" />
                  Upgrade via Stripe Checkout
                </Button>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Upgrade Dialog */}
      <UpgradePlanDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        currentPlan={effectivePlan}
        cancelAtPeriodEnd={cancelAtPeriodEnd}
        backendPremiumPrice={premiumPrice}
      />
    </div>
  );
}
