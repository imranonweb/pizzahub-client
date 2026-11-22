"use client";

import {
  AlertCircle,
  Check,
  Crown,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAuthSession } from "@/components/providers/session-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createVendorCheckoutSession } from "@/lib/subscription-api";
import {
  FREE_PLAN_ACTIVE_ITEM_LIMIT,
  FREE_PLAN_MONTHLY_PRICE,
  getPremiumMonthlyPrice,
} from "@/lib/subscription-plans";

export function UpgradePlanDialog({
  open,
  onOpenChange,
  currentPlan,
  cancelAtPeriodEnd = false,
  backendPremiumPrice,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: "free" | "premium";
  cancelAtPeriodEnd?: boolean;
  backendPremiumPrice?: number;
}) {
  const { role, isAuthenticated } = useAuthSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const premiumPrice =
    typeof backendPremiumPrice === "number" && backendPremiumPrice >= 0
      ? backendPremiumPrice
      : getPremiumMonthlyPrice();

  const isVendor = isAuthenticated && role === "vendor";
  const canStartCheckout =
    isVendor && (currentPlan === "free" || cancelAtPeriodEnd);

  const handleCheckout = async () => {
    if (!canStartCheckout || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await createVendorCheckoutSession();
      if (!result.ok || !result.checkoutUrl) {
        setErrorMessage(result.message);
        setIsSubmitting(false);
        return;
      }

      window.location.assign(result.checkoutUrl);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to initiate Stripe checkout.",
      );
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isSubmitting) {
          if (!nextOpen) {
            setErrorMessage(null);
          }
          onOpenChange(nextOpen);
        }
      }}
    >
      <DialogContent className="rounded-2xl p-6 sm:max-w-lg">
        <DialogHeader>
          <div className="mb-1 inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Crown className="size-5" aria-hidden="true" />
          </div>
          <DialogTitle className="text-xl font-semibold">
            {currentPlan === "premium" && !cancelAtPeriodEnd
              ? "Your Premium Kitchen Plan"
              : "Upgrade to PizzaHub Premium"}
          </DialogTitle>
          <DialogDescription>
            Compare kitchen listing limits across Free and Premium vendor plans.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          {/* Free Plan */}
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Free Plan</p>
              <span className="font-heading text-sm font-bold text-foreground tabular-nums">
                ${FREE_PLAN_MONTHLY_PRICE}/mo
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Best for testing your kitchen
            </p>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <Check
                  className="mt-0.5 size-3.5 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span>
                  Up to {FREE_PLAN_ACTIVE_ITEM_LIMIT} active approved menu items
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check
                  className="mt-0.5 size-3.5 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span>Standard listing placement on the public menu</span>
              </li>
            </ul>
          </div>

          {/* Premium Plan */}
          <div className="rounded-xl border border-primary/35 bg-accent/50 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">
                Premium Plan
              </p>
              <span className="font-heading text-sm font-bold text-primary tabular-nums">
                ${premiumPrice}/mo
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Built for busy pizzerias
            </p>
            <ul className="mt-3 space-y-2 text-xs text-foreground">
              <li className="flex items-start gap-2">
                <Check
                  className="mt-0.5 size-3.5 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span>Unlimited active approved menu items</span>
              </li>
              <li className="flex items-start gap-2">
                <Check
                  className="mt-0.5 size-3.5 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span>
                  Verified Premium badge displayed on your public listings
                </span>
              </li>
            </ul>
          </div>
        </div>

        {errorMessage ? (
          <Alert variant="destructive" className="rounded-xl">
            <AlertCircle className="size-4" aria-hidden="true" />
            <AlertTitle>Checkout unavailable</AlertTitle>
            <AlertDescription className="text-xs">
              {errorMessage}
            </AlertDescription>
          </Alert>
        ) : !isVendor ? (
          <Alert className="rounded-xl bg-muted/40">
            <AlertCircle className="size-4 text-primary" aria-hidden="true" />
            <AlertTitle>Vendor account required</AlertTitle>
            <AlertDescription className="text-xs">
              Only signed-in Vendor accounts can purchase a kitchen
              subscription.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="rounded-xl bg-muted/40">
            <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
            <AlertTitle>Secure Stripe Checkout</AlertTitle>
            <AlertDescription className="text-xs">
              You will be redirected to Stripe&apos;s hosted checkout page to
              complete your ${premiumPrice}/month subscription. Card details are
              never collected on PizzaHub.
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter className="-mx-6 -mb-6 mt-1 flex-col gap-2 rounded-b-2xl px-6 py-4 sm:flex-row sm:justify-between">
          <Button
            render={
              <Link href="/pricing" onClick={() => onOpenChange(false)} />
            }
            variant="ghost"
            size="sm"
            disabled={isSubmitting}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
            Full Plan Comparison
          </Button>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              className="rounded-xl bg-card"
            >
              Cancel
            </Button>

            {canStartCheckout ? (
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={() => void handleCheckout()}
                className="rounded-xl font-semibold shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                    Redirecting to Stripe...
                  </>
                ) : (
                  <>
                    <Crown className="size-4" aria-hidden="true" />
                    Continue to Stripe
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                  </>
                )}
              </Button>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
