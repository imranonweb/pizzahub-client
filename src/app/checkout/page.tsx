import type { Metadata } from "next";
import { Suspense } from "react";
import { ProtectedRouteFallback } from "@/components/auth/protected-route-fallback";
import { PublicShell } from "@/components/layout/public-shell";
import { CheckoutClient } from "@/components/orders/checkout-client";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = {
  title: "Checkout | PizzaHub",
  description:
    "Verify your pizza selection and submit a delivery order on PizzaHub.",
};

async function CheckoutGuard() {
  const { user } = await requireRole(["customer"], "/checkout");

  return (
    <CheckoutClient
      customer={{
        id: user.id,
        name: user.name,
        email: user.email,
      }}
    />
  );
}

export default function CheckoutPage() {
  return (
    <PublicShell>
      <Suspense fallback={<ProtectedRouteFallback />}>
        <CheckoutGuard />
      </Suspense>
    </PublicShell>
  );
}
