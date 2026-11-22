"use client";

import {
  AlertCircle,
  Bell,
  CheckCheck,
  ExternalLink,
  RotateCw,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useNotifications } from "@/components/providers/notification-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { NotificationItem } from "./notification-item";

interface NotificationDropdownProps {
  onClose?: () => void;
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    isRefetching,
    source,
    notice,
    markAsRead,
    markAllAsRead,
    refresh,
  } = useNotifications();

  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const filteredItems = notifications.filter((item) => {
    if (filter === "unread") {
      return !item.read;
    }
    return true;
  });

  const displayedItems = filteredItems.slice(0, 5);

  const handleMarkAll = async () => {
    if (isMarkingAll) return;
    setIsMarkingAll(true);
    try {
      await markAllAsRead();
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-popover shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="font-heading text-sm font-semibold text-foreground">
            Notifications
          </h2>
          {unreadCount > 0 ? (
            <Badge className="h-5 rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
              {unreadCount}
            </Badge>
          ) : null}
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={isRefetching || isLoading}
            onClick={() => void refresh()}
            aria-label="Refresh notifications"
            className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <RotateCw
              className={cn("size-3.5", isRefetching && "animate-spin")}
              aria-hidden="true"
            />
          </Button>

          {unreadCount > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isMarkingAll}
              onClick={() => void handleMarkAll()}
              className="h-7 rounded-lg px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <CheckCheck
                className="size-3.5 text-primary"
                aria-hidden="true"
              />
              Mark all read
            </Button>
          ) : null}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 border-b border-border/60 bg-muted/30 px-3 py-1.5">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={cn(
            "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
            filter === "all"
              ? "bg-background font-semibold text-foreground shadow-2xs"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Recent ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("unread")}
          className={cn(
            "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
            filter === "unread"
              ? "bg-background font-semibold text-foreground shadow-2xs"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Content Area */}
      <div className="max-h-80 overflow-y-auto p-2">
        {isLoading ? (
          <div className="space-y-2 p-2">
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
          </div>
        ) : source === "unavailable" && notifications.length === 0 ? (
          <div className="space-y-3 p-3">
            <Alert variant="destructive" className="rounded-xl p-3 text-xs">
              <AlertCircle className="size-3.5" aria-hidden="true" />
              <AlertTitle className="text-xs font-semibold">
                Notifications Unavailable
              </AlertTitle>
              <AlertDescription className="text-[11px] leading-relaxed">
                {notice || "Unable to reach the PizzaHub notification API."}
              </AlertDescription>
            </Alert>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isRefetching}
              onClick={() => void refresh()}
              className="h-8 w-full rounded-xl bg-card text-xs"
            >
              <RotateCw
                className={cn("size-3", isRefetching && "animate-spin")}
                aria-hidden="true"
              />
              Retry
            </Button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Bell
              className="size-8 text-muted-foreground/40"
              aria-hidden="true"
            />
            <p className="mt-2 text-xs font-medium text-foreground">
              {filter === "unread"
                ? "No unread notifications"
                : "No notifications yet"}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {filter === "unread"
                ? "You are all caught up!"
                : "You will be alerted about orders, moderation, and kitchen updates."}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {displayedItems.map((item) => (
              <NotificationItem
                key={item.id}
                notification={item}
                compact={true}
                onMarkAsRead={(id) => void markAsRead(id)}
                onNavigate={onClose}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border/80 bg-muted/20 p-2 text-center">
        <Link
          href="/notifications"
          onClick={onClose}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          <span>View all notifications</span>
          <ExternalLink className="size-3" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
