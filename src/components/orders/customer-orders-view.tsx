"use client";

import {
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Info,
  MapPin,
  RotateCcw,
  RotateCw,
  Store,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  type SearchSuggestionOption,
  SearchSuggestionsInput,
} from "@/components/ui/search-suggestions-input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type CustomerOrdersListResponse,
  fetchCustomerOrders,
} from "@/lib/order-api";
import {
  type CustomerOrderStatusFilter,
  filterCustomerOrders,
} from "@/lib/order-rules";
import { cn } from "@/lib/utils";
import { OrderStatusBadge } from "./order-status-badge";

const PAGE_SIZE = 6;

const STATUS_TABS: { value: CustomerOrderStatusFilter; label: string }[] = [
  { value: "all", label: "All orders" },
  { value: "active", label: "In progress" },
  { value: "pending", label: "Pending" },
  { value: "delivered", label: "Delivered" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

function formatOrderDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime()) || parsed.getTime() === 0) {
    return "Date unavailable";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(parsed);
}

export function CustomerOrdersView() {
  const [data, setData] = useState<CustomerOrdersListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<CustomerOrderStatusFilter>("all");
  const [page, setPage] = useState(1);

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
          : "Unable to load your order history.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const isLive = data?.source === "live";
  const allOrders = data?.orders ?? [];

  const orderSuggestions = useMemo<SearchSuggestionOption[]>(() => {
    const trimmed = search.trim().toLowerCase();
    const matched = trimmed
      ? allOrders.filter((order) => {
          const dishes = order.items.map((i) => i.itemName).join(" ");
          return `${order.id} ${order.vendorName} ${order.deliveryAddress} ${dishes}`
            .toLowerCase()
            .includes(trimmed);
        })
      : allOrders;
    return matched.slice(0, 6).map((order) => ({
      id: order.id,
      label: `${order.vendorName} · #${order.id.slice(-8).toUpperCase()}`,
      value: order.vendorName || order.id,
      subtitle:
        order.items
          .map((i) => `${i.quantity}× ${i.itemName}`)
          .slice(0, 2)
          .join(", ") || order.deliveryAddress,
      badge: order.status.replaceAll("_", " "),
      rightText: `$${order.total.toFixed(2)}`,
    }));
  }, [allOrders, search]);

  const filtered = filterCustomerOrders(allOrders, {
    search,
    statusFilter,
    page,
    pageSize: PAGE_SIZE,
  });

  const hasActiveFilters = Boolean(search.trim() || statusFilter !== "all");

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border/70 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-heading text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-3xl">
              My Orders
            </h1>
            <Badge
              variant="secondary"
              className="rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums"
            >
              {isLive ? `${allOrders.length} orders` : "Order history"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Track kitchen acceptance, baking progress, delivery updates, and
            past receipts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={() => void loadOrders()}
            className="h-10 rounded-xl bg-card px-3.5"
          >
            <RotateCw
              className={cn("size-4", isLoading && "animate-spin")}
              aria-hidden="true"
            />
            Refresh
          </Button>
          <Button
            render={<Link href="/menu" />}
            className="h-10 rounded-xl px-4 font-semibold"
          >
            <Store className="size-4" aria-hidden="true" />
            Order More
          </Button>
        </div>
      </div>

      {data?.source === "unavailable" && data.notice ? (
        <Alert className="rounded-2xl bg-accent/65 p-4">
          <Info className="size-4 text-primary" aria-hidden="true" />
          <AlertTitle>Customer Orders API Pending</AlertTitle>
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
          <AlertTitle>Failed to load orders</AlertTitle>
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

      <div className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
        <SearchSuggestionsInput
          value={search}
          onValueChange={(nextValue) => {
            setSearch(nextValue);
            setPage(1);
          }}
          onClear={() => {
            setSearch("");
            setPage(1);
          }}
          suggestions={orderSuggestions}
          onSelectSuggestion={(option) => {
            setSearch(option.value);
            setPage(1);
          }}
          suggestionHeader="Your Orders"
          ariaLabel="Search your orders"
          clearAriaLabel="Clear order search"
          placeholder="Search by order ID, vendor kitchen, dish name, or address..."
        />

        <fieldset className="flex flex-wrap items-center justify-between gap-3 border-0 border-t border-border/70 p-0 pt-3.5">
          <legend className="sr-only">Filter orders by status</legend>
          <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1 no-scrollbar sm:flex-wrap sm:pb-0">
            {STATUS_TABS.map((tab) => {
              const active = statusFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setStatusFilter(tab.value);
                    setPage(1);
                  }}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-foreground/25 hover:text-foreground",
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-8 rounded-lg px-2.5 text-xs font-medium text-primary hover:text-primary"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Reset filters
            </Button>
          ) : null}
        </fieldset>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-2xl border border-border" />
          <Skeleton className="h-32 rounded-2xl border border-border" />
          <Skeleton className="h-32 rounded-2xl border border-border" />
        </div>
      ) : !isLive ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <h2 className="font-heading text-xl font-semibold text-foreground">
            Order history awaiting Express API
          </h2>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">
            Submitted customer orders will appear here once{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
              GET /api/orders/my
            </code>{" "}
            is active on the Express server.
          </p>
          <Button
            render={<Link href="/menu" />}
            className="mt-5 h-10 rounded-xl px-5 font-semibold"
          >
            Browse Menu
          </Button>
        </div>
      ) : allOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <h2 className="font-heading text-xl font-semibold text-foreground">
            No orders yet
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            You have not placed any pizza orders yet. Browse approved local
            pizzerias to place your first order.
          </p>
          <Button
            render={<Link href="/menu" />}
            className="mt-5 h-10 rounded-xl px-5 font-semibold"
          >
            Explore Menu
          </Button>
        </div>
      ) : filtered.orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <h2 className="font-heading text-xl font-semibold text-foreground">
            No matching orders
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Clear your search or status filters to view all {allOrders.length}{" "}
            orders.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={resetFilters}
            className="mt-5 h-10 rounded-xl bg-background px-5"
          >
            Reset all filters
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {filtered.orders.map((order, index) => (
              <motion.article
                key={order.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.2,
                  delay: index * 0.04,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-2xs sm:flex-row sm:items-center"
              >
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-sm font-semibold text-foreground">
                      Order #{order.id}
                    </span>
                    <OrderStatusBadge status={order.status} />
                  </div>

                  <p className="text-sm font-medium text-foreground">
                    {order.vendorName}
                    {order.vendorLocation ? (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
                        <MapPin
                          className="size-3 text-primary"
                          aria-hidden="true"
                        />
                        {order.vendorLocation}
                      </span>
                    ) : null}
                  </p>

                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    {order.items
                      .map((i) => `${i.quantity}× ${i.itemName}`)
                      .join(", ")}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Placed {formatOrderDate(order.createdAt)}
                    {order.deliveryDate
                      ? ` · Delivery: ${order.deliveryDate}`
                      : ""}{" "}
                    · Cash on Delivery
                  </p>
                </div>

                <div className="flex shrink-0 items-center justify-between gap-4 border-t border-border/70 pt-3 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                  <span className="font-heading text-lg font-bold text-foreground tabular-nums">
                    ${order.total.toFixed(2)}
                  </span>
                  <Button
                    render={
                      <Link
                        href={`/dashboard/customer/orders/${encodeURIComponent(order.id)}`}
                      />
                    }
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-xl bg-background px-3.5"
                  >
                    <span>Order Details</span>
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </motion.article>
            ))}
          </div>

          {filtered.totalPages > 1 ? (
            <nav
              aria-label="Customer order pagination"
              className="flex flex-wrap items-center justify-between gap-4 border-t border-border/70 pt-5"
            >
              <p className="text-sm text-muted-foreground tabular-nums">
                Page{" "}
                <span className="font-semibold text-foreground">
                  {filtered.page}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-foreground">
                  {filtered.totalPages}
                </span>
              </p>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={filtered.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-9 rounded-xl bg-card px-3.5"
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={filtered.page >= filtered.totalPages}
                  onClick={() =>
                    setPage((p) => Math.min(filtered.totalPages, p + 1))
                  }
                  className="h-9 rounded-xl bg-card px-3.5"
                >
                  Next
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
