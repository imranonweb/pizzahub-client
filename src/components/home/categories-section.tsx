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
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
        <MotionReveal className="mb-9 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
          <div className="space-y-1.5">
            <h2
              id="categories-heading"
              className="font-heading text-2xl font-bold tracking-[-0.025em] text-foreground sm:text-3xl"
            >
              Explore by category
            </h2>
            <p className="text-sm text-muted-foreground sm:text-base">
              Wood-fired Neapolitan classics, garden vegetarian pies, artisan
              truffle specialties, cast-iron sides, and Italian sweets.
            </p>
          </div>
        </MotionReveal>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                    <Image
                      src={preset.image}
                      alt={preset.imageAlt}
                      fill
                      sizes="(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 100vw"
                      className="object-cover object-center motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 text-white">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium backdrop-blur-xs">
                        <Icon
                          className="size-3.5 text-amber-300"
                          aria-hidden="true"
                        />
                        {preset.shortLabel}
                      </span>
                      <span className="flex size-7 items-center justify-center rounded-full bg-white/90 text-zinc-900 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                        <ArrowUpRight className="size-4" aria-hidden="true" />
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between gap-1.5 p-4">
                    <h3 className="font-heading text-base font-semibold text-foreground group-hover:text-primary">
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
