"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import {
  type SearchSuggestionOption,
  SearchSuggestionsInput,
} from "@/components/ui/search-suggestions-input";
import { translateCategory } from "@/lib/i18n/translations";
import {
  getCachedPublicCatalogItems,
  MENU_CATEGORIES,
  type PublicMenuItem,
  prefetchPublicMenuCatalog,
  scoreAndFilterPublicMenuItems,
} from "@/lib/menu-api";
import { cn } from "@/lib/utils";

const QUICK_DISCOVERY_TAGS = [
  { labelEn: "Margherita", labelBn: "মার্গেরিটা", query: "Margherita" },
  { labelEn: "Diavola", labelBn: "দিয়াভোলা", query: "Diavola" },
  { labelEn: "Truffle Mushroom", labelBn: "ট্রাফল মাশরুম", query: "Truffle" },
  { labelEn: "Vegetarian", labelBn: "ভেজিটেরিয়ান", query: "Vegetarian" },
  { labelEn: "Garlic Knots", labelBn: "গার্লিক নটস", query: "Garlic" },
] as const;

interface HeroSearchProps {
  tone?: "light" | "dark";
}

export function HeroSearch({ tone = "light" }: HeroSearchProps) {
  const router = useRouter();
  const { locale, isBangla, t } = useLanguage();
  const [query, setQuery] = useState("");
  const [catalogItems, setCatalogItems] = useState<PublicMenuItem[]>(() =>
    getCachedPublicCatalogItems(),
  );
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

  const isDark = tone === "dark";

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
          subtitle: `${item.vendor.businessName} · ${translateCategory(item.category, locale)}`,
          rightText: `$${item.price.toFixed(2)}`,
          imageUrl: item.images[0] || "/images/auth-pizza-hero.jpg",
        }));
      }

      return QUICK_DISCOVERY_TAGS.map((tag) => ({
        id: `tag-${tag.query}`,
        label: isBangla ? tag.labelBn : tag.labelEn,
        value: tag.query,
        badge: t.hero.popularBadge,
      }));
    }

    const itemMatches = scoreAndFilterPublicMenuItems(catalogItems, trimmed)
      .slice(0, 5)
      .map((item) => ({
        id: `item-${item.id}`,
        label: item.itemName,
        value: item.itemName,
        subtitle: `${item.vendor.businessName} · ${item.location}`,
        badge: translateCategory(item.category, locale),
        rightText: `$${item.price.toFixed(2)}`,
        imageUrl: item.images[0] || "/images/auth-pizza-hero.jpg",
      }));

    if (itemMatches.length > 0) {
      return itemMatches;
    }

    const lowered = trimmed.toLowerCase();
    const categoryMatches = MENU_CATEGORIES.filter((cat) => {
      const translated = translateCategory(cat, locale).toLowerCase();
      return (
        cat.toLowerCase().includes(lowered) || translated.includes(lowered)
      );
    }).map((cat) => ({
      id: `cat-${cat}`,
      label: translateCategory(cat, locale),
      value: cat,
      badge: t.hero.categoryBadge,
      subtitle: cat,
    }));

    if (categoryMatches.length > 0) {
      return categoryMatches;
    }

    return QUICK_DISCOVERY_TAGS.filter(
      (tag) =>
        tag.labelEn.toLowerCase().includes(lowered) ||
        tag.labelBn.includes(trimmed),
    ).map((tag) => ({
      id: `tag-${tag.query}`,
      label: isBangla ? tag.labelBn : tag.labelEn,
      value: tag.query,
      badge: t.hero.popularBadge,
    }));
  }, [catalogItems, isBangla, locale, query, t.hero]);

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
        className={cn(
          "relative flex flex-col gap-2 rounded-2xl border p-1.5 sm:flex-row sm:items-center",
          isDark
            ? "border-[#faf6f0]/18 bg-[#faf6f0]/[0.07] backdrop-blur-md"
            : "border-border/80 bg-card p-2",
        )}
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
            query.trim() ? t.hero.suggestionMatching : t.hero.suggestionPopular
          }
          ariaLabel={t.hero.searchAria}
          clearAriaLabel={t.hero.clearSearchAria}
          placeholder={t.hero.searchPlaceholder}
          className="flex-1"
          inputClassName={cn(
            "h-11 rounded-xl text-sm shadow-none focus-visible:ring-primary",
            isDark
              ? "border-transparent bg-[#faf6f0] text-[#1c130f] placeholder:text-[#6b5d53] dark:bg-[#231915] dark:text-[#faf6f0] dark:placeholder:text-[#b5a79b]"
              : "border-border/80 bg-background",
          )}
        />

        <Button
          type="submit"
          size="lg"
          className="h-11 shrink-0 rounded-xl px-5 font-semibold shadow-xs"
        >
          <span>{t.hero.findPizzaBtn}</span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </form>

      <div
        className={cn(
          "flex flex-wrap items-center gap-1.5 text-xs",
          isDark ? "text-[#d2c7bc]" : "text-muted-foreground",
        )}
      >
        <span
          className={cn(
            "inline-flex items-center gap-1 font-medium",
            isDark ? "text-[#f2eae1]" : "text-foreground/80",
          )}
        >
          <Sparkles
            className={cn("size-3", isDark ? "text-[#f26d4f]" : "text-primary")}
            aria-hidden="true"
          />
          {t.hero.popularLabel}
        </span>
        {QUICK_DISCOVERY_TAGS.map((tag) => (
          <button
            key={tag.query}
            type="button"
            onClick={() => handleTagClick(tag.query)}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              isDark
                ? "border-[#faf6f0]/20 bg-[#faf6f0]/6 text-[#e4dbd1] hover:border-[#faf6f0]/45 hover:bg-[#faf6f0]/14 hover:text-[#faf6f0]"
                : "border-border/70 bg-card/60 text-muted-foreground hover:border-primary/40 hover:bg-accent/50 hover:text-foreground",
            )}
          >
            {isBangla ? tag.labelBn : tag.labelEn}
          </button>
        ))}
      </div>
    </div>
  );
}
