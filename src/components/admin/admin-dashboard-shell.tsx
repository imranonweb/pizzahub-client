"use client";

import {
  ArrowLeft,
  Bell,
  ClipboardCheck,
  LayoutDashboard,
  ReceiptText,
  ShieldCheck,
  Store,
  UserCircle,
  Users,
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
import type { AdminSessionProfile } from "./admin-types";

const AdminProfileContext = createContext<AdminSessionProfile | null>(null);

export function useAdminProfile(): AdminSessionProfile {
  const ctx = useContext(AdminProfileContext);
  if (!ctx) {
    throw new Error("useAdminProfile must be used inside AdminDashboardShell.");
  }
  return ctx;
}

const ADMIN_NAV_ITEMS: readonly DashboardNavItem[] = [
  {
    href: "/dashboard/admin",
    label: "Overview",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/dashboard/admin/menu",
    label: "Menu Moderation",
    icon: ClipboardCheck,
    exact: false,
  },
  {
    href: "/dashboard/admin/users",
    label: "User Management",
    icon: Users,
    exact: false,
  },
  {
    href: "/dashboard/admin/transactions",
    label: "Transactions",
    icon: ReceiptText,
    exact: false,
  },
  {
    href: "/dashboard/admin/profile",
    label: "Profile",
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
    href: "/menu",
    label: "Storefront",
    icon: Store,
  },
  {
    href: "/",
    label: "Back to Home",
    icon: ArrowLeft,
  },
];

export function AdminDashboardShell({
  user,
  children,
}: {
  user: AdminSessionProfile;
  children: ReactNode;
}) {
  const { user: sessionUser } = useAuthSession();

  const syncedUser = useMemo<AdminSessionProfile>(
    () =>
      sessionUser && sessionUser.id === user.id
        ? {
            id: user.id,
            name: sessionUser.name || user.name,
            email: sessionUser.email || user.email,
            image: sessionUser.image ?? user.image,
            role: "admin",
          }
        : user,
    [sessionUser, user],
  );

  return (
    <AdminProfileContext.Provider value={syncedUser}>
      <DashboardShellFrame
        workspaceLabel="Admin navigation"
        drawerTitle="Admin Navigation"
        drawerDescription="Navigate PizzaHub admin moderation and user management views."
        openMenuAriaLabel="Open admin navigation menu"
        headerTitle="PizzaHub Admin"
        navItems={ADMIN_NAV_ITEMS}
        storefrontLinks={STOREFRONT_LINKS}
        displayName={syncedUser.name}
        email={syncedUser.email}
        image={syncedUser.image}
        roleBadge={
          <Badge className="gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
            <ShieldCheck className="size-3" aria-hidden="true" />
            Administrator
          </Badge>
        }
        headerActions={
          <Button
            render={<Link href="/dashboard/admin/menu" />}
            size="sm"
            className="hidden h-9 rounded-xl px-3 font-medium sm:inline-flex"
          >
            <ClipboardCheck className="size-4" aria-hidden="true" />
            Moderation
          </Button>
        }
      >
        {children}
      </DashboardShellFrame>
    </AdminProfileContext.Provider>
  );
}
