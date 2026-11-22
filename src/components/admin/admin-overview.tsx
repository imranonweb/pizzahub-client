"use client";

import {
  Activity,
  AlertCircle,
  ChefHat,
  ClipboardCheck,
  Clock,
  Info,
  RotateCw,
  ShieldCheck,
  ShoppingBag,
  Store,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type AdminOverviewResponse,
  fetchAdminOverview,
} from "@/lib/admin-api";
import { useAdminProfile } from "./admin-dashboard-shell";

function formatUtcTimestamp(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime()) || parsed.getTime() === 0) {
    return "Date unavailable";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(parsed);
}

export function AdminOverview() {
  const user = useAdminProfile();
  const [data, setData] = useState<AdminOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetchAdminOverview();
      setData(response);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load admin platform overview.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const isLiveStats = data?.source === "live" && data.stats !== null;
  const stats = data?.stats;

  const kpiCards = [
    {
      label: "Total Users",
      value: isLiveStats && stats ? String(stats.totalUsers) : "—",
      caption: isLiveStats ? "All registered accounts" : "Awaiting admin API",
      icon: Users,
    },
    {
      label: "Customers",
      value: isLiveStats && stats ? String(stats.totalCustomers) : "—",
      caption: isLiveStats ? "Ordering accounts" : "Awaiting admin API",
      icon: ShoppingBag,
    },
    {
      label: "Total Vendors",
      value: isLiveStats && stats ? String(stats.totalVendors) : "—",
      caption: isLiveStats
        ? "Registered kitchen partners"
        : "Awaiting admin API",
      icon: ChefHat,
    },
    {
      label: "Active Vendors",
      value: isLiveStats && stats ? String(stats.activeVendors) : "—",
      caption: isLiveStats ? "Unblocked vendors" : "Awaiting admin API",
      icon: Store,
    },
    {
      label: "Total Menu Items",
      value: isLiveStats && stats ? String(stats.totalMenuItems) : "—",
      caption: isLiveStats
        ? "Submissions across kitchens"
        : "Awaiting admin API",
      icon: UtensilsCrossed,
    },
    {
      label: "Pending Menu Approvals",
      value: isLiveStats && stats ? String(stats.pendingMenuApprovals) : "—",
      caption: isLiveStats
        ? "Listings waiting for review"
        : "Awaiting admin API",
      icon: Clock,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 border-b border-border/70 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="font-heading text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-3xl">
            Welcome back, {user.name}
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Oversee PizzaHub menu moderation, account status controls, and
            platform health.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            render={<Link href="/dashboard/admin/users" />}
            variant="outline"
            className="h-10 rounded-xl bg-card px-4 font-medium"
          >
            <Users className="size-4" aria-hidden="true" />
            User Management
          </Button>
          <Button
            render={<Link href="/dashboard/admin/menu" />}
            className="h-10 rounded-xl px-4 font-semibold"
          >
            <ClipboardCheck className="size-4" aria-hidden="true" />
            Review Menu Queue
          </Button>
        </div>
      </div>

      {data?.source === "unavailable" && data.notice ? (
        <Alert className="rounded-2xl bg-accent/65 p-4">
          <Info className="size-4 text-primary" aria-hidden="true" />
          <AlertTitle>Admin Analytics Backend Pending</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>{data.notice}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadOverview()}
              className="rounded-xl bg-card"
            >
              <RotateCw className="size-3.5" aria-hidden="true" />
              Retry API
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {errorMessage ? (
        <Alert variant="destructive" className="rounded-2xl p-4">
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertTitle>Unable to load platform overview</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>{errorMessage}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadOverview()}
              className="rounded-xl bg-background text-foreground"
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <section
        aria-label="Platform statistics"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {isLoading
          ? kpiCards.map((card) => (
              <Skeleton
                key={card.label}
                className="h-32 rounded-2xl border border-border"
              />
            ))
          : kpiCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.24,
                    delay: index * 0.04,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      {card.label}
                    </span>
                    <span className="flex size-8 items-center justify-center rounded-xl bg-muted text-primary">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="mt-4 space-y-1">
                    <p className="font-heading text-3xl font-bold tracking-tight text-foreground tabular-nums">
                      {card.value}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {card.caption}
                    </p>
                  </div>
                </motion.div>
              );
            })}
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        <section
          aria-labelledby="recent-platform-activity-heading"
          className="rounded-2xl border border-border bg-card p-6 lg:col-span-7"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-4">
            <div className="space-y-0.5">
              <h2
                id="recent-platform-activity-heading"
                className="font-heading text-lg font-semibold text-foreground"
              >
                Recent Platform Activity
              </h2>
              <p className="text-sm text-muted-foreground">
                Moderation actions and account updates across PizzaHub.
              </p>
            </div>
            <Activity
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
          </div>

          {isLoading ? (
            <div className="mt-4 space-y-3">
              <Skeleton className="h-14 rounded-xl" />
              <Skeleton className="h-14 rounded-xl" />
              <Skeleton className="h-14 rounded-xl" />
            </div>
          ) : data?.source !== "live" ? (
            <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
              <p className="font-heading text-base font-semibold text-foreground">
                Activity feed unavailable
              </p>
              <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
                Real platform events will appear here once{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                  GET /api/admin/overview
                </code>{" "}
                is available on the Express server.
              </p>
            </div>
          ) : data.recentActivity.length === 0 ? (
            <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
              <p className="font-heading text-base font-semibold text-foreground">
                No recent platform events recorded
              </p>
              <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
                Moderation decisions and account status updates will log here as
                activity occurs.
              </p>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-border/70">
              {data.recentActivity.slice(0, 6).map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-start justify-between gap-2 py-3 text-sm"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="font-medium text-foreground">
                      {entry.summary}
                    </p>
                    {entry.actorName || entry.targetLabel ? (
                      <p className="text-xs text-muted-foreground">
                        {[entry.actorName, entry.targetLabel]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {formatUtcTimestamp(entry.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          aria-labelledby="admin-governance-heading"
          className="flex flex-col justify-between gap-5 rounded-2xl border border-border bg-card p-6 lg:col-span-5"
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h2
                  id="admin-governance-heading"
                  className="font-heading text-lg font-semibold text-foreground"
                >
                  Governance & Security Rules
                </h2>
                <p className="text-sm text-muted-foreground">
                  Platform moderation and access safeguards active in this
                  workspace.
                </p>
              </div>
              <ShieldCheck
                className="size-5 shrink-0 text-primary"
                aria-hidden="true"
              />
            </div>

            <ul className="space-y-2.5 text-xs leading-relaxed text-muted-foreground">
              <li className="rounded-xl border border-border/80 bg-background p-3">
                <span className="font-semibold text-foreground">
                  Admin-only moderation:
                </span>{" "}
                New items stay Pending until reviewed; rejected listings remain
                hidden from the public menu.
              </li>
              <li className="rounded-xl border border-border/80 bg-background p-3">
                <span className="font-semibold text-foreground">
                  Account protection:
                </span>{" "}
                Self-blocking your own admin session and public role escalation
                are blocked in both UI and auth hooks.
              </li>
              <li className="rounded-xl border border-border/80 bg-background p-3">
                <span className="font-semibold text-foreground">
                  Server authorization:
                </span>{" "}
                Express endpoints must independently verify Bearer JWTs and
                current database roles before executing changes.
              </li>
            </ul>
          </div>

          <div className="grid gap-2.5 border-t border-border/70 pt-4 sm:grid-cols-2">
            <Button
              render={<Link href="/dashboard/admin/menu" />}
              variant="outline"
              size="sm"
              className="h-9 rounded-xl bg-background"
            >
              Menu Moderation
            </Button>
            <Button
              render={<Link href="/dashboard/admin/users" />}
              variant="outline"
              size="sm"
              className="h-9 rounded-xl bg-background"
            >
              User Management
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
