"use client";

import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Crown,
  ShieldAlert,
  Store,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import { useAuthSession } from "@/components/providers/session-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UpgradePlanDialog } from "@/components/vendor/upgrade-plan-dialog";
import {
  type BackendVendorSubscription,
  fetchVendorSubscription,
} from "@/lib/subscription-api";
import {
  FREE_PLAN_ACTIVE_ITEM_LIMIT,
  FREE_PLAN_MONTHLY_PRICE,
  getPremiumMonthlyPrice,
  PLAN_COMPARISON_CATEGORIES,
  VENDOR_FAQS,
} from "@/lib/subscription-plans";
import { cn } from "@/lib/utils";

export function PricingPageClient() {
  const { user, role, isAuthenticated } = useAuthSession();
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [liveSubscription, setLiveSubscription] =
    useState<BackendVendorSubscription | null>(null);
  const [backendPremiumPrice, setBackendPremiumPrice] = useState<
    number | undefined
  >(undefined);

  const isVendor = isAuthenticated && role === "vendor";
  const isNonVendorAuthenticated =
    isAuthenticated && (role === "customer" || role === "admin");

  useEffect(() => {
    if (!isVendor) {
      setLiveSubscription(null);
      setBackendPremiumPrice(undefined);
      return;
    }

    let cancelled = false;
    fetchVendorSubscription()
      .then((res) => {
        if (cancelled) return;
        if (res.source === "live") {
          setLiveSubscription(res.subscription);
          const premium = res.plans.find((p) => p.id === "premium");
          if (premium && typeof premium.price === "number") {
            setBackendPremiumPrice(premium.price);
          }
        }
      })
      .catch(() => {
        // Fallback smoothly to authenticated session values
      });

    return () => {
      cancelled = true;
    };
  }, [isVendor]);

  const premiumPrice =
    typeof backendPremiumPrice === "number"
      ? backendPremiumPrice
      : getPremiumMonthlyPrice();

  const userPlan = liveSubscription?.plan ?? user?.subscriptionPlan ?? "free";
  const cancelAtPeriodEnd = liveSubscription?.cancelAtPeriodEnd ?? false;
  const isPremiumVendor = isVendor && userPlan === "premium";
  const isFreeVendor = isVendor && userPlan === "free";

  const toggleFaq = (index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
      {/* Hero Section */}
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="font-heading text-3xl font-bold tracking-[-0.03em] text-foreground text-balance sm:text-4xl lg:text-5xl">
          Simple, honest pricing for independent pizzerias
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Start completely free with up to {FREE_PLAN_ACTIVE_ITEM_LIMIT} active
          menu listings. Upgrade to PizzaHub Premium anytime via Stripe Checkout
          for unlimited dishes, priority discovery placement, and our Verified
          Kitchen badge.
        </p>

        {isNonVendorAuthenticated ? (
          <div className="mt-6">
            <Alert className="rounded-2xl border-border bg-card text-left sm:text-center">
              <ShieldAlert className="size-4 text-primary" aria-hidden="true" />
              <AlertTitle className="font-semibold text-foreground">
                Vendor Account Required for Subscription Purchase
              </AlertTitle>
              <AlertDescription className="text-xs text-muted-foreground sm:text-sm">
                You are signed in with a{" "}
                <strong className="capitalize text-foreground">{role}</strong>{" "}
                account. Subscriptions apply exclusively to pizzeria vendor
                kitchens.
              </AlertDescription>
            </Alert>
          </div>
        ) : null}
      </div>

      {/* Pricing Cards */}
      <section
        aria-label="Vendor Subscription Plans"
        className="mt-12 grid gap-8 lg:grid-cols-2 lg:gap-8"
      >
        {/* FREE PLAN CARD */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "surface-card relative flex flex-col justify-between rounded-3xl border border-border/90 bg-card p-7 sm:p-9",
            isFreeVendor && "ring-2 ring-primary/40",
          )}
        >
          <div>
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-semibold text-foreground">
                <Store className="size-3.5 text-primary" aria-hidden="true" />
                Free Kitchen Tier
              </span>
              {isFreeVendor ? (
                <Badge
                  variant="secondary"
                  className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                >
                  Your Current Plan
                </Badge>
              ) : null}
            </div>

            <h2 className="mt-4 font-heading text-2xl font-bold tracking-tight text-foreground">
              Free Plan
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Ideal for new kitchens testing neighborhood demand or operating
              with a focused pizza roster.
            </p>

            <div className="mt-6 flex items-baseline gap-1.5 border-b border-border/70 pb-6">
              <span className="font-heading text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                ${FREE_PLAN_MONTHLY_PRICE}
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                / month
              </span>
              <span className="ml-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                · Free forever
              </span>
            </div>

            <div className="mt-6 space-y-4">
              <p className="text-xs font-bold tracking-wider text-foreground uppercase">
                What&apos;s included:
              </p>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Check className="size-3.5" aria-hidden="true" />
                  </span>
                  <span>
                    Up to{" "}
                    <strong className="font-semibold text-foreground">
                      {FREE_PLAN_ACTIVE_ITEM_LIMIT} active approved menu items
                    </strong>{" "}
                    live simultaneously
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Check className="size-3.5" aria-hidden="true" />
                  </span>
                  <span>
                    Unlimited draft, pending, and paused menu catalog items
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Check className="size-3.5" aria-hidden="true" />
                  </span>
                  <span>Standard placement on the public /menu directory</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Check className="size-3.5" aria-hidden="true" />
                  </span>
                  <span>
                    Basic vendor overview dashboard & status moderation
                    indicators
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Check className="size-3.5" aria-hidden="true" />
                  </span>
                  <span>Up to 5 dish photos per listing</span>
                </li>
                <li className="flex items-start gap-3 text-muted-foreground/60">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <X className="size-3.5" aria-hidden="true" />
                  </span>
                  <span className="line-through">
                    Verified Premium Kitchen badge
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-border/70 pt-6">
            {!isAuthenticated ? (
              <Button
                render={<Link href="/sign-up?role=vendor" />}
                variant="outline"
                className="h-11 w-full rounded-xl bg-card font-semibold"
              >
                Start Free as a Vendor
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            ) : isFreeVendor ? (
              <Button
                render={<Link href="/dashboard/vendor/menu" />}
                variant="outline"
                className="h-11 w-full rounded-xl bg-card font-semibold"
              >
                <CheckCircle2
                  className="size-4 text-primary"
                  aria-hidden="true"
                />
                Manage Free Menu ({FREE_PLAN_ACTIVE_ITEM_LIMIT} active limit)
              </Button>
            ) : isPremiumVendor ? (
              <Button
                variant="outline"
                disabled
                className="h-11 w-full rounded-xl bg-muted text-muted-foreground"
              >
                Included in Your Account
              </Button>
            ) : (
              <Button
                variant="outline"
                disabled
                className="h-11 w-full rounded-xl bg-muted text-muted-foreground"
              >
                Available for Vendor Accounts Only
              </Button>
            )}
          </div>
        </motion.div>

        {/* PREMIUM PLAN CARD */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex flex-col justify-between rounded-3xl border border-[#3a2820] bg-[#1a110d] p-7 text-[#faf6f0] shadow-[0_24px_48px_-22px_rgba(22,15,12,0.58)] sm:p-9"
        >
          {/* Most popular badge */}
          <div className="absolute -top-3.5 right-8">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3.5 py-1 text-xs font-bold text-primary-foreground shadow-sm">
              <Crown className="size-3" aria-hidden="true" />
              Most Popular
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#faf6f0]/15 bg-[#faf6f0]/8 px-3 py-1 text-xs font-semibold text-[#f6d6ad]">
                <Crown className="size-3.5 text-[#f26d4f]" aria-hidden="true" />
                PizzaHub Premium
              </span>
              {isPremiumVendor ? (
                <Badge className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  {cancelAtPeriodEnd ? "Cancelling Soon" : "Your Current Plan"}
                </Badge>
              ) : null}
            </div>

            <h2 className="mt-4 font-heading text-2xl font-bold tracking-tight text-[#faf6f0]">
              Premium Plan
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[#d7cbc0]">
              Designed for high-volume pizzerias, multiple styles, and kitchens
              ready to maximize delivery reach.
            </p>

            <div className="mt-6 flex flex-col border-b border-[#faf6f0]/14 pb-6">
              <div className="flex items-baseline gap-1.5">
                <span className="font-heading text-4xl font-bold tracking-tight tabular-nums text-[#faf6f0] sm:text-5xl">
                  ${premiumPrice}
                </span>
                <span className="text-sm font-medium text-[#d7cbc0]">
                  / month
                </span>
                <span className="ml-2 text-xs font-medium text-[#cfc4b8]">
                  · Billed monthly via Stripe
                </span>
              </div>
              <p className="mt-1 text-xs text-[#b5a99c]">
                Cancel anytime · Secure Stripe Checkout
              </p>
            </div>

            <div className="mt-6 space-y-4">
              <p className="text-xs font-bold tracking-wider text-[#f6d6ad] uppercase">
                Everything in Free, plus:
              </p>
              <ul className="space-y-3 text-sm text-[#efe7df]">
                <li className="flex items-start gap-3">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3.5" aria-hidden="true" />
                  </span>
                  <span>
                    <strong className="font-semibold text-[#faf6f0]">
                      Unlimited active approved menu listings
                    </strong>{" "}
                    live on /menu
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3.5" aria-hidden="true" />
                  </span>
                  <span>
                    <strong className="font-semibold text-[#faf6f0]">
                      Verified Premium Kitchen badge
                    </strong>{" "}
                    displayed on your pizza cards
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3.5" aria-hidden="true" />
                  </span>
                  <span>
                    Priority catalog visibility & featured search ranking
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3.5" aria-hidden="true" />
                  </span>
                  <span>
                    Priority moderation queue for rapid dish approvals
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3.5" aria-hidden="true" />
                  </span>
                  <span>
                    Full dish rotation flexibility with zero capacity
                    restrictions
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3.5" aria-hidden="true" />
                  </span>
                  <span>Priority vendor customer support & onboarding</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-[#faf6f0]/14 pt-6">
            {!isAuthenticated ? (
              <Button
                render={<Link href="/sign-up?role=vendor" />}
                className="h-11 w-full rounded-xl font-semibold"
              >
                <Crown className="size-4" aria-hidden="true" />
                Join as Vendor to Upgrade
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            ) : isPremiumVendor && !cancelAtPeriodEnd ? (
              <Button
                render={<Link href="/dashboard/vendor/subscription" />}
                className="h-11 w-full rounded-xl font-semibold"
              >
                <Crown className="size-4" aria-hidden="true" />
                View Subscription Details
              </Button>
            ) : isVendor ? (
              <Button
                type="button"
                onClick={() => setUpgradeDialogOpen(true)}
                className="h-11 w-full rounded-xl font-semibold"
              >
                <Crown className="size-4" aria-hidden="true" />
                {cancelAtPeriodEnd
                  ? "Renew Premium Plan"
                  : "Upgrade to Premium"}
              </Button>
            ) : (
              <Button
                variant="outline"
                disabled
                className="h-11 w-full rounded-xl border-[#faf6f0]/20 bg-[#faf6f0]/8 text-[#cfc4b8]"
              >
                Vendor Accounts Only
              </Button>
            )}
          </div>
        </motion.div>
      </section>

      {/* Feature Comparison Matrix */}
      <section aria-labelledby="comparison-heading" className="mt-20 space-y-6">
        <div className="text-center">
          <h2
            id="comparison-heading"
            className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
          >
            Detailed Feature Comparison
          </h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Compare every capability across Free and Premium vendor plans.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th
                    scope="col"
                    className="w-1/2 px-6 py-4 font-semibold text-foreground"
                  >
                    Feature & Benefit
                  </th>
                  <th
                    scope="col"
                    className="w-1/4 px-6 py-4 text-center font-semibold text-foreground"
                  >
                    Free Plan
                  </th>
                  <th
                    scope="col"
                    className="w-1/4 px-6 py-4 text-center font-bold text-primary"
                  >
                    Premium Plan
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {PLAN_COMPARISON_CATEGORIES.map((category) => (
                  <Fragment key={category.category}>
                    <tr className="bg-muted/30">
                      <th
                        colSpan={3}
                        scope="colgroup"
                        className="px-6 py-2.5 text-xs font-bold tracking-wider text-muted-foreground uppercase"
                      >
                        {category.category}
                      </th>
                    </tr>
                    {category.features.map((feature) => (
                      <tr
                        key={feature.name}
                        className={cn(
                          "transition-colors hover:bg-muted/15",
                          feature.highlight && "bg-accent/20",
                        )}
                      >
                        <td className="px-6 py-4 align-top">
                          <p className="font-medium text-foreground">
                            {feature.name}
                          </p>
                          {feature.description ? (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {feature.description}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-6 py-4 text-center align-top">
                          {typeof feature.free === "boolean" ? (
                            feature.free ? (
                              <Check
                                className="mx-auto size-4 text-primary"
                                aria-label="Included"
                              />
                            ) : (
                              <X
                                className="mx-auto size-4 text-muted-foreground/60"
                                aria-label="Not included"
                              />
                            )
                          ) : (
                            <span className="text-xs font-medium text-foreground">
                              {feature.free}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center align-top font-semibold text-primary">
                          {typeof feature.premium === "boolean" ? (
                            feature.premium ? (
                              <Check
                                className="mx-auto size-4 text-primary"
                                aria-label="Included"
                              />
                            ) : (
                              <X
                                className="mx-auto size-4 text-muted-foreground/60"
                                aria-label="Not included"
                              />
                            )
                          ) : (
                            <span className="text-xs font-semibold text-foreground">
                              {feature.premium}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Vendor FAQ Section */}
      <section aria-labelledby="faq-heading" className="mt-20 space-y-8">
        <div className="text-center">
          <h2
            id="faq-heading"
            className="font-heading text-2xl font-bold tracking-[-0.025em] text-foreground sm:text-3xl"
          >
            Frequently Asked Questions for Kitchens
          </h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Everything you need to know about listing limits, approvals, and
            billing.
          </p>
        </div>

        <div className="mx-auto max-w-3xl space-y-3">
          {VENDOR_FAQS.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={faq.question}
                className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xs transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left font-medium text-foreground hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="text-base font-semibold">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                      isOpen && "rotate-180 text-foreground",
                    )}
                    aria-hidden="true"
                  />
                </button>
                {isOpen ? (
                  <div className="border-t border-border/70 px-5 pt-3 pb-5 text-sm leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section
        aria-label="Get started"
        className="mt-20 rounded-3xl border border-primary/20 bg-accent/40 p-8 text-center sm:p-12"
      >
        <div className="mx-auto max-w-2xl space-y-4">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Ready to bring your pizza creations to the neighborhood?
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            Join PizzaHub today. Submit your first 3 pizzas on our Free plan
            with zero financial commitment, or upgrade to Premium for unlimited
            listings.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {!isAuthenticated ? (
              <>
                <Button
                  render={<Link href="/sign-up?role=vendor" />}
                  className="h-11 rounded-xl px-6 font-semibold"
                >
                  <Store className="size-4" aria-hidden="true" />
                  Become a Vendor Free
                </Button>
                <Button
                  render={<Link href="/menu" />}
                  variant="outline"
                  className="h-11 rounded-xl bg-card px-6"
                >
                  Browse Customer Menu
                </Button>
              </>
            ) : isVendor ? (
              <>
                <Button
                  render={<Link href="/dashboard/vendor/menu" />}
                  className="h-11 rounded-xl px-6 font-semibold"
                >
                  <UtensilsCrossed className="size-4" aria-hidden="true" />
                  Go to Kitchen Dashboard
                </Button>
                <Button
                  render={<Link href="/dashboard/vendor/subscription" />}
                  variant="outline"
                  className="h-11 rounded-xl bg-card px-6"
                >
                  <Crown className="size-4 text-primary" aria-hidden="true" />
                  Subscription Settings
                </Button>
              </>
            ) : (
              <Button
                render={
                  <Link
                    href={
                      role === "admin"
                        ? "/dashboard/admin"
                        : "/dashboard/customer"
                    }
                  />
                }
                className="h-11 rounded-xl px-6 font-semibold"
              >
                Return to Your Dashboard
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Upgrade Plan Dialog (Vendors only) */}
      {isVendor ? (
        <UpgradePlanDialog
          open={upgradeDialogOpen}
          onOpenChange={setUpgradeDialogOpen}
          currentPlan={userPlan}
          cancelAtPeriodEnd={cancelAtPeriodEnd}
          backendPremiumPrice={premiumPrice}
        />
      ) : null}
    </div>
  );
}
