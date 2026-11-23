"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  type SearchSuggestionOption,
  SearchSuggestionsInput,
} from "@/components/ui/search-suggestions-input";
import {
  getCachedPublicCatalogItems,
  MENU_CATEGORIES,
  type PublicMenuItem,
  prefetchPublicMenuCatalog,
  scoreAndFilterPublicMenuItems,
} from "@/lib/menu-api";

const QUICK_DISCOVERY_TAGS = [
  { label: "Margherita", query: "Margherita" },
  { label: "Diavola", query: "Diavola" },
  { label: "Truffle Mushroom", query: "Truffle" },
  { label: "Vegetarian", query: "Vegetarian" },
  { label: "Garlic Knots", query: "Garlic" },
] as const;

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [catalogItems, setCatalogItems] = useState<PublicMenuItem[]>(() =>
    getCachedPublicCatalogItems(),
  );
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

  const ensureCatalogLoaded = async () => {
    if (catalogItems.length > 0 || isLoadingCatalog) {
      return;
    }
    setIsLoadingCatalog(true);
    try {
      const items = await prefetchPublicMenuCatalog();
      if (items.length > 0) {
        setCatalogItems(items);
      }
    } finally {
      setIsLoadingCatalog(false);
    }
  };

  const suggestions = useMemo<SearchSuggestionOption[]>(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      if (catalogItems.length > 0) {
        return catalogItems.slice(0, 5).map((item) => ({
          id: `item-${item.id}`,
          label: item.itemName,
          value: item.itemName,
          subtitle: `${item.vendor.businessName} · ${item.category}`,
          rightText: `$${item.price.toFixed(2)}`,
          imageUrl: item.images[0] || "/images/auth-pizza-hero.jpg",
        }));
      }

      return QUICK_DISCOVERY_TAGS.map((tag) => ({
        id: `tag-${tag.label}`,
        label: tag.label,
        value: tag.query,
        badge: "Popular",
      }));
    }

    const itemMatches = scoreAndFilterPublicMenuItems(catalogItems, trimmed)
      .slice(0, 5)
      .map((item) => ({
        id: `item-${item.id}`,
        label: item.itemName,
        value: item.itemName,
        subtitle: `${item.vendor.businessName} · ${item.location}`,
        badge: item.category,
        rightText: `$${item.price.toFixed(2)}`,
        imageUrl: item.images[0] || "/images/auth-pizza-hero.jpg",
      }));

    if (itemMatches.length > 0) {
      return itemMatches;
    }

    const lowered = trimmed.toLowerCase();
    const categoryMatches = MENU_CATEGORIES.filter((cat) =>
      cat.toLowerCase().includes(lowered),
    ).map((cat) => ({
      id: `cat-${cat}`,
      label: cat,
      value: cat,
      badge: "Category",
      subtitle: `Browse all ${cat.toLowerCase()}`,
    }));

    if (categoryMatches.length > 0) {
      return categoryMatches;
    }

    return QUICK_DISCOVERY_TAGS.filter((t) =>
      t.label.toLowerCase().includes(lowered),
    ).map((tag) => ({
      id: `tag-${tag.label}`,
      label: tag.label,
      value: tag.query,
      badge: "Popular",
    }));
  }, [catalogItems, query]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/menu?search=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/menu");
    }
  };

  const handleSelectSuggestion = (option: SearchSuggestionOption) => {
    if (option.id.startsWith("item-")) {
      const itemId = option.id.slice("item-".length);
      router.push(`/menu/${encodeURIComponent(itemId)}`);
      return;
    }
    if (option.id.startsWith("cat-")) {
      router.push(`/menu?category=${encodeURIComponent(option.value)}`);
      return;
    }
    setQuery(option.value);
    router.push(`/menu?search=${encodeURIComponent(option.value)}`);
  };

  const handleTagClick = (tagQuery: string) => {
    router.push(`/menu?search=${encodeURIComponent(tagQuery)}`);
  };

  return (
    <div className="space-y-3 pt-1">
      <form
        onSubmit={handleSubmit}
        className="relative flex flex-col gap-2.5 sm:flex-row sm:items-center"
      >
        <SearchSuggestionsInput
          value={query}
          onValueChange={(nextValue) => {
            setQuery(nextValue);
            void ensureCatalogLoaded();
          }}
          onClear={() => setQuery("")}
          onFocusPrefetch={() => {
            void ensureCatalogLoaded();
          }}
          suggestions={suggestions}
          onSelectSuggestion={handleSelectSuggestion}
          showWhenEmpty={true}
          isLoadingSuggestions={isLoadingCatalog}
          suggestionHeader={
            query.trim() ? "Matching Pizzas & Kitchens" : "Popular Searches"
          }
          ariaLabel="Search pizza by name"
          clearAriaLabel="Clear search input"
          placeholder="Search pizza, topping, or kitchen (e.g. Margherita, Diavola)..."
          className="flex-1"
          inputClassName="h-12 border-border/80 bg-card text-sm shadow-2xs focus-visible:ring-primary"
        />

        <Button
          type="submit"
          size="lg"
          className="h-12 shrink-0 rounded-xl px-6 font-semibold shadow-xs"
        >
          <span>Find Pizza</span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </form>

      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
          <Sparkles className="size-3 text-primary" aria-hidden="true" />
          Popular:
        </span>
        {QUICK_DISCOVERY_TAGS.map((tag) => (
          <button
            key={tag.label}
            type="button"
            onClick={() => handleTagClick(tag.query)}
            className="rounded-full border border-border/70 bg-card/60 px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {tag.label}
          </button>
        ))}
      </div>
    </div>
  );
}
