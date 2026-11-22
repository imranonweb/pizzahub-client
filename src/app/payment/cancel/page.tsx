import { ArrowLeft, Crown, XCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PublicShell } from "@/components/layout/public-shell";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { requireRole } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Checkout Cancelled | PizzaHub",
  description:
    "Your Stripe subscription checkout was cancelled before completion.",
};

async function PaymentCancelGate() {
  await requireRole(["vendor"], "/payment/cancel");

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-14 sm:px-6 lg:py-20">
      <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-xs sm:p-10">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <XCircle className="size-7" aria-hidden="true" />
        </div>

        <h1 className="mt-5 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Subscription Checkout Cancelled
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
          Your Stripe Checkout session was cancelled and your account has not
          been charged. You can continue using your current kitchen plan or
          upgrade whenever you are ready.
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/dashboard/vendor/subscription"
            className={cn(
              buttonVariants({ variant: "default" }),
              "h-10 rounded-xl px-5 font-semibold",
            )}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Return to Subscription Settings
          </Link>
          <Link
            href="/pricing"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-10 rounded-xl bg-card px-5 font-medium",
            )}
          >
            <Crown className="size-4 text-primary" aria-hidden="true" />
            Compare Plans
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentCancelPage() {
  return (
    <PublicShell>
      <Suspense
        fallback={
          <div className="mx-auto w-full max-w-2xl px-4 py-16">
            <Skeleton className="h-64 w-full rounded-3xl" />
          </div>
        }
      >
        <PaymentCancelGate />
      </Suspense>
    </PublicShell>
  );
}
