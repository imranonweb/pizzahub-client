"use client";

import {
  AlertCircle,
  ArrowLeft,
  Info,
  Loader2,
  MapPin,
  Phone,
  RotateCw,
  Store,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import {
  type CustomerOrderDetailResult,
  cancelCustomerOrder,
  fetchCustomerOrderById,
} from "@/lib/order-api";
import { canCustomerCancelOrder } from "@/lib/order-rules";
import { cn } from "@/lib/utils";
import { OrderStatusBadge } from "./order-status-badge";
import { OrderTimeline } from "./order-timeline";

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

export function CustomerOrderDetailView({ orderId }: { orderId: string }) {
  const [result, setResult] = useState<CustomerOrderDetailResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const loadOrder = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetchCustomerOrderById(orderId);
      setResult(response);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load order tracking details.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  const handleConfirmCancel = async () => {
    if (result?.state !== "found" || isCancelling) return;

    const eligibility = canCustomerCancelOrder(result.order.status);
    if (!eligibility.allowed) {
      toast.add({
        title: "Cancellation unavailable",
        description: eligibility.reason ?? "This order cannot be cancelled.",
        type: "warning",
      });
      setCancelOpen(false);
      return;
    }

    setIsCancelling(true);
    try {
      const mutation = await cancelCustomerOrder(result.order.id);
      if (!mutation.ok) {
        toast.add({
          title:
            mutation.reason === "backend-unavailable"
              ? "Order cancellation unavailable"
              : "Could not cancel order",
          description: mutation.message,
          type: mutation.reason === "backend-unavailable" ? "warning" : "error",
        });
        return;
      }

      toast.add({
        title: "Order cancelled",
        description: mutation.message,
        type: "success",
      });
      setCancelOpen(false);
      await loadOrder();
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="grid gap-6 lg:grid-cols-12">
          <Skeleton className="h-96 rounded-2xl lg:col-span-5" />
          <Skeleton className="h-96 rounded-2xl lg:col-span-7" />
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <Alert variant="destructive" className="rounded-2xl p-6">
        <AlertCircle className="size-4" aria-hidden="true" />
        <AlertTitle>Unable to load order details</AlertTitle>
        <AlertDescription className="mt-2 flex flex-wrap items-center gap-3">
          <span>{errorMessage}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadOrder()}
            className="rounded-xl bg-background text-foreground"
          >
            <RotateCw className="size-3.5" aria-hidden="true" />
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (result?.state === "unavailable") {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/customer/orders"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-2.5 w-fit rounded-xl px-2.5 text-muted-foreground hover:text-foreground",
          )}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to My Orders
        </Link>

        <Alert className="rounded-2xl bg-accent/65 p-5">
          <Info className="size-4 text-primary" aria-hidden="true" />
          <AlertTitle>Order Details API Pending</AlertTitle>
          <AlertDescription className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <span>{result.notice}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadOrder()}
              className="rounded-xl bg-card"
            >
              <RotateCw className="size-3.5" aria-hidden="true" />
              Retry API
            </Button>
          </AlertDescription>
        </Alert>

        <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <h1 className="font-heading text-xl font-semibold text-foreground">
            Order tracking unavailable (#{orderId})
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Real order items, timestamps, and cancellation require{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
              GET /api/orders/:id
            </code>{" "}
            and{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
              PATCH /api/orders/:id/cancel
            </code>{" "}
            on the Express server.
          </p>
        </div>
      </div>
    );
  }

  if (!result || result.state === "not-found") {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/customer/orders"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-2.5 w-fit rounded-xl px-2.5 text-muted-foreground hover:text-foreground",
          )}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to My Orders
        </Link>
        <div className="rounded-3xl border border-border bg-card px-6 py-14 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Order not found
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The requested order does not exist or does not belong to your
            account.
          </p>
        </div>
      </div>
    );
  }

  const order = result.order;
  const cancelCheck = canCustomerCancelOrder(order.status);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border/70 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Link
            href="/dashboard/customer/orders"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "-ml-2.5 w-fit rounded-xl px-2.5 text-muted-foreground hover:text-foreground",
            )}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to My Orders
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-3xl">
              Order #{order.id}
            </h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Placed {formatOrderDate(order.createdAt)} · {order.vendorName}
            {order.deliveryDate ? ` · Delivery: ${order.deliveryDate}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadOrder()}
            className="h-9 rounded-xl bg-card px-3.5"
          >
            <RotateCw className="size-3.5" aria-hidden="true" />
            Refresh Status
          </Button>
          {cancelCheck.allowed ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setCancelOpen(true)}
              className="h-9 rounded-xl px-4 font-semibold"
            >
              Cancel Order
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        <section
          aria-labelledby="order-lifecycle-heading"
          className="rounded-2xl border border-border bg-card p-6 lg:col-span-5"
        >
          <div className="mb-5 space-y-1">
            <h2
              id="order-lifecycle-heading"
              className="font-heading text-lg font-semibold text-foreground"
            >
              Order Timeline
            </h2>
            <p className="text-xs text-muted-foreground">
              {cancelCheck.allowed
                ? "You can cancel this order while it remains Pending."
                : cancelCheck.reason}
            </p>
          </div>

          <OrderTimeline
            currentStatus={order.status}
            statusHistory={order.statusHistory}
          />
        </section>

        <div className="space-y-6 lg:col-span-7">
          <section
            aria-labelledby="order-items-heading"
            className="rounded-2xl border border-border bg-card p-6"
          >
            <h2
              id="order-items-heading"
              className="font-heading text-lg font-semibold text-foreground"
            >
              Items & Pricing
            </h2>

            <ul className="mt-4 divide-y divide-border/70">
              {order.items.map((item) => (
                <li
                  key={item.menuItemId}
                  className="flex items-center justify-between gap-4 py-3.5"
                >
                  <div className="flex min-w-0 items-center gap-3.5">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                      <Image
                        src={item.image}
                        alt={item.itemName}
                        fill
                        unoptimized
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {item.itemName}
                      </p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {item.quantity} × ${item.unitPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <span className="font-heading text-sm font-bold text-foreground tabular-nums">
                    ${item.lineTotal.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>

            <Separator className="my-4" />

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Payment Method</span>
                <span className="font-medium text-foreground">
                  Cash on Delivery (COD)
                </span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-medium text-foreground tabular-nums">
                  ${order.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between font-heading text-lg font-bold text-foreground">
                <span>Total (Cash on Delivery)</span>
                <span className="tabular-nums">${order.total.toFixed(2)}</span>
              </div>
            </div>
          </section>

          <section
            aria-labelledby="order-delivery-heading"
            className="rounded-2xl border border-border bg-card p-6"
          >
            <h2
              id="order-delivery-heading"
              className="font-heading text-lg font-semibold text-foreground"
            >
              Kitchen & Delivery Details
            </h2>

            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-background p-3.5">
                <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Store className="size-3.5 text-primary" aria-hidden="true" />
                  Vendor Kitchen
                </dt>
                <dd className="mt-1 font-medium text-foreground">
                  {order.vendorName}
                  {order.vendorLocation ? ` (${order.vendorLocation})` : ""}
                </dd>
              </div>

              <div className="rounded-xl border border-border bg-background p-3.5">
                <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Phone className="size-3.5 text-primary" aria-hidden="true" />
                  Contact Phone
                </dt>
                <dd className="mt-1 font-medium text-foreground">
                  {order.contactPhone}
                </dd>
              </div>

              <div className="rounded-xl border border-border bg-background p-3.5 sm:col-span-2">
                <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <MapPin
                    className="size-3.5 text-primary"
                    aria-hidden="true"
                  />
                  Delivery Address
                </dt>
                <dd className="mt-1 font-medium text-foreground">
                  {order.deliveryAddress}
                </dd>
              </div>

              {order.orderNotes ? (
                <div className="rounded-xl border border-border bg-background p-3.5 sm:col-span-2">
                  <dt className="text-xs font-medium text-muted-foreground">
                    Order Notes
                  </dt>
                  <dd className="mt-1 text-foreground">{order.orderNotes}</dd>
                </div>
              ) : null}
            </dl>
          </section>
        </div>
      </div>

      <AlertDialog
        open={cancelOpen}
        onOpenChange={(open) => {
          if (!isCancelling) setCancelOpen(open);
        }}
      >
        <AlertDialogContent className="rounded-2xl p-6 sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel pending order?</AlertDialogTitle>
            <AlertDialogDescription>
              Cancel order{" "}
              <strong className="text-foreground">#{order.id}</strong> with{" "}
              <strong className="text-foreground">{order.vendorName}</strong>?
              This can only be done while the order has not yet been accepted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="-mx-6 -mb-6 rounded-b-2xl px-6 py-4">
            <AlertDialogCancel
              disabled={isCancelling}
              className="rounded-xl bg-card"
            >
              Keep Order
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isCancelling}
              onClick={() => void handleConfirmCancel()}
              className="rounded-xl"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Cancelling...
                </>
              ) : (
                "Confirm Cancellation"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
