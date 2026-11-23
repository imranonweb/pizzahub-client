import { ArrowRight, Check, Flame, UtensilsCrossed } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { MotionReveal } from "@/components/home/motion-reveal";
import { buttonVariants } from "@/components/ui/button";
import { PIZZERIA_SHOWCASE_PHOTOS } from "@/lib/category-media";
import { cn } from "@/lib/utils";

const CUSTOMER_BENEFITS = [
  "Only admin-reviewed and active menu items are publicly listed.",
  "Filter by pizza category, neighborhood location, and price.",
  "Duplicate orders for the same item and date are automatically prevented.",
  "Cancel any pending order cleanly before the kitchen accepts it.",
] as const;

const VENDOR_BENEFITS = [
  "Launch your restaurant profile and publish up to 3 active items on the Free plan.",
  "Upgrade to Premium for unlimited active items, a Premium badge, and featured placement.",
  "Accept or reject incoming orders from a dedicated Vendor Dashboard.",
] as const;

export function WhyPizzaHubSection() {
  return (
    <section
      aria-labelledby="why-pizzahub-heading"
      className="border-t border-border/70 bg-secondary/35"
    >
      <div className="mx-auto w-full max-w-6xl space-y-14 px-4 py-18 sm:px-6 lg:px-8 lg:py-22">
        <div className="space-y-7">
          <MotionReveal className="max-w-2xl space-y-2">
            <h2 className="font-heading text-2xl font-bold tracking-[-0.03em] text-foreground text-balance sm:text-[2rem]">
              From glowing brick-oven kitchens to neighborhood tables
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              Partnering with authentic wood-fired trattorias and artisan pizza
              kitchens — inside their 900°F brick-oven prep rooms and out on
              their neighborhood dining terraces.
            </p>
          </MotionReveal>

          <div className="grid gap-6 md:grid-cols-3">
            {PIZZERIA_SHOWCASE_PHOTOS.map((scene, idx) => (
              <MotionReveal
                key={scene.id}
                delay={idx * 0.06}
                className="h-full"
              >
                <article className="surface-card group flex h-full flex-col overflow-hidden rounded-3xl border border-border/90 bg-card">
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#1a110d]">
                    <Image
                      src={scene.image}
                      alt={scene.imageAlt}
                      fill
                      sizes="(min-width: 1024px) 31vw, 100vw"
                      className="object-cover object-center motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:scale-[1.035]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/22 to-transparent" />
                    <div className="absolute right-4 bottom-4 left-4 text-white">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#160f0c]/75 px-3 py-1 text-xs font-medium text-[#f6d6ad] backdrop-blur-xs">
                        {idx === 0 ? (
                          <Flame className="size-3.5" aria-hidden="true" />
                        ) : (
                          <UtensilsCrossed
                            className="size-3.5"
                            aria-hidden="true"
                          />
                        )}
                        {scene.locationTag}
                      </span>
                      <h3 className="mt-2 font-heading text-xl font-bold tracking-tight text-[#faf6f0]">
                        {scene.title}
                      </h3>
                    </div>
                  </div>
                  <div className="flex-1 p-5 sm:p-6">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {scene.caption}
                    </p>
                  </div>
                </article>
              </MotionReveal>
            ))}
          </div>
        </div>

        <MotionReveal className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="surface-card flex flex-col justify-between gap-7 rounded-3xl border border-border/90 bg-card p-7 sm:p-9">
            <div className="space-y-4">
              <h2
                id="why-pizzahub-heading"
                className="font-heading text-2xl font-bold tracking-[-0.03em] text-foreground text-balance sm:text-[1.85rem]"
              >
                Why PizzaHub for hungry diners
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                Built around straightforward ordering, verified kitchen menus,
                and real status transparency without surprise checkout hurdles.
              </p>

              <ul className="space-y-3 pt-2">
                {CUSTOMER_BENEFITS.map((benefit) => (
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
                  "h-11 rounded-xl px-5 text-sm font-semibold",
                )}
              >
                Browse Menu
              </Link>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-7 rounded-3xl border border-[#3a2820] bg-[#1a110d] p-7 text-[#faf6f0] shadow-[0_18px_40px_-20px_rgba(22,15,12,0.55)] sm:p-9">
            <div className="space-y-4">
              <h2 className="font-heading text-2xl font-bold tracking-[-0.03em] text-[#faf6f0] text-balance sm:text-[1.85rem]">
                Built for local pizzerias too
              </h2>
              <p className="text-sm leading-relaxed text-[#d7cbc0] sm:text-base">
                Create a restaurant profile, publish wood-fired specialties, and
                stay in control of incoming customer requests at your own pace.
              </p>

              <ul className="space-y-3 pt-2">
                {VENDOR_BENEFITS.map((benefit) => (
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
                  "h-11 rounded-xl px-5 text-sm font-semibold",
                )}
              >
                <span>Register as a Vendor</span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/sign-in"
                className="rounded-xl px-3 py-2 text-sm font-medium text-[#e4dbd1] underline-offset-4 hover:text-[#faf6f0] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f26d4f]"
              >
                Vendor Sign In
              </Link>
            </div>
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}
