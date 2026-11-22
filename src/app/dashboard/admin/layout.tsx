import { type ReactNode, Suspense } from "react";
import { AdminDashboardShell } from "@/components/admin/admin-dashboard-shell";
import type { AdminSessionProfile } from "@/components/admin/admin-types";
import { ProtectedRouteFallback } from "@/components/auth/protected-route-fallback";
import { requireRole } from "@/lib/session";

async function AdminLayoutGuard({ children }: { children: ReactNode }) {
  const { user } = await requireRole(["admin"], "/dashboard/admin");

  const profile: AdminSessionProfile = {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    role: "admin",
  };

  return <AdminDashboardShell user={profile}>{children}</AdminDashboardShell>;
}

export default function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<ProtectedRouteFallback />}>
      <AdminLayoutGuard>{children}</AdminLayoutGuard>
    </Suspense>
  );
}
