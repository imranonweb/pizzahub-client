import { CupSoda, Flame, Leaf, Pizza, Sparkles, Utensils } from "lucide-react";
import Link from "next/link";
import { PIZZA_CATEGORIES } from "@/data/homepage-mock";

const CATEGORY_ICONS = {
  "classic-pizzas": Pizza,
  "vegetarian-pizzas": Leaf,
  "meat-lovers": Flame,
  "specialty-gourmet-pizzas": Sparkles,
  "sides-appetizers": Utensils,
  "beverages-desserts": CupSoda,
} as const;

export function CategoriesSection() {
  return (
    <section
      aria-labelledby="categories-heading"
      className="border-y border-border/70 bg-secondary/45"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
          <div className="space-y-1.5">
            <h2
              id="categories-heading"
              className="font-heading text-2xl font-bold tracking-[-0.025em] text-foreground sm:text-3xl"
            >
              Explore by category
            </h2>
            <p className="text-sm text-muted-foreground sm:text-base">
              Jump straight to classic pies, roasted vegetarian favorites,
              sides, or drinks.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PIZZA_CATEGORIES.map((category) => {
            const Icon =
              CATEGORY_ICONS[category.slug as keyof typeof CATEGORY_ICONS] ??
              Pizza;

            return (
              <Link
                key={category.slug}
                href={`/menu?category=${encodeURIComponent(category.name)}`}
                className="group flex items-start gap-3.5 rounded-2xl border border-border bg-card p-4 transition-all duration-150 hover:border-primary/40 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 space-y-0.5">
                  <span className="block font-heading text-sm font-semibold text-foreground">
                    {category.name}
                  </span>
                  <span className="block text-xs leading-relaxed text-muted-foreground">
                    {category.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
