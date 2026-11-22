"use client";

import {
  AlertCircle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchPublicMenu,
  MENU_CATEGORIES,
  type MenuListResult,
  type MenuSortOption,
} from "@/lib/menu-api";
import { cn } from "@/lib/utils";
import { MenuGridSkeleton } from "./menu-skeletons";
import { PizzaCard } from "./pizza-card";

const ITEMS_PER_PAGE = 12;

const SORT_LABELS: Record<MenuSortOption, string> = {
  featured: "Featured first",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  newest: "Newest items",
};

function parseSortOption(raw: string | null): MenuSortOption {
  if (
    raw === "price-asc" ||
    raw === "price-desc" ||
    raw === "newest" ||
    raw === "featured"
  ) {
    return raw;
  }
  return "featured";
}

function parsePageNumber(raw: string | null): number {
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function MenuBrowseClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlSearch = searchParams.get("search") ?? "";
  const urlCategory = searchParams.get("category") ?? "";
  const urlLocation = searchParams.get("location") ?? "";
  const urlSort = parseSortOption(searchParams.get("sort"));
  const urlPage = parsePageNumber(searchParams.get("page"));

  const [searchInput, setSearchInput] = useState(urlSearch);
  const [result, setResult] = useState<MenuListResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  const updateUrlParams = useCallback(
    (updates: {
      search?: string;
      category?: string;
      location?: string;
      sort?: MenuSortOption;
      page?: number;
    }) => {
      const next = new URLSearchParams(searchParams.toString());

      const applyParam = (key: string, val: string | undefined) => {
        if (val === undefined) return;
        const trimmed = val.trim();
        if (trimmed && trimmed.toLowerCase() !== "all") {
          next.set(key, trimmed);
        } else {
          next.delete(key);
        }
      };

      applyParam("search", updates.search);
      applyParam("category", updates.category);
      applyParam("location", updates.location);

      if (updates.sort !== undefined) {
        if (updates.sort === "featured") {
          next.delete("sort");
        } else {
          next.set("sort", updates.sort);
        }
      }

      if (updates.page !== undefined) {
        if (updates.page <= 1) {
          next.delete("page");
        } else {
          next.set("page", String(updates.page));
        }
      }

      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const trimmedInput = searchInput.trim();
    if (trimmedInput === urlSearch.trim()) {
      return;
    }

    const timer = setTimeout(() => {
      updateUrlParams({ search: trimmedInput, page: 1 });
    }, 260);

    return () => clearTimeout(timer);
  }, [searchInput, urlSearch, updateUrlParams]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setErrorMessage(null);

    void reloadNonce;

    fetchPublicMenu({
      search: urlSearch,
      category: urlCategory,
      location: urlLocation,
      sort: urlSort,
      page: urlPage,
      limit: ITEMS_PER_PAGE,
    })
      .then((data) => {
        if (!cancelled) {
          setResult(data);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Failed to load the menu catalog.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [urlSearch, urlCategory, urlLocation, urlSort, urlPage, reloadNonce]);

  const hasActiveFilters = Boolean(
    urlSearch.trim() ||
      urlCategory.trim() ||
      urlLocation.trim() ||
      urlSort !== "featured",
  );

  const handleResetFilters = () => {
    setSearchInput("");
    router.replace(pathname, { scroll: false });
  };

  const locations = result?.locations ?? [];
  const totalCount = result?.pagination.total ?? 0;
  const currentPage = result?.pagination.page ?? urlPage;
  const totalPages = result?.pagination.totalPages ?? 1;
  const hasNextPage =
    result?.pagination.hasNextPage ?? currentPage < totalPages;
  const hasPrevPage = result?.pagination.hasPrevPage ?? currentPage > 1;

  return (
    <div className="space-y-8">
      <div className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              aria-label="Search pizza menu items by name"
              placeholder="Search pizzas by name..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setSearchInput("");
                  updateUrlParams({ search: "", page: 1 });
                } else if (event.key === "Enter") {
                  event.preventDefault();
                  updateUrlParams({ search: searchInput.trim(), page: 1 });
                }
              }}
              className="h-10 rounded-xl bg-background pr-10 pl-10"
            />
            {searchInput ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setSearchInput("");
                  updateUrlParams({ search: "", page: 1 });
                }}
                className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            ) : null}
          </div>

          <Select
            value={urlLocation || "all"}
            onValueChange={(value) =>
              updateUrlParams({
                location: value === "all" || !value ? "" : value,
                page: 1,
              })
            }
          >
            <SelectTrigger
              aria-label="Filter by location"
              className="h-10 w-full rounded-xl bg-background px-3"
            >
              <div className="flex items-center gap-2 truncate">
                <MapPin
                  className="size-3.5 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <SelectValue placeholder="All locations">
                  {urlLocation ? urlLocation : "All locations"}
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="all">All locations</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc} value={loc}>
                  {loc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={urlSort}
            onValueChange={(value) =>
              updateUrlParams({
                sort: parseSortOption(value),
                page: 1,
              })
            }
          >
            <SelectTrigger
              aria-label="Sort menu items"
              className="h-10 w-full rounded-xl bg-background px-3"
            >
              <div className="flex items-center gap-2 truncate">
                <ArrowUpDown
                  className="size-3.5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <SelectValue placeholder="Sort items">
                  {SORT_LABELS[urlSort]}
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="featured">Featured first</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="newest">Newest items</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <fieldset className="flex items-center gap-2 overflow-x-auto border-0 border-t border-border/70 p-0 pt-3.5 no-scrollbar flex-nowrap sm:flex-wrap">
          <legend className="sr-only">Filter by pizza category</legend>
          <button
            type="button"
            aria-pressed={!urlCategory}
            onClick={() => updateUrlParams({ category: "", page: 1 })}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              !urlCategory
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:border-foreground/25 hover:text-foreground",
            )}
          >
            All categories
          </button>

          {MENU_CATEGORIES.map((category) => {
            const active = urlCategory === category;
            return (
              <button
                key={category}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  updateUrlParams({
                    category: active ? "" : category,
                    page: 1,
                  })
                }
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-foreground/25 hover:text-foreground",
                )}
              >
                {category}
              </button>
            );
          })}
        </fieldset>

        {hasActiveFilters || result ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 font-medium text-muted-foreground">
                <SlidersHorizontal className="size-3.5" aria-hidden="true" />
                <span className="tabular-nums">
                  {isLoading
                    ? "Updating menu..."
                    : `${totalCount} ${totalCount === 1 ? "item" : "items"} shown`}
                </span>
              </span>

              {urlSearch.trim() ? (
                <Badge
                  variant="secondary"
                  className="gap-1 rounded-full pr-1.5"
                >
                  Search: {urlSearch.trim()}
                  <button
                    type="button"
                    aria-label="Remove search filter"
                    onClick={() => {
                      setSearchInput("");
                      updateUrlParams({ search: "", page: 1 });
                    }}
                    className="rounded-full p-0.5 hover:bg-muted"
                  >
                    <X className="size-3" aria-hidden="true" />
                  </button>
                </Badge>
              ) : null}

              {urlCategory ? (
                <Badge
                  variant="secondary"
                  className="gap-1 rounded-full pr-1.5"
                >
                  {urlCategory}
                  <button
                    type="button"
                    aria-label="Remove category filter"
                    onClick={() => updateUrlParams({ category: "", page: 1 })}
                    className="rounded-full p-0.5 hover:bg-muted"
                  >
                    <X className="size-3" aria-hidden="true" />
                  </button>
                </Badge>
              ) : null}

              {urlLocation ? (
                <Badge
                  variant="secondary"
                  className="gap-1 rounded-full pr-1.5"
                >
                  {urlLocation}
                  <button
                    type="button"
                    aria-label="Remove location filter"
                    onClick={() => updateUrlParams({ location: "", page: 1 })}
                    className="rounded-full p-0.5 hover:bg-muted"
                  >
                    <X className="size-3" aria-hidden="true" />
                  </button>
                </Badge>
              ) : null}

              {urlSort !== "featured" ? (
                <Badge
                  variant="secondary"
                  className="gap-1 rounded-full pr-1.5"
                >
                  {SORT_LABELS[urlSort]}
                  <button
                    type="button"
                    aria-label="Reset sort order"
                    onClick={() =>
                      updateUrlParams({ sort: "featured", page: 1 })
                    }
                    className="rounded-full p-0.5 hover:bg-muted"
                  >
                    <X className="size-3" aria-hidden="true" />
                  </button>
                </Badge>
              ) : null}
            </div>

            {hasActiveFilters ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-7 rounded-lg px-2.5 text-xs font-medium text-primary hover:text-primary"
              >
                <RotateCcw className="size-3" aria-hidden="true" />
                Reset filters
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <MenuGridSkeleton />
      ) : errorMessage ? (
        <Alert variant="destructive" className="rounded-2xl p-6">
          <AlertCircle className="size-5" aria-hidden="true" />
          <AlertTitle className="text-base font-semibold">
            Menu Service Unavailable
          </AlertTitle>
          <AlertDescription className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm leading-relaxed">{errorMessage}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReloadNonce((n) => n + 1)}
              className="shrink-0 rounded-xl bg-background text-foreground"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Retry connection
            </Button>
          </AlertDescription>
        </Alert>
      ) : result?.catalogEmpty ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <h2 className="font-heading text-xl font-semibold text-foreground">
            No approved pizzas published yet
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Check back soon as local kitchens publish and receive admin approval
            for new menu items.
          </p>
        </div>
      ) : result && result.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
            <Search className="size-6" aria-hidden="true" />
          </div>
          {urlSearch.trim() ? (
            <>
              <h2 className="font-heading text-xl font-semibold text-foreground">
                No pizzas matching &ldquo;{urlSearch}&rdquo;
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                We couldn&apos;t find any pizzas matching your search query. Try
                checking for typos, clearing your keywords, or exploring these
                popular categories:
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {MENU_CATEGORIES.slice(0, 4).map((cat) => (
                  <Button
                    key={cat}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchInput("");
                      updateUrlParams({ category: cat, search: "", page: 1 });
                    }}
                    className="h-8 rounded-full text-xs"
                  >
                    <Sparkles
                      className="mr-1 size-3 text-primary"
                      aria-hidden="true"
                    />
                    {cat}
                  </Button>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Button
                  type="button"
                  variant="default"
                  onClick={() => {
                    setSearchInput("");
                    updateUrlParams({ search: "", page: 1 });
                  }}
                  className="h-10 rounded-xl px-5 font-semibold"
                >
                  Clear search
                </Button>
                {hasActiveFilters ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResetFilters}
                    className="h-10 rounded-xl px-5"
                  >
                    Reset all filters
                  </Button>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <h2 className="font-heading text-xl font-semibold text-foreground">
                No matching menu items
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                No approved items matched your current filter criteria
                {urlCategory ? ` for category "${urlCategory}"` : ""}
                {urlLocation ? ` in ${urlLocation}` : ""}. Clear your filters to
                see everything available.
              </p>
              <Button
                type="button"
                variant="default"
                onClick={handleResetFilters}
                className="mt-5 h-10 rounded-xl px-5 font-semibold"
              >
                Reset all filters
              </Button>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {result?.items.map((item) => (
              <PizzaCard key={item.id} item={item} />
            ))}
          </div>

          {totalPages > 1 ? (
            <nav
              aria-label="Menu pagination"
              className="flex flex-wrap items-center justify-between gap-4 border-t border-border/70 pt-6"
            >
              <p className="text-sm text-muted-foreground tabular-nums">
                Page{" "}
                <span className="font-semibold text-foreground">
                  {currentPage}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-foreground">
                  {totalPages}
                </span>
              </p>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!hasPrevPage}
                  onClick={() => updateUrlParams({ page: currentPage - 1 })}
                  className="h-9 rounded-xl bg-card px-3.5"
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!hasNextPage}
                  onClick={() => updateUrlParams({ page: currentPage + 1 })}
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
