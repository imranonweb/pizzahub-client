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
import { CATEGORY_MEDIA_PRESETS } from "@/lib/category-media";

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
      <div className="mx-auto w-full max-w-6xl px-4 py-18 sm:px-6 lg:px-8 lg:py-22">
        <MotionReveal className="mb-10 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <h2
              id="categories-heading"
              className="font-heading text-2xl font-bold tracking-[-0.03em] text-foreground text-balance sm:text-[2rem]"
            >
              Explore by category
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Wood-fired Neapolitan classics, garden vegetarian pies, artisan
              truffle specialties, cast-iron sides, and Italian sweets.
            </p>
          </div>
        </MotionReveal>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORY_MEDIA_PRESETS.map((preset, idx) => {
            const Icon =
              CATEGORY_ICONS[preset.slug as keyof typeof CATEGORY_ICONS] ??
              Pizza;

            return (
              <MotionReveal
                key={preset.slug}
                delay={idx * 0.04}
                className="h-full"
              >
                <Link
                  href={`/menu?category=${encodeURIComponent(preset.category)}`}
                  className="surface-card surface-card-interactive group flex h-full flex-col overflow-hidden rounded-2xl border border-border/90 bg-card hover:-translate-y-0.5 hover:border-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                    <Image
                      src={preset.image}
                      alt={preset.imageAlt}
                      fill
                      sizes="(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 100vw"
                      className="object-cover object-center motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:scale-[1.045]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/18 to-transparent" />
                    <div className="absolute right-3.5 bottom-3 left-3.5 flex items-center justify-between gap-2 text-white">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#160f0c]/75 px-3 py-1 text-xs font-medium text-[#faf6f0] backdrop-blur-xs">
                        <Icon
                          className="size-3.5 text-[#f2a65a]"
                          aria-hidden="true"
                        />
                        {preset.shortLabel}
                      </span>
                      <span className="flex size-8 items-center justify-center rounded-full bg-[#faf6f0]/95 text-[#160f0c] shadow-sm transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                        <ArrowUpRight className="size-4" aria-hidden="true" />
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between gap-1.5 p-5">
                    <h3 className="font-heading text-base font-semibold tracking-[-0.015em] text-foreground transition-colors group-hover:text-primary">
                      {preset.category}
                    </h3>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {preset.tagline}
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
