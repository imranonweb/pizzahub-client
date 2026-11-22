"use client";

import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Crown,
  ShoppingBag,
  Sparkles,
  Truck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import {
  type AppNotification,
  formatRelativeTime,
} from "@/lib/notifications-api";
import { cn } from "@/lib/utils";

interface NotificationItemProps {
  notification: AppNotification;
  onMarkAsRead?: (id: string) => void;
  onNavigate?: () => void;
  compact?: boolean;
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onNavigate,
  compact = false,
}: NotificationItemProps) {
  const getIcon = () => {
    switch (notification.type) {
      case "order_placed":
      case "new_order":
        return (
          <ShoppingBag className="size-4 text-primary" aria-hidden="true" />
        );
      case "order_status":
        return <Clock className="size-4 text-amber-500" aria-hidden="true" />;
      case "order_delivered":
        return <Truck className="size-4 text-emerald-500" aria-hidden="true" />;
      case "order_cancelled":
      case "vendor_order_cancelled":
        return (
          <XCircle className="size-4 text-destructive" aria-hidden="true" />
        );
      case "menu_approved":
        return (
          <CheckCircle2
            className="size-4 text-emerald-500"
            aria-hidden="true"
          />
        );
      case "menu_rejected":
        return (
          <AlertCircle className="size-4 text-destructive" aria-hidden="true" />
        );
      case "subscription_status":
        return <Crown className="size-4 text-primary" aria-hidden="true" />;
      case "menu_moderation":
        return (
          <ClipboardCheck className="size-4 text-blue-500" aria-hidden="true" />
        );
      default:
        return <Sparkles className="size-4 text-primary" aria-hidden="true" />;
    }
  };

  const handleClick = () => {
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    if (onNavigate) {
      onNavigate();
    }
  };

  const content = (
    <div
      className={cn(
        "group relative flex items-start gap-3 rounded-xl p-3 transition-colors",
        notification.read
          ? "bg-transparent text-muted-foreground hover:bg-muted/50"
          : "bg-primary/5 text-foreground hover:bg-primary/10",
        compact ? "py-2.5 text-xs" : "p-4 text-sm",
      )}
    >
      {/* Type Icon */}
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg border border-border bg-card shadow-2xs",
          compact ? "size-8" : "size-10",
        )}
      >
        {getIcon()}
      </div>

      {/* Text Info */}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              "truncate font-medium text-foreground",
              !notification.read && "font-semibold",
              compact ? "text-xs" : "text-sm",
            )}
          >
            {notification.title}
          </p>
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {formatRelativeTime(notification.createdAt)}
          </span>
        </div>

        <p
          className={cn(
            "leading-relaxed text-muted-foreground",
            compact ? "line-clamp-2 text-[11px]" : "line-clamp-3 text-xs",
          )}
        >
          {notification.message}
        </p>

        {/* Metadata tag if any */}
        {notification.metadata?.orderNumber ? (
          <span className="inline-block rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            Order #{String(notification.metadata.orderNumber)}
          </span>
        ) : null}
      </div>

      {/* Read Status Dot or Chevron */}
      <div className="flex shrink-0 items-center gap-1.5 pt-1">
        {!notification.read ? (
          <>
            <span
              className="size-2 rounded-full bg-primary"
              aria-hidden="true"
            />
            <span className="sr-only">Unread notification</span>
          </>
        ) : null}

        {notification.link ? (
          <ChevronRight
            className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        ) : null}
      </div>
    </div>
  );

  if (notification.link) {
    return (
      <Link
        href={notification.link}
        onClick={handleClick}
        className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full text-left cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {content}
    </button>
  );
}
