import { ArrowRight, Clock, ShieldCheck, Store } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { HeroSearch } from "@/components/home/hero-search";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HeroSection() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden border-b border-[#2f221c] bg-[#160f0c] text-[#faf6f0]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_80%_at_82%_45%,rgba(220,76,42,0.18)_0%,transparent_70%)]"
      />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="min-w-0 space-y-6 lg:col-span-6">
            <div className="space-y-4">
              <h1
                id="hero-heading"
                className="font-heading text-[2.2rem] font-bold leading-[1.06] tracking-[-0.035em] text-[#faf6f0] text-balance sm:text-5xl lg:text-[3.35rem]"
              >
                Hot, brick-oven pizza from local kitchens to your table.
              </h1>
              <p className="max-w-lg text-base leading-relaxed text-[#ddd3c8] sm:text-[1.05rem]">
                Browse curated pizza menus from neighborhood pizzerias, pick
                your delivery date, and follow every order status from oven prep
                to doorstep.
              </p>
            </div>

            <HeroSearch tone="dark" />

            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/menu"
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "h-12 w-full rounded-xl px-6 text-sm font-semibold shadow-lg shadow-black/25 sm:w-auto",
                )}
              >
                <span>Explore Pizza Menu</span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/sign-up?role=vendor"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-12 w-full rounded-xl border-[#faf6f0]/25 bg-transparent px-6 text-sm font-semibold text-[#faf6f0] hover:border-[#faf6f0]/45 hover:bg-[#faf6f0]/10 hover:text-[#faf6f0] sm:w-auto",
                )}
              >
                Become a Vendor
              </Link>
            </div>

            <ul className="grid grid-cols-1 gap-3 border-t border-[#faf6f0]/14 pt-5 text-sm text-[#e0d6cb] sm:grid-cols-3">
              <li className="flex items-center gap-2">
                <ShieldCheck
                  className="size-4 shrink-0 text-[#f26d4f]"
                  aria-hidden="true"
                />
                <span>Verified menus</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock
                  className="size-4 shrink-0 text-[#f26d4f]"
                  aria-hidden="true"
                />
                <span>Live tracking</span>
              </li>
              <li className="flex items-center gap-2">
                <Store
                  className="size-4 shrink-0 text-[#f26d4f]"
                  aria-hidden="true"
                />
                <span>Local kitchens</span>
              </li>
            </ul>
          </div>

          <div className="relative lg:col-span-6">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl bg-[#241813] shadow-[0_28px_60px_-24px_rgba(0,0,0,0.75)] ring-1 ring-[#faf6f0]/14 sm:aspect-[16/10] lg:aspect-[5/4]">
              <Image
                src="/images/hero-artisan-pizza.jpg"
                alt="Freshly baked artisan pizza topped with creamy burrata, basil leaves, olives, and rich tomato sauce on a rustic timber table"
                fill
                priority
                sizes="(min-width: 1024px) 46vw, 100vw"
                className="object-cover object-center"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_62%,rgba(22,15,12,0.52)_100%)]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
