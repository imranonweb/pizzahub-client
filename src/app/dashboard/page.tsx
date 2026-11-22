import { Suspense } from "react";
import { ProtectedRouteFallback } from "@/components/auth/protected-route-fallback";
import { resolveDashboardRedirect } from "@/lib/session";

async function DashboardRedirectGate() {
  await resolveDashboardRedirect();
  return null;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<ProtectedRouteFallback />}>
      <DashboardRedirectGate />
    </Suspense>
  );
}
