import type { Metadata } from "next";
import { Suspense } from "react";
import { PublicShell } from "@/components/layout/public-shell";
import { MenuDetailClient } from "@/components/menu/menu-detail-client";
import { MenuDetailSkeleton } from "@/components/menu/menu-skeletons";

export const metadata: Metadata = {
  title: "Menu Item Details — PizzaHub",
  description:
    "Inspect dish details, vendor kitchen info, pricing, and availability before placing your PizzaHub order.",
};

async function MenuDetailGate({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MenuDetailClient itemId={id} />;
}

export default function MenuItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <PublicShell>
      <Suspense fallback={<MenuDetailSkeleton />}>
        <MenuDetailGate params={params} />
      </Suspense>
    </PublicShell>
  );
}
