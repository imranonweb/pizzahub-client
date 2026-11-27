"use client";

import {
  ArrowRight,
  Banknote,
  Calendar,
  CheckCircle2,
  MapPin,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/components/providers/language-provider";
import { buttonVariants } from "@/components/ui/button";
import { PizzaImage } from "@/components/ui/pizza-image";
import type { CustomerOrder } from "@/lib/order-rules";
import { cn } from "@/lib/utils";
import { CopyOrderButton } from "./copy-order-button";
import { OrderStatusBadge } from "./order-status-badge";

export function OrderConfirmationCard({
  order,
  additionalOrders = [],
}: {
  order: CustomerOrder;
  additionalOrders?: readonly CustomerOrder[];
}) {
  const { t } = useLanguage();

  return (
    <section
      aria-labelledby="order-confirmed-heading"
      className="surface-card mx-auto w-full max-w-3xl space-y-6 rounded-3xl border border-border bg-card p-6 sm:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/75 pb-6">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="size-6" aria-hidden="true" />
          </span>
          <div className="space-y-1">
            <h1
              id="order-confirmed-heading"
              className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
            >
              {t.checkout.confirmedHeading}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{t.checkout.orderRef}</span>
              <span className="font-mono font-semibold text-foreground">
                #{order.id}
              </span>
              <CopyOrderButton orderId={order.id} />
            </div>
          </div>
        </div>

        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid gap-4 rounded-2xl border border-border bg-background p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
        {order.deliveryDate ? (
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Calendar className="size-3.5 text-primary" aria-hidden="true" />
              {t.menu.deliveryDateLabel}
            </p>
            <p className="font-medium text-foreground">{order.deliveryDate}</p>
          </div>
        ) : null}
        <div className="space-y-1">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Banknote className="size-3.5 text-primary" aria-hidden="true" />
            {t.checkout.paymentMethodLabel}
          </p>
          <p className="font-medium text-foreground">{t.checkout.codTitle}</p>
        </div>
        <div className="space-y-1">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <MapPin className="size-3.5 text-primary" aria-hidden="true" />
            {t.menu.deliveryAddressLabel}
          </p>
          <p className="font-medium text-foreground">{order.deliveryAddress}</p>
        </div>
        <div className="space-y-1">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Phone className="size-3.5 text-primary" aria-hidden="true" />
            {t.menu.contactPhoneLabel}
          </p>
          <p className="font-medium text-foreground">{order.contactPhone}</p>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-heading text-base font-semibold text-foreground">
          {t.checkout.orderedItems} ({order.vendorName})
        </h2>
        <ul className="divide-y divide-border/70 rounded-2xl border border-border bg-background px-4">
          {order.items.map((item) => (
            <li
              key={item.menuItemId}
              className="flex items-center justify-between gap-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                  <PizzaImage
                    src={item.image}
                    alt={item.itemName}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {item.itemName}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground tabular-nums">
                    {item.quantity} × ${item.unitPrice.toFixed(2)}
                  </p>
                </div>
              </div>
              <span className="font-mono text-sm font-bold text-foreground tabular-nums">
                ${item.lineTotal.toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2.5 rounded-2xl border border-border bg-muted/30 p-4 text-sm">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>{t.checkout.subtotal}</span>
          <span className="font-mono font-medium text-foreground tabular-nums">
            ${order.subtotal.toFixed(2)}
          </span>
        </div>
        <div className="ticket-divider flex items-center justify-between pt-2.5 font-heading text-lg font-bold text-foreground">
          <span>{t.checkout.total}</span>
          <span className="font-mono tabular-nums">
            ${order.total.toFixed(2)}
          </span>
        </div>
      </div>

      {additionalOrders.length > 0 ? (
        <div className="space-y-2.5 rounded-2xl border border-border bg-background p-4">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {t.checkout.additionalOrders}
          </p>
          <ul className="divide-y divide-border/70">
            {additionalOrders.map((extraOrder) => (
              <li
                key={extraOrder.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground">
                    {extraOrder.vendorName} ·{" "}
                    <span className="font-mono text-xs">#{extraOrder.id}</span>
                  </p>
                  <p className="font-mono text-xs text-muted-foreground tabular-nums">
                    {extraOrder.items.length}{" "}
                    {extraOrder.items.length === 1
                      ? t.cart.itemWord
                      : t.cart.itemsWord}{" "}
                    · ${extraOrder.total.toFixed(2)}
                  </p>
                </div>
                <Link
                  href={`/dashboard/customer/orders/${encodeURIComponent(extraOrder.id)}`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "h-8 rounded-lg px-3 text-xs",
                  )}
                >
                  {t.dashboard.orderDetails}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Link
          href="/menu"
          className={cn(
            buttonVariants({ variant: "outline", size: "default" }),
            "h-10 rounded-full bg-background px-5",
          )}
        >
          {t.checkout.continueBrowsing}
        </Link>

        <Link
          href={`/dashboard/customer/orders/${encodeURIComponent(order.id)}`}
          className={cn(
            buttonVariants({ variant: "default", size: "lg" }),
            "h-11 rounded-full px-6 font-semibold",
          )}
        >
          <span>{t.checkout.viewOrderTracking}</span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
