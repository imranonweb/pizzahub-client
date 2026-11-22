import type { Metadata } from "next";
import { Suspense } from "react";
import { ProtectedRouteFallback } from "@/components/auth/protected-route-fallback";
import { CustomerSettingsView } from "@/components/profile/customer-settings-view";
import type { AuthenticatedProfileData } from "@/components/profile/profile-types";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = {
  title: "Account Settings | PizzaHub",
  description:
    "Manage your customer profile, saved delivery details, password, and active session security.",
};

async function CustomerSettingsGuard() {
  const { user } = await requireRole(
    ["customer"],
    "/dashboard/customer/settings",
  );

  const profile: AuthenticatedProfileData = {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
    businessName: user.businessName,
    subscriptionPlan: user.subscriptionPlan,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt ? user.createdAt.toISOString() : null,
  };

  return <CustomerSettingsView initialProfile={profile} />;
}

export default function CustomerSettingsPage() {
  return (
    <Suspense fallback={<ProtectedRouteFallback />}>
      <CustomerSettingsGuard />
    </Suspense>
  );
}
