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
      {/* Desktop full-bleed culinary photography backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden lg:block"
      >
        <Image
          src="/images/hero-artisan-pizza.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[78%_center] scale-[1.02]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(96deg,#160f0c_0%,rgba(22,15,12,0.96)_36%,rgba(22,15,12,0.72)_58%,rgba(22,15,12,0.18)_86%,rgba(22,15,12,0.34)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent_0%,rgba(22,15,12,0.72)_100%)]" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
        <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="min-w-0 space-y-6 sm:space-y-7 lg:col-span-7">
            <div className="space-y-4">
              <h1
                id="hero-heading"
                className="font-heading text-[2.25rem] font-bold leading-[1.03] tracking-[-0.035em] text-[#faf6f0] text-balance sm:text-5xl lg:text-[3.85rem]"
              >
                Hot, brick-oven pizza from local kitchens to your table.
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-[#ddd3c8] sm:text-lg">
                Browse curated pizza menus from neighborhood pizzerias, pick
                your delivery date, and follow every order status from oven prep
                to doorstep.
              </p>
            </div>

            <HeroSearch tone="dark" />

            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3.5">
              <Link
                href="/menu"
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "h-12 w-full rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-black/25 hover:bg-primary/90 sm:w-auto",
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

            <ul className="grid grid-cols-1 gap-3 border-t border-[#faf6f0]/14 pt-6 text-sm text-[#e0d6cb] sm:grid-cols-3 sm:gap-4">
              <li className="flex items-center gap-2.5">
                <ShieldCheck
                  className="size-4 shrink-0 text-[#f26d4f]"
                  aria-hidden="true"
                />
                <span>Verified pizzeria menus</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock
                  className="size-4 shrink-0 text-[#f26d4f]"
                  aria-hidden="true"
                />
                <span>Live order tracking</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Store
                  className="size-4 shrink-0 text-[#f26d4f]"
                  aria-hidden="true"
                />
                <span>Local pizzeria partners</span>
              </li>
            </ul>
          </div>

          {/* Mobile & tablet framed culinary photograph */}
          <div className="relative lg:hidden">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-[#241813] shadow-2xl shadow-black/45 ring-1 ring-[#faf6f0]/12 sm:aspect-[16/9]">
              <Image
                src="/images/hero-artisan-pizza.jpg"
                alt="Freshly baked artisan pizza topped with creamy burrata, basil leaves, olives, and rich tomato sauce on a rustic timber table"
                fill
                priority
                sizes="(max-width: 1023px) 100vw, 1px"
                className="object-cover object-center"
              />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_58%,rgba(22,15,12,0.55)_100%)]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
