import type { Metadata } from "next";
import { Suspense } from "react";
import { ProtectedRouteFallback } from "@/components/auth/protected-route-fallback";
import { CustomerOrderDetailView } from "@/components/orders/customer-order-detail-view";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = {
  title: "Order Tracking | PizzaHub",
  description:
    "View real-time order lifecycle milestones, delivery details, and ordered items on PizzaHub.",
};

async function OrderDetailGuard({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireRole(
    ["customer"],
    `/dashboard/customer/orders/${encodeURIComponent(id)}`,
  );

  return <CustomerOrderDetailView orderId={decodeURIComponent(id)} />;
}

export default function CustomerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<ProtectedRouteFallback />}>
      <OrderDetailGuard params={params} />
    </Suspense>
  );
}
