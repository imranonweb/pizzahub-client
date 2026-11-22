import { type ReactNode, Suspense } from "react";
import { ProtectedRouteFallback } from "@/components/auth/protected-route-fallback";
import { CustomerDashboardShell } from "@/components/customer/customer-dashboard-shell";
import type { CustomerSessionProfile } from "@/components/customer/customer-types";
import { requireRole } from "@/lib/session";

async function CustomerLayoutGuard({ children }: { children: ReactNode }) {
  const { user } = await requireRole(["customer"], "/dashboard/customer");

  const profile: CustomerSessionProfile = {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    role: "customer",
  };

  return (
    <CustomerDashboardShell user={profile}>{children}</CustomerDashboardShell>
  );
}

export default function CustomerDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<ProtectedRouteFallback />}>
      <CustomerLayoutGuard>{children}</CustomerLayoutGuard>
    </Suspense>
  );
}
