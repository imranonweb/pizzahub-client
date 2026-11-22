"use client";

import {
  AlertCircle,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Crown,
  Eye,
  Info,
  Loader2,
  Lock,
  RotateCcw,
  RotateCw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import {
  type AdminUsersListResponse,
  fetchAdminUsers,
  updateAdminUserBlockStatus,
} from "@/lib/admin-api";
import {
  type AdminUserRecord,
  type AdminUserRoleFilter,
  type AdminUserStatusFilter,
  canAdminToggleUserBlock,
  filterAdminUsers,
} from "@/lib/admin-rules";
import type { PizzaHubRole } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useAdminProfile } from "./admin-dashboard-shell";

const PAGE_SIZE = 8;

const ROLE_LABELS: Record<AdminUserRoleFilter, string> = {
  all: "All roles",
  customer: "Customers",
  vendor: "Vendors",
  admin: "Administrators",
};

const STATUS_TABS: { value: AdminUserStatusFilter; label: string }[] = [
  { value: "all", label: "All accounts" },
  { value: "active", label: "Active" },
  { value: "blocked", label: "Blocked" },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "US";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatUtcDate(iso: string | null): string {
  if (!iso) return "—";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime()) || parsed.getTime() === 0) {
    return "Date unavailable";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

function RoleBadge({ role }: { role: PizzaHubRole }) {
  if (role === "admin") {
    return (
      <Badge className="gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
        <ShieldCheck className="size-3" aria-hidden="true" />
        Admin
      </Badge>
    );
  }
  if (role === "vendor") {
    return (
      <Badge
        variant="secondary"
        className="rounded-full px-2.5 py-0.5 text-xs font-medium"
      >
        Vendor
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="rounded-full px-2.5 py-0.5 text-xs font-medium"
    >
      Customer
    </Badge>
  );
}

function AccountStatusBadge({ isBlocked }: { isBlocked: boolean }) {
  if (isBlocked) {
    return (
      <Badge
        variant="destructive"
        className="gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
      >
        <Ban className="size-3" aria-hidden="true" />
        Blocked
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="gap-1 rounded-full border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-200"
    >
      <CheckCircle2 className="size-3" aria-hidden="true" />
      Active
    </Badge>
  );
}

export function AdminUserManagement() {
  const currentAdmin = useAdminProfile();

  const [data, setData] = useState<AdminUsersListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<AdminUserRoleFilter>("all");
  const [accountStatusFilter, setAccountStatusFilter] =
    useState<AdminUserStatusFilter>("all");
  const [page, setPage] = useState(1);

  const [inspectUser, setInspectUser] = useState<AdminUserRecord | null>(null);
  const [toggleTarget, setToggleTarget] = useState<AdminUserRecord | null>(
    null,
  );
  const [isUpdating, setIsUpdating] = useState(false);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetchAdminUsers();
      setData(response);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load platform user accounts.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const isBackendLive = data?.source === "live";
  const allUsers = data?.users ?? [];
  const counts = data?.counts;

  const filtered = filterAdminUsers(allUsers, {
    search,
    role: roleFilter,
    accountStatus: accountStatusFilter,
    page,
    pageSize: PAGE_SIZE,
  });

  const hasActiveFilters = Boolean(
    search.trim() || roleFilter !== "all" || accountStatusFilter !== "all",
  );

  const resetFilters = () => {
    setSearch("");
    setRoleFilter("all");
    setAccountStatusFilter("all");
    setPage(1);
  };

  const handleConfirmBlockToggle = async () => {
    if (!toggleTarget || isUpdating) return;

    const nextBlocked = !toggleTarget.isBlocked;
    const check = canAdminToggleUserBlock({
      actorId: currentAdmin.id,
      actorRole: currentAdmin.role,
      actorBlocked: false,
      targetUserId: toggleTarget.id,
      targetRole: toggleTarget.role,
      nextBlocked,
    });

    if (!check.allowed) {
      toast.add({
        title: "Action blocked",
        description: check.reason ?? "This account action is not allowed.",
        type: "warning",
      });
      setToggleTarget(null);
      return;
    }

    setIsUpdating(true);
    try {
      const result = await updateAdminUserBlockStatus(
        toggleTarget.id,
        nextBlocked,
      );
      if (!result.ok) {
        toast.add({
          title:
            result.reason === "backend-unavailable"
              ? "User management API not implemented yet"
              : "Could not update user status",
          description: result.message,
          type: result.reason === "backend-unavailable" ? "warning" : "error",
        });
        return;
      }

      toast.add({
        title: nextBlocked ? "Account blocked" : "Account unblocked",
        description: result.message,
        type: "success",
      });
      setToggleTarget(null);
      setInspectUser(null);
      await loadUsers();
    } finally {
      setIsUpdating(false);
    }
  };

  const getTabCount = (tab: AdminUserStatusFilter): number | null => {
    if (!isBackendLive || !counts) return null;
    if (tab === "all") return counts.total;
    if (tab === "active") return counts.active;
    return counts.blocked;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border/70 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-heading text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-3xl">
              User Management
            </h1>
            <Badge
              variant="secondary"
              className="rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums"
            >
              {isBackendLive && counts
                ? `${counts.total} accounts · ${counts.blocked} blocked`
                : "Platform accounts"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Search platform accounts, inspect vendor subscription tiers, and
            enforce blocked-account access restrictions.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isLoading}
          onClick={() => void loadUsers()}
          className="h-10 w-fit rounded-xl bg-card px-4"
        >
          <RotateCw
            className={cn("size-4", isLoading && "animate-spin")}
            aria-hidden="true"
          />
          Refresh Users
        </Button>
      </div>

      {data?.source === "unavailable" && data.notice ? (
        <Alert className="rounded-2xl bg-accent/65 p-4">
          <Info className="size-4 text-primary" aria-hidden="true" />
          <AlertTitle>Admin User Management API Pending</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>{data.notice}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadUsers()}
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
          <AlertTitle>Failed to load users</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>{errorMessage}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadUsers()}
              className="rounded-xl bg-background text-foreground"
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              aria-label="Search platform users"
              placeholder="Search by name, email, or vendor business name..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="h-10 rounded-xl bg-background pr-10 pl-10"
            />
            {search ? (
              <button
                type="button"
                aria-label="Clear search query"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            ) : null}
          </div>

          <Select
            value={roleFilter}
            onValueChange={(next) => {
              const normalized =
                next === "customer" || next === "vendor" || next === "admin"
                  ? next
                  : "all";
              setRoleFilter(normalized);
              setPage(1);
            }}
          >
            <SelectTrigger
              aria-label="Filter users by role"
              className="h-10 w-full rounded-xl bg-background px-3.5"
            >
              <SelectValue placeholder="All roles">
                {ROLE_LABELS[roleFilter]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="end" alignItemWithTrigger={false}>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="customer">Customers</SelectItem>
              <SelectItem value="vendor">Vendors</SelectItem>
              <SelectItem value="admin">Administrators</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <fieldset className="flex flex-wrap items-center justify-between gap-3 border-0 border-t border-border/70 p-0 pt-3.5">
          <legend className="sr-only">Filter users by account status</legend>
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_TABS.map((tab) => {
              const active = accountStatusFilter === tab.value;
              const count = getTabCount(tab.value);
              return (
                <button
                  key={tab.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setAccountStatusFilter(tab.value);
                    setPage(1);
                  }}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-foreground/25 hover:text-foreground",
                  )}
                >
                  <span>{tab.label}</span>
                  {count !== null ? (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
                        active
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-muted text-foreground",
                      )}
                    >
                      {count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-8 rounded-lg px-2.5 text-xs font-medium text-primary hover:text-primary"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Reset filters
            </Button>
          ) : null}
        </fieldset>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 rounded-2xl border border-border" />
          <Skeleton className="h-16 rounded-2xl border border-border" />
          <Skeleton className="h-16 rounded-2xl border border-border" />
        </div>
      ) : !isBackendLive ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <h2 className="font-heading text-xl font-semibold text-foreground">
            User directory unavailable
          </h2>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">
            Account records and block controls require{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
              GET /api/admin/users
            </code>{" "}
            and{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
              PATCH /api/admin/users/:id/block
            </code>{" "}
            on the Express server. Admin role changes remain restricted server
            side to prevent privilege escalation.
          </p>
        </div>
      ) : allUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <h2 className="font-heading text-xl font-semibold text-foreground">
            No user accounts found
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Registered platform accounts will appear here once created.
          </p>
        </div>
      ) : filtered.users.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <h2 className="font-heading text-xl font-semibold text-foreground">
            No matching accounts
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Clear your search query or filters to view all {allUsers.length}{" "}
            accounts.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={resetFilters}
            className="mt-5 h-10 rounded-xl bg-background px-5"
          >
            Reset all filters
          </Button>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-2xs md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/35 hover:bg-muted/35">
                  <TableHead className="pl-5">User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Kitchen & Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="pr-5 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.users.map((row) => {
                  const isSelf = row.id === currentAdmin.id;
                  const blockCheck = canAdminToggleUserBlock({
                    actorId: currentAdmin.id,
                    actorRole: currentAdmin.role,
                    actorBlocked: false,
                    targetUserId: row.id,
                    targetRole: row.role,
                    nextBlocked: !row.isBlocked,
                  });

                  return (
                    <TableRow key={row.id}>
                      <TableCell className="pl-5">
                        <div className="flex items-center gap-3">
                          <Avatar size="default">
                            {row.image ? (
                              <AvatarImage src={row.image} alt={row.name} />
                            ) : null}
                            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                              {getInitials(row.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-medium text-foreground">
                                {row.name}
                              </span>
                              {isSelf ? (
                                <Badge
                                  variant="secondary"
                                  className="rounded-full px-2 py-0 text-[10px] font-semibold"
                                >
                                  You
                                </Badge>
                              ) : null}
                            </div>
                            <p className="truncate text-xs text-muted-foreground">
                              {row.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <RoleBadge role={row.role} />
                      </TableCell>
                      <TableCell>
                        {row.role === "vendor" ? (
                          <div className="space-y-0.5">
                            <p className="text-xs font-medium text-foreground">
                              {row.businessName || "No business name"}
                            </p>
                            <p className="inline-flex items-center gap-1 text-xs text-muted-foreground capitalize">
                              {row.subscriptionPlan === "premium" ? (
                                <Crown
                                  className="size-3 text-primary"
                                  aria-hidden="true"
                                />
                              ) : null}
                              {row.subscriptionPlan} plan
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <AccountStatusBadge isBlocked={row.isBlocked} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground tabular-nums">
                        {formatUtcDate(row.createdAt)}
                      </TableCell>
                      <TableCell className="pr-5 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setInspectUser(row)}
                            className="h-8 rounded-lg bg-background px-2.5 text-xs"
                          >
                            <Eye className="size-3.5" aria-hidden="true" />
                            Details
                          </Button>

                          {isSelf ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled
                              className="h-8 rounded-lg px-2.5 text-xs"
                            >
                              <Lock className="size-3" aria-hidden="true" />
                              Protected
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant={row.isBlocked ? "default" : "outline"}
                              size="sm"
                              disabled={!blockCheck.allowed || isUpdating}
                              onClick={() => setToggleTarget(row)}
                              className={cn(
                                "h-8 rounded-lg px-2.5 text-xs",
                                !row.isBlocked &&
                                  "border-destructive/35 bg-background text-destructive hover:bg-destructive/10 hover:text-destructive",
                              )}
                            >
                              {row.isBlocked ? "Unblock" : "Block"}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 md:hidden">
            {filtered.users.map((row) => {
              const isSelf = row.id === currentAdmin.id;
              const blockCheck = canAdminToggleUserBlock({
                actorId: currentAdmin.id,
                actorRole: currentAdmin.role,
                actorBlocked: false,
                targetUserId: row.id,
                targetRole: row.role,
                nextBlocked: !row.isBlocked,
              });

              return (
                <article
                  key={row.id}
                  className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar size="default">
                        {row.image ? (
                          <AvatarImage src={row.image} alt={row.name} />
                        ) : null}
                        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                          {getInitials(row.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h2 className="truncate text-sm font-semibold text-foreground">
                            {row.name}
                          </h2>
                          {isSelf ? (
                            <Badge
                              variant="secondary"
                              className="rounded-full px-2 py-0 text-[10px]"
                            >
                              You
                            </Badge>
                          ) : null}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {row.email}
                        </p>
                      </div>
                    </div>

                    <AccountStatusBadge isBlocked={row.isBlocked} />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <RoleBadge role={row.role} />
                    {row.role === "vendor" ? (
                      <span className="capitalize">
                        {row.businessName || "Vendor"} · {row.subscriptionPlan}{" "}
                        plan
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/70 pt-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setInspectUser(row)}
                      className="h-9 rounded-xl bg-background px-3"
                    >
                      <Eye className="size-3.5" aria-hidden="true" />
                      Details
                    </Button>
                    {isSelf ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled
                        className="h-9 rounded-xl px-3"
                      >
                        <Lock className="size-3.5" aria-hidden="true" />
                        Protected
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant={row.isBlocked ? "default" : "outline"}
                        size="sm"
                        disabled={!blockCheck.allowed || isUpdating}
                        onClick={() => setToggleTarget(row)}
                        className={cn(
                          "h-9 rounded-xl px-3.5",
                          !row.isBlocked &&
                            "border-destructive/35 bg-background text-destructive hover:bg-destructive/10 hover:text-destructive",
                        )}
                      >
                        {row.isBlocked ? "Unblock" : "Block"}
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {filtered.totalPages > 1 ? (
            <nav
              aria-label="User directory pagination"
              className="flex flex-wrap items-center justify-between gap-4 border-t border-border/70 pt-5"
            >
              <p className="text-sm text-muted-foreground tabular-nums">
                Page{" "}
                <span className="font-semibold text-foreground">
                  {filtered.page}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-foreground">
                  {filtered.totalPages}
                </span>{" "}
                ({filtered.totalFiltered} matching accounts)
              </p>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={filtered.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-9 rounded-xl bg-card px-3.5"
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={filtered.page >= filtered.totalPages}
                  onClick={() =>
                    setPage((p) => Math.min(filtered.totalPages, p + 1))
                  }
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

      <Dialog
        open={Boolean(inspectUser)}
        onOpenChange={(open) => {
          if (!open) setInspectUser(null);
        }}
      >
        <DialogContent className="rounded-2xl p-6 sm:max-w-lg">
          {inspectUser ? (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="text-xl font-semibold">
                    {inspectUser.name}
                  </DialogTitle>
                  <RoleBadge role={inspectUser.role} />
                  <AccountStatusBadge isBlocked={inspectUser.isBlocked} />
                </div>
                <DialogDescription>{inspectUser.email}</DialogDescription>
              </DialogHeader>

              <dl className="grid gap-3 text-xs sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-background p-3.5">
                  <dt className="font-medium text-muted-foreground">Joined</dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">
                    {formatUtcDate(inspectUser.createdAt)}
                  </dd>
                </div>
                <div className="rounded-xl border border-border bg-background p-3.5">
                  <dt className="font-medium text-muted-foreground">
                    Subscription Plan
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground capitalize">
                    {inspectUser.subscriptionPlan}
                  </dd>
                </div>
                {inspectUser.role === "vendor" ? (
                  <>
                    <div className="rounded-xl border border-border bg-background p-3.5">
                      <dt className="font-medium text-muted-foreground">
                        Business Name
                      </dt>
                      <dd className="mt-1 text-sm font-semibold text-foreground">
                        {inspectUser.businessName || "Not specified"}
                      </dd>
                    </div>
                    <div className="rounded-xl border border-border bg-background p-3.5">
                      <dt className="font-medium text-muted-foreground">
                        Plan Expiry
                      </dt>
                      <dd className="mt-1 text-sm font-semibold text-foreground">
                        {formatUtcDate(inspectUser.subscriptionExpiresAt)}
                      </dd>
                    </div>
                  </>
                ) : null}
              </dl>

              {inspectUser.id === currentAdmin.id ? (
                <Alert className="rounded-xl bg-muted/40">
                  <Lock className="size-4 text-primary" aria-hidden="true" />
                  <AlertTitle>Self-protection active</AlertTitle>
                  <AlertDescription>
                    You cannot block your own active administrator session.
                  </AlertDescription>
                </Alert>
              ) : null}

              <DialogFooter className="-mx-6 -mb-6 rounded-b-2xl px-6 py-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setInspectUser(null)}
                  className="rounded-xl bg-card"
                >
                  Close
                </Button>
                {inspectUser.id !== currentAdmin.id ? (
                  <Button
                    type="button"
                    variant={inspectUser.isBlocked ? "default" : "destructive"}
                    onClick={() => setToggleTarget(inspectUser)}
                    className="rounded-xl"
                  >
                    {inspectUser.isBlocked
                      ? "Unblock Account"
                      : "Block Account"}
                  </Button>
                ) : null}
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(toggleTarget)}
        onOpenChange={(open) => {
          if (!open && !isUpdating) setToggleTarget(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl p-6 sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleTarget?.isBlocked
                ? "Unblock user account?"
                : "Block user account?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleTarget?.isBlocked ? (
                <>
                  Restoring access allows{" "}
                  <strong className="text-foreground">
                    {toggleTarget.name}
                  </strong>{" "}
                  ({toggleTarget.email}) to sign in and use PizzaHub features
                  matching their role.
                </>
              ) : (
                <>
                  Blocking{" "}
                  <strong className="text-foreground">
                    {toggleTarget?.name}
                  </strong>{" "}
                  ({toggleTarget?.email}) immediately prevents them from signing
                  in or accessing protected PizzaHub routes.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="-mx-6 -mb-6 rounded-b-2xl px-6 py-4">
            <AlertDialogCancel
              disabled={isUpdating}
              className="rounded-xl bg-card"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant={toggleTarget?.isBlocked ? "default" : "destructive"}
              disabled={isUpdating}
              onClick={() => void handleConfirmBlockToggle()}
              className="rounded-xl"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Saving...
                </>
              ) : toggleTarget?.isBlocked ? (
                "Confirm Unblock"
              ) : (
                "Confirm Block"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
