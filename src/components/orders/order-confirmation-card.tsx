import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  MapPin,
  Phone,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { CustomerOrder } from "@/lib/order-rules";
import { cn } from "@/lib/utils";
import { OrderStatusBadge } from "./order-status-badge";

export function OrderConfirmationCard({ order }: { order: CustomerOrder }) {
  return (
    <section
      aria-labelledby="order-confirmed-heading"
      className="mx-auto w-full max-w-3xl space-y-6 rounded-3xl border border-border bg-card p-6 shadow-xs sm:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/70 pb-6">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="size-6" aria-hidden="true" />
          </span>
          <div className="space-y-1">
            <h1
              id="order-confirmed-heading"
              className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
            >
              Order confirmed
            </h1>
            <p className="text-sm text-muted-foreground">
              Order reference{" "}
              <span className="font-mono font-semibold text-foreground">
                #{order.id}
              </span>
            </p>
          </div>
        </div>

        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid gap-4 rounded-2xl border border-border bg-background p-4 text-sm sm:grid-cols-3">
        {order.deliveryDate ? (
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Calendar className="size-3.5 text-primary" aria-hidden="true" />
              Delivery Date
            </p>
            <p className="font-medium text-foreground">{order.deliveryDate}</p>
          </div>
        ) : null}
        <div className="space-y-1">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <MapPin className="size-3.5 text-primary" aria-hidden="true" />
            Delivery Address
          </p>
          <p className="font-medium text-foreground">{order.deliveryAddress}</p>
        </div>
        <div className="space-y-1">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Phone className="size-3.5 text-primary" aria-hidden="true" />
            Contact Phone
          </p>
          <p className="font-medium text-foreground">{order.contactPhone}</p>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-heading text-base font-semibold text-foreground">
          Ordered Items ({order.vendorName})
        </h2>
        <ul className="divide-y divide-border/70 rounded-2xl border border-border bg-background px-4">
          {order.items.map((item) => (
            <li
              key={item.menuItemId}
              className="flex items-center justify-between gap-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                  <Image
                    src={item.image}
                    alt={item.itemName}
                    fill
                    unoptimized
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
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
      </div>

      <div className="space-y-2 rounded-2xl border border-border bg-muted/30 p-4 text-sm">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span className="font-medium text-foreground tabular-nums">
            ${order.subtotal.toFixed(2)}
          </span>
        </div>
        <Separator />
        <div className="flex items-center justify-between font-heading text-lg font-bold text-foreground">
          <span>Total</span>
          <span className="tabular-nums">${order.total.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Link
          href="/menu"
          className={cn(
            buttonVariants({ variant: "outline", size: "default" }),
            "h-10 rounded-xl bg-background px-4",
          )}
        >
          Continue Browsing
        </Link>

        <Link
          href={`/dashboard/customer/orders/${encodeURIComponent(order.id)}`}
          className={cn(
            buttonVariants({ variant: "default", size: "lg" }),
            "h-11 rounded-xl px-5 font-semibold",
          )}
        >
          <span>View Order Tracking</span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
