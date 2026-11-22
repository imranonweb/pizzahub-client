import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
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
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="flex flex-col justify-between gap-6 rounded-3xl border border-border bg-card p-7 sm:p-9">
            <div className="space-y-4">
              <h2
                id="why-pizzahub-heading"
                className="font-heading text-2xl font-bold tracking-[-0.025em] text-foreground sm:text-3xl"
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

          <div className="flex flex-col justify-between gap-6 rounded-3xl bg-[#1d130f] p-7 text-white sm:p-9">
            <div className="space-y-4">
              <h2 className="font-heading text-2xl font-bold tracking-[-0.025em] text-white sm:text-3xl">
                Built for local pizzerias too
              </h2>
              <p className="text-sm leading-relaxed text-white/80 sm:text-base">
                Create a restaurant profile, publish wood-fired specialties, and
                stay in control of incoming customer requests at your own pace.
              </p>

              <ul className="space-y-3 pt-2">
                {VENDOR_BENEFITS.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-start gap-2.5 text-sm text-white/90"
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
                  "h-11 rounded-xl px-5 text-sm font-semibold shadow-sm",
                )}
              >
                <span>Register as a Vendor</span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/sign-in"
                className="rounded-xl px-3 py-2 text-sm font-medium text-white/85 underline-offset-4 hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
              >
                Vendor Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
