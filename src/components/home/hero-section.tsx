"use client";

import {
  ArrowRight,
  Banknote,
  Clock,
  Flame,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { HeroSearch } from "@/components/home/hero-search";
import { useLanguage } from "@/components/providers/language-provider";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HeroSection() {
  const { t } = useLanguage();

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden border-b border-[#2e201a] bg-[#150e0b] text-[#faf6f0]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(62%_88%_at_80%_38%,rgba(224,83,46,0.20)_0%,transparent_72%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,#faf6f0_1px,transparent_1px),linear-gradient(to_bottom,#faf6f0_1px,transparent_1px)] [background-size:48px_48px]"
      />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="min-w-0 space-y-6 lg:col-span-7">
            <div className="space-y-4">
              <h1
                id="hero-heading"
                className="font-heading text-[2.15rem] font-extrabold leading-[1.08] tracking-[-0.035em] text-[#faf6f0] text-balance sm:text-5xl lg:text-[3.3rem]"
              >
                {t.hero.headline}
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-[#ddd2c6] sm:text-[1.04rem]">
                {t.hero.subheadline}
              </p>
            </div>

            <HeroSearch tone="dark" />

            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/menu"
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "h-12 w-full rounded-full px-6 text-sm font-semibold shadow-lg shadow-black/30 sm:w-auto",
                )}
              >
                <span>{t.hero.exploreCta}</span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/sign-up?role=vendor"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-12 w-full rounded-full border-[#faf6f0]/25 bg-[#faf6f0]/5 px-6 text-sm font-semibold text-[#faf6f0] hover:border-[#faf6f0]/45 hover:bg-[#faf6f0]/12 hover:text-[#faf6f0] sm:w-auto",
                )}
              >
                {t.hero.vendorCta}
              </Link>
            </div>

            <dl className="grid grid-cols-1 gap-3 border-t border-[#faf6f0]/14 pt-5 sm:grid-cols-3">
              <div className="flex items-start gap-2.5 rounded-2xl border border-[#faf6f0]/10 bg-[#faf6f0]/[0.03] px-3.5 py-3">
                <ShieldCheck
                  className="mt-0.5 size-4 shrink-0 text-[#f26d4f]"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <dt className="text-xs font-semibold text-[#faf6f0]">
                    {t.hero.trustVerifiedTitle}
                  </dt>
                  <dd className="mt-0.5 text-[11px] text-[#c9bdb1]">
                    {t.hero.trustVerifiedSub}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-2xl border border-[#faf6f0]/10 bg-[#faf6f0]/[0.03] px-3.5 py-3">
                <Clock
                  className="mt-0.5 size-4 shrink-0 text-[#f26d4f]"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <dt className="text-xs font-semibold text-[#faf6f0]">
                    {t.hero.trustTrackingTitle}
                  </dt>
                  <dd className="mt-0.5 text-[11px] text-[#c9bdb1]">
                    {t.hero.trustTrackingSub}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-2xl border border-[#faf6f0]/10 bg-[#faf6f0]/[0.03] px-3.5 py-3">
                <Banknote
                  className="mt-0.5 size-4 shrink-0 text-[#f26d4f]"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <dt className="text-xs font-semibold text-[#faf6f0]">
                    {t.hero.trustCodTitle}
                  </dt>
                  <dd className="mt-0.5 text-[11px] text-[#c9bdb1]">
                    {t.hero.trustCodSub}
                  </dd>
                </div>
              </div>
            </dl>
          </div>

          <div className="relative lg:col-span-5">
            <div className="relative aspect-[16/11] w-full overflow-hidden rounded-[2rem] border border-[#faf6f0]/16 bg-[#241813] shadow-[0_32px_68px_-26px_rgba(0,0,0,0.8)] lg:aspect-[4/4.4]">
              <Image
                src="/images/hero-artisan-pizza.jpg"
                alt="Freshly baked artisan pizza topped with creamy burrata, basil leaves, olives, and rich tomato sauce on a rustic timber table"
                fill
                priority
                sizes="(min-width: 1024px) 42vw, 100vw"
                className="object-cover object-center"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(20,13,10,0.12)_0%,transparent_44%,rgba(20,13,10,0.88)_100%)]"
              />

              <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full border border-[#faf6f0]/20 bg-[#150e0b]/82 px-3 py-1 text-xs font-medium text-[#f5dec3] backdrop-blur-md">
                <MapPin
                  className="size-3.5 text-[#f26d4f]"
                  aria-hidden="true"
                />
                <span>{t.brand.cities}</span>
              </div>

              <div className="absolute right-4 bottom-4 left-4 rounded-2xl border border-[#faf6f0]/16 bg-[#150e0b]/86 p-4 backdrop-blur-md">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#faf6f0]">
                    <Flame
                      className="size-4 shrink-0 text-[#f26d4f]"
                      aria-hidden="true"
                    />
                    <span>{t.hero.ovenCardTitle}</span>
                  </div>
                  <span className="rounded-full bg-primary/90 px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground">
                    {t.hero.ovenCardBadge}
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-[#d6cabd]">
                  {t.hero.ovenCardSubtitle}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
