import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { TEMPORARY_FEATURED_PIZZAS } from "@/data/homepage-mock";
import { cn } from "@/lib/utils";

export function FeaturedPizzasSection() {
  return (
    <section
      aria-labelledby="featured-pizzas-heading"
      className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
    >
      <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <h2
            id="featured-pizzas-heading"
            className="font-heading text-2xl font-bold tracking-[-0.025em] text-foreground sm:text-3xl"
          >
            Featured from local ovens
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Sample menu showcase from neighborhood kitchens. Full searchable
            menus connect directly to the live catalog.
          </p>
        </div>

        <Link
          href="/menu"
          className={cn(
            buttonVariants({ variant: "outline", size: "default" }),
            "h-10 rounded-xl bg-card px-4 text-sm font-semibold",
          )}
        >
          <span>View Menu</span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPORARY_FEATURED_PIZZAS.map((item) => (
          <article
            key={item.id}
            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
              <Image
                src={item.image}
                alt={item.itemName}
                fill
                sizes="(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 100vw"
                className="object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
              />
              {item.isPremiumVendor ? (
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
                  <Badge
                    variant="secondary"
                    className="rounded-full font-medium"
                  >
                    {item.category}
                  </Badge>
                  <span className="font-heading text-base font-bold tabular-nums text-foreground">
                    ${item.price.toFixed(2)}
                  </span>
                </div>

                <h3 className="font-heading text-lg font-semibold leading-snug text-foreground">
                  {item.itemName}
                </h3>

                <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>

              <div className="space-y-3 border-t border-border/70 pt-3.5">
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="truncate font-medium text-foreground">
                    {item.vendorName}
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1">
                    <MapPin
                      className="size-3.5 text-primary"
                      aria-hidden="true"
                    />
                    {item.location}
                  </span>
                </div>

                <Link
                  href={`/menu/${item.id}`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "default" }),
                    "h-10 w-full rounded-xl font-medium group-hover:border-primary/40 group-hover:bg-accent/60",
                  )}
                >
                  View Details
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
