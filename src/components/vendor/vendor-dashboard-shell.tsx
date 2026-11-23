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
import { useAuthSession } from "@/components/providers/session-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

const VENDOR_NAV_ITEMS: readonly DashboardNavItem[] = [
  {
    href: "/dashboard/vendor",
    label: "Overview",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/dashboard/vendor/menu",
    label: "My Menu Items",
    icon: UtensilsCrossed,
    exact: false,
  },
  {
    href: "/dashboard/vendor/add",
    label: "Add Pizza",
    icon: PlusCircle,
    exact: false,
  },
  {
    href: "/dashboard/vendor/orders",
    label: "Incoming Orders",
    icon: ShoppingBag,
    exact: false,
  },
  {
    href: "/dashboard/vendor/subscription",
    label: "Subscription",
    icon: Crown,
    exact: false,
  },
  {
    href: "/dashboard/vendor/profile",
    label: "Profile Settings",
    icon: UserCircle,
    exact: false,
  },
  {
    href: "/notifications",
    label: "Notifications",
    icon: Bell,
    exact: false,
  },
];

const STOREFRONT_LINKS: readonly DashboardStorefrontLink[] = [
  {
    href: "/pricing",
    label: "Vendor Pricing",
    icon: Sparkles,
  },
  {
    href: "/menu",
    label: "Public Menu",
    icon: Store,
  },
  {
    href: "/",
    label: "Back to Home",
    icon: ArrowLeft,
  },
];

export function VendorDashboardShell({
  user,
  children,
}: {
  user: VendorSessionProfile;
  children: ReactNode;
}) {
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
        navItems={VENDOR_NAV_ITEMS}
        storefrontLinks={STOREFRONT_LINKS}
        displayName={displayName}
        email={syncedUser.email}
        image={syncedUser.image}
        roleSecondaryLabel="Vendor"
        roleBadge={
          isPremium ? (
            <Badge className="gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
              <Crown className="size-3" aria-hidden="true" />
              Premium Plan
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
            >
              <Sparkles className="size-3 text-primary" aria-hidden="true" />
              Free Plan
            </Badge>
          )
        }
        headerActions={
          <Button
            render={<Link href="/dashboard/vendor/add" />}
            size="sm"
            className="hidden h-9 rounded-xl px-3 font-medium sm:inline-flex"
          >
            <PlusCircle className="size-4" aria-hidden="true" />
            Add Pizza
          </Button>
        }
      >
        {children}
      </DashboardShellFrame>
    </VendorProfileContext.Provider>
  );
}
