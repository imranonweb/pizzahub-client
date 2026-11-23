"use client";

import {
  AlertCircle,
  ArrowUpDown,
  CheckCircle2,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Loader2,
  MapPin,
  Phone,
  RotateCw,
  Search,
  ShoppingBag,
  User,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  fetchVendorOrders,
  getAllowedVendorNextStatuses,
  updateVendorOrderStatus,
  type VendorActionableOrderStatus,
  type VendorOrder,
  type VendorOrderSortOption,
  type VendorOrderStatusFilter,
  type VendorOrdersListResponse,
} from "@/lib/vendor-order-api";

const STATUS_TABS: { value: VendorOrderStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "preparing", label: "Preparing" },
  { value: "ready", label: "Ready" },
  { value: "delivered", label: "Delivered" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

const SORT_LABELS: Record<VendorOrderSortOption, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  "total-desc": "Total: High to Low",
  "total-asc": "Total: Low to High",
};

const ACTION_CONFIG: Record<
  VendorActionableOrderStatus,
  { label: string; description: string }
> = {
  accepted: {
    label: "Accept Order",
    description: "Confirm that your kitchen will fulfill this order.",
  },
  rejected: {
    label: "Reject Order",
    description: "Decline this pending order and notify the customer.",
  },
  preparing: {
    label: "Start Preparing",
    description: "Let the customer know their pizzas are in the oven.",
  },
  ready: {
    label: "Mark Ready",
    description: "Mark this order ready for handoff or delivery pickup.",
  },
};

function formatOrderDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime()) || parsed.getTime() === 0) {
    return "Recently";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(parsed);
}

export function VendorOrdersView() {
  const [statusFilter, setStatusFilter] =
    useState<VendorOrderStatusFilter>("all");
  const [sortOption, setSortOption] = useState<VendorOrderSortOption>("newest");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  const [data, setData] = useState<VendorOrdersListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [detailOrder, setDetailOrder] = useState<VendorOrder | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    order: VendorOrder;
    targetStatus: VendorActionableOrderStatus;
  } | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [isMutating, setIsMutating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchInput.trim();
      setDebouncedSearch((prev) => {
        if (prev !== trimmed) {
          setPage(1);
        }
        return trimmed;
      });
    }, 260);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadOrders = useCallback(
    async (isBackground = false) => {
      if (isBackground) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const res = await fetchVendorOrders({
          search: debouncedSearch,
          status: statusFilter,
          sort: sortOption,
          page,
          limit: 10,
        });
        setData(res);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [debouncedSearch, statusFilter, sortOption, page],
  );

  useEffect(() => {
    void loadOrders(false);
  }, [loadOrders]);

  const handleConfirmStatusUpdate = async () => {
    if (!pendingAction || isMutating) return;
    setIsMutating(true);
    try {
      const res = await updateVendorOrderStatus(
        pendingAction.order.id,
        pendingAction.targetStatus,
        actionNote,
      );

      if (!res.ok) {
        toast.add({
          title: "Order update failed",
          description: res.message,
          type: "error",
        });
        return;
      }

      toast.add({
        title: "Order updated",
        description: res.message,
        type: "success",
      });

      if (res.order && detailOrder?.id === res.order.id) {
        setDetailOrder(res.order);
      }

      setPendingAction(null);
      setActionNote("");
      await loadOrders(true);
    } finally {
      setIsMutating(false);
    }
  };

  const orders = data?.orders ?? [];
  const pagination = data?.pagination;
  const isUnavailable = data?.source === "unavailable";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border/70 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="font-heading text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-3xl">
            Incoming Kitchen Orders
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Review incoming customer orders, accept or decline pending requests,
            and update preparation progress.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isLoading || isRefreshing}
          onClick={() => void loadOrders(true)}
          className="h-10 rounded-xl bg-card px-4 font-medium"
        >
          <RotateCw
            className={cn("size-4", isRefreshing && "animate-spin")}
            aria-hidden="true"
          />
          Refresh Orders
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              aria-label="Search incoming orders"
              placeholder="Search by order ID, customer, address, or dish..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="h-10 rounded-xl bg-background pr-10 pl-10"
            />
            {searchInput ? (
              <button
                type="button"
                aria-label="Clear order search"
                onClick={() => {
                  setSearchInput("");
                  setDebouncedSearch("");
                  setPage(1);
                }}
                className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            ) : null}
          </div>

          <Select
            value={sortOption}
            onValueChange={(value) => {
              setSortOption((value as VendorOrderSortOption) || "newest");
              setPage(1);
            }}
          >
            <SelectTrigger
              aria-label="Sort incoming orders"
              className="h-10 w-full rounded-xl bg-background px-3"
            >
              <div className="flex items-center gap-2 truncate">
                <ArrowUpDown
                  className="size-3.5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <SelectValue placeholder="Sort orders">
                  {SORT_LABELS[sortOption]}
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="total-desc">Total: High to Low</SelectItem>
              <SelectItem value="total-asc">Total: Low to High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-nowrap items-center gap-1.5 overflow-x-auto border-t border-border/70 pt-3.5 pb-1 no-scrollbar sm:flex-wrap">
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
                  "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
      ) : isUnavailable ? (
        <Alert variant="destructive" className="rounded-2xl p-6">
          <AlertCircle className="size-5" aria-hidden="true" />
          <AlertTitle className="text-base font-semibold">
            Unable to load incoming orders
          </AlertTitle>
          <AlertDescription className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm">
              {data?.notice ||
                "Unable to connect to the PizzaHub vendor orders API."}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadOrders(true)}
              className="shrink-0 rounded-xl bg-background text-foreground"
            >
              <RotateCw className="size-3.5" aria-hidden="true" />
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <ShoppingBag className="size-6" aria-hidden="true" />
          </div>
          <h2 className="mt-4 font-heading text-lg font-semibold text-foreground">
            {statusFilter !== "all" || debouncedSearch
              ? "No matching orders"
              : "No incoming orders yet"}
          </h2>
          <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
            {statusFilter !== "all" || debouncedSearch
              ? "Try clearing your search or selecting another status tab."
              : "New customer orders placed for your approved menu items will appear here."}
          </p>
          {statusFilter !== "all" || debouncedSearch ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setStatusFilter("all");
                setSearchInput("");
                setDebouncedSearch("");
                setPage(1);
              }}
              className="mt-5 h-9 rounded-xl bg-background px-4 text-xs"
            >
              Reset filters
            </Button>
          ) : null}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order) => {
              const allowedNext = getAllowedVendorNextStatuses(order.status);
              return (
                <article
                  key={order.id}
                  className="rounded-2xl border border-border bg-card p-5 shadow-2xs transition-colors hover:border-border/90"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/70 pb-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-mono text-xs font-semibold text-foreground">
                          Order #{order.id.slice(-8).toUpperCase()}
                        </span>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <User className="size-3.5" aria-hidden="true" />
                          {order.customer.name}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3.5" aria-hidden="true" />
                          {formatOrderDate(order.createdAt)}
                        </span>
                        {order.deliveryDate ? (
                          <span className="font-medium text-foreground">
                            Delivery: {order.deliveryDate}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-heading text-lg font-bold text-foreground tabular-nums">
                        ${order.total.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.items.reduce((acc, i) => acc + i.quantity, 0)}{" "}
                        item(s) · Cash on Delivery
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
                        Items
                      </p>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        {order.items.map((item) => (
                          <li
                            key={`${order.id}-${item.menuItemId}`}
                            className="flex items-center justify-between gap-2"
                          >
                            <span className="truncate text-foreground">
                              {item.quantity} × {item.itemName}
                            </span>
                            <span className="shrink-0 tabular-nums">
                              ${item.lineTotal.toFixed(2)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <p className="font-semibold text-foreground uppercase tracking-wider">
                        Delivery Details
                      </p>
                      <p className="flex items-start gap-1.5">
                        <MapPin
                          className="mt-0.5 size-3.5 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                        <span>{order.deliveryAddress || "Not provided"}</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Phone
                          className="size-3.5 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                        <span>{order.contactPhone || "Not provided"}</span>
                      </p>
                      {order.orderNotes ? (
                        <p className="rounded-lg bg-muted/40 px-2.5 py-1.5 text-[11px] text-foreground">
                          Note: {order.orderNotes}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setDetailOrder(order)}
                      className="h-9 rounded-xl bg-background text-xs font-medium"
                    >
                      <Eye className="size-3.5" aria-hidden="true" />
                      View Timeline & Details
                    </Button>

                    <div className="flex flex-wrap items-center gap-2">
                      {allowedNext.map((nextStatus) => {
                        const isReject = nextStatus === "rejected";
                        return (
                          <Button
                            key={nextStatus}
                            type="button"
                            variant={isReject ? "outline" : "default"}
                            size="sm"
                            onClick={() => {
                              setActionNote("");
                              setPendingAction({
                                order,
                                targetStatus: nextStatus,
                              });
                            }}
                            className={cn(
                              "h-9 rounded-xl text-xs font-semibold",
                              isReject &&
                                "border-destructive/40 text-destructive hover:bg-destructive/10",
                            )}
                          >
                            {isReject ? (
                              <XCircle
                                className="size-3.5"
                                aria-hidden="true"
                              />
                            ) : nextStatus === "preparing" ? (
                              <ChefHat
                                className="size-3.5"
                                aria-hidden="true"
                              />
                            ) : (
                              <CheckCircle2
                                className="size-3.5"
                                aria-hidden="true"
                              />
                            )}
                            {ACTION_CONFIG[nextStatus].label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {pagination && pagination.totalPages > 1 ? (
            <nav
              aria-label="Vendor orders pagination"
              className="flex flex-wrap items-center justify-between gap-4 border-t border-border/70 pt-5"
            >
              <p className="text-xs text-muted-foreground tabular-nums sm:text-sm">
                Page{" "}
                <span className="font-semibold text-foreground">
                  {pagination.page}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-foreground">
                  {pagination.totalPages}
                </span>{" "}
                ({pagination.total} orders)
              </p>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPrevPage || isRefreshing}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-9 rounded-xl bg-card px-3.5"
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNextPage || isRefreshing}
                  onClick={() => setPage((p) => p + 1)}
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

      {/* Order Details & Timeline Dialog */}
      <Dialog
        open={detailOrder !== null}
        onOpenChange={(open) => {
          if (!open) setDetailOrder(null);
        }}
      >
        <DialogContent className="max-h-[85dvh] overflow-y-auto rounded-2xl p-6 sm:max-w-xl">
          {detailOrder ? (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="font-heading text-lg font-bold">
                    Order #{detailOrder.id.slice(-8).toUpperCase()}
                  </DialogTitle>
                  <OrderStatusBadge status={detailOrder.status} />
                </div>
                <DialogDescription className="text-xs">
                  Customer: {detailOrder.customer.name} · Placed{" "}
                  {formatOrderDate(detailOrder.createdAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-2">
                <div className="rounded-xl border border-border bg-muted/30 p-4 text-xs space-y-2">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Address</span>
                    <span className="text-right font-medium text-foreground">
                      {detailOrder.deliveryAddress}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-medium text-foreground">
                      {detailOrder.contactPhone}
                    </span>
                  </div>
                  {detailOrder.deliveryDate ? (
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">
                        Delivery Date
                      </span>
                      <span className="font-medium text-foreground">
                        {detailOrder.deliveryDate}
                      </span>
                    </div>
                  ) : null}
                  <div className="flex justify-between gap-2 border-t border-border/70 pt-2">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="font-heading text-sm font-bold text-foreground tabular-nums">
                      ${detailOrder.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Order Lifecycle Timeline
                  </h3>
                  <OrderTimeline
                    currentStatus={detailOrder.status}
                    statusHistory={detailOrder.statusHistory}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDetailOrder(null)}
                  className="rounded-xl bg-card"
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Confirm Status Transition Dialog */}
      <Dialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open && !isMutating) {
            setPendingAction(null);
            setActionNote("");
          }
        }}
      >
        <DialogContent className="rounded-2xl p-6 sm:max-w-md">
          {pendingAction ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold">
                  {ACTION_CONFIG[pendingAction.targetStatus].label}
                </DialogTitle>
                <DialogDescription className="text-xs leading-relaxed">
                  {ACTION_CONFIG[pendingAction.targetStatus].description}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2 py-2">
                <Label htmlFor="vendor-order-note" className="text-xs">
                  Optional note for customer (max 300 characters)
                </Label>
                <Textarea
                  id="vendor-order-note"
                  maxLength={300}
                  rows={3}
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder={
                    pendingAction.targetStatus === "rejected"
                      ? "e.g., Out of sourdough dough for tonight."
                      : "e.g., Wood-fired oven is heating up now."
                  }
                  className="rounded-xl text-sm"
                />
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isMutating}
                  onClick={() => {
                    setPendingAction(null);
                    setActionNote("");
                  }}
                  className="rounded-xl bg-card"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant={
                    pendingAction.targetStatus === "rejected"
                      ? "destructive"
                      : "default"
                  }
                  disabled={isMutating}
                  onClick={() => void handleConfirmStatusUpdate()}
                  className="rounded-xl font-semibold"
                >
                  {isMutating ? (
                    <>
                      <Loader2
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                      Updating...
                    </>
                  ) : (
                    ACTION_CONFIG[pendingAction.targetStatus].label
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
