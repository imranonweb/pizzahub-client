"use client";

import {
  Ban,
  CheckCircle2,
  ChefHat,
  Clock,
  PackageCheck,
  ThumbsUp,
  Truck,
  XCircle,
} from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import { Badge } from "@/components/ui/badge";
import { type Locale, translateOrderStatus } from "@/lib/i18n/translations";
import type { OrderStatus } from "@/lib/order-rules";
import { cn } from "@/lib/utils";

const ORDER_STATUS_STYLE: Record<
  OrderStatus,
  {
    className: string;
    icon: typeof Clock;
  }
> = {
  pending: {
    className:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-200",
    icon: Clock,
  },
  accepted: {
    className:
      "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800/60 dark:bg-sky-950/50 dark:text-sky-200",
    icon: ThumbsUp,
  },
  preparing: {
    className:
      "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800/60 dark:bg-orange-950/50 dark:text-orange-200",
    icon: ChefHat,
  },
  ready: {
    className:
      "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-800/60 dark:bg-indigo-950/50 dark:text-indigo-200",
    icon: PackageCheck,
  },
  out_for_delivery: {
    className:
      "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-800/60 dark:bg-violet-950/50 dark:text-violet-200",
    icon: Truck,
  },
  delivered: {
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-200",
    icon: CheckCircle2,
  },
  rejected: {
    className:
      "border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/50",
    icon: XCircle,
  },
  cancelled: {
    className: "border-border bg-muted text-muted-foreground",
    icon: Ban,
  },
};

export function getOrderStatusMeta(status: OrderStatus, locale: Locale = "en") {
  const style = ORDER_STATUS_STYLE[status] ?? ORDER_STATUS_STYLE.pending;
  const copy = translateOrderStatus(status, locale);
  return {
    label: copy.label,
    description: copy.description,
    className: style.className,
    icon: style.icon,
  };
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { locale } = useLanguage();
  const meta = getOrderStatusMeta(status, locale);
  const Icon = meta.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        meta.className,
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      <span>{meta.label}</span>
    </Badge>
  );
}
