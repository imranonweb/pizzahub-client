"use client";

import {
  AlertCircle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Crown,
  Lock,
  ReceiptText,
  RotateCw,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type AdminTransactionPlanFilter,
  type AdminTransactionSortOption,
  type AdminTransactionStatusFilter,
  type AdminTransactionsListResponse,
  fetchAdminTransactions,
} from "@/lib/admin-api";
import { formatCurrencyAmountFromCents } from "@/lib/subscription-api";
import { cn } from "@/lib/utils";

const STATUS_FILTERS: { value: AdminTransactionStatusFilter; label: string }[] =
  [
    { value: "all", label: "All" },
    { value: "paid", label: "Paid" },
    { value: "failed", label: "Failed" },
    { value: "pending", label: "Pending" },
    { value: "active", label: "Active" },
    { value: "cancelling", label: "Cancelling" },
    { value: "cancelled", label: "Cancelled" },
  ];

const SORT_LABELS: Record<AdminTransactionSortOption, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  "amount-desc": "Amount: High to Low",
  "amount-asc": "Amount: Low to High",
};

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(parsed);
}

function getStatusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status.toLowerCase()) {
    case "paid":
    case "active":
      return "default";
    case "failed":
      return "destructive";
    case "pending":
      return "secondary";
    default:
      return "outline";
  }
}

export function AdminTransactionsView() {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<AdminTransactionStatusFilter>("all");
  const [planFilter, setPlanFilter] =
    useState<AdminTransactionPlanFilter>("all");
  const [sortOption, setSortOption] =
    useState<AdminTransactionSortOption>("newest");
  const [page, setPage] = useState(1);

  const [data, setData] = useState<AdminTransactionsListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchInput.trim();
      setDebouncedSearch((prev) => {
        if (prev !== trimmed) setPage(1);
        return trimmed;
      });
    }, 150);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadTransactions = useCallback(
    async (isBackground = false) => {
      if (isBackground) setIsRefreshing(true);
      else setIsLoading(true);
      try {
        const res = await fetchAdminTransactions({
          search: debouncedSearch,
          status: statusFilter,
          plan: planFilter,
          sort: sortOption,
          page,
          limit: 15,
        });
        setData(res);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [debouncedSearch, statusFilter, planFilter, sortOption, page],
  );

  useEffect(() => {
    void loadTransactions(false);
  }, [loadTransactions]);

  const counts = data?.counts;
  const transactions = data?.transactions ?? [];
  const pagination = data?.pagination;
  const isUnavailable = data?.source === "unavailable";

  const txSuggestions = useMemo<SearchSuggestionOption[]>(() => {
    const trimmed = searchInput.trim().toLowerCase();
    const matched = trimmed
      ? transactions.filter((tx) =>
          `${tx.vendor.businessName} ${tx.vendor.name} ${tx.vendor.email} ${tx.stripeSubscriptionId ?? ""} ${tx.stripeSessionId ?? ""}`
            .toLowerCase()
            .includes(trimmed),
        )
      : transactions;
    return matched.slice(0, 6).map((tx) => ({
      id: tx.id,
      label: tx.vendor.businessName,
      value: tx.vendor.businessName || tx.vendor.email,
      subtitle: `${tx.vendor.name} · ${formatDateTime(tx.createdAt)}`,
      badge: tx.status,
      rightText: formatCurrencyAmountFromCents(tx.amount, tx.currency),
    }));
  }, [searchInput, transactions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border/70 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-heading text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-3xl">
              Platform Transactions
            </h1>
            <Badge
              variant="outline"
              className="gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
            >
              <Lock className="size-3 text-primary" aria-hidden="true" />
              Read-only ledger
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground sm:text-base">
            Audit verified Stripe vendor subscription payments, renewals, and
            status events. Payment records are immutable.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isLoading || isRefreshing}
          onClick={() => void loadTransactions(true)}
          className="h-10 rounded-xl bg-card px-4 font-medium"
        >
          <RotateCw
            className={cn("size-4", isRefreshing && "animate-spin")}
            aria-hidden="true"
          />
          Refresh
        </Button>
      </div>

      {/* Summary KPI Row */}
      <section
        aria-label="Transaction summary"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {isLoading ? (
          ["t1", "t2", "t3", "t4"].map((k) => (
            <Skeleton
              key={k}
              className="h-24 rounded-2xl border border-border"
            />
          ))
        ) : (
          <>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs">
              <p className="text-xs font-medium text-muted-foreground">
                Total Transactions
              </p>
              <p className="mt-2 font-heading text-2xl font-bold text-foreground tabular-nums">
                {counts ? counts.total : "—"}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs">
              <p className="text-xs font-medium text-muted-foreground">
                Verified Paid Revenue
              </p>
              <p className="mt-2 font-heading text-2xl font-bold text-primary tabular-nums">
                {counts
                  ? formatCurrencyAmountFromCents(counts.totalRevenueCents)
                  : "—"}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs">
              <p className="text-xs font-medium text-muted-foreground">
                Paid Events
              </p>
              <p className="mt-2 font-heading text-2xl font-bold text-foreground tabular-nums">
                {counts ? counts.paid : "—"}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs">
              <p className="text-xs font-medium text-muted-foreground">
                Failed / Cancelled
              </p>
              <p className="mt-2 font-heading text-2xl font-bold text-foreground tabular-nums">
                {counts ? `${counts.failed} / ${counts.cancelled}` : "—"}
              </p>
            </div>
          </>
        )}
      </section>

      {/* Filter Bar */}
      <div className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1.5fr)_minmax(0,0.8fr)_minmax(0,1fr)]">
          <SearchSuggestionsInput
            value={searchInput}
            onValueChange={setSearchInput}
            onClear={() => {
              setSearchInput("");
              setDebouncedSearch("");
              setPage(1);
            }}
            suggestions={txSuggestions}
            onSelectSuggestion={(option) => {
              setSearchInput(option.value);
              setDebouncedSearch(option.value.trim());
              setPage(1);
            }}
            suggestionHeader="Matching Transactions"
            ariaLabel="Search transactions"
            clearAriaLabel="Clear search"
            placeholder="Search vendor name, email, or Stripe ID..."
          />

          <Select
            value={planFilter}
            onValueChange={(value) => {
              setPlanFilter((value as AdminTransactionPlanFilter) || "all");
              setPage(1);
            }}
          >
            <SelectTrigger
              aria-label="Filter by plan"
              className="h-10 w-full rounded-xl bg-background px-3"
            >
              <SelectValue placeholder="All plans">
                {planFilter === "all"
                  ? "All plans"
                  : planFilter === "premium"
                    ? "Premium"
                    : "Free"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="all">All plans</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="free">Free</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sortOption}
            onValueChange={(value) => {
              setSortOption((value as AdminTransactionSortOption) || "newest");
              setPage(1);
            }}
          >
            <SelectTrigger
              aria-label="Sort transactions"
              className="h-10 w-full rounded-xl bg-background px-3"
            >
              <div className="flex items-center gap-2 truncate">
                <ArrowUpDown
                  className="size-3.5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <SelectValue placeholder="Sort">
                  {SORT_LABELS[sortOption]}
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="amount-desc">Amount: High to Low</SelectItem>
              <SelectItem value="amount-asc">Amount: Low to High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-nowrap items-center gap-1.5 overflow-x-auto border-t border-border/70 pt-3.5 pb-1 no-scrollbar sm:flex-wrap">
          {STATUS_FILTERS.map((tab) => {
            const active = statusFilter === tab.value;
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
                  "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table / States */}
      {isLoading ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-14 rounded-2xl" />
          <Skeleton className="h-14 rounded-2xl" />
          <Skeleton className="h-14 rounded-2xl" />
        </div>
      ) : isUnavailable ? (
        <Alert variant="destructive" className="rounded-2xl p-6">
          <AlertCircle className="size-5" aria-hidden="true" />
          <AlertTitle className="text-base font-semibold">
            Unable to load transactions
          </AlertTitle>
          <AlertDescription className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm">
              {data?.notice ||
                "Unable to connect to the PizzaHub admin transactions API."}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadTransactions(true)}
              className="shrink-0 rounded-xl bg-background text-foreground"
            >
              <RotateCw className="size-3.5" aria-hidden="true" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <ReceiptText className="size-6" aria-hidden="true" />
          </div>
          <h2 className="mt-4 font-heading text-lg font-semibold text-foreground">
            No transactions recorded
          </h2>
          <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
            Verified Stripe vendor subscription payments and webhook events will
            appear in this immutable ledger.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {transactions.map((tx) => (
              <article
                key={tx.id}
                className="rounded-2xl border border-border bg-card p-4 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-3 border-b border-border/70 pb-3">
                  <div className="min-w-0 space-y-0.5">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {tx.vendor.businessName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {tx.vendor.name}
                      {tx.vendor.email ? ` · ${tx.vendor.email}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 font-heading text-base font-bold text-foreground tabular-nums">
                    {formatCurrencyAmountFromCents(tx.amount, tx.currency)}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge
                      variant={tx.plan === "premium" ? "default" : "secondary"}
                      className="gap-1 rounded-full px-2.5 py-0.5 text-xs capitalize"
                    >
                      {tx.plan === "premium" ? (
                        <Crown className="size-3" aria-hidden="true" />
                      ) : null}
                      {tx.plan}
                    </Badge>
                    <Badge
                      variant={getStatusVariant(tx.status)}
                      className="rounded-full px-2.5 py-0.5 text-xs capitalize"
                    >
                      {tx.status}
                    </Badge>
                  </div>
                  <span className="text-muted-foreground tabular-nums">
                    {formatDateTime(tx.createdAt)}
                  </span>
                </div>

                <p className="mt-2.5 inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                  <CreditCard className="size-3" aria-hidden="true" />
                  {tx.stripeSubscriptionId
                    ? `${tx.stripeSubscriptionId.slice(0, 18)}…`
                    : tx.stripeSessionId
                      ? `${tx.stripeSessionId.slice(0, 18)}…`
                      : tx.id.slice(-8)}
                </p>
              </article>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-2xs md:block">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/35">
                    <TableHead className="px-4 py-3 text-xs font-semibold">
                      Vendor
                    </TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold">
                      Plan
                    </TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold">
                      Amount
                    </TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold">
                      Status
                    </TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold">
                      Date (UTC)
                    </TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold">
                      Stripe Ref
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="px-4 py-3.5">
                        <div className="space-y-0.5">
                          <p className="text-sm font-semibold text-foreground">
                            {tx.vendor.businessName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {tx.vendor.name}
                            {tx.vendor.email ? ` · ${tx.vendor.email}` : ""}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <Badge
                          variant={
                            tx.plan === "premium" ? "default" : "secondary"
                          }
                          className="gap-1 rounded-full px-2.5 py-0.5 text-xs capitalize"
                        >
                          {tx.plan === "premium" ? (
                            <Crown className="size-3" aria-hidden="true" />
                          ) : null}
                          {tx.plan}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3.5 font-heading text-sm font-bold text-foreground tabular-nums">
                        {formatCurrencyAmountFromCents(tx.amount, tx.currency)}
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <Badge
                          variant={getStatusVariant(tx.status)}
                          className="rounded-full px-2.5 py-0.5 text-xs capitalize"
                        >
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-xs text-muted-foreground tabular-nums">
                        {formatDateTime(tx.createdAt)}
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                          <CreditCard className="size-3" aria-hidden="true" />
                          {tx.stripeSubscriptionId
                            ? `${tx.stripeSubscriptionId.slice(0, 14)}…`
                            : tx.stripeSessionId
                              ? `${tx.stripeSessionId.slice(0, 14)}…`
                              : tx.id.slice(-8)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {pagination && pagination.totalPages > 1 ? (
            <nav
              aria-label="Transactions pagination"
              className="flex flex-wrap items-center justify-between gap-4 border-t border-border/70 pt-5"
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
                ({pagination.total} records)
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
  );
}
