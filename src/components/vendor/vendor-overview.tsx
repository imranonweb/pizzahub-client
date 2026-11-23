"use client";

import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Crown,
  Info,
  PlusCircle,
  RotateCw,
  ShoppingBag,
  Sparkles,
  Store,
  UtensilsCrossed,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { StatusDistributionChart } from "@/components/dashboard/status-distribution-chart";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createEmptyVendorMenuStats,
  FREE_PLAN_ACTIVE_ITEM_LIMIT,
  fetchVendorMenuItems,
  type VendorMenuListResponse,
} from "@/lib/vendor-menu-api";
import {
  fetchVendorOrders,
  type VendorOrdersListResponse,
} from "@/lib/vendor-order-api";
import { UpgradePlanDialog } from "./upgrade-plan-dialog";
import { useVendorProfile } from "./vendor-dashboard-shell";
import { VendorStatusBadge } from "./vendor-status-badge";

function formatShortDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime()) || parsed.getTime() === 0) {
    return "Date unavailable";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

export function VendorOverview() {
  const user = useVendorProfile();
  const [data, setData] = useState<VendorMenuListResponse | null>(null);
  const [ordersData, setOrdersData] = useState<VendorOrdersListResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const loadOverview = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [menuResponse, ordersResponse] = await Promise.all([
        fetchVendorMenuItems(),
        fetchVendorOrders({ limit: 100 }),
      ]);
      setData(menuResponse);
      setOrdersData(ordersResponse);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load vendor dashboard data.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const isBackendLive = data?.source === "live";
  const isOrdersLive = ordersData?.source === "live";
  const stats = data?.stats ?? createEmptyVendorMenuStats();
  const vendorOrders = ordersData?.orders ?? [];
  const pendingCustomerOrdersCount = vendorOrders.filter(
    (o) => o.status === "pending",
  ).length;
  const acceptedOrdersCount = vendorOrders.filter((o) =>
    [
      "accepted",
      "preparing",
      "ready",
      "out_for_delivery",
      "delivered",
    ].includes(o.status),
  ).length;
  const inKitchenOrdersCount = vendorOrders.filter((o) =>
    ["accepted", "preparing"].includes(o.status),
  ).length;
  const readyOrDeliveredOrdersCount = vendorOrders.filter((o) =>
    ["ready", "out_for_delivery", "delivered"].includes(o.status),
  ).length;
  const declinedOrCancelledOrdersCount = vendorOrders.filter((o) =>
    ["rejected", "cancelled"].includes(o.status),
  ).length;
  const isPremium = user.subscriptionPlan === "premium";

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

  const recentItems = isBackendLive
    ? [...data.items]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 5)
    : [];

  const statCards = [
    {
      label: "Total Menu Items",
      value: isBackendLive ? String(stats.total) : "—",
      caption: isBackendLive
        ? "Listings across all statuses"
        : "Awaiting vendor API",
      icon: UtensilsCrossed,
    },
    {
      label: "Active Items",
      value: isBackendLive ? String(stats.active) : "—",
      caption: isBackendLive
        ? "Approved and visible on /menu"
        : "Awaiting vendor API",
      icon: CheckCircle2,
    },
    {
      label: "Pending Approvals",
      value: isBackendLive ? String(stats.pending) : "—",
      caption: isBackendLive
        ? "Queued for admin review"
        : "Awaiting vendor API",
      icon: Clock,
    },
    {
      label: "Rejected Items",
      value: isBackendLive ? String(stats.rejected) : "—",
      caption: isBackendLive
        ? "Needs update before approval"
        : "Awaiting vendor API",
      icon: XCircle,
    },
    {
      label: "Pending Orders",
      value: isOrdersLive ? String(pendingCustomerOrdersCount) : "—",
      caption: isOrdersLive
        ? "Customer orders awaiting response"
        : "Awaiting orders API",
      icon: ShoppingBag,
    },
    {
      label: "Accepted Orders",
      value: isOrdersLive ? String(acceptedOrdersCount) : "—",
      caption: isOrdersLive
        ? "Accepted, preparing, or completed"
        : "Awaiting orders API",
      icon: ClipboardCheck,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 border-b border-border/70 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="font-heading text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-3xl">
            Welcome back, {user.name}
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            {user.businessName
              ? `${user.businessName} · Manage pizza listings, approvals, and plan limits.`
              : "Manage your kitchen's pizza listings, approval status, and active item limits."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            render={<Link href="/dashboard/vendor/menu" />}
            variant="outline"
            className="h-10 rounded-xl bg-card px-4 font-medium"
          >
            Manage Listings
          </Button>
          <Button
            render={<Link href="/dashboard/vendor/add" />}
            className="h-10 rounded-xl px-4 font-semibold"
          >
            <PlusCircle className="size-4" aria-hidden="true" />
            Add Pizza
          </Button>
        </div>
      </div>

      {data?.source === "unavailable" && data.notice ? (
        <Alert className="rounded-2xl bg-accent/65 p-4">
          <Info className="size-4 text-primary" aria-hidden="true" />
          <AlertTitle>Vendor Menu Service Notice</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>{data.notice}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadOverview()}
              className="rounded-xl bg-card"
            >
              <RotateCw className="size-3.5" aria-hidden="true" />
              Retry API
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {ordersData?.source === "unavailable" && ordersData.notice ? (
        <Alert className="rounded-2xl bg-accent/65 p-4">
          <Info className="size-4 text-primary" aria-hidden="true" />
          <AlertTitle>Vendor Orders Service Notice</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>{ordersData.notice}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadOverview()}
              className="rounded-xl bg-card"
            >
              <RotateCw className="size-3.5" aria-hidden="true" />
              Retry API
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {errorMessage ? (
        <Alert variant="destructive" className="rounded-2xl p-4">
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertTitle>Could not load menu summary</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>{errorMessage}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadOverview()}
              className="rounded-xl bg-background text-foreground"
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <section
        aria-label="Menu and order summary metrics"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {isLoading
          ? statCards.map((card) => (
              <Skeleton
                key={card.label}
                className="h-32 rounded-2xl border border-border"
              />
            ))
          : statCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.16,
                    delay: index * 0.02,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      {card.label}
                    </span>
                    <span className="flex size-8 items-center justify-center rounded-xl bg-muted text-primary">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="mt-4 space-y-1">
                    <p className="font-heading text-3xl font-bold tracking-tight text-foreground tabular-nums">
                      {card.value}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {card.caption}
                    </p>
                  </div>
                </motion.div>
              );
            })}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <StatusDistributionChart
          title="Menu Status Breakdown"
          description="Live moderation and active status across your pizza listings."
          emptyMessage="Add your first pizza item to see menu distribution."
          segments={[
            {
              label: "Active / Approved",
              value: isBackendLive ? stats.active : 0,
              colorClass: "bg-chart-3",
            },
            {
              label: "Pending Review",
              value: isBackendLive ? stats.pending : 0,
              colorClass: "bg-chart-4",
            },
            {
              label: "Inactive",
              value: isBackendLive ? stats.inactive : 0,
              colorClass: "bg-chart-5",
            },
            {
              label: "Rejected",
              value: isBackendLive ? stats.rejected : 0,
              colorClass: "bg-chart-1",
            },
          ]}
        />

        <StatusDistributionChart
          title="Incoming Order Status"
          description="Customer order fulfillment pipeline for your kitchen."
          emptyMessage="No incoming customer orders recorded yet."
          segments={[
            {
              label: "Pending Response",
              value: isOrdersLive ? pendingCustomerOrdersCount : 0,
              colorClass: "bg-chart-4",
            },
            {
              label: "Accepted / Preparing",
              value: isOrdersLive ? inKitchenOrdersCount : 0,
              colorClass: "bg-chart-2",
            },
            {
              label: "Ready / Delivered",
              value: isOrdersLive ? readyOrDeliveredOrdersCount : 0,
              colorClass: "bg-chart-3",
            },
            {
              label: "Rejected / Cancelled",
              value: isOrdersLive ? declinedOrCancelledOrdersCount : 0,
              colorClass: "bg-chart-1",
            },
          ]}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <section
          aria-labelledby="vendor-plan-heading"
          className="flex flex-col justify-between gap-5 rounded-2xl border border-border bg-card p-6 lg:col-span-7"
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <h2
                  id="vendor-plan-heading"
                  className="font-heading text-lg font-semibold text-foreground"
                >
                  Subscription & Active Listing Capacity
                </h2>
                <p className="text-sm text-muted-foreground">
                  Active approved items determine how many dishes customers can
                  currently browse.
                </p>
              </div>

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
                  Free Plan
                </Badge>
              )}
            </div>

            {isPremium ? (
              <div className="rounded-xl border border-border bg-muted/35 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-medium text-foreground">
                    Unlimited active menu listings
                  </span>
                  <span className="font-mono text-xs text-muted-foreground tabular-nums">
                    {isBackendLive
                      ? `${stats.active} active now`
                      : "Live count awaiting API"}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {user.subscriptionExpiresAt
                    ? `Active through ${formatShortDate(user.subscriptionExpiresAt)}.`
                    : "Your kitchen can publish unlimited approved items to the public menu."}
                </p>
              </div>
            ) : (
              <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-medium text-foreground">
                    Active menu slots
                  </span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {isBackendLive
                      ? `${stats.active} / ${FREE_PLAN_ACTIVE_ITEM_LIMIT} used`
                      : `Max ${FREE_PLAN_ACTIVE_ITEM_LIMIT} active items`}
                  </span>
                </div>

                <Progress value={freeUsagePercent} />

                <p className="text-xs leading-relaxed text-muted-foreground">
                  {isBackendLive ? (
                    remainingFreeSlots > 0 ? (
                      <>
                        You have{" "}
                        <strong className="text-foreground">
                          {remainingFreeSlots}
                        </strong>{" "}
                        active {remainingFreeSlots === 1 ? "slot" : "slots"}{" "}
                        remaining on the Free plan. You can deactivate an active
                        dish at any time to rotate your menu.
                      </>
                    ) : (
                      <>
                        Free plan active limit ({FREE_PLAN_ACTIVE_ITEM_LIMIT}/
                        {FREE_PLAN_ACTIVE_ITEM_LIMIT}) reached. Deactivate an
                        existing active item before activating another, or
                        upgrade to Premium.
                      </>
                    )
                  ) : (
                    <>
                      Free vendor accounts can keep up to{" "}
                      {FREE_PLAN_ACTIVE_ITEM_LIMIT} active approved menu items
                      simultaneously. Usage updates once live vendor data
                      connects.
                    </>
                  )}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
            <Button
              render={<Link href="/menu" />}
              variant="outline"
              size="sm"
              className="h-9 rounded-xl bg-background px-3.5"
            >
              <Store className="size-4" aria-hidden="true" />
              View Public Menu
            </Button>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                render={<Link href="/dashboard/vendor/subscription" />}
                variant="outline"
                size="sm"
                className="h-9 rounded-xl bg-card px-3.5 text-xs font-medium"
              >
                Plan Details
              </Button>
              {!isPremium ? (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => setUpgradeOpen(true)}
                  className="h-9 rounded-xl px-4 font-semibold text-xs shadow-xs"
                >
                  <Crown className="size-3.5" aria-hidden="true" />
                  Upgrade to Premium
                </Button>
              ) : null}
            </div>
          </div>
        </section>

        <section
          aria-labelledby="approval-workflow-heading"
          className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-6 lg:col-span-5"
        >
          <div className="space-y-4">
            <div className="space-y-1">
              <h2
                id="approval-workflow-heading"
                className="font-heading text-lg font-semibold text-foreground"
              >
                Approval Workflow
              </h2>
              <p className="text-sm text-muted-foreground">
                Every newly created dish goes through platform moderation before
                appearing to customers.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start justify-between gap-3 rounded-xl border border-border/80 bg-background p-3">
                <VendorStatusBadge status="pending" />
                <p className="text-right text-muted-foreground">
                  Assigned automatically on creation until an admin reviews.
                </p>
              </div>
              <div className="flex items-start justify-between gap-3 rounded-xl border border-border/80 bg-background p-3">
                <VendorStatusBadge status="approved" compact />
                <p className="text-right text-muted-foreground">
                  Live on the public menu and counted toward active slots.
                </p>
              </div>
              <div className="flex items-start justify-between gap-3 rounded-xl border border-border/80 bg-background p-3">
                <VendorStatusBadge status="inactive" />
                <p className="text-right text-muted-foreground">
                  Paused by you to free an active slot on Free plan.
                </p>
              </div>
              <div className="flex items-start justify-between gap-3 rounded-xl border border-border/80 bg-background p-3">
                <VendorStatusBadge status="rejected" />
                <p className="text-right text-muted-foreground">
                  Declined during review; cannot be self-activated.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section
        aria-labelledby="recent-activity-heading"
        className="rounded-2xl border border-border bg-card p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-4">
          <div className="space-y-0.5">
            <h2
              id="recent-activity-heading"
              className="font-heading text-lg font-semibold text-foreground"
            >
              Recent Menu Activity
            </h2>
            <p className="text-sm text-muted-foreground">
              Latest menu items submitted under your kitchen profile.
            </p>
          </div>
          <Button
            render={<Link href="/dashboard/vendor/menu" />}
            variant="ghost"
            size="sm"
            className="rounded-xl text-primary hover:text-primary"
          >
            View all items
          </Button>
        </div>

        {isLoading ? (
          <div className="mt-4 space-y-3">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
        ) : !isBackendLive ? (
          <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
            <p className="font-heading text-base font-semibold text-foreground">
              No live menu activity yet
            </p>
            <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
              Unable to reach the vendor menu API right now. Retry or navigate
              to Menu Manager once the backend server is reachable.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2.5">
              <Button
                render={<Link href="/dashboard/vendor/add" />}
                size="sm"
                className="h-9 rounded-xl px-4 font-medium"
              >
                <PlusCircle className="size-4" aria-hidden="true" />
                Open Add Pizza Form
              </Button>
              <Button
                render={<Link href="/dashboard/vendor/menu" />}
                variant="outline"
                size="sm"
                className="h-9 rounded-xl bg-card px-4"
              >
                Open Menu Manager
              </Button>
            </div>
          </div>
        ) : recentItems.length === 0 ? (
          <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
            <p className="font-heading text-base font-semibold text-foreground">
              Your kitchen menu is empty
            </p>
            <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
              Create your first pizza listing so customers can discover your
              kitchen after admin approval.
            </p>
            <Button
              render={<Link href="/dashboard/vendor/add" />}
              size="sm"
              className="mt-4 h-9 rounded-xl px-4 font-medium"
            >
              <PlusCircle className="size-4" aria-hidden="true" />
              Add First Pizza
            </Button>
          </div>
        ) : (
          <div className="mt-4 divide-y divide-border/70">
            {recentItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-4 py-3.5"
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                    <Image
                      src={item.images[0] || "/images/auth-pizza-hero.jpg"}
                      alt={item.itemName}
                      fill
                      unoptimized
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {item.itemName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.category} · ${item.price.toFixed(2)} ·{" "}
                      {formatShortDate(item.createdAt)}
                    </p>
                  </div>
                </div>

                <VendorStatusBadge status={item.status} compact />
              </div>
            ))}
          </div>
        )}
      </section>

      <UpgradePlanDialog
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        currentPlan={user.subscriptionPlan}
      />
    </div>
  );
}
