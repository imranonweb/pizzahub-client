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
import { useLanguage } from "@/components/providers/language-provider";
import { useAuthSession } from "@/components/providers/session-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UpgradePlanDialog } from "@/components/vendor/upgrade-plan-dialog";
import { translateRole } from "@/lib/i18n/translations";
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

const VENDOR_FAQS_BN = [
  {
    question: "ফ্রি প্ল্যানের ৩টি সক্রিয় আইটেম সীমা কীভাবে কাজ করে?",
    answer:
      "ফ্রি প্ল্যানে আপনি যত খুশি ড্রাফট বা নিষ্ক্রিয় পিৎজা তৈরি করে রাখতে পারবেন। তবে পাবলিক /menu পেজে একসাথে সর্বোচ্চ ৩টি অনুমোদিত পিৎজা সক্রিয় রাখা যাবে। নতুন কোনো আইটেম চালু করতে চাইলে সক্রিয় একটি আইটেম নিষ্ক্রিয় করলেই সাথে সাথে স্লট খালি হয়ে যাবে।",
  },
  {
    question: "প্রিমিয়াম ভেন্ডররা কী কী অতিরিক্ত সুবিধা পান?",
    answer:
      "প্রিমিয়াম ভেন্ডররা আনলিমিটেড সক্রিয় মেনু লিস্টিং, প্রতিটি পিৎজা কার্ডে ভেরিফায়েড প্রিমিয়াম কিচেন ব্যাজ এবং পাবলিক মেনু ও সার্চে অগ্রাধিকার পান।",
  },
  {
    question: "PizzaHub প্রিমিয়াম প্ল্যানের মাসিক খরচ কত?",
    answer:
      "প্ল্যাটফর্মের নির্ধারিত মাসিক রেটে (সাধারণত $29/মাস) নিরাপদ Stripe Checkout-এর মাধ্যমে বিল পরিশোধ করা হয়।",
  },
  {
    question: "নতুন পিৎজা যোগ করলেই কি কাস্টমাররা সাথে সাথে দেখতে পান?",
    answer:
      "না। প্রতিটি নতুন পিৎজা প্রথমে 'পর্যালোচনাধীন' (Pending) অবস্থায় থাকে। প্ল্যাটফর্ম অ্যাডমিন ছবি ও বিবরণ যাচাই করে অনুমোদন দিলেই সেটি আপনার প্ল্যান সীমার মধ্যে সক্রিয় হয়।",
  },
  {
    question: "ফ্রি প্ল্যানে কি মৌসুমি বা স্পেশাল মেনু পরিবর্তন করা যায়?",
    answer:
      "হ্যাঁ! ভেন্ডর ড্যাশবোর্ড থেকে এক ক্লিকেই যেকোনো অনুমোদিত পিৎজা সক্রিয় বা নিষ্ক্রিয় করে কোনো খরচ ছাড়াই মেনু রোটেশন করতে পারবেন।",
  },
  {
    question: "বিলিং নবায়ন ও সাবস্ক্রিপশন বাতিল করার নিয়ম কী?",
    answer:
      "সাবস্ক্রিপশন সেটিংস থেকে Stripe Customer Billing Portal-এ গিয়ে যেকোনো সময় কার্ড পরিবর্তন, ইনভয়েস দেখা বা প্ল্যান বাতিল করা যায়। বাতিল করলেও চলতি বিলিং মেয়াদ শেষ হওয়া পর্যন্ত প্রিমিয়াম সুবিধা চালু থাকে।",
  },
] as const;

export function PricingPageClient() {
  const { locale, isBangla, t } = useLanguage();
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

  const faqs = isBangla ? VENDOR_FAQS_BN : VENDOR_FAQS;

  const toggleFaq = (index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="font-heading text-3xl font-extrabold tracking-[-0.03em] text-foreground text-balance sm:text-4xl lg:text-5xl">
          {t.pricing.heading}
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {t.pricing.subheadingPrefix} {FREE_PLAN_ACTIVE_ITEM_LIMIT}{" "}
          {t.pricing.subheadingSuffix}
        </p>

        {isNonVendorAuthenticated ? (
          <div className="mt-6">
            <Alert className="rounded-2xl border-border bg-card text-left sm:text-center">
              <ShieldAlert className="size-4 text-primary" aria-hidden="true" />
              <AlertTitle className="font-semibold text-foreground">
                {t.pricing.vendorReqTitle}
              </AlertTitle>
              <AlertDescription className="text-xs text-muted-foreground sm:text-sm">
                {role ? translateRole(role, locale) : ""}
              </AlertDescription>
            </Alert>
          </div>
        ) : null}
      </div>

      <section
        aria-label="Vendor Subscription Plans"
        className="mt-12 grid gap-8 lg:grid-cols-2 lg:gap-8"
      >
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "surface-card relative flex flex-col justify-between rounded-[2rem] border border-border/90 bg-card p-7 sm:p-9",
            isFreeVendor && "ring-2 ring-primary/40",
          )}
        >
          <div>
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-semibold text-foreground">
                <Store className="size-3.5 text-primary" aria-hidden="true" />
                {t.pricing.freeBadge}
              </span>
              {isFreeVendor ? (
                <Badge
                  variant="secondary"
                  className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                >
                  {t.pricing.currentPlanBadge}
                </Badge>
              ) : null}
            </div>

            <h2 className="mt-4 font-heading text-2xl font-bold tracking-tight text-foreground">
              {t.pricing.freeTitle}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {t.pricing.freeDesc}
            </p>

            <div className="mt-6 flex items-baseline gap-1.5 border-b border-border/75 pb-6">
              <span className="font-mono text-4xl font-extrabold tracking-tight tabular-nums text-foreground sm:text-5xl">
                ${FREE_PLAN_MONTHLY_PRICE}
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                {t.pricing.perMonth}
              </span>
              <span className="ml-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {t.pricing.freeForever}
              </span>
            </div>

            <div className="mt-6 space-y-4">
              <p className="text-xs font-bold tracking-wider text-foreground uppercase">
                {t.pricing.whatsIncluded}
              </p>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {(isBangla
                  ? [
                      `একসাথে সর্বোচ্চ ${FREE_PLAN_ACTIVE_ITEM_LIMIT}টি অনুমোদিত সক্রিয় মেনু আইটেম`,
                      "আনলিমিটেড ড্রাফট, পর্যালোচনাধীন ও নিষ্ক্রিয় আইটেম সংরক্ষণ",
                      "পাবলিক /menu ডিরেক্টরিতে স্ট্যান্ডার্ড প্রদর্শন",
                      "ভেন্ডর ড্যাশবোর্ড ও অর্ডার স্ট্যাটাস ম্যানেজমেন্ট",
                      "প্রতিটি আইটেমে সর্বোচ্চ ৫টি হাই-রেজোলিউশন ছবি",
                    ]
                  : [
                      `Up to ${FREE_PLAN_ACTIVE_ITEM_LIMIT} active approved menu items live simultaneously`,
                      "Unlimited draft, pending, and paused menu catalog items",
                      "Standard placement on the public /menu directory",
                      "Vendor overview dashboard & incoming order management",
                      "Up to 5 dish photos per listing",
                    ]
                ).map((line) => (
                  <li key={line} className="flex items-start gap-3">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Check className="size-3.5" aria-hidden="true" />
                    </span>
                    <span className="text-foreground/90">{line}</span>
                  </li>
                ))}
                <li className="flex items-start gap-3 text-muted-foreground/60">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <X className="size-3.5" aria-hidden="true" />
                  </span>
                  <span className="line-through">
                    {isBangla
                      ? "ভেরিফায়েড প্রিমিয়াম কিচেন ব্যাজ"
                      : "Verified Premium Kitchen badge"}
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-border/75 pt-6">
            {!isAuthenticated ? (
              <Button
                render={<Link href="/sign-up?role=vendor" />}
                variant="outline"
                className="h-11 w-full rounded-full bg-card font-semibold"
              >
                {t.pricing.startFreeVendor}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            ) : isFreeVendor ? (
              <Button
                render={<Link href="/dashboard/vendor/menu" />}
                variant="outline"
                className="h-11 w-full rounded-full bg-card font-semibold"
              >
                <CheckCircle2
                  className="size-4 text-primary"
                  aria-hidden="true"
                />
                {t.dashboard.myMenuItems} ({FREE_PLAN_ACTIVE_ITEM_LIMIT})
              </Button>
            ) : (
              <Button
                variant="outline"
                disabled
                className="h-11 w-full rounded-full bg-muted text-muted-foreground"
              >
                {t.pricing.vendorOnlyBtn}
              </Button>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex flex-col justify-between rounded-[2rem] border border-[#3a2820] bg-[#160f0c] p-7 text-[#faf6f0] shadow-[0_24px_48px_-22px_rgba(20,13,10,0.62)] sm:p-9"
        >
          <div className="absolute -top-3.5 right-8">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3.5 py-1 text-xs font-bold text-primary-foreground shadow-sm">
              <Crown className="size-3" aria-hidden="true" />
              {t.pricing.mostPopular}
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#faf6f0]/15 bg-[#faf6f0]/8 px-3 py-1 text-xs font-semibold text-[#f6d6ad]">
                <Crown className="size-3.5 text-[#f26d4f]" aria-hidden="true" />
                {t.pricing.premiumBadge}
              </span>
              {isPremiumVendor ? (
                <Badge className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  {cancelAtPeriodEnd
                    ? t.pricing.cancellingSoonBadge
                    : t.pricing.currentPlanBadge}
                </Badge>
              ) : null}
            </div>

            <h2 className="mt-4 font-heading text-2xl font-bold tracking-tight text-[#faf6f0]">
              {t.pricing.premiumTitle}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[#d7cbc0]">
              {t.pricing.premiumDesc}
            </p>

            <div className="mt-6 flex flex-col border-b border-[#faf6f0]/14 pb-6">
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-4xl font-bold tracking-tight tabular-nums text-[#faf6f0] sm:text-5xl">
                  ${premiumPrice}
                </span>
                <span className="text-sm font-medium text-[#d7cbc0]">
                  {t.pricing.perMonth}
                </span>
                <span className="ml-2 text-xs font-medium text-[#cfc4b8]">
                  {t.pricing.billedStripe}
                </span>
              </div>
              <p className="mt-1 text-xs text-[#b5a99c]">
                {t.pricing.cancelAnytime}
              </p>
            </div>

            <div className="mt-6 space-y-4">
              <p className="text-xs font-bold tracking-wider text-[#f6d6ad] uppercase">
                {t.pricing.everythingInFree}
              </p>
              <ul className="space-y-3 text-sm text-[#efe7df]">
                {(isBangla
                  ? [
                      "পাবলিক /menu পেজে আনলিমিটেড সক্রিয় অনুমোদিত লিস্টিং",
                      "পিৎজা কার্ডে ভেরিফায়েড প্রিমিয়াম কিচেন ব্যাজ",
                      "পাবলিক মেনু ও সার্চে অগ্রাধিকারমূলক র‍্যাঙ্কিং",
                      "দ্রুত মেনু অনুমোদনের জন্য প্রায়োরিটি মডারেশন কিউ",
                      "স্লট সীমা ছাড়াই সম্পূর্ণ মৌসুমি ও স্পেশাল মেনু স্বাধীনতা",
                      "প্রায়োরিটি ভেন্ডর সাপোর্ট ও অনবোর্ডিং সহায়তা",
                    ]
                  : [
                      "Unlimited active approved menu listings live on /menu",
                      "Verified Premium Kitchen badge displayed on your pizza cards",
                      "Priority catalog visibility & featured search ranking",
                      "Priority moderation queue for rapid dish approvals",
                      "Full dish rotation flexibility with zero capacity restrictions",
                      "Priority vendor customer support & onboarding",
                    ]
                ).map((line) => (
                  <li key={line} className="flex items-start gap-3">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3.5" aria-hidden="true" />
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-[#faf6f0]/14 pt-6">
            {!isAuthenticated ? (
              <Button
                render={<Link href="/sign-up?role=vendor" />}
                className="h-11 w-full rounded-full font-semibold"
              >
                <Crown className="size-4" aria-hidden="true" />
                {t.pricing.joinVendorUpgrade}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            ) : isPremiumVendor && !cancelAtPeriodEnd ? (
              <Button
                render={<Link href="/dashboard/vendor/subscription" />}
                className="h-11 w-full rounded-full font-semibold"
              >
                <Crown className="size-4" aria-hidden="true" />
                {t.pricing.viewSubDetails}
              </Button>
            ) : isVendor ? (
              <Button
                type="button"
                onClick={() => setUpgradeDialogOpen(true)}
                className="h-11 w-full rounded-full font-semibold"
              >
                <Crown className="size-4" aria-hidden="true" />
                {cancelAtPeriodEnd
                  ? t.pricing.renewPremium
                  : t.pricing.upgradePremium}
              </Button>
            ) : (
              <Button
                variant="outline"
                disabled
                className="h-11 w-full rounded-full border-[#faf6f0]/20 bg-[#faf6f0]/8 text-[#cfc4b8]"
              >
                {t.pricing.vendorOnlyBtn}
              </Button>
            )}
          </div>
        </motion.div>
      </section>

      <section aria-labelledby="comparison-heading" className="mt-20 space-y-6">
        <div className="text-center">
          <h2
            id="comparison-heading"
            className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
          >
            {t.pricing.comparisonHeading}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            {t.pricing.comparisonSubheading}
          </p>
        </div>

        <div className="surface-card overflow-hidden rounded-3xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th
                    scope="col"
                    className="w-1/2 px-6 py-4 font-semibold text-foreground"
                  >
                    {t.pricing.featureCol}
                  </th>
                  <th
                    scope="col"
                    className="w-1/4 px-6 py-4 text-center font-semibold text-foreground"
                  >
                    {t.pricing.freeTitle}
                  </th>
                  <th
                    scope="col"
                    className="w-1/4 px-6 py-4 text-center font-bold text-primary"
                  >
                    {t.pricing.premiumTitle}
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

      <section aria-labelledby="faq-heading" className="mt-20 space-y-8">
        <div className="text-center">
          <h2
            id="faq-heading"
            className="font-heading text-2xl font-bold tracking-[-0.025em] text-foreground sm:text-3xl"
          >
            {t.pricing.faqHeading}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            {t.pricing.faqSubheading}
          </p>
        </div>

        <div className="mx-auto max-w-3xl space-y-3">
          {faqs.map((faq, index) => {
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

      <section
        aria-label="Get started"
        className="surface-card mt-20 rounded-[2rem] border border-primary/20 bg-accent/65 p-8 text-center sm:p-12"
      >
        <div className="mx-auto max-w-2xl space-y-4">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t.pricing.bottomHeading}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t.pricing.bottomSubheading}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {!isAuthenticated ? (
              <>
                <Button
                  render={<Link href="/sign-up?role=vendor" />}
                  className="h-11 rounded-full px-6 font-semibold"
                >
                  <Store className="size-4" aria-hidden="true" />
                  {t.pricing.becomeVendorFree}
                </Button>
                <Button
                  render={<Link href="/menu" />}
                  variant="outline"
                  className="h-11 rounded-full bg-card px-6"
                >
                  {t.pricing.browseCustomerMenu}
                </Button>
              </>
            ) : isVendor ? (
              <>
                <Button
                  render={<Link href="/dashboard/vendor/menu" />}
                  className="h-11 rounded-full px-6 font-semibold"
                >
                  <UtensilsCrossed className="size-4" aria-hidden="true" />
                  {t.pricing.goKitchenDashboard}
                </Button>
                <Button
                  render={<Link href="/dashboard/vendor/subscription" />}
                  variant="outline"
                  className="h-11 rounded-full bg-card px-6"
                >
                  <Crown className="size-4 text-primary" aria-hidden="true" />
                  {t.pricing.subSettings}
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
                className="h-11 rounded-full px-6 font-semibold"
              >
                {t.pricing.returnDashboard}
              </Button>
            )}
          </div>
        </div>
      </section>

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
