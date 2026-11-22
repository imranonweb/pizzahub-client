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
import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/lib/order-rules";
import { cn } from "@/lib/utils";

const ORDER_STATUS_META: Record<
  OrderStatus,
  {
    label: string;
    description: string;
    className: string;
    icon: typeof Clock;
  }
> = {
  pending: {
    label: "Pending",
    description: "Waiting for the kitchen to confirm your order.",
    className:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-200",
    icon: Clock,
  },
  accepted: {
    label: "Accepted",
    description: "The vendor confirmed and queued your order.",
    className:
      "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800/60 dark:bg-sky-950/50 dark:text-sky-200",
    icon: ThumbsUp,
  },
  preparing: {
    label: "Preparing",
    description: "Your pizza is being stretched and baked fresh.",
    className:
      "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800/60 dark:bg-orange-950/50 dark:text-orange-200",
    icon: ChefHat,
  },
  ready: {
    label: "Ready",
    description: "Hot out of the oven and packed for dispatch.",
    className:
      "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-800/60 dark:bg-indigo-950/50 dark:text-indigo-200",
    icon: PackageCheck,
  },
  out_for_delivery: {
    label: "Out for Delivery",
    description: "On the way to your delivery address.",
    className:
      "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-800/60 dark:bg-violet-950/50 dark:text-violet-200",
    icon: Truck,
  },
  delivered: {
    label: "Delivered",
    description: "Completed and delivered to your address.",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-200",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    description: "The vendor could not fulfill this order.",
    className:
      "border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/50",
    icon: XCircle,
  },
  cancelled: {
    label: "Cancelled",
    description: "Cancelled before kitchen acceptance.",
    className: "border-border bg-muted text-muted-foreground",
    icon: Ban,
  },
};

export function getOrderStatusMeta(status: OrderStatus) {
  return ORDER_STATUS_META[status] ?? ORDER_STATUS_META.pending;
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const meta = getOrderStatusMeta(status);
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
