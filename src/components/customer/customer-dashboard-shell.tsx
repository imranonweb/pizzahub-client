"use client";

import {
  ArrowLeft,
  Bell,
  CreditCard,
  LayoutDashboard,
  ReceiptText,
  Settings,
  ShoppingBag,
  Store,
  UserCircle,
} from "lucide-react";
import { createContext, type ReactNode, useContext, useMemo } from "react";
import {
  type DashboardNavItem,
  DashboardShellFrame,
  type DashboardStorefrontLink,
} from "@/components/dashboard/dashboard-shell-frame";
import { useCart } from "@/components/providers/cart-provider";
import { useAuthSession } from "@/components/providers/session-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CustomerSessionProfile } from "./customer-types";

const CustomerProfileContext = createContext<CustomerSessionProfile | null>(
  null,
);

export function useCustomerProfile(): CustomerSessionProfile {
  const ctx = useContext(CustomerProfileContext);
  if (!ctx) {
    throw new Error(
      "useCustomerProfile must be used inside CustomerDashboardShell.",
    );
  }
  return ctx;
}

const CUSTOMER_NAV_BASE: readonly DashboardNavItem[] = [
  {
    href: "/dashboard/customer",
    label: "Overview",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/dashboard/customer/orders",
    label: "My Orders",
    icon: ReceiptText,
    exact: false,
  },
  {
    href: "/checkout",
    label: "Checkout",
    icon: CreditCard,
    exact: false,
  },
  {
    href: "/notifications",
    label: "Notifications",
    icon: Bell,
    exact: false,
  },
  {
    href: "/dashboard/customer/settings",
    label: "Account Settings",
    icon: Settings,
    exact: false,
  },
  {
    href: "/profile",
    label: "Profile",
    icon: UserCircle,
    exact: true,
  },
];

const STOREFRONT_LINKS: readonly DashboardStorefrontLink[] = [
  {
    href: "/menu",
    label: "Browse Menu",
    icon: Store,
  },
  {
    href: "/",
    label: "Back to Home",
    icon: ArrowLeft,
  },
];

export function CustomerDashboardShell({
  user,
  children,
}: {
  user: CustomerSessionProfile;
  children: ReactNode;
}) {
  const { user: sessionUser } = useAuthSession();
  const { summary, isHydrated, openDrawer } = useCart();

  const syncedUser = useMemo<CustomerSessionProfile>(
    () =>
      sessionUser && sessionUser.id === user.id
        ? {
            id: user.id,
            name: sessionUser.name || user.name,
            email: sessionUser.email || user.email,
            image: sessionUser.image ?? user.image,
            role: "customer",
          }
        : user,
    [sessionUser, user],
  );

  const cartCount = isHydrated ? summary.itemCount : 0;
  const navItems = useMemo<readonly DashboardNavItem[]>(
    () =>
      CUSTOMER_NAV_BASE.map((item) =>
        item.href === "/checkout" ? { ...item, badgeCount: cartCount } : item,
      ),
    [cartCount],
  );

  return (
    <CustomerProfileContext.Provider value={syncedUser}>
      <DashboardShellFrame
        workspaceLabel="Customer navigation"
        drawerTitle="Customer Navigation"
        drawerDescription="Navigate your customer overview, order history, and cart checkout."
        openMenuAriaLabel="Open customer navigation menu"
        headerTitle="Customer Portal"
        navItems={navItems}
        storefrontLinks={STOREFRONT_LINKS}
        displayName={syncedUser.name}
        email={syncedUser.email}
        image={syncedUser.image}
        roleBadge={
          <Badge
            variant="secondary"
            className="rounded-full px-2.5 py-0.5 text-xs font-medium"
          >
            Customer Account
          </Badge>
        }
        headerActions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openDrawer}
            className="h-9 gap-1.5 rounded-xl bg-card px-3 font-medium"
          >
            <ShoppingBag className="size-4 text-primary" aria-hidden="true" />
            <span>Cart</span>
            {cartCount > 0 ? (
              <Badge className="h-5 min-w-5 rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground tabular-nums">
                {cartCount}
              </Badge>
            ) : null}
          </Button>
        }
      >
        {children}
      </DashboardShellFrame>
    </CustomerProfileContext.Provider>
  );
}
