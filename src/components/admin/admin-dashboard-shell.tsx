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
import { useLanguage } from "@/components/providers/language-provider";
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

export function AdminDashboardShell({
  user,
  children,
}: {
  user: AdminSessionProfile;
  children: ReactNode;
}) {
  const { t } = useLanguage();
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

  const navItems = useMemo<readonly DashboardNavItem[]>(
    () => [
      {
        href: "/dashboard/admin",
        label: t.dashboard.overview,
        icon: LayoutDashboard,
        exact: true,
      },
      {
        href: "/dashboard/admin/menu",
        label: t.dashboard.menuModeration,
        icon: ClipboardCheck,
        exact: false,
      },
      {
        href: "/dashboard/admin/users",
        label: t.dashboard.userManagement,
        icon: Users,
        exact: false,
      },
      {
        href: "/dashboard/admin/transactions",
        label: t.dashboard.transactions,
        icon: ReceiptText,
        exact: false,
      },
      {
        href: "/dashboard/admin/profile",
        label: t.dashboard.profile,
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
        href: "/menu",
        label: t.dashboard.storefrontSection,
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

  return (
    <AdminProfileContext.Provider value={syncedUser}>
      <DashboardShellFrame
        workspaceLabel="Admin navigation"
        drawerTitle="Admin Navigation"
        drawerDescription="Navigate PizzaHub admin moderation and user management views."
        openMenuAriaLabel="Open admin navigation menu"
        headerTitle={t.dashboard.adminPortal}
        navItems={navItems}
        storefrontLinks={storefrontLinks}
        displayName={syncedUser.name}
        email={syncedUser.email}
        image={syncedUser.image}
        roleBadge={
          <Badge className="gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
            <ShieldCheck className="size-3" aria-hidden="true" />
            {t.dashboard.administrator}
          </Badge>
        }
        headerActions={
          <Button
            render={<Link href="/dashboard/admin/menu" />}
            size="sm"
            className="hidden h-9 rounded-full px-3.5 font-medium sm:inline-flex"
          >
            <ClipboardCheck className="size-4" aria-hidden="true" />
            {t.dashboard.moderationShort}
          </Button>
        }
      >
        {children}
      </DashboardShellFrame>
    </AdminProfileContext.Provider>
  );
}
