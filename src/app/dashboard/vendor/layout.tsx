import { type ReactNode, Suspense } from "react";
import { ProtectedRouteFallback } from "@/components/auth/protected-route-fallback";
import { VendorDashboardShell } from "@/components/vendor/vendor-dashboard-shell";
import type { VendorSessionProfile } from "@/components/vendor/vendor-types";
import { requireRole } from "@/lib/session";

async function VendorLayoutGuard({ children }: { children: ReactNode }) {
  const { user } = await requireRole(["vendor"], "/dashboard/vendor");

  const profile: VendorSessionProfile = {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    businessName: user.businessName,
    subscriptionPlan: user.subscriptionPlan,
    subscriptionExpiresAt: user.subscriptionExpiresAt
      ? user.subscriptionExpiresAt.toISOString()
      : null,
  };

  return <VendorDashboardShell user={profile}>{children}</VendorDashboardShell>;
}

export default function VendorDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<ProtectedRouteFallback />}>
      <VendorLayoutGuard>{children}</VendorLayoutGuard>
    </Suspense>
  );
}
