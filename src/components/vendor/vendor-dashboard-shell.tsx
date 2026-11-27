"use client";

import {
  ArrowLeft,
  Bell,
  Crown,
  LayoutDashboard,
  PlusCircle,
  ShoppingBag,
  Sparkles,
  Store,
  UserCircle,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { createContext, type ReactNode, useContext, useMemo } from "react";
import {
  type DashboardNavItem,
  DashboardShellFrame,
  type DashboardStorefrontLink,
} from "@/components/dashboard/dashboard-shell-frame";
import { useLanguage } from "@/components/providers/language-provider";
import { useAuthSession } from "@/components/providers/session-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { translateRole } from "@/lib/i18n/translations";
import type { VendorSessionProfile } from "./vendor-types";

const VendorProfileContext = createContext<VendorSessionProfile | null>(null);

export function useVendorProfile(): VendorSessionProfile {
  const ctx = useContext(VendorProfileContext);
  if (!ctx) {
    throw new Error(
      "useVendorProfile must be used inside VendorDashboardShell.",
    );
  }
  return ctx;
}

export function VendorDashboardShell({
  user,
  children,
}: {
  user: VendorSessionProfile;
  children: ReactNode;
}) {
  const { locale, t } = useLanguage();
  const { user: sessionUser } = useAuthSession();

  const syncedUser = useMemo<VendorSessionProfile>(
    () =>
      sessionUser && sessionUser.id === user.id
        ? {
            ...user,
            name: sessionUser.name || user.name,
            email: sessionUser.email || user.email,
            image: sessionUser.image ?? user.image,
            businessName: sessionUser.businessName || user.businessName,
            subscriptionPlan:
              sessionUser.subscriptionPlan === "premium"
                ? "premium"
                : user.subscriptionPlan,
          }
        : user,
    [sessionUser, user],
  );

  const navItems = useMemo<readonly DashboardNavItem[]>(
    () => [
      {
        href: "/dashboard/vendor",
        label: t.dashboard.overview,
        icon: LayoutDashboard,
        exact: true,
      },
      {
        href: "/dashboard/vendor/menu",
        label: t.dashboard.myMenuItems,
        icon: UtensilsCrossed,
        exact: false,
      },
      {
        href: "/dashboard/vendor/add",
        label: t.dashboard.addPizza,
        icon: PlusCircle,
        exact: false,
      },
      {
        href: "/dashboard/vendor/orders",
        label: t.dashboard.incomingOrders,
        icon: ShoppingBag,
        exact: false,
      },
      {
        href: "/dashboard/vendor/subscription",
        label: t.dashboard.subscription,
        icon: Crown,
        exact: false,
      },
      {
        href: "/dashboard/vendor/profile",
        label: t.nav.profileSettings,
        icon: UserCircle,
        exact: false,
      },
      {
        href: "/notifications",
        label: t.nav.notifications,
        icon: Bell,
        exact: false,
      },
    ],
    [t],
  );

  const storefrontLinks = useMemo<readonly DashboardStorefrontLink[]>(
    () => [
      {
        href: "/pricing",
        label: t.dashboard.vendorPricing,
        icon: Sparkles,
      },
      {
        href: "/menu",
        label: t.dashboard.publicMenu,
        icon: Store,
      },
      {
        href: "/",
        label: t.dashboard.backToHome,
        icon: ArrowLeft,
      },
    ],
    [t],
  );

  const displayName = syncedUser.businessName.trim() || syncedUser.name;
  const isPremium = syncedUser.subscriptionPlan === "premium";

  return (
    <VendorProfileContext.Provider value={syncedUser}>
      <DashboardShellFrame
        workspaceLabel="Vendor navigation"
        drawerTitle="Vendor Navigation"
        drawerDescription="Navigate vendor dashboard views and account actions."
        openMenuAriaLabel="Open vendor navigation menu"
        headerTitle={displayName}
        navItems={navItems}
        storefrontLinks={storefrontLinks}
        displayName={displayName}
        email={syncedUser.email}
        image={syncedUser.image}
        roleSecondaryLabel={translateRole("vendor", locale)}
        roleBadge={
          isPremium ? (
            <Badge className="gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
              <Crown className="size-3" aria-hidden="true" />
              {t.dashboard.premiumPlan}
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
            >
              <Sparkles className="size-3 text-primary" aria-hidden="true" />
              {t.dashboard.freePlan}
            </Badge>
          )
        }
        headerActions={
          <Button
            render={<Link href="/dashboard/vendor/add" />}
            size="sm"
            className="hidden h-9 rounded-full px-3.5 font-medium sm:inline-flex"
          >
            <PlusCircle className="size-4" aria-hidden="true" />
            {t.dashboard.addPizza}
          </Button>
        }
      >
        {children}
      </DashboardShellFrame>
    </VendorProfileContext.Provider>
  );
}
