"use client";

import {
  AlertCircle,
  Bell,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  LogIn,
  RotateCw,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useNotifications } from "@/components/providers/notification-provider";
import { useAuthSession } from "@/components/providers/session-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import {
  type AppNotification,
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationListResponse,
  type NotificationType,
} from "@/lib/notifications-api";
import { cn } from "@/lib/utils";
import { NotificationItem } from "./notification-item";

const ITEMS_PER_PAGE = 10;

interface TypeOption {
  value: NotificationType | "all";
  label: string;
}

const CUSTOMER_TYPE_OPTIONS: TypeOption[] = [
  { value: "all", label: "All Categories" },
  { value: "order_placed", label: "Orders · Placed" },
  { value: "order_status", label: "Orders · Status Updates" },
  { value: "order_delivered", label: "Orders · Delivered" },
  { value: "order_cancelled", label: "Orders · Cancelled" },
];

const VENDOR_TYPE_OPTIONS: TypeOption[] = [
  { value: "all", label: "All Categories" },
  { value: "new_order", label: "Orders · New Orders" },
  { value: "vendor_order_cancelled", label: "Orders · Cancelled" },
  { value: "menu_approved", label: "Menu Moderation · Approved" },
  { value: "menu_rejected", label: "Menu Moderation · Rejected" },
  { value: "subscription_status", label: "Subscriptions · Billing & Plans" },
];

const ADMIN_TYPE_OPTIONS: TypeOption[] = [
  { value: "all", label: "All Categories" },
  { value: "menu_moderation", label: "Menu Moderation" },
  { value: "platform_event", label: "Platform Events" },
];

export function NotificationPageClient() {
  const { isAuthenticated, role, isLoading: authLoading } = useAuthSession();
  const { refresh: refreshGlobalUnread } = useNotifications();

  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedType, setSelectedType] = useState<NotificationType | "all">(
    "all",
  );
  const [page, setPage] = useState(1);

  const [pageData, setPageData] = useState<NotificationListResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const typeOptions =
    role === "vendor"
      ? VENDOR_TYPE_OPTIONS
      : role === "admin"
        ? ADMIN_TYPE_OPTIONS
        : CUSTOMER_TYPE_OPTIONS;

  const loadPage = useCallback(
    async (isBackground = false) => {
      if (authLoading || !isAuthenticated) {
        return;
      }

      if (isBackground) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const res = await fetchNotifications({
          unreadOnly,
          type: selectedType,
          page,
          limit: ITEMS_PER_PAGE,
        });
        setPageData(res);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [authLoading, isAuthenticated, unreadOnly, selectedType, page],
  );

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      void loadPage(false);
    }
  }, [authLoading, isAuthenticated, loadPage]);

  const handleMarkOneRead = async (id: string) => {
    const res = await markNotificationAsRead(id);
    if (!res.ok) {
      toast.add({
        title: "Could not mark notification as read",
        description: res.message,
        type: "error",
      });
      return;
    }

    setPageData((prev) => {
      if (!prev) return prev;
      let wasUnread = false;
      const updatedItems: AppNotification[] = prev.items.map((item) => {
        if (item.id === id) {
          if (!item.read) wasUnread = true;
          return res.notification ?? { ...item, read: true };
        }
        return item;
      });
      return {
        ...prev,
        items: updatedItems,
        unreadCount: wasUnread
          ? Math.max(0, prev.unreadCount - 1)
          : prev.unreadCount,
      };
    });

    await refreshGlobalUnread();
  };

  const handleMarkAllRead = async () => {
    if (isMarkingAll) return;
    setIsMarkingAll(true);
    try {
      const res = await markAllNotificationsAsRead();
      if (!res.ok) {
        toast.add({
          title: "Could not mark notifications as read",
          description: res.message,
          type: "error",
        });
        return;
      }

      setPageData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((item) => ({ ...item, read: true })),
          unreadCount: 0,
        };
      });

      toast.add({
        title: "Notifications cleared",
        description:
          res.count > 0
            ? `${res.count} ${res.count === 1 ? "notification" : "notifications"} marked as read.`
            : "All notifications are already read.",
        type: "success",
      });

      await refreshGlobalUnread();
    } finally {
      setIsMarkingAll(false);
    }
  };

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl border border-border bg-card shadow-2xs">
          <Bell className="size-6 text-primary" aria-hidden="true" />
        </div>
        <h1 className="mt-4 font-heading text-2xl font-bold tracking-tight text-foreground">
          Sign In to View Notifications
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Notification updates are private and scoped to your customer, vendor,
          or administrator account.
        </p>
        <Button
          render={<Link href="/sign-in" />}
          className="mt-6 h-10 rounded-xl px-5 font-semibold"
        >
          <LogIn className="size-4" aria-hidden="true" />
          Sign In to PizzaHub
        </Button>
      </div>
    );
  }

  const notifications = pageData?.items ?? [];
  const unreadCount = pageData?.unreadCount ?? 0;
  const totalCount = pageData?.totalCount ?? 0;
  const pagination = pageData?.pagination;
  const isUnavailable = pageData?.source === "unavailable";
  const selectedTypeLabel =
    typeOptions.find((opt) => opt.value === selectedType)?.label ??
    "All Categories";

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-heading text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-3xl">
              Notification Center
            </h1>
            {unreadCount > 0 ? (
              <Badge className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
                {unreadCount} unread
              </Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {role === "customer"
              ? "Track order statuses, kitchen confirmations, and delivery updates."
              : role === "vendor"
                ? "Monitor new customer orders, menu moderation outcomes, and Stripe subscription notices."
                : role === "admin"
                  ? "Platform moderation alerts, vendor submissions, and system events."
                  : "View real-time updates and account activity."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isRefreshing || isLoading || authLoading}
            onClick={() => void loadPage(true)}
            className="h-9 rounded-xl bg-card px-3 text-xs font-medium"
          >
            <RotateCw
              className={cn("size-3.5", isRefreshing && "animate-spin")}
              aria-hidden="true"
            />
            Refresh
          </Button>

          {unreadCount > 0 ? (
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={isMarkingAll}
              onClick={() => void handleMarkAllRead()}
              className="h-9 rounded-xl px-3.5 text-xs font-semibold"
            >
              <CheckCheck className="size-3.5" aria-hidden="true" />
              Mark all as read
            </Button>
          ) : null}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setUnreadOnly(false);
              setPage(1);
            }}
            className={cn(
              "rounded-xl px-3 py-1.5 text-xs font-medium transition-colors",
              !unreadOnly
                ? "bg-foreground font-semibold text-background shadow-2xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            All ({totalCount})
          </button>

          <button
            type="button"
            onClick={() => {
              setUnreadOnly(true);
              setPage(1);
            }}
            className={cn(
              "rounded-xl px-3 py-1.5 text-xs font-medium transition-colors",
              unreadOnly
                ? "bg-foreground font-semibold text-background shadow-2xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            Unread ({unreadCount})
          </button>
        </div>

        <div className="w-full sm:w-64">
          <Select
            value={selectedType}
            onValueChange={(value) => {
              setSelectedType((value as NotificationType | "all") || "all");
              setPage(1);
            }}
          >
            <SelectTrigger
              aria-label="Filter notifications by category"
              className="h-9 w-full rounded-xl bg-card px-3 text-xs"
            >
              <SelectValue placeholder="Filter by category">
                {selectedTypeLabel}
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="end">
              {typeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="mt-6 space-y-4">
        {authLoading || isLoading ? (
          <div className="space-y-3" aria-busy="true">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
        ) : isUnavailable ? (
          <Alert variant="destructive" className="rounded-2xl p-6">
            <AlertCircle className="size-5" aria-hidden="true" />
            <AlertTitle className="text-base font-semibold">
              Unable to load notifications
            </AlertTitle>
            <AlertDescription className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm">
                {pageData?.notice ||
                  "Unable to connect to the PizzaHub notification API."}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void loadPage(true)}
                className="shrink-0 rounded-xl bg-background text-foreground"
              >
                <RotateCw className="size-3.5" aria-hidden="true" />
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Bell
                className="size-6 text-muted-foreground/60"
                aria-hidden="true"
              />
            </div>
            <h2 className="mt-4 font-heading text-lg font-semibold text-foreground">
              {unreadOnly
                ? "No unread notifications"
                : selectedType !== "all"
                  ? "No matching notifications"
                  : "No notifications yet"}
            </h2>
            <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
              {unreadOnly
                ? "You are all caught up! When new orders, approvals, or billing updates occur, they will appear here."
                : "Notifications scoped to your account will appear here as activity happens."}
            </p>

            {unreadOnly || selectedType !== "all" ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setUnreadOnly(false);
                  setSelectedType("all");
                  setPage(1);
                }}
                className="mt-5 h-9 rounded-xl bg-background text-xs"
              >
                Reset filters
              </Button>
            ) : role === "customer" ? (
              <Button
                render={<Link href="/menu" />}
                variant="outline"
                size="sm"
                className="mt-5 h-9 rounded-xl bg-background text-xs"
              >
                Browse Menu
              </Button>
            ) : role === "vendor" ? (
              <Button
                render={<Link href="/dashboard/vendor/menu" />}
                variant="outline"
                size="sm"
                className="mt-5 h-9 rounded-xl bg-background text-xs"
              >
                Manage Kitchen Menu
              </Button>
            ) : (
              <Button
                render={<Link href="/dashboard/admin/menu" />}
                variant="outline"
                size="sm"
                className="mt-5 h-9 rounded-xl bg-background text-xs"
              >
                Review Menu Queue
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {notifications.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.025 }}
                >
                  <NotificationItem
                    notification={item}
                    compact={false}
                    onMarkAsRead={(id) => void handleMarkOneRead(id)}
                  />
                </motion.div>
              ))}
            </div>

            {pagination && pagination.totalPages > 1 ? (
              <nav
                aria-label="Notification pagination"
                className="flex flex-wrap items-center justify-between gap-4 border-t border-border/70 pt-6"
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
                  ({pagination.total} matching)
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
      </div>
    </div>
  );
}
