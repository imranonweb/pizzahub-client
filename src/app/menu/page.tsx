import type { Metadata } from "next";
import { Suspense } from "react";
import { PublicShell } from "@/components/layout/public-shell";
import { MenuBrowseClient } from "@/components/menu/menu-browse-client";
import { MenuGridSkeleton } from "@/components/menu/menu-skeletons";

export const metadata: Metadata = {
  title: "Browse Menu — PizzaHub",
  description:
    "Search, filter by pizza category or neighborhood location, and compare wood-fired menu items across local PizzaHub kitchens.",
};

export default function BrowseMenuPage() {
  return (
    <PublicShell>
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <header className="max-w-2xl space-y-2.5">
          <h1 className="font-heading text-3xl font-bold tracking-[-0.025em] text-foreground sm:text-4xl">
            Browse the Pizza Menu
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            Explore approved wood-fired pizzas, sides, and beverages from
            neighborhood kitchens. Filter by category, location, or price.
          </p>
        </header>

        <Suspense fallback={<MenuGridSkeleton />}>
          <MenuBrowseClient />
        </Suspense>
      </div>
    </PublicShell>
  );
}
