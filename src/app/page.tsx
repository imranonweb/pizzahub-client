import type { Metadata } from "next";
import { CategoriesSection } from "@/components/home/categories-section";
import { FeaturedPizzasSection } from "@/components/home/featured-pizzas-section";
import { FinalCtaSection } from "@/components/home/final-cta-section";
import { HeroSection } from "@/components/home/hero-section";
import { HowItWorksSection } from "@/components/home/how-it-works-section";
import { WhyPizzaHubSection } from "@/components/home/why-pizzahub-section";
import { PublicShell } from "@/components/layout/public-shell";

export const metadata: Metadata = {
  title: "PizzaHub — Hot & Fresh Pizza Ordering & Delivery",
  description:
    "Discover local wood-fired pizzerias, browse curated menus, place orders with scheduled delivery dates, or partner as a vendor.",
};

export default function HomePage() {
  return (
    <PublicShell>
      <HeroSection />
      <FeaturedPizzasSection />
      <CategoriesSection />
      <HowItWorksSection />
      <WhyPizzaHubSection />
      <FinalCtaSection />
    </PublicShell>
  );
}
