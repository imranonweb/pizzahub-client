"use client";

import { ArrowRight, Search, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/menu?search=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/menu");
    }
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
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            aria-label="Search pizza by name"
            placeholder="Search pizza, topping, or kitchen (e.g. Margherita, Diavola)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-12 rounded-xl border-border/80 bg-card pr-10 pl-10 text-sm shadow-2xs focus-visible:ring-primary"
          />
          {query ? (
            <button
              type="button"
              aria-label="Clear search input"
              onClick={() => setQuery("")}
              className="absolute top-1/2 right-3 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          ) : null}
        </div>

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
