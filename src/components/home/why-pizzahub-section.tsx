"use client";

import { ArrowRight, Check, Flame, UtensilsCrossed } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { MotionReveal } from "@/components/home/motion-reveal";
import { useLanguage } from "@/components/providers/language-provider";
import { buttonVariants } from "@/components/ui/button";
import { PIZZERIA_SHOWCASE_PHOTOS } from "@/lib/category-media";
import { cn } from "@/lib/utils";

export function WhyPizzaHubSection() {
  const { isBangla, t } = useLanguage();
  const leadScene = PIZZERIA_SHOWCASE_PHOTOS[0];
  const secondaryScenes = PIZZERIA_SHOWCASE_PHOTOS.slice(1);

  return (
    <section
      aria-labelledby="why-pizzahub-heading"
      className="border-t border-border/75 bg-secondary/35"
    >
      <div className="mx-auto w-full max-w-6xl space-y-14 px-4 py-16 sm:px-6 lg:px-8 lg:py-22">
        <div className="space-y-8">
          <MotionReveal className="max-w-2xl space-y-2">
            <h2 className="font-heading text-2xl font-bold tracking-[-0.025em] text-foreground text-balance sm:text-3xl lg:text-[2.15rem]">
              {t.home.showcaseHeading}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              {t.home.showcaseSubheading}
            </p>
          </MotionReveal>

          <div className="grid gap-6 lg:grid-cols-12">
            {leadScene ? (
              <MotionReveal className="lg:col-span-7">
                <article className="surface-card group flex h-full flex-col overflow-hidden rounded-3xl border border-border/90 bg-card">
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#1a110d] lg:aspect-[16/11]">
                    <Image
                      src={leadScene.image}
                      alt={leadScene.imageAlt}
                      fill
                      sizes="(min-width: 1024px) 56vw, 100vw"
                      className="object-cover object-center motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:scale-[1.035]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/22 to-transparent" />
                    <div className="absolute right-5 bottom-5 left-5 text-white">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#140d0a]/80 px-3 py-1 text-xs font-medium text-[#f6d6ad] backdrop-blur-xs">
                        <Flame
                          className="size-3.5 text-[#f26d4f]"
                          aria-hidden="true"
                        />
                        {isBangla
                          ? leadScene.locationTagBn
                          : leadScene.locationTag}
                      </span>
                      <h3 className="mt-2.5 font-heading text-xl font-bold tracking-tight text-[#faf6f0] sm:text-2xl">
                        {isBangla ? leadScene.titleBn : leadScene.title}
                      </h3>
                    </div>
                  </div>
                  <div className="flex-1 p-6">
                    <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                      {isBangla ? leadScene.captionBn : leadScene.caption}
                    </p>
                  </div>
                </article>
              </MotionReveal>
            ) : null}

            <div className="grid gap-6 lg:col-span-5">
              {secondaryScenes.map((scene, idx) => (
                <MotionReveal key={scene.id} delay={(idx + 1) * 0.06}>
                  <article className="surface-card group flex h-full flex-col overflow-hidden rounded-3xl border border-border/90 bg-card">
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#1a110d]">
                      <Image
                        src={scene.image}
                        alt={scene.imageAlt}
                        fill
                        sizes="(min-width: 1024px) 40vw, 100vw"
                        className="object-cover object-center motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:scale-[1.035]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute right-4 bottom-3.5 left-4 text-white">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#140d0a]/80 px-2.5 py-0.5 text-[11px] font-medium text-[#f6d6ad] backdrop-blur-xs">
                          <UtensilsCrossed
                            className="size-3 text-[#f29d52]"
                            aria-hidden="true"
                          />
                          {isBangla ? scene.locationTagBn : scene.locationTag}
                        </span>
                        <h3 className="mt-1.5 font-heading text-lg font-bold tracking-tight text-[#faf6f0]">
                          {isBangla ? scene.titleBn : scene.title}
                        </h3>
                      </div>
                    </div>
                    <div className="p-5">
                      <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                        {isBangla ? scene.captionBn : scene.caption}
                      </p>
                    </div>
                  </article>
                </MotionReveal>
              ))}
            </div>
          </div>
        </div>

        <MotionReveal className="grid gap-6 lg:grid-cols-12 lg:gap-7">
          <div className="surface-card flex flex-col justify-between gap-7 rounded-3xl border border-border/90 bg-card p-7 sm:p-9 lg:col-span-6">
            <div className="space-y-4">
              <h2
                id="why-pizzahub-heading"
                className="font-heading text-2xl font-bold tracking-[-0.03em] text-foreground text-balance sm:text-[1.85rem]"
              >
                {t.home.dinerHeading}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                {t.home.dinerSubheading}
              </p>

              <ul className="space-y-3 pt-2">
                {t.home.dinerBenefits.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-start gap-2.5 text-sm text-foreground"
                  >
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                      <Check className="size-3.5" aria-hidden="true" />
                    </span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <Link
                href="/menu"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-11 rounded-full bg-background px-6 text-sm font-semibold",
                )}
              >
                {t.nav.browseMenu}
              </Link>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-7 rounded-3xl border border-[#3a2820] bg-[#160f0c] p-7 text-[#faf6f0] shadow-[0_20px_44px_-20px_rgba(20,13,10,0.6)] sm:p-9 lg:col-span-6">
            <div className="space-y-4">
              <h2 className="font-heading text-2xl font-bold tracking-[-0.03em] text-[#faf6f0] text-balance sm:text-[1.85rem]">
                {t.home.vendorHeading}
              </h2>
              <p className="text-sm leading-relaxed text-[#d7cbc0] sm:text-base">
                {t.home.vendorSubheading}
              </p>

              <ul className="space-y-3 pt-2">
                {t.home.vendorBenefits.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-start gap-2.5 text-sm text-[#efe7df]"
                  >
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3.5" aria-hidden="true" />
                    </span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/sign-up?role=vendor"
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "h-11 rounded-full px-6 text-sm font-semibold",
                )}
              >
                <span>{t.home.registerVendorCta}</span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/sign-in"
                className="rounded-full px-3.5 py-2 text-sm font-medium text-[#e4dbd1] underline-offset-4 hover:text-[#faf6f0] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f26d4f]"
              >
                {t.home.vendorSignIn}
              </Link>
            </div>
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}
