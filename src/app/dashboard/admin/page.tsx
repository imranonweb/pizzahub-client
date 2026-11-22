import Link from "next/link";
import { Suspense } from "react";
import { ProtectedRouteFallback } from "@/components/auth/protected-route-fallback";
import { requireRole } from "@/lib/session";

async function AdminDashboardGuard() {
  const { user } = await requireRole(["admin"], "/dashboard/admin");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center gap-4 px-6 py-12">
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
        Admin Dashboard
      </h1>
      <p className="text-sm text-muted-foreground">
        Signed in as{" "}
        <span className="font-medium text-foreground">{user.email}</span> (role:{" "}
        {user.role}).
      </p>
      <Link
        href="/"
        className="w-fit text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        Back to home
      </Link>
    </main>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<ProtectedRouteFallback />}>
      <AdminDashboardGuard />
    </Suspense>
  );
}
