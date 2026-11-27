"use client";

import {
  ArrowUpRight,
  CupSoda,
  Flame,
  Leaf,
  Pizza,
  Sparkles,
  Utensils,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { MotionReveal } from "@/components/home/motion-reveal";
import { useLanguage } from "@/components/providers/language-provider";
import { CATEGORY_MEDIA_PRESETS } from "@/lib/category-media";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS = {
  "classic-pizzas": Pizza,
  "vegetarian-pizzas": Leaf,
  "meat-lovers": Flame,
  "specialty-gourmet-pizzas": Sparkles,
  "sides-appetizers": Utensils,
  "beverages-desserts": CupSoda,
} as const;

const BENTO_SPANS = [
  "lg:col-span-7",
  "lg:col-span-5",
  "lg:col-span-5",
  "lg:col-span-7",
  "lg:col-span-6",
  "lg:col-span-6",
] as const;

export function CategoriesSection() {
  const { isBangla, t } = useLanguage();

  return (
    <section
      aria-labelledby="categories-heading"
      className="border-y border-border/75 bg-secondary/45 bg-culinary-grid"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-22">
        <MotionReveal className="mb-10 max-w-2xl space-y-2">
          <h2
            id="categories-heading"
            className="font-heading text-2xl font-bold tracking-[-0.025em] text-foreground text-balance sm:text-3xl lg:text-[2.15rem]"
          >
            {t.home.categoriesHeading}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t.home.categoriesSubheading}
          </p>
        </MotionReveal>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-12">
          {CATEGORY_MEDIA_PRESETS.map((preset, idx) => {
            const Icon =
              CATEGORY_ICONS[preset.slug as keyof typeof CATEGORY_ICONS] ??
              Pizza;
            const spanClass = BENTO_SPANS[idx] ?? "lg:col-span-6";
            const isWide =
              spanClass === "lg:col-span-7" || spanClass === "lg:col-span-6";

            return (
              <MotionReveal
                key={preset.slug}
                delay={idx * 0.04}
                className={cn("h-full", spanClass)}
              >
                <Link
                  href={`/menu?category=${encodeURIComponent(preset.category)}`}
                  className="surface-card surface-card-interactive group relative flex h-full min-h-[250px] flex-col justify-between overflow-hidden rounded-3xl border border-border/90 bg-[#170f0b] p-5 text-[#faf6f0] hover:-translate-y-0.5 hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-[270px] sm:p-6"
                >
                  <Image
                    src={preset.image}
                    alt={preset.imageAlt}
                    fill
                    sizes={
                      isWide
                        ? "(min-width: 1024px) 55vw, (min-width: 640px) 48vw, 100vw"
                        : "(min-width: 1024px) 40vw, (min-width: 640px) 48vw, 100vw"
                    }
                    className="object-cover object-center motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:scale-[1.045]"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,13,10,0.42)_0%,rgba(20,13,10,0.22)_42%,rgba(20,13,10,0.88)_100%)]"
                  />

                  <div className="relative z-10 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#faf6f0]/18 bg-[#140d0a]/75 px-3 py-1 text-xs font-medium text-[#f7dec0] backdrop-blur-xs">
                      <Icon
                        className="size-3.5 text-[#f29d52]"
                        aria-hidden="true"
                      />
                      {isBangla ? preset.shortLabelBn : preset.shortLabel}
                    </span>
                    <span className="flex size-9 items-center justify-center rounded-full bg-[#faf6f0]/95 text-[#140d0a] shadow-sm transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                      <ArrowUpRight className="size-4" aria-hidden="true" />
                    </span>
                  </div>

                  <div className="relative z-10 mt-14 space-y-1.5">
                    <h3 className="font-heading text-xl font-bold tracking-[-0.02em] text-[#faf6f0] sm:text-2xl">
                      {isBangla ? preset.categoryBn : preset.category}
                    </h3>
                    <p className="max-w-lg text-xs leading-relaxed text-[#ded3c8] sm:text-sm">
                      {isBangla ? preset.taglineBn : preset.tagline}
                    </p>
                  </div>
                </Link>
              </MotionReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
