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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/components/providers/language-provider";
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
import { translateCategory } from "@/lib/i18n/translations";
import {
  fetchPublicMenu,
  getCachedPublicCatalogItems,
  MENU_CATEGORIES,
  type MenuListResult,
  type MenuSortOption,
  type PublicMenuItem,
  prefetchPublicMenuCatalog,
  scoreAndFilterPublicMenuItems,
} from "@/lib/menu-api";
import { cn } from "@/lib/utils";
import { MenuGridSkeleton } from "./menu-skeletons";
import { PizzaCard } from "./pizza-card";

const ITEMS_PER_PAGE = 12;

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

export function MenuPageHeader() {
  const { t } = useLanguage();

  return (
    <div className="border-b border-border/75 bg-secondary/45 bg-culinary-grid">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <header className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div className="max-w-2xl space-y-2">
            <h1 className="font-heading text-3xl font-extrabold tracking-[-0.03em] text-foreground text-balance sm:text-4xl">
              {t.menu.pageHeading}
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              {t.menu.pageSubheading}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-2xs">
            <MapPin className="size-3.5 text-primary" aria-hidden="true" />
            <span>{t.brand.cities}</span>
          </div>
        </header>
      </div>
    </div>
  );
}

export function MenuBrowseClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { locale, t } = useLanguage();

  const urlSearch = searchParams.get("search") ?? "";
  const urlCategory = searchParams.get("category") ?? "";
  const urlLocation = searchParams.get("location") ?? "";
  const urlSort = parseSortOption(searchParams.get("sort"));
  const urlPage = parsePageNumber(searchParams.get("page"));

  const sortLabels: Record<MenuSortOption, string> = {
    featured: t.menu.sortFeatured,
    "price-asc": t.menu.sortPriceAsc,
    "price-desc": t.menu.sortPriceDesc,
    newest: t.menu.sortNewest,
  };

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [searchInput, setSearchInput] = useState(urlSearch);
  const [result, setResult] = useState<MenuListResult | null>(null);
  const [catalogForSuggestions, setCatalogForSuggestions] = useState<
    PublicMenuItem[]
  >(() => getCachedPublicCatalogItems());
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      event.preventDefault();
      searchInputRef.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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
    }, 140);

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
          if (data.items.length > 0) {
            setCatalogForSuggestions((prev) =>
              prev.length >= data.items.length ? prev : data.items,
            );
          }
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

  const searchSuggestions = useMemo<SearchSuggestionOption[]>(() => {
    const sourceItems =
      catalogForSuggestions.length > 0
        ? catalogForSuggestions
        : (result?.items ?? []);
    const trimmed = searchInput.trim();
    const matchedItems = trimmed
      ? scoreAndFilterPublicMenuItems(sourceItems, trimmed)
      : sourceItems;

    return matchedItems.slice(0, 6).map((item) => ({
      id: `menu-${item.id}`,
      label: item.itemName,
      value: item.itemName,
      subtitle: `${item.vendor.businessName} · ${item.location}`,
      badge: translateCategory(item.category, locale),
      rightText: `$${item.price.toFixed(2)}`,
      imageUrl: item.images[0] || "/images/auth-pizza-hero.jpg",
    }));
  }, [catalogForSuggestions, locale, result?.items, searchInput]);

  return (
    <div className="space-y-8">
      <div className="surface-card space-y-4 rounded-3xl border border-border/90 bg-card p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <SearchSuggestionsInput
            inputRef={searchInputRef}
            value={searchInput}
            onValueChange={setSearchInput}
            onClear={() => {
              setSearchInput("");
              updateUrlParams({ search: "", page: 1 });
            }}
            onFocusPrefetch={() => {
              void prefetchPublicMenuCatalog().then((items) => {
                if (items.length > 0) {
                  setCatalogForSuggestions(items);
                }
              });
            }}
            suggestions={searchSuggestions}
            onSelectSuggestion={(option) => {
              setSearchInput(option.value);
              updateUrlParams({ search: option.value, page: 1 });
            }}
            suggestionHeader={t.menu.suggestionHeader}
            ariaLabel={t.menu.searchAria}
            clearAriaLabel={t.menu.clearSearchAria}
            placeholder={t.menu.searchPlaceholder}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setSearchInput("");
                updateUrlParams({ search: "", page: 1 });
              } else if (event.key === "Enter") {
                event.preventDefault();
                updateUrlParams({ search: searchInput.trim(), page: 1 });
              }
            }}
          />

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
              aria-label={t.menu.filterLocationAria}
              className="h-10 w-full rounded-xl bg-background px-3"
            >
              <div className="flex items-center gap-2 truncate">
                <MapPin
                  className="size-3.5 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <SelectValue placeholder={t.menu.allLocations}>
                  {urlLocation ? urlLocation : t.menu.allLocations}
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="all">{t.menu.allLocations}</SelectItem>
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
              aria-label={t.menu.sortAria}
              className="h-10 w-full rounded-xl bg-background px-3"
            >
              <div className="flex items-center gap-2 truncate">
                <ArrowUpDown
                  className="size-3.5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <SelectValue placeholder={t.menu.sortAria}>
                  {sortLabels[urlSort]}
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="featured">{t.menu.sortFeatured}</SelectItem>
              <SelectItem value="price-asc">{t.menu.sortPriceAsc}</SelectItem>
              <SelectItem value="price-desc">{t.menu.sortPriceDesc}</SelectItem>
              <SelectItem value="newest">{t.menu.sortNewest}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <fieldset className="flex flex-nowrap items-center gap-2 overflow-x-auto border-0 border-t border-border/70 p-0 pt-3.5 no-scrollbar sm:flex-wrap">
          <legend className="sr-only">Filter by pizza category</legend>
          <button
            type="button"
            aria-pressed={!urlCategory}
            onClick={() => updateUrlParams({ category: "", page: 1 })}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              !urlCategory
                ? "border-primary bg-primary text-primary-foreground shadow-2xs"
                : "border-border bg-background text-muted-foreground hover:border-foreground/25 hover:text-foreground",
            )}
          >
            {t.menu.allCategories}
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
                    ? "border-primary bg-primary font-semibold text-primary-foreground shadow-2xs"
                    : "border-border bg-background text-muted-foreground hover:border-foreground/25 hover:text-foreground",
                )}
              >
                {translateCategory(category, locale)}
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
                    ? t.menu.updatingMenu
                    : `${totalCount} ${totalCount === 1 ? t.menu.itemShown : t.menu.itemsShown}`}
                </span>
              </span>

              {urlSearch.trim() ? (
                <Badge
                  variant="secondary"
                  className="gap-1 rounded-full pr-1.5"
                >
                  {t.menu.searchFilterPrefix}: {urlSearch.trim()}
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
                  {translateCategory(urlCategory, locale)}
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
                  {sortLabels[urlSort]}
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
                {t.menu.resetFilters}
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
            {t.menu.serviceUnavailable}
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
              {t.menu.retryConnection}
            </Button>
          </AlertDescription>
        </Alert>
      ) : result?.catalogEmpty ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <h2 className="font-heading text-xl font-semibold text-foreground">
            {t.menu.emptyCatalogHeading}
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {t.menu.emptyCatalogDesc}
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
                {t.menu.noMatchSearchPrefix} &ldquo;{urlSearch}&rdquo;
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                {t.menu.noMatchSearchDesc}
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
                    {translateCategory(cat, locale)}
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
                  className="h-10 rounded-full px-5 font-semibold"
                >
                  {t.menu.clearSearch}
                </Button>
                {hasActiveFilters ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResetFilters}
                    className="h-10 rounded-full px-5"
                  >
                    {t.menu.resetAllFilters}
                  </Button>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <h2 className="font-heading text-xl font-semibold text-foreground">
                {t.menu.noMatchFilterHeading}
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                {t.menu.noMatchFilterDesc}
              </p>
              <Button
                type="button"
                variant="default"
                onClick={handleResetFilters}
                className="mt-5 h-10 rounded-full px-5 font-semibold"
              >
                {t.menu.resetAllFilters}
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
                {t.menu.page}{" "}
                <span className="font-semibold text-foreground">
                  {currentPage}
                </span>{" "}
                {t.menu.of}{" "}
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
                  className="h-9 rounded-full bg-card px-4"
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                  {t.menu.previous}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!hasNextPage}
                  onClick={() => updateUrlParams({ page: currentPage + 1 })}
                  className="h-9 rounded-full bg-card px-4"
                >
                  {t.menu.next}
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
