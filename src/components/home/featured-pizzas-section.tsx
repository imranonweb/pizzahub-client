"use client";

import { AlertCircle, ArrowRight, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MenuGridSkeleton } from "@/components/menu/menu-skeletons";
import { PizzaCard } from "@/components/menu/pizza-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { fetchPublicMenu, type MenuListResult } from "@/lib/menu-api";
import { cn } from "@/lib/utils";

const FEATURED_ITEMS_LIMIT = 6;

export function FeaturedPizzasSection() {
  const [result, setResult] = useState<MenuListResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setErrorMessage(null);

    void reloadNonce;

    fetchPublicMenu({
      sort: "featured",
      page: 1,
      limit: FEATURED_ITEMS_LIMIT,
    })
      .then((data) => {
        if (!cancelled) {
          setResult(data);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load featured menu items.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [reloadNonce]);

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
            Signature wood-fired pies and customer favorites freshly prepared by
            approved PizzaHub kitchens.
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

      {isLoading ? (
        <MenuGridSkeleton count={FEATURED_ITEMS_LIMIT} />
      ) : errorMessage ? (
        <Alert variant="destructive" className="rounded-2xl p-6">
          <AlertCircle className="size-5" aria-hidden="true" />
          <AlertTitle className="text-base font-semibold">
            Featured Menu Unavailable
          </AlertTitle>
          <AlertDescription className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm leading-relaxed">{errorMessage}</span>
            <div className="flex shrink-0 flex-wrap items-center gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReloadNonce((n) => n + 1)}
                className="rounded-xl bg-background text-foreground"
              >
                <RotateCcw className="size-3.5" aria-hidden="true" />
                Retry
              </Button>
              <Link
                href="/menu"
                className={cn(
                  buttonVariants({ variant: "default", size: "sm" }),
                  "rounded-xl",
                )}
              >
                Browse Menu
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      ) : !result || result.catalogEmpty || result.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <h3 className="font-heading text-xl font-semibold text-foreground">
            No approved pizzas published yet
          </h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Local kitchens have not published approved menu items yet. Check
            back soon or browse the menu catalog.
          </p>
          <Link
            href="/menu"
            className={cn(
              buttonVariants({ variant: "outline", size: "default" }),
              "mt-5 h-10 rounded-xl px-5 font-semibold",
            )}
          >
            Browse Menu
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((item) => (
            <PizzaCard key={item.id} item={item} headingAs="h3" />
          ))}
        </div>
      )}
    </section>
  );
}
