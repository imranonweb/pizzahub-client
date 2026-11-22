import type { Metadata } from "next";
import { PublicShell } from "@/components/layout/public-shell";
import { PricingPageClient } from "@/components/pricing/pricing-page-client";

export const metadata: Metadata = {
  title: "Vendor Pricing & Plans | PizzaHub",
  description:
    "Compare PizzaHub vendor plans: Free kitchen tier with 3 active menu items or Premium with unlimited listings, verified badge, and priority placement.",
};

export default function PricingPage() {
  return (
    <PublicShell>
      <PricingPageClient />
    </PublicShell>
  );
}
