"use client";

import { Check, Crown, Info, Sparkles } from "lucide-react";
import Link from "next/link";
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
import {
  FREE_PLAN_ACTIVE_ITEM_LIMIT,
  FREE_PLAN_MONTHLY_PRICE,
  getPremiumMonthlyPrice,
} from "@/lib/subscription-plans";

export function UpgradePlanDialog({
  open,
  onOpenChange,
  currentPlan,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: "free" | "premium";
}) {
  const premiumPrice = getPremiumMonthlyPrice();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl p-6 sm:max-w-lg">
        <DialogHeader>
          <div className="mb-1 inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Crown className="size-5" aria-hidden="true" />
          </div>
          <DialogTitle className="text-xl font-semibold">
            {currentPlan === "premium"
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

        <Alert className="rounded-xl bg-muted/40">
          <Info className="size-4 text-primary" aria-hidden="true" />
          <AlertTitle>Subscription checkout pending</AlertTitle>
          <AlertDescription>
            Stripe subscription checkout will be connected in Client Task 15.
            Monthly price is configurable (${premiumPrice}/mo). Free plan
            vendors can rotate their menu by deactivating an active item.
          </AlertDescription>
        </Alert>

        <DialogFooter className="-mx-6 -mb-6 mt-1 flex-col gap-2 rounded-b-2xl px-6 py-4 sm:flex-row sm:justify-between">
          <Button
            render={
              <Link href="/pricing" onClick={() => onOpenChange(false)} />
            }
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
            Full Plan Comparison
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl bg-card"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
