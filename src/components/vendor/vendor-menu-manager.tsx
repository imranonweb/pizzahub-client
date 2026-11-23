"use client";

import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Crown,
  Info,
  Loader2,
  MapPin,
  Pencil,
  PlusCircle,
  Power,
  RotateCcw,
  RotateCw,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { MENU_CATEGORIES } from "@/lib/menu-api";
import { cn } from "@/lib/utils";
import {
  createEmptyVendorMenuStats,
  deleteVendorMenuItem,
  FREE_PLAN_ACTIVE_ITEM_LIMIT,
  fetchVendorMenuItems,
  filterVendorMenuItems,
  updateVendorMenuItemStatus,
  type VendorMenuItem,
  type VendorMenuListResponse,
  type VendorStatusFilter,
} from "@/lib/vendor-menu-api";
import { canActivateMenuItem } from "@/lib/vendor-menu-validation";
import { PizzaForm } from "./pizza-form";
import { UpgradePlanDialog } from "./upgrade-plan-dialog";
import { useVendorProfile } from "./vendor-dashboard-shell";
import { VendorStatusBadge } from "./vendor-status-badge";

const PAGE_SIZE = 6;

const STATUS_TABS: { value: VendorStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "approved", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "inactive", label: "Inactive" },
  { value: "rejected", label: "Rejected" },
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

export function VendorMenuManager() {
  const user = useVendorProfile();

  const [data, setData] = useState<VendorMenuListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState<VendorStatusFilter>("all");
  const [page, setPage] = useState(1);

  const [editingItem, setEditingItem] = useState<VendorMenuItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VendorMenuItem | null>(null);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const loadMenu = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetchVendorMenuItems();
      setData(response);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load your vendor menu listings.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMenu();
  }, [loadMenu]);

  const isBackendLive = data?.source === "live";
  const allItems = data?.items ?? [];
  const stats = data?.stats ?? createEmptyVendorMenuStats();
  const isPremium = user.subscriptionPlan === "premium";

  const menuSuggestions = useMemo<SearchSuggestionOption[]>(() => {
    const trimmed = search.trim().toLowerCase();
    const matched = trimmed
      ? allItems.filter((item) =>
          `${item.itemName} ${item.category} ${item.location} ${item.description}`
            .toLowerCase()
            .includes(trimmed),
        )
      : allItems;
    return matched.slice(0, 6).map((item) => ({
      id: item.id,
      label: item.itemName,
      value: item.itemName,
      subtitle: `${item.location} · ${item.category}`,
      badge: item.status,
      rightText: `$${item.price.toFixed(2)}`,
      imageUrl: item.images[0] || "/images/auth-pizza-hero.jpg",
    }));
  }, [allItems, search]);

  const filtered = filterVendorMenuItems(allItems, {
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

  const handleToggleStatus = async (item: VendorMenuItem) => {
    if (busyItemId) return;

    const nextStatus = item.status === "approved" ? "inactive" : "approved";
    if (nextStatus === "approved") {
      const check = canActivateMenuItem({
        subscriptionPlan: user.subscriptionPlan,
        activeCount: stats.active,
        itemStatus: item.status,
      });
      if (!check.allowed) {
        toast.add({
          title: "Cannot activate item",
          description: check.reason ?? "Activation is currently restricted.",
          type: "warning",
        });
        return;
      }
    }

    setBusyItemId(item.id);
    try {
      const result = await updateVendorMenuItemStatus(item.id, nextStatus);
      if (!result.ok) {
        toast.add({
          title:
            result.reason === "backend-unavailable"
              ? "Vendor menu service unavailable"
              : "Status update failed",
          description: result.message,
          type: result.reason === "backend-unavailable" ? "warning" : "error",
        });
        return;
      }

      toast.add({
        title:
          nextStatus === "approved" ? "Listing activated" : "Listing paused",
        description: result.message,
        type: "success",
      });
      await loadMenu();
    } finally {
      setBusyItemId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);

    try {
      const result = await deleteVendorMenuItem(deleteTarget.id);
      if (!result.ok) {
        toast.add({
          title:
            result.reason === "backend-unavailable"
              ? "Vendor menu service unavailable"
              : "Could not delete listing",
          description: result.message,
          type: result.reason === "backend-unavailable" ? "warning" : "error",
        });
        return;
      }

      toast.add({
        title: "Listing removed",
        description: result.message,
        type: "success",
      });
      setDeleteTarget(null);
      await loadMenu();
    } finally {
      setIsDeleting(false);
    }
  };

  const getTabCount = (tab: VendorStatusFilter): number | null => {
    if (!isBackendLive) return null;
    if (tab === "all") return stats.total;
    if (tab === "approved") return stats.active;
    if (tab === "pending") return stats.pending;
    if (tab === "inactive") return stats.inactive;
    return stats.rejected;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border/70 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-heading text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-3xl">
              My Menu Items
            </h1>
            {isPremium ? (
              <Badge className="gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
                <Crown className="size-3" aria-hidden="true" />
                Unlimited Active
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums"
              >
                {isBackendLive
                  ? `${stats.active} / ${FREE_PLAN_ACTIVE_ITEM_LIMIT} active used`
                  : `Free limit: ${FREE_PLAN_ACTIVE_ITEM_LIMIT} active`}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Search, filter, update details, pause listings, or monitor admin
            review decisions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={() => void loadMenu()}
            className="h-10 rounded-xl bg-card px-3.5"
          >
            <RotateCw
              className={cn("size-4", isLoading && "animate-spin")}
              aria-hidden="true"
            />
            Refresh
          </Button>
          {!isPremium ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setUpgradeOpen(true)}
              className="h-10 rounded-xl bg-card px-3.5"
            >
              <Crown className="size-4 text-primary" aria-hidden="true" />
              Upgrade
            </Button>
          ) : null}
          <Button
            render={<Link href="/dashboard/vendor/add" />}
            className="h-10 rounded-xl px-4 font-semibold"
          >
            <PlusCircle className="size-4" aria-hidden="true" />
            Add Pizza
          </Button>
        </div>
      </div>

      {data?.source === "unavailable" && data.notice ? (
        <Alert className="rounded-2xl bg-accent/65 p-4">
          <Info className="size-4 text-primary" aria-hidden="true" />
          <AlertTitle>Vendor Menu Backend Pending</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>{data.notice}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadMenu()}
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
          <AlertTitle>Failed to load menu items</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>{errorMessage}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadMenu()}
              className="rounded-xl bg-background text-foreground"
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {!isPremium &&
      isBackendLive &&
      stats.active >= FREE_PLAN_ACTIVE_ITEM_LIMIT ? (
        <Alert className="rounded-2xl border-amber-500/35 bg-amber-500/10 text-amber-900 dark:text-amber-200">
          <AlertCircle
            className="size-4 text-amber-600 dark:text-amber-400"
            aria-hidden="true"
          />
          <AlertTitle className="font-semibold text-foreground">
            Free Plan Active Item Limit Reached ({stats.active}/
            {FREE_PLAN_ACTIVE_ITEM_LIMIT})
          </AlertTitle>
          <AlertDescription className="mt-1 flex flex-col gap-3 text-xs sm:flex-row sm:items-center sm:justify-between sm:text-sm">
            <span>
              Your Free plan allows up to {FREE_PLAN_ACTIVE_ITEM_LIMIT} active
              approved menu items simultaneously. To activate an inactive or
              newly approved dish, deactivate one of your currently active
              pizzas below, or upgrade to Premium for unlimited active listings.
            </span>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => setUpgradeOpen(true)}
                className="h-8 rounded-lg px-3 text-xs font-semibold"
              >
                <Crown className="size-3.5" aria-hidden="true" />
                Upgrade to Premium
              </Button>
              <Button
                render={<Link href="/dashboard/vendor/subscription" />}
                variant="outline"
                size="sm"
                className="h-8 rounded-lg bg-card text-xs font-medium"
              >
                Plan Details
              </Button>
            </div>
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
            suggestions={menuSuggestions}
            onSelectSuggestion={(option) => {
              setSearch(option.value);
              setPage(1);
            }}
            suggestionHeader="Your Pizza Listings"
            ariaLabel="Search your menu items"
            clearAriaLabel="Clear search query"
            placeholder="Search by item name, location, or description..."
          />

          <Select
            value={category}
            onValueChange={(next) => {
              setCategory(next || "all");
              setPage(1);
            }}
          >
            <SelectTrigger
              aria-label="Filter by menu category"
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
          <legend className="sr-only">
            Filter listings by approval status
          </legend>
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
          <Skeleton className="h-36 rounded-2xl border border-border" />
          <Skeleton className="h-36 rounded-2xl border border-border" />
          <Skeleton className="h-36 rounded-2xl border border-border" />
        </div>
      ) : !isBackendLive ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <h2 className="font-heading text-xl font-semibold text-foreground">
            Connected listings will appear here
          </h2>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">
            Your vendor listings cannot be loaded yet because{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
              GET /api/vendor/menu
            </code>{" "}
            is not live on the Express server. You can still test form
            validation and image uploads on the Add Pizza page.
          </p>
          <Button
            render={<Link href="/dashboard/vendor/add" />}
            className="mt-5 h-10 rounded-xl px-5 font-semibold"
          >
            <PlusCircle className="size-4" aria-hidden="true" />
            Add Pizza
          </Button>
        </div>
      ) : allItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <h2 className="font-heading text-xl font-semibold text-foreground">
            No menu items added yet
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Create your first pizza listing. New submissions start in Pending
            status until approved by an admin.
          </p>
          <Button
            render={<Link href="/dashboard/vendor/add" />}
            className="mt-5 h-10 rounded-xl px-5 font-semibold"
          >
            <PlusCircle className="size-4" aria-hidden="true" />
            Create Your First Pizza
          </Button>
        </div>
      ) : filtered.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <h2 className="font-heading text-xl font-semibold text-foreground">
            No items match your filters
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Clear your search, category, or status filters to view all{" "}
            {allItems.length} of your kitchen items.
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
                const isBusy = busyItemId === item.id;
                const activationCheck = canActivateMenuItem({
                  subscriptionPlan: user.subscriptionPlan,
                  activeCount: stats.active,
                  itemStatus: item.status,
                });

                return (
                  <motion.article
                    key={item.id}
                    layout="position"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between sm:p-5"
                  >
                    <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl border border-border bg-muted sm:h-24 sm:w-32">
                        <Image
                          src={item.images[0] || "/images/auth-pizza-hero.jpg"}
                          alt={item.itemName}
                          fill
                          unoptimized
                          sizes="(min-width: 640px) 128px, 100vw"
                          className="object-cover"
                        />
                      </div>

                      <div className="min-w-0 space-y-1.5">
                        <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1 no-scrollbar sm:flex-wrap sm:pb-0">
                          <h2 className="truncate font-heading text-lg font-semibold text-foreground">
                            {item.itemName}
                          </h2>
                          <VendorStatusBadge status={item.status} />
                        </div>

                        <p className="line-clamp-2 max-w-2xl text-sm text-muted-foreground">
                          {item.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 text-xs text-muted-foreground">
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
                          <span>Added {formatCreatedDate(item.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                      <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1 no-scrollbar sm:flex-wrap sm:pb-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isBusy}
                          onClick={() => setEditingItem(item)}
                          className="h-9 rounded-xl bg-background px-3"
                        >
                          <Pencil className="size-3.5" aria-hidden="true" />
                          Edit
                        </Button>

                        {item.status === "approved" ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isBusy}
                            onClick={() => void handleToggleStatus(item)}
                            className="h-9 rounded-xl bg-background px-3"
                          >
                            {isBusy ? (
                              <Loader2
                                className="size-3.5 animate-spin"
                                aria-hidden="true"
                              />
                            ) : (
                              <Power className="size-3.5" aria-hidden="true" />
                            )}
                            Deactivate
                          </Button>
                        ) : item.status === "inactive" ? (
                          <Button
                            type="button"
                            variant="default"
                            size="sm"
                            disabled={!activationCheck.allowed || isBusy}
                            onClick={() => void handleToggleStatus(item)}
                            className="h-9 rounded-xl px-3"
                          >
                            {isBusy ? (
                              <Loader2
                                className="size-3.5 animate-spin"
                                aria-hidden="true"
                              />
                            ) : (
                              <Power className="size-3.5" aria-hidden="true" />
                            )}
                            Activate
                          </Button>
                        ) : null}

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={isBusy}
                          aria-label={`Delete ${item.itemName}`}
                          onClick={() => setDeleteTarget(item)}
                          className="size-9 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </Button>
                      </div>

                      {item.status === "inactive" &&
                      !activationCheck.allowed &&
                      activationCheck.reason ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="max-w-56 text-right">
                            {activationCheck.reason}
                          </span>
                          {!isPremium ? (
                            <Button
                              type="button"
                              variant="link"
                              size="sm"
                              onClick={() => setUpgradeOpen(true)}
                              className="h-auto p-0 text-xs font-semibold text-primary"
                            >
                              Upgrade
                            </Button>
                          ) : null}
                        </div>
                      ) : item.status === "pending" ? (
                        <p className="text-xs text-muted-foreground">
                          Awaiting admin approval
                        </p>
                      ) : item.status === "rejected" ? (
                        <p className="text-xs text-destructive">
                          Rejected by admin review
                        </p>
                      ) : null}
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </div>

          {filtered.totalPages > 1 ? (
            <nav
              aria-label="Vendor menu pagination"
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
                ({filtered.totalFiltered} matching items)
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

      <Sheet
        open={Boolean(editingItem)}
        onOpenChange={(open) => {
          if (!open) setEditingItem(null);
        }}
      >
        <SheetContent
          side="right"
          className="w-full overflow-y-auto bg-card p-6 sm:max-w-xl"
        >
          <SheetHeader className="p-0 pb-4">
            <SheetTitle className="text-xl font-semibold">
              Edit Menu Item
            </SheetTitle>
            <SheetDescription>
              Update item details or images for{" "}
              <span className="font-medium text-foreground">
                {editingItem?.itemName}
              </span>
              .
            </SheetDescription>
          </SheetHeader>

          {editingItem ? (
            <PizzaForm
              mode="edit"
              initialItem={editingItem}
              onCancel={() => setEditingItem(null)}
              onSuccess={() => {
                setEditingItem(null);
                void loadMenu();
              }}
            />
          ) : null}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl p-6 sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete menu item?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes{" "}
              <strong className="text-foreground">
                {deleteTarget?.itemName}
              </strong>{" "}
              from your kitchen menu. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="-mx-6 -mb-6 rounded-b-2xl px-6 py-4">
            <AlertDialogCancel
              disabled={isDeleting}
              className="rounded-xl bg-card"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={() => void handleConfirmDelete()}
              className="rounded-xl"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Deleting...
                </>
              ) : (
                "Delete Item"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UpgradePlanDialog
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        currentPlan={user.subscriptionPlan}
      />
    </div>
  );
}
