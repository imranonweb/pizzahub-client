import type { Metadata } from "next";
import { Suspense } from "react";
import { PublicShell } from "@/components/layout/public-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { PaymentSuccessView } from "@/components/vendor/payment-success-view";
import { requireRole } from "@/lib/session";
import { reconcileVendorStripeCheckout } from "@/lib/stripe-reconcile";

export const metadata: Metadata = {
  title: "Subscription Checkout Confirmation | PizzaHub",
  description:
    "Verify your PizzaHub vendor subscription status after Stripe Checkout.",
};

async function PaymentSuccessGate({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const authSession = await requireRole(["vendor"], "/payment/success");
  const params = await searchParams;
  const sessionId =
    typeof params.session_id === "string" ? params.session_id : undefined;

  await reconcileVendorStripeCheckout({
    vendorId: authSession.user.id,
    sessionId,
  });

  return <PaymentSuccessView sessionId={sessionId} />;
}

export default function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  return (
    <PublicShell>
      <Suspense
        fallback={
          <div className="mx-auto w-full max-w-2xl px-4 py-16">
            <Skeleton className="h-72 w-full rounded-3xl" />
          </div>
        }
      >
        <PaymentSuccessGate searchParams={searchParams} />
      </Suspense>
    </PublicShell>
  );
}
