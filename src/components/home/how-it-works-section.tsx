"use client";

import { CalendarCheck2, Search, Truck } from "lucide-react";
import { MotionReveal } from "@/components/home/motion-reveal";
import { useLanguage } from "@/components/providers/language-provider";

const STEP_ICONS = [Search, CalendarCheck2, Truck] as const;

export function HowItWorksSection() {
  const { t } = useLanguage();

  return (
    <section
      aria-labelledby="how-it-works-heading"
      className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-22"
    >
      <MotionReveal className="mb-11 max-w-2xl space-y-2">
        <h2
          id="how-it-works-heading"
          className="font-heading text-2xl font-bold tracking-[-0.025em] text-foreground text-balance sm:text-3xl lg:text-[2.15rem]"
        >
          {t.home.howHeading}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          {t.home.howSubheading}
        </p>
      </MotionReveal>

      <ol className="grid gap-6 md:grid-cols-3">
        {t.home.steps.map((item, idx) => {
          const Icon = STEP_ICONS[idx] ?? Search;
          const stepNumber = `0${idx + 1}`;
          return (
            <li
              key={stepNumber}
              className="surface-card relative flex flex-col justify-between rounded-3xl border border-border/90 bg-card p-6 sm:p-7"
            >
              <MotionReveal delay={idx * 0.06} className="flex flex-col gap-5">
                <div className="flex items-center justify-between border-b border-border/75 pb-4">
                  <span className="flex size-11 items-center justify-center rounded-2xl border border-primary/18 bg-accent/85 text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="font-mono text-2xl font-bold tracking-tight text-primary/80 tabular-nums">
                    {stepNumber}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="font-heading text-lg font-bold tracking-[-0.015em] text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </MotionReveal>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
