"use client";

import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Crown,
  Eye,
  Info,
  Loader2,
  MapPin,
  PauseCircle,
  RotateCcw,
  RotateCw,
  Store,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Label } from "@/components/ui/label";
import {
  type SearchSuggestionOption,
  SearchSuggestionsInput,
} from "@/components/ui/search-suggestions-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { VendorStatusBadge } from "@/components/vendor/vendor-status-badge";
import {
  type AdminMenuListResponse,
  deleteAdminMenuItem,
  fetchAdminMenuItems,
  moderateAdminMenuItem,
} from "@/lib/admin-api";
import {
  type AdminMenuStatusFilter,
  type AdminModerationMenuItem,
  canAdminModerateItem,
  filterAdminMenuItems,
  MAX_REJECTION_REASON_LENGTH,
  validateRejectionReason,
} from "@/lib/admin-rules";
import { MENU_CATEGORIES } from "@/lib/menu-api";
import { cn } from "@/lib/utils";
import { useAdminProfile } from "./admin-dashboard-shell";

const PAGE_SIZE = 6;

const STATUS_TABS: { value: AdminMenuStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "inactive", label: "Inactive" },
];

function formatCreatedDate(iso: string): string {
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

export function AdminMenuModeration() {
  const admin = useAdminProfile();
  const [data, setData] = useState<AdminMenuListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [statusFilter, setStatusFilter] =
    useState<AdminMenuStatusFilter>("all");
  const [page, setPage] = useState(1);

  const [inspectItem, setInspectItem] =
    useState<AdminModerationMenuItem | null>(null);
  const [approveTarget, setApproveTarget] =
    useState<AdminModerationMenuItem | null>(null);
  const [rejectTarget, setRejectTarget] =
    useState<AdminModerationMenuItem | null>(null);
  const [deactivateTarget, setDeactivateTarget] =
    useState<AdminModerationMenuItem | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<AdminModerationMenuItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionError, setRejectionError] = useState<string | null>(null);
  const [isModerating, setIsModerating] = useState(false);

  const loadMenuItems = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetchAdminMenuItems();
      setData(response);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load platform menu items for moderation.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMenuItems();
  }, [loadMenuItems]);

  const isBackendLive = data?.source === "live";
  const allItems = data?.items ?? [];
  const counts = data?.counts;

  const moderationSuggestions = useMemo<SearchSuggestionOption[]>(() => {
    const trimmed = search.trim().toLowerCase();
    const matched = trimmed
      ? allItems.filter((item) =>
          `${item.itemName} ${item.vendor.businessName} ${item.location} ${item.category}`
            .toLowerCase()
            .includes(trimmed),
        )
      : allItems;
    return matched.slice(0, 6).map((item) => ({
      id: item.id,
      label: item.itemName,
      value: item.itemName,
      subtitle: `${item.vendor.businessName} · ${item.location}`,
      badge: item.status,
      rightText: `$${item.price.toFixed(2)}`,
      imageUrl: item.images[0] || "/images/auth-pizza-hero.jpg",
    }));
  }, [allItems, search]);

  const filtered = filterAdminMenuItems(allItems, {
    search,
    category,
    status: statusFilter,
    page,
    pageSize: PAGE_SIZE,
  });

  const hasActiveFilters = Boolean(
    search.trim() || category !== "all" || statusFilter !== "all",
  );

  const resetFilters = () => {
    setSearch("");
    setCategory("all");
    setStatusFilter("all");
    setPage(1);
  };

  const openRejectDialog = (item: AdminModerationMenuItem) => {
    setRejectTarget(item);
    setRejectionReason(item.rejectionReason ?? "");
    setRejectionError(null);
  };

  const handleConfirmApprove = async () => {
    if (!approveTarget || isModerating) return;

    const eligibility = canAdminModerateItem({
      actorRole: admin.role,
      actorBlocked: false,
      actorId: admin.id,
      itemVendorId: approveTarget.vendorId,
      itemStatus: approveTarget.status,
      action: "approve",
    });

    if (!eligibility.allowed) {
      toast.add({
        title: "Approval blocked",
        description: eligibility.reason ?? "Action not permitted.",
        type: "warning",
      });
      setApproveTarget(null);
      return;
    }

    setIsModerating(true);
    try {
      const result = await moderateAdminMenuItem(approveTarget.id, "approved");
      if (!result.ok) {
        toast.add({
          title:
            result.reason === "backend-unavailable"
              ? "Moderation service unavailable"
              : "Could not approve listing",
          description: result.message,
          type: result.reason === "backend-unavailable" ? "warning" : "error",
        });
        return;
      }

      toast.add({
        title: "Listing approved",
        description: result.message,
        type: "success",
      });
      setApproveTarget(null);
      setInspectItem(null);
      await loadMenuItems();
    } finally {
      setIsModerating(false);
    }
  };

  const handleConfirmReject = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!rejectTarget || isModerating) return;

    const reasonValidation = validateRejectionReason(rejectionReason);
    if (!reasonValidation.valid) {
      setRejectionError(reasonValidation.error ?? "Invalid rejection reason.");
      return;
    }

    const eligibility = canAdminModerateItem({
      actorRole: admin.role,
      actorBlocked: false,
      actorId: admin.id,
      itemVendorId: rejectTarget.vendorId,
      itemStatus: rejectTarget.status,
      action: "reject",
    });

    if (!eligibility.allowed) {
      toast.add({
        title: "Rejection blocked",
        description: eligibility.reason ?? "Action not permitted.",
        type: "warning",
      });
      setRejectTarget(null);
      return;
    }

    setIsModerating(true);
    try {
      const result = await moderateAdminMenuItem(
        rejectTarget.id,
        "rejected",
        reasonValidation.value || undefined,
      );
      if (!result.ok) {
        toast.add({
          title:
            result.reason === "backend-unavailable"
              ? "Moderation service unavailable"
              : "Could not reject listing",
          description: result.message,
          type: result.reason === "backend-unavailable" ? "warning" : "error",
        });
        return;
      }

      toast.add({
        title: "Listing rejected",
        description: result.message,
        type: "success",
      });
      setRejectTarget(null);
      setInspectItem(null);
      setRejectionReason("");
      await loadMenuItems();
    } finally {
      setIsModerating(false);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivateTarget || isModerating) return;
    setIsModerating(true);
    try {
      const result = await moderateAdminMenuItem(
        deactivateTarget.id,
        "inactive",
      );
      if (!result.ok) {
        toast.add({
          title: "Could not deactivate listing",
          description: result.message,
          type: "error",
        });
        return;
      }
      toast.add({
        title: "Listing deactivated",
        description: result.message,
        type: "success",
      });
      setDeactivateTarget(null);
      setInspectItem(null);
      await loadMenuItems();
    } finally {
      setIsModerating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || isModerating) return;
    setIsModerating(true);
    try {
      const result = await deleteAdminMenuItem(deleteTarget.id);
      if (!result.ok) {
        toast.add({
          title: "Could not delete listing",
          description: result.message,
          type: "error",
        });
        return;
      }
      toast.add({
        title: "Listing deleted",
        description: result.message,
        type: "success",
      });
      setDeleteTarget(null);
      setInspectItem(null);
      await loadMenuItems();
    } finally {
      setIsModerating(false);
    }
  };

  const getTabCount = (tab: AdminMenuStatusFilter): number | null => {
    if (!isBackendLive || !counts) return null;
    return counts[tab];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border/70 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-heading text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-3xl">
              Menu Moderation
            </h1>
            <Badge
              variant="secondary"
              className="rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums"
            >
              {isBackendLive && counts
                ? `${counts.pending} pending approval`
                : "Admin moderation queue"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Review vendor submissions, inspect food imagery, and approve or
            reject menu items before public listing.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isLoading}
          onClick={() => void loadMenuItems()}
          className="h-10 w-fit rounded-xl bg-card px-4"
        >
          <RotateCw
            className={cn("size-4", isLoading && "animate-spin")}
            aria-hidden="true"
          />
          Refresh Queue
        </Button>
      </div>

      {data?.source === "unavailable" && data.notice ? (
        <Alert className="rounded-2xl bg-accent/65 p-4">
          <Info className="size-4 text-primary" aria-hidden="true" />
          <AlertTitle>Admin Menu Moderation API Pending</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>{data.notice}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadMenuItems()}
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
          <AlertTitle>Failed to load moderation queue</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>{errorMessage}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadMenuItems()}
              className="rounded-xl bg-background text-foreground"
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <SearchSuggestionsInput
            value={search}
            onValueChange={(nextValue) => {
              setSearch(nextValue);
              setPage(1);
            }}
            onClear={() => {
              setSearch("");
              setPage(1);
            }}
            suggestions={moderationSuggestions}
            onSelectSuggestion={(option) => {
              setSearch(option.value);
              setPage(1);
            }}
            suggestionHeader="Platform Menu Queue"
            ariaLabel="Search menu submissions"
            clearAriaLabel="Clear search query"
            placeholder="Search by item name, vendor kitchen, or area..."
          />

          <Select
            value={category}
            onValueChange={(next) => {
              setCategory(next || "all");
              setPage(1);
            }}
          >
            <SelectTrigger
              aria-label="Filter moderation queue by category"
              className="h-10 w-full rounded-xl bg-background px-3.5"
            >
              <SelectValue placeholder="All categories">
                {category === "all" ? "All categories" : category}
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="end" alignItemWithTrigger={false}>
              <SelectItem value="all">All categories</SelectItem>
              {MENU_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <fieldset className="flex flex-wrap items-center justify-between gap-3 border-0 border-t border-border/70 p-0 pt-3.5">
          <legend className="sr-only">Filter listings by status</legend>
          <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1 no-scrollbar sm:flex-wrap sm:pb-0">
            {STATUS_TABS.map((tab) => {
              const active = statusFilter === tab.value;
              const count = getTabCount(tab.value);
              return (
                <button
                  key={tab.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setStatusFilter(tab.value);
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
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-2xl border border-border" />
          <Skeleton className="h-40 rounded-2xl border border-border" />
          <Skeleton className="h-40 rounded-2xl border border-border" />
        </div>
      ) : !isBackendLive ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <h2 className="font-heading text-xl font-semibold text-foreground">
            Moderation queue unavailable
          </h2>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">
            No listings can be displayed or moderated yet because{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
              GET /api/admin/menu
            </code>{" "}
            and{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
              PATCH /api/admin/menu/:id/status
            </code>{" "}
            are not implemented on the Express server.
          </p>
        </div>
      ) : allItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <h2 className="font-heading text-xl font-semibold text-foreground">
            No menu items found
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Vendors have not submitted any menu items for review yet.
          </p>
        </div>
      ) : filtered.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <h2 className="font-heading text-xl font-semibold text-foreground">
            No listings match your filters
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Reset your search, category, or status filters to view all{" "}
            {allItems.length} submissions.
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
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {filtered.items.map((item) => {
                const approveCheck = canAdminModerateItem({
                  actorRole: admin.role,
                  actorBlocked: false,
                  actorId: admin.id,
                  itemVendorId: item.vendorId,
                  itemStatus: item.status,
                  action: "approve",
                });
                const rejectCheck = canAdminModerateItem({
                  actorRole: admin.role,
                  actorBlocked: false,
                  actorId: admin.id,
                  itemVendorId: item.vendorId,
                  itemStatus: item.status,
                  action: "reject",
                });

                return (
                  <motion.article
                    key={item.id}
                    layout="position"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-2xs lg:flex-row lg:items-center lg:justify-between lg:p-5"
                  >
                    <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
                      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl border border-border bg-muted sm:h-28 sm:w-36">
                        <Image
                          src={item.images[0] || "/images/auth-pizza-hero.jpg"}
                          alt={item.itemName}
                          fill
                          unoptimized
                          sizes="(min-width: 640px) 144px, 100vw"
                          className="object-cover"
                        />
                      </div>

                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate font-heading text-lg font-semibold text-foreground">
                            {item.itemName}
                          </h2>
                          <VendorStatusBadge status={item.status} />
                        </div>

                        <p className="line-clamp-2 max-w-2xl text-sm text-muted-foreground">
                          {item.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground tabular-nums">
                            ${item.price.toFixed(2)}
                          </span>
                          <span>{item.category}</span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin
                              className="size-3 text-primary"
                              aria-hidden="true"
                            />
                            {item.location}
                          </span>
                          <span className="inline-flex items-center gap-1 font-medium text-foreground">
                            <Store
                              className="size-3 text-primary"
                              aria-hidden="true"
                            />
                            {item.vendor.businessName}
                          </span>
                          {item.vendor.subscriptionPlan === "premium" ? (
                            <Badge className="gap-1 rounded-full bg-primary/10 px-2 py-0 text-[11px] font-medium text-primary">
                              <Crown className="size-2.5" aria-hidden="true" />
                              Premium Vendor
                            </Badge>
                          ) : null}
                          <span>
                            Submitted {formatCreatedDate(item.createdAt)}
                          </span>
                        </div>

                        {item.status === "rejected" && item.rejectionReason ? (
                          <p className="rounded-lg bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
                            <strong>Rejection reason:</strong>{" "}
                            {item.rejectionReason}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setInspectItem(item)}
                        className="h-9 rounded-xl bg-background px-3"
                      >
                        <Eye className="size-3.5" aria-hidden="true" />
                        Inspect
                      </Button>

                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        disabled={!approveCheck.allowed || isModerating}
                        onClick={() => setApproveTarget(item)}
                        className="h-9 rounded-xl px-3.5 font-medium"
                      >
                        <Check className="size-3.5" aria-hidden="true" />
                        Approve
                      </Button>

                      {item.status === "approved" ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isModerating}
                          onClick={() => setDeactivateTarget(item)}
                          className="h-9 rounded-xl bg-background px-3 text-xs font-medium"
                        >
                          <PauseCircle
                            className="size-3.5"
                            aria-hidden="true"
                          />
                          Deactivate
                        </Button>
                      ) : null}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!rejectCheck.allowed || isModerating}
                        onClick={() => openRejectDialog(item)}
                        className="h-9 rounded-xl border-destructive/35 bg-background px-3.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X className="size-3.5" aria-hidden="true" />
                        Reject
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={isModerating}
                        aria-label={`Delete ${item.itemName}`}
                        onClick={() => setDeleteTarget(item)}
                        className="size-9 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </div>

          {filtered.totalPages > 1 ? (
            <nav
              aria-label="Menu moderation pagination"
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
                ({filtered.totalFiltered} matching submissions)
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
        open={Boolean(inspectItem)}
        onOpenChange={(open) => {
          if (!open) setInspectItem(null);
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-2xl p-6 sm:max-w-2xl">
          {inspectItem ? (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="text-xl font-semibold">
                    {inspectItem.itemName}
                  </DialogTitle>
                  <VendorStatusBadge status={inspectItem.status} />
                </div>
                <DialogDescription>
                  {inspectItem.category} · ${inspectItem.price.toFixed(2)} ·{" "}
                  {inspectItem.location}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {(inspectItem.images.length > 0
                    ? inspectItem.images
                    : ["/images/auth-pizza-hero.jpg"]
                  ).map((imgUrl, idx) => (
                    <div
                      key={imgUrl}
                      className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted"
                    >
                      <Image
                        src={imgUrl}
                        alt={`${inspectItem.itemName} photo ${idx + 1}`}
                        fill
                        unoptimized
                        sizes="(min-width: 640px) 280px, 90vw"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-border bg-muted/25 p-4">
                  <p className="text-xs font-semibold text-foreground">
                    Description
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {inspectItem.description}
                  </p>
                </div>

                <div className="grid gap-3 rounded-xl border border-border bg-background p-4 text-xs sm:grid-cols-2">
                  <div>
                    <p className="font-medium text-muted-foreground">
                      Vendor Kitchen
                    </p>
                    <p className="mt-0.5 font-semibold text-foreground">
                      {inspectItem.vendor.businessName}
                    </p>
                    <p className="text-muted-foreground">
                      Owner: {inspectItem.vendor.name}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">
                      Vendor Contact & Plan
                    </p>
                    <p className="mt-0.5 font-medium text-foreground">
                      {inspectItem.vendor.email || "No email provided"}
                    </p>
                    <p className="text-muted-foreground capitalize">
                      {inspectItem.vendor.subscriptionPlan} plan
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter className="-mx-6 -mb-6 rounded-b-2xl px-6 py-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setInspectItem(null)}
                  className="rounded-xl bg-card"
                >
                  Close
                </Button>
                {inspectItem.status !== "rejected" ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => openRejectDialog(inspectItem)}
                    className="rounded-xl border-destructive/35 bg-background text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    Reject
                  </Button>
                ) : null}
                {inspectItem.status !== "approved" ? (
                  <Button
                    type="button"
                    onClick={() => setApproveTarget(inspectItem)}
                    className="rounded-xl"
                  >
                    Approve Listing
                  </Button>
                ) : null}
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(approveTarget)}
        onOpenChange={(open) => {
          if (!open && !isModerating) setApproveTarget(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl p-6 sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Approve menu listing?</AlertDialogTitle>
            <AlertDialogDescription>
              Approving{" "}
              <strong className="text-foreground">
                {approveTarget?.itemName}
              </strong>{" "}
              from{" "}
              <strong className="text-foreground">
                {approveTarget?.vendor.businessName}
              </strong>{" "}
              allows it to appear on the public menu when the vendor stays
              within their active plan limits.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="-mx-6 -mb-6 rounded-b-2xl px-6 py-4">
            <AlertDialogCancel
              disabled={isModerating}
              className="rounded-xl bg-card"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isModerating}
              onClick={() => void handleConfirmApprove()}
              className="rounded-xl"
            >
              {isModerating ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Approving...
                </>
              ) : (
                "Confirm Approval"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={Boolean(rejectTarget)}
        onOpenChange={(open) => {
          if (!open && !isModerating) {
            setRejectTarget(null);
            setRejectionError(null);
          }
        }}
      >
        <DialogContent className="rounded-2xl p-6 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Reject menu listing
            </DialogTitle>
            <DialogDescription>
              Rejecting{" "}
              <strong className="text-foreground">
                {rejectTarget?.itemName}
              </strong>{" "}
              keeps it hidden from the public storefront. Provide a clear reason
              if supported by the server.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmReject} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="admin-rejection-reason" className="font-medium">
                  Rejection reason (optional)
                </Label>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {rejectionReason.trim().length} /{" "}
                  {MAX_REJECTION_REASON_LENGTH}
                </span>
              </div>
              <Textarea
                id="admin-rejection-reason"
                rows={4}
                maxLength={MAX_REJECTION_REASON_LENGTH}
                placeholder="e.g. Blurry product photo or mismatched category description."
                value={rejectionReason}
                disabled={isModerating}
                aria-invalid={Boolean(rejectionError)}
                onChange={(event) => {
                  setRejectionReason(event.target.value);
                  if (rejectionError) setRejectionError(null);
                }}
                className="rounded-xl bg-background px-3 py-2"
              />
              {rejectionError ? (
                <p
                  role="alert"
                  className="text-xs font-medium text-destructive"
                >
                  {rejectionError}
                </p>
              ) : null}
            </div>

            <DialogFooter className="-mx-6 -mb-6 rounded-b-2xl px-6 py-4">
              <Button
                type="button"
                variant="outline"
                disabled={isModerating}
                onClick={() => setRejectTarget(null)}
                className="rounded-xl bg-card"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isModerating}
                className="rounded-xl"
              >
                {isModerating ? (
                  <>
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                    Rejecting...
                  </>
                ) : (
                  "Confirm Rejection"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deactivateTarget)}
        onOpenChange={(open) => {
          if (!open && !isModerating) setDeactivateTarget(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl p-6 sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate published item?</AlertDialogTitle>
            <AlertDialogDescription>
              Deactivating{" "}
              <strong className="text-foreground">
                {deactivateTarget?.itemName}
              </strong>{" "}
              will hide it from the public customer menu without deleting it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isModerating} className="rounded-xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isModerating}
              onClick={() => void handleConfirmDeactivate()}
              className="rounded-xl"
            >
              {isModerating ? "Deactivating..." : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !isModerating) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl p-6 sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete menu item permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              Deleting{" "}
              <strong className="text-foreground">
                {deleteTarget?.itemName}
              </strong>{" "}
              permanently removes this listing from the platform. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isModerating} className="rounded-xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isModerating}
              onClick={() => void handleConfirmDelete()}
              className="rounded-xl"
            >
              {isModerating ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
