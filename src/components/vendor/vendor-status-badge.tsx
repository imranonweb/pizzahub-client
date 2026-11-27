"use client";

import { CheckCircle2, Clock, PauseCircle, XCircle } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import { Badge } from "@/components/ui/badge";
import { translateMenuStatus } from "@/lib/i18n/translations";
import type { MenuItemStatus } from "@/lib/menu-api";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<
  MenuItemStatus,
  {
    className: string;
    icon: typeof Clock;
  }
> = {
  approved: {
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-200",
    icon: CheckCircle2,
  },
  pending: {
    className:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-200",
    icon: Clock,
  },
  rejected: {
    className:
      "border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/50",
    icon: XCircle,
  },
  inactive: {
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
  const { locale } = useLanguage();
  const config = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
  const Icon = config.icon;
  const label = translateMenuStatus(status, locale, compact);

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
