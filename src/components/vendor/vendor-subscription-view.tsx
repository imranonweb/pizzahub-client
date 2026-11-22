"use client";

import {
  AlertCircle,
  Check,
  Clock,
  CreditCard,
  Crown,
  FileText,
  Info,
  RotateCw,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
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

export function VendorSubscriptionView() {
  const user = useVendorProfile();
  const [data, setData] = useState<VendorMenuListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [billingPortalDialogOpen, setBillingPortalDialogOpen] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetchVendorMenuItems();
      setData(response);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load vendor menu capacity data.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const isBackendLive = data?.source === "live";
  const stats = data?.stats ?? createEmptyVendorMenuStats();
  const isPremium = user.subscriptionPlan === "premium";
  const premiumPrice = getPremiumMonthlyPrice();

  const activeUsageValue = isBackendLive ? stats.active : 0;
  const remainingFreeSlots = Math.max(
    0,
    FREE_PLAN_ACTIVE_ITEM_LIMIT - activeUsageValue,
  );
  const freeUsagePercent = isBackendLive
    ? Math.min(
        100,
        Math.round((activeUsageValue / FREE_PLAN_ACTIVE_ITEM_LIMIT) * 100),
      )
    : 0;

  const statusInfo = getSubscriptionStatusDetails({
    subscriptionPlan: user.subscriptionPlan,
    subscriptionExpiresAt: user.subscriptionExpiresAt,
  });

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
            Track active menu item capacity, manage your kitchen subscription,
            and review plan limits.
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

      {/* Honest Backend Integration Banner */}
      <Alert className="rounded-2xl border-primary/25 bg-accent/60">
        <Info className="size-4 text-primary" aria-hidden="true" />
        <AlertTitle className="font-semibold text-foreground">
          Express Server & Billing Status
        </AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground sm:text-sm">
          Subscription plan data is authenticated directly from your session.
          The Express server (
          <code className="font-mono text-xs text-foreground">
            D:\PizzaHub-server
          </code>
          ) currently operates in demo mode without payment or billing
          endpoints. Stripe checkout, automatic renewals, and customer portal
          actions are scheduled for <strong>Client Task 15</strong>.
        </AlertDescription>
      </Alert>

      {/* Error state if data fetch fails */}
      {errorMessage ? (
        <Alert variant="destructive" className="rounded-2xl p-4">
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertTitle>Could not load live listing metrics</AlertTitle>
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
                  : "Basic vendor kitchen tier with up to 3 active menu items visible to neighborhood customers."}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <div className="flex items-baseline gap-2">
                <span className="font-heading text-3xl font-extrabold text-foreground tabular-nums">
                  ${isPremium ? premiumPrice : FREE_PLAN_MONTHLY_PRICE}
                </span>
                <span className="text-xs text-muted-foreground">/ month</span>
                <span className="ml-auto text-xs font-medium text-muted-foreground">
                  {isPremium ? "(Configurable · Task 15)" : "Free forever tier"}
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
                        ? "Active (Awaiting Stripe portal)"
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
            {isPremium ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setBillingPortalDialogOpen(true)}
                className="h-10 flex-1 rounded-xl bg-background font-medium"
              >
                <CreditCard className="size-4" aria-hidden="true" />
                Manage Payment Details
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => setUpgradeDialogOpen(true)}
                className="h-10 flex-1 rounded-xl font-semibold shadow-xs"
              >
                <Crown className="size-4" aria-hidden="true" />
                Upgrade to Premium
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
                    {isBackendLive ? stats.active : "—"}
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
                    {isBackendLive
                      ? `${stats.active} / ${FREE_PLAN_ACTIVE_ITEM_LIMIT}`
                      : `0 / ${FREE_PLAN_ACTIVE_ITEM_LIMIT}`}
                  </span>
                </div>

                <Progress value={freeUsagePercent} className="h-2.5 bg-muted" />

                <div className="text-xs leading-relaxed text-muted-foreground">
                  {isBackendLive ? (
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

      {/* Honest Backend-Unavailable Sections */}
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
                Billing & Invoice History
              </h2>
              <p className="text-xs text-muted-foreground">
                Past receipts, monthly subscription statements, and VAT
                invoices.
              </p>
            </div>
          </div>

          {/* Honest unavailable state */}
          <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
            <Clock
              className="size-8 text-muted-foreground/60"
              aria-hidden="true"
            />
            <h3 className="mt-3 text-sm font-semibold text-foreground">
              No Billing History Available
            </h3>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
              Billing and invoice records will be generated automatically once
              Stripe subscription checkouts are introduced in Task 15.
            </p>
          </div>
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
                Payment Method & Renewal Controls
              </h2>
              <p className="text-xs text-muted-foreground">
                Card on file, renewal preferences, and cancellation controls.
              </p>
            </div>
          </div>

          {/* Honest unavailable state */}
          <div className="mt-6 space-y-4 rounded-2xl border border-border bg-muted/20 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground">Payment Method:</span>
              <span className="font-medium text-foreground">
                None on file (Stripe pending)
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground">Renewal Status:</span>
              <span className="font-medium text-foreground">
                {isPremium ? "Auto-renew monthly" : "Not applicable (Free)"}
              </span>
            </div>

            <div className="flex flex-wrap gap-2.5 border-t border-border/70 pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setBillingPortalDialogOpen(true)}
                className="h-9 rounded-xl bg-card text-xs font-medium"
              >
                Update Payment Method
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setBillingPortalDialogOpen(true)}
                className="h-9 rounded-xl bg-card text-xs font-medium text-destructive hover:bg-destructive/10"
              >
                Cancel Subscription
              </Button>
            </div>
          </div>
        </section>
      </div>

      {/* Upgrade Dialog */}
      <UpgradePlanDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        currentPlan={user.subscriptionPlan}
      />

      {/* Honest Stripe Billing Portal Pending Dialog */}
      <Dialog
        open={billingPortalDialogOpen}
        onOpenChange={setBillingPortalDialogOpen}
      >
        <DialogContent className="rounded-2xl p-6 sm:max-w-md">
          <DialogHeader>
            <div className="mb-1 inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CreditCard className="size-5" aria-hidden="true" />
            </div>
            <DialogTitle className="text-lg font-semibold">
              Stripe Customer Portal Pending
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
              Self-service subscription management, payment method updates, and
              cancellations will be powered securely by the Stripe Customer
              Billing Portal in Client Task 15.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">
              What will be available in Task 15:
            </p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Direct payment via credit card or digital wallets</li>
              <li>Downloadable PDF tax invoices and receipts</li>
              <li>One-click self-service cancellation or reactivation</li>
              <li>Webhook-driven status synchronization</li>
            </ul>
          </div>

          <DialogFooter className="-mx-6 -mb-6 mt-2 rounded-b-2xl px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setBillingPortalDialogOpen(false)}
              className="rounded-xl bg-card text-xs"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
