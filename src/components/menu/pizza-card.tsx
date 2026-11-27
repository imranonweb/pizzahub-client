"use client";

import { MapPin, Sparkles, Store } from "lucide-react";
import Link from "next/link";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { useLanguage } from "@/components/providers/language-provider";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { PizzaImage } from "@/components/ui/pizza-image";
import { translateCategory } from "@/lib/i18n/translations";
import type { PublicMenuItem } from "@/lib/menu-api";
import { cn } from "@/lib/utils";

interface PizzaCardProps {
  item: PublicMenuItem;
  headingAs?: "h2" | "h3";
}

export function PizzaCard({ item, headingAs = "h2" }: PizzaCardProps) {
  const { locale, t } = useLanguage();
  const Heading = headingAs;
  const coverImage = item.images[0] || "/images/auth-pizza-hero.jpg";
  const isPremium = item.vendor.subscriptionPlan === "premium";
  const isAvailable = item.status === "approved";

  return (
    <article className="surface-card surface-card-interactive group flex h-full flex-col overflow-hidden rounded-3xl border border-border/90 bg-card hover:-translate-y-0.5 hover:border-primary/40">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <PizzaImage
          src={coverImage}
          alt={item.itemName}
          fill
          sizes="(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 100vw"
          className="object-cover object-center motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:scale-[1.045]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/8 dark:ring-white/8"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 via-black/15 to-transparent"
        />
        {isPremium ? (
          <div className="absolute top-3 left-3">
            <Badge className="gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow-sm ring-1 ring-black/10">
              <Sparkles className="size-3" aria-hidden="true" />
              {t.menu.premiumBadge}
            </Badge>
          </div>
        ) : null}
        <div className="absolute right-3 bottom-3">
          <span className="inline-flex items-center rounded-full border border-white/15 bg-[#150e0b]/90 px-3 py-1 font-mono text-sm font-bold tabular-nums text-[#faf6f0] shadow-sm backdrop-blur-xs">
            ${item.price.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-4 p-5">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <Link
              href={`/menu?category=${encodeURIComponent(item.category)}`}
              className="rounded-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <Badge
                variant="secondary"
                className="cursor-pointer rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {translateCategory(item.category, locale)}
              </Badge>
            </Link>
            {isAvailable ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                <span
                  aria-hidden="true"
                  className="size-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400"
                />
                {t.menu.available}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span
                  aria-hidden="true"
                  className="size-1.5 rounded-full bg-muted-foreground/60"
                />
                {t.menu.unavailable}
              </span>
            )}
          </div>

          <Heading className="font-heading text-lg font-bold leading-snug tracking-[-0.015em] text-foreground">
            <Link
              href={`/menu/${encodeURIComponent(item.id)}`}
              prefetch={false}
              className="rounded-sm transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {item.itemName}
            </Link>
          </Heading>

          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {item.description}
          </p>
        </div>

        <div className="ticket-divider space-y-3.5 pt-3.5">
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="inline-flex min-w-0 items-center gap-1.5 truncate font-medium text-foreground">
              <Store
                className="size-3.5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="truncate">{item.vendor.businessName}</span>
            </span>
            <Link
              href={`/menu?location=${encodeURIComponent(item.location)}`}
              className="inline-flex shrink-0 items-center gap-1 rounded-sm transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <MapPin className="size-3.5 text-primary" aria-hidden="true" />
              <span>{item.location}</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/menu/${encodeURIComponent(item.id)}`}
              prefetch={false}
              className={cn(
                buttonVariants({ variant: "outline", size: "default" }),
                "h-10 flex-1 rounded-xl bg-background font-medium group-hover:border-primary/45 group-hover:bg-accent/55",
              )}
            >
              {t.menu.viewDetails}
            </Link>
            {isAvailable ? <AddToCartButton item={item} compact /> : null}
          </div>
        </div>
      </div>
    </article>
  );
}
