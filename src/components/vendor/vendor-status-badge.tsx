import { CheckCircle2, Clock, PauseCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { MenuItemStatus } from "@/lib/menu-api";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  MenuItemStatus,
  {
    label: string;
    className: string;
    icon: typeof Clock;
  }
> = {
  approved: {
    label: "Approved (Active)",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-200",
    icon: CheckCircle2,
  },
  pending: {
    label: "Pending Review",
    className:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-200",
    icon: Clock,
  },
  rejected: {
    label: "Rejected",
    className:
      "border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/50",
    icon: XCircle,
  },
  inactive: {
    label: "Inactive",
    className: "border-border bg-muted text-muted-foreground",
    icon: PauseCircle,
  },
};

export function VendorStatusBadge({
  status,
  compact = false,
}: {
  status: MenuItemStatus;
  compact?: boolean;
}) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = config.icon;
  const label = compact && status === "approved" ? "Active" : config.label;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className,
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </Badge>
  );
}
