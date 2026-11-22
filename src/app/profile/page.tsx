import type { Metadata } from "next";
import { Suspense } from "react";
import { ProtectedRouteFallback } from "@/components/auth/protected-route-fallback";
import { PublicShell } from "@/components/layout/public-shell";
import { ProfilePageClient } from "@/components/profile/profile-page-client";
import type { AuthenticatedProfileData } from "@/components/profile/profile-types";
import { requireAuth } from "@/lib/session";

export const metadata: Metadata = {
  title: "Profile | PizzaHub",
  description:
    "View and update your PizzaHub profile, contact details, and saved delivery address.",
};

async function ProfileGuard() {
  const { user } = await requireAuth("/profile");

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

  return <ProfilePageClient initialProfile={profile} />;
}

export default function ProfilePage() {
  return (
    <PublicShell>
      <Suspense fallback={<ProtectedRouteFallback />}>
        <ProfileGuard />
      </Suspense>
    </PublicShell>
  );
}
