import { ArrowRight, Clock, ShieldCheck, Store } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { HeroSearch } from "@/components/home/hero-search";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-border/70">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14 lg:px-8 lg:py-22">
        <div className="space-y-7">
          <div className="space-y-4">
            <h1 className="font-heading text-4xl font-bold tracking-[-0.03em] leading-[1.06] text-foreground text-balance sm:text-5xl lg:text-[3.35rem]">
              Hot, brick-oven pizza from local kitchens to your table.
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Browse curated pizza menus from neighborhood pizzerias, pick your
              delivery date, and follow every order status from oven prep to
              doorstep.
            </p>
          </div>

          <HeroSearch />

          <div className="flex flex-wrap items-center gap-3.5">
            <Link
              href="/menu"
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "h-12 rounded-xl px-6 text-sm font-semibold shadow-sm",
              )}
            >
              <span>Explore Menu</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/sign-up?role=vendor"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-12 rounded-xl bg-card px-6 text-sm font-semibold",
              )}
            >
              Become a Vendor
            </Link>
          </div>

          <ul className="grid gap-3 border-t border-border/80 pt-6 text-sm text-muted-foreground sm:grid-cols-3">
            <li className="flex items-center gap-2.5">
              <ShieldCheck
                className="size-4.5 shrink-0 text-primary"
                aria-hidden="true"
              />
              <span>Admin-approved menus</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Clock
                className="size-4.5 shrink-0 text-primary"
                aria-hidden="true"
              />
              <span>Clear order tracking</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Store
                className="size-4.5 shrink-0 text-primary"
                aria-hidden="true"
              />
              <span>Local pizzeria partners</span>
            </li>
          </ul>
        </div>

        <div className="relative">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-[#1f1410] shadow-xl ring-1 ring-border/70">
            <Image
              src="/images/pizza-diavola.jpg"
              alt="Wood-fired Neapolitan Diavola pizza on stoneware in front of a glowing brick oven"
              fill
              priority
              sizes="(min-width: 1024px) 46vw, 100vw"
              className="object-cover object-center"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
