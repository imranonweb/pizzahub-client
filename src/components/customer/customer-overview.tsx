"use client";

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Info,
  ReceiptText,
  RotateCw,
  Store,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { StatusDistributionChart } from "@/components/dashboard/status-distribution-chart";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { useCart } from "@/components/providers/cart-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type CustomerOrdersListResponse,
  fetchCustomerOrders,
} from "@/lib/order-api";
import { useCustomerProfile } from "./customer-dashboard-shell";

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

export function CustomerOverview() {
  const user = useCustomerProfile();
  const { summary, isHydrated, openDrawer } = useCart();

  const [data, setData] = useState<CustomerOrdersListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetchCustomerOrders();
      setData(response);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load your recent orders.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const isLive = data?.source === "live";
  const orders = data?.orders ?? [];
  const pendingOrdersCount = orders.filter(
    (o) => o.status === "pending",
  ).length;
  const acceptedOrdersCount = orders.filter((o) =>
    [
      "accepted",
      "preparing",
      "ready",
      "out_for_delivery",
      "delivered",
    ].includes(o.status),
  ).length;
  const rejectedOrdersCount = orders.filter(
    (o) => o.status === "rejected",
  ).length;
  const cancelledOrdersCount = orders.filter(
    (o) => o.status === "cancelled",
  ).length;
  const deliveredOrdersCount = orders.filter(
    (o) => o.status === "delivered",
  ).length;

  const summaryCards = [
    {
      label: "Total Orders",
      value: isLive ? String(orders.length) : "—",
      caption: isLive ? "All submitted orders" : "Awaiting orders API",
      icon: ReceiptText,
    },
    {
      label: "Pending Orders",
      value: isLive ? String(pendingOrdersCount) : "—",
      caption: isLive ? "Awaiting vendor confirmation" : "Awaiting orders API",
      icon: Clock,
    },
    {
      label: "Accepted Orders",
      value: isLive ? String(acceptedOrdersCount) : "—",
      caption: isLive
        ? `${deliveredOrdersCount} delivered so far`
        : "Awaiting orders API",
      icon: CheckCircle2,
    },
    {
      label: "Rejected Orders",
      value: isLive ? String(rejectedOrdersCount) : "—",
      caption: isLive
        ? `${cancelledOrdersCount} cancelled by you`
        : "Awaiting orders API",
      icon: XCircle,
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
            Track active deliveries, review past orders, and manage your pizza
            cart.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            render={<Link href="/dashboard/customer/orders" />}
            variant="outline"
            className="h-10 rounded-xl bg-card px-4 font-medium"
          >
            <ReceiptText className="size-4" aria-hidden="true" />
            Order History
          </Button>
          <Button
            render={<Link href="/menu" />}
            className="h-10 rounded-xl px-4 font-semibold"
          >
            <Store className="size-4" aria-hidden="true" />
            Browse Menu
          </Button>
        </div>
      </div>

      {data?.source === "unavailable" && data.notice ? (
        <Alert className="rounded-2xl bg-accent/65 p-4">
          <Info className="size-4 text-primary" aria-hidden="true" />
          <AlertTitle>Customer Orders Service Notice</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>{data.notice}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadOrders()}
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
          <AlertTitle>Unable to load order summary</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>{errorMessage}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadOrders()}
              className="rounded-xl bg-background text-foreground"
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <section
        aria-label="Customer order summary"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {isLoading
          ? summaryCards.map((card) => (
              <Skeleton
                key={card.label}
                className="h-32 rounded-2xl border border-border"
              />
            ))
          : summaryCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.24,
                    delay: index * 0.05,
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

      <StatusDistributionChart
        title="Order Status Breakdown"
        description="Overview of your pending, accepted, rejected, and cancelled pizza orders."
        emptyMessage="Place your first pizza order to track order distribution here."
        segments={[
          {
            label: "Pending",
            value: isLive ? pendingOrdersCount : 0,
            colorClass: "bg-chart-4",
          },
          {
            label: "Accepted / Completed",
            value: isLive ? acceptedOrdersCount : 0,
            colorClass: "bg-chart-3",
          },
          {
            label: "Rejected",
            value: isLive ? rejectedOrdersCount : 0,
            colorClass: "bg-chart-1",
          },
          {
            label: "Cancelled",
            value: isLive ? cancelledOrdersCount : 0,
            colorClass: "bg-chart-5",
          },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-12">
        <section
          aria-labelledby="cart-snapshot-heading"
          className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-6 lg:col-span-5"
        >
          <div className="space-y-2">
            <h2
              id="cart-snapshot-heading"
              className="font-heading text-lg font-semibold text-foreground"
            >
              Current Cart
            </h2>
            {isHydrated && summary.itemCount > 0 ? (
              <p className="text-sm text-muted-foreground">
                You have{" "}
                <strong className="text-foreground">{summary.itemCount}</strong>{" "}
                {summary.itemCount === 1 ? "item" : "items"} ready from{" "}
                {summary.vendorNames.join(", ") || "local kitchens"} (estimated{" "}
                <strong className="text-foreground tabular-nums">
                  ${summary.subtotal.toFixed(2)}
                </strong>
                ).
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Your shopping cart is empty. Browse pizzas from local kitchens
                to start an order.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 border-t border-border/70 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openDrawer}
              className="h-9 rounded-xl bg-background px-3.5"
            >
              Open Cart Drawer
            </Button>
            {isHydrated && summary.itemCount > 0 ? (
              <Button
                render={<Link href="/checkout" />}
                size="sm"
                className="h-9 rounded-xl px-4 font-semibold"
              >
                Checkout
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            ) : (
              <Button
                render={<Link href="/menu" />}
                size="sm"
                className="h-9 rounded-xl px-4 font-semibold"
              >
                Explore Menu
              </Button>
            )}
          </div>
        </section>

        <section
          aria-labelledby="recent-orders-heading"
          className="rounded-2xl border border-border bg-card p-6 lg:col-span-7"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-4">
            <div>
              <h2
                id="recent-orders-heading"
                className="font-heading text-lg font-semibold text-foreground"
              >
                Recent Orders
              </h2>
              <p className="text-xs text-muted-foreground">
                {isLive
                  ? `${deliveredOrdersCount} delivered so far`
                  : "Live tracking syncs with /api/orders/my"}
              </p>
            </div>
            <Button
              render={<Link href="/dashboard/customer/orders" />}
              variant="ghost"
              size="sm"
              className="rounded-xl text-primary hover:text-primary"
            >
              View all orders
            </Button>
          </div>

          {isLoading ? (
            <div className="mt-4 space-y-3">
              <Skeleton className="h-14 rounded-xl" />
              <Skeleton className="h-14 rounded-xl" />
            </div>
          ) : !isLive ? (
            <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-8 text-center">
              <p className="font-heading text-base font-semibold text-foreground">
                Order history awaiting API
              </p>
              <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
                Once the Express{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                  GET /api/orders/my
                </code>{" "}
                endpoint is deployed, your orders and delivery progress will
                appear here.
              </p>
            </div>
          ) : orders.length === 0 ? (
            <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-8 text-center">
              <p className="font-heading text-base font-semibold text-foreground">
                No orders placed yet
              </p>
              <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
                Once you place an order, you can track kitchen preparation and
                delivery here.
              </p>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-border/70">
              {orders.slice(0, 4).map((order) => (
                <Link
                  key={order.id}
                  href={`/dashboard/customer/orders/${encodeURIComponent(order.id)}`}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm transition-colors hover:bg-muted/25"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">
                      Order #{order.id} · {order.vendorName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatShortDate(order.createdAt)} · $
                      {order.total.toFixed(2)}
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
