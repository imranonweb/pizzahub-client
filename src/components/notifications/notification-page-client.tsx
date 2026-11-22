"use client";

import {
  Bell,
  CheckCheck,
  ClipboardCheck,
  Info,
  LogIn,
  RotateCw,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useNotifications } from "@/components/providers/notification-provider";
import { useAuthSession } from "@/components/providers/session-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getNotificationCategory } from "@/lib/notifications-api";
import { cn } from "@/lib/utils";
import { NotificationItem } from "./notification-item";

export function NotificationPageClient() {
  const { isAuthenticated, role, isLoading: authLoading } = useAuthSession();
  const {
    notifications,
    unreadCount,
    isLoading: notifLoading,
    isRefetching,
    markAsRead,
    markAllAsRead,
    refresh,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<
    "all" | "unread" | "orders" | "kitchen" | "moderation"
  >("all");

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (activeTab === "unread") {
        return !item.read;
      }
      if (activeTab === "orders") {
        return getNotificationCategory(item.type) === "orders";
      }
      if (activeTab === "kitchen") {
        return getNotificationCategory(item.type) === "kitchen";
      }
      if (activeTab === "moderation") {
        return getNotificationCategory(item.type) === "moderation";
      }
      return true;
    });
  }, [notifications, activeTab]);

  const isLoading = authLoading || notifLoading;

  // Unauthenticated State
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
                ? "Monitor new customer orders, dish approvals, and kitchen subscription notices."
                : role === "admin"
                  ? "Platform moderation reviews, vendor submissions, and system events."
                  : "View real-time updates and account activity."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isRefetching || isLoading}
            onClick={() => void refresh()}
            className="h-9 rounded-xl bg-card px-3 text-xs font-medium"
          >
            <RotateCw
              className={cn("size-3.5", isRefetching && "animate-spin")}
              aria-hidden="true"
            />
            Refresh
          </Button>

          {unreadCount > 0 ? (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => void markAllAsRead()}
              className="h-9 rounded-xl px-3.5 text-xs font-semibold"
            >
              <CheckCheck className="size-3.5" aria-hidden="true" />
              Mark all as read
            </Button>
          ) : null}
        </div>
      </div>

      {/* Honest Backend Service Status Notice */}
      <div className="mt-6">
        <Alert className="rounded-2xl border-primary/25 bg-accent/50">
          <Info className="size-4 text-primary" aria-hidden="true" />
          <AlertTitle className="text-xs font-semibold sm:text-sm">
            Notification Service Status
          </AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground sm:text-sm">
            PizzaHub&apos;s Express server (
            <code className="font-mono text-xs text-foreground">
              D:\PizzaHub-server
            </code>
            ) currently operates in demo mode without notification endpoints.
            Live event streams, order dispatch notifications, and admin
            moderation alerts are structured and will automatically connect once
            the server notification module is live.
          </AlertDescription>
        </Alert>
      </div>

      {/* Filter Tabs */}
      <div className="mt-6 flex flex-wrap items-center gap-1.5 border-b border-border/70 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={cn(
            "rounded-xl px-3 py-1.5 text-xs font-medium transition-colors",
            activeTab === "all"
              ? "bg-foreground text-background font-semibold shadow-2xs"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          All ({notifications.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("unread")}
          className={cn(
            "rounded-xl px-3 py-1.5 text-xs font-medium transition-colors",
            activeTab === "unread"
              ? "bg-foreground text-background font-semibold shadow-2xs"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          Unread ({unreadCount})
        </button>

        {role === "customer" || role === "vendor" ? (
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={cn(
              "flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors",
              activeTab === "orders"
                ? "bg-foreground text-background font-semibold shadow-2xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <ShoppingBag className="size-3" aria-hidden="true" />
            Orders
          </button>
        ) : null}

        {role === "vendor" ? (
          <button
            type="button"
            onClick={() => setActiveTab("kitchen")}
            className={cn(
              "flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors",
              activeTab === "kitchen"
                ? "bg-foreground text-background font-semibold shadow-2xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <UtensilsCrossed className="size-3" aria-hidden="true" />
            Kitchen & Menu
          </button>
        ) : null}

        {role === "admin" ? (
          <button
            type="button"
            onClick={() => setActiveTab("moderation")}
            className={cn(
              "flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors",
              activeTab === "moderation"
                ? "bg-foreground text-background font-semibold shadow-2xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <ClipboardCheck className="size-3" aria-hidden="true" />
            Moderation & System
          </button>
        ) : null}
      </div>

      {/* Notifications List */}
      <div className="mt-6 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Bell
                className="size-6 text-muted-foreground/60"
                aria-hidden="true"
              />
            </div>
            <h2 className="mt-4 font-heading text-lg font-semibold text-foreground">
              {activeTab === "unread"
                ? "No unread notifications"
                : "No notifications found"}
            </h2>
            <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
              {activeTab === "unread"
                ? "You are all caught up! When new orders, approvals, or updates occur, they will appear here."
                : "Notifications relevant to your account will be displayed here as events happen."}
            </p>

            {role === "customer" ? (
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
          <div className="space-y-2">
            {filteredNotifications.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
              >
                <NotificationItem
                  notification={item}
                  compact={false}
                  onMarkAsRead={markAsRead}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
