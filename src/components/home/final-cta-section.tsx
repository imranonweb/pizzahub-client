"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { MotionReveal } from "@/components/home/motion-reveal";
import { useLanguage } from "@/components/providers/language-provider";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FinalCtaSection() {
  const { t } = useLanguage();

  return (
    <section
      aria-labelledby="final-cta-heading"
      className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-22"
    >
      <MotionReveal className="surface-card relative overflow-hidden rounded-[2rem] border border-primary/22 bg-accent/75 p-8 sm:p-11">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-primary/10 blur-3xl"
        />
        <div className="relative flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-xl space-y-2">
            <h2
              id="final-cta-heading"
              className="font-heading text-2xl font-bold tracking-[-0.025em] text-foreground text-balance sm:text-3xl"
            >
              {t.home.finalCtaHeading}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              {t.home.finalCtaSubheading}
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href="/menu"
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "h-11 w-full rounded-full px-6 text-sm font-semibold sm:w-auto",
              )}
            >
              <span>{t.hero.exploreCta}</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/sign-up"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-11 w-full rounded-full bg-card px-6 text-sm font-semibold sm:w-auto",
              )}
            >
              {t.home.createAccount}
            </Link>
          </div>
        </div>
      </MotionReveal>
    </section>
  );
}
