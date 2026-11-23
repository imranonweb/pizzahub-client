import { MapPin, Sparkles } from "lucide-react";
import Link from "next/link";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { PizzaImage } from "@/components/ui/pizza-image";
import type { PublicMenuItem } from "@/lib/menu-api";
import { cn } from "@/lib/utils";

interface PizzaCardProps {
  item: PublicMenuItem;
  headingAs?: "h2" | "h3";
}

export function PizzaCard({ item, headingAs = "h2" }: PizzaCardProps) {
  const Heading = headingAs;
  const coverImage = item.images[0] || "/images/auth-pizza-hero.jpg";
  const isPremium = item.vendor.subscriptionPlan === "premium";
  const isAvailable = item.status === "approved";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <PizzaImage
          src={coverImage}
          alt={item.itemName}
          fill
          sizes="(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 100vw"
          className="object-cover object-center motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.03]"
        />
        {isPremium ? (
          <div className="absolute top-3 left-3">
            <Badge className="gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
              <Sparkles className="size-3" aria-hidden="true" />
              Premium
            </Badge>
          </div>
        ) : null}
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
                className="cursor-pointer rounded-full font-medium transition-colors hover:bg-secondary/80"
              >
                {item.category}
              </Badge>
            </Link>
            <span className="font-heading text-base font-bold tabular-nums text-foreground">
              ${item.price.toFixed(2)}
            </span>
          </div>

          <Heading className="font-heading text-lg font-semibold leading-snug text-foreground">
            <Link
              href={`/menu/${encodeURIComponent(item.id)}`}
              className="rounded-sm transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {item.itemName}
            </Link>
          </Heading>

          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {item.description}
          </p>
        </div>

        <div className="space-y-3 border-t border-border/70 pt-3.5">
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="truncate font-medium text-foreground">
              {item.vendor.businessName}
            </span>
            <Link
              href={`/menu?location=${encodeURIComponent(item.location)}`}
              className="inline-flex shrink-0 items-center gap-1 rounded-sm transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <MapPin className="size-3.5 text-primary" aria-hidden="true" />
              <span>{item.location}</span>
            </Link>
          </div>

          <div className="flex items-center justify-between gap-2">
            {isAvailable ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full bg-emerald-600"
                />
                Available
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full bg-muted-foreground/60"
                />
                Unavailable
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/menu/${encodeURIComponent(item.id)}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "default" }),
                "h-10 flex-1 rounded-xl font-medium group-hover:border-primary/40 group-hover:bg-accent/60",
              )}
            >
              View Details
            </Link>
            {isAvailable ? <AddToCartButton item={item} compact /> : null}
          </div>
        </div>
      </div>
    </article>
  );
}
