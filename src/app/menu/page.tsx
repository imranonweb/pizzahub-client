import type { Metadata } from "next";
import { Suspense } from "react";
import { PublicShell } from "@/components/layout/public-shell";
import {
  MenuBrowseClient,
  MenuPageHeader,
} from "@/components/menu/menu-browse-client";
import { MenuGridSkeleton } from "@/components/menu/menu-skeletons";

export const metadata: Metadata = {
  title: "Browse Menu — PizzaHub",
  description:
    "Search, filter by pizza category or neighborhood location across Dhaka, Chattogram, and Sylhet, and compare wood-fired menu items.",
};

export default function BrowseMenuPage() {
  return (
    <PublicShell>
      <MenuPageHeader />

      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <Suspense fallback={<MenuGridSkeleton />}>
          <MenuBrowseClient />
        </Suspense>
      </div>
    </PublicShell>
  );
}
