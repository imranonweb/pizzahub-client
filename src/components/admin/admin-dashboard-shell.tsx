"use client";

import {
  ArrowLeft,
  Bell,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptText,
  ShieldCheck,
  Store,
  UserCircle,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";
import { PizzaHubBrandMark } from "@/components/brand/pizzahub-logo";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { useAuthSession } from "@/components/providers/session-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn, getInitials } from "@/lib/utils";
import type { AdminSessionProfile } from "./admin-types";

const AdminProfileContext = createContext<AdminSessionProfile | null>(null);

export function useAdminProfile(): AdminSessionProfile {
  const ctx = useContext(AdminProfileContext);
  if (!ctx) {
    throw new Error("useAdminProfile must be used inside AdminDashboardShell.");
  }
  return ctx;
}

const ADMIN_NAV_ITEMS = [
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
] as const;

const STOREFRONT_LINKS = [
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
] as const;

function AdminSidebarContent({
  user,
  pathname,
  isSigningOut,
  onSignOut,
  onNavigate,
}: {
  user: AdminSessionProfile;
  pathname: string;
  isSigningOut: boolean;
  onSignOut: () => void;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col justify-between overflow-hidden">
      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        <div className="flex items-center justify-between px-1">
          <Link
            href="/"
            onClick={onNavigate}
            aria-label="PizzaHub home"
            className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <PizzaHubBrandMark />
          </Link>
          <ThemeToggle className="size-8" />
        </div>

        <nav aria-label="Admin workspace" className="space-y-1">
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-2xs"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <Separator />

        <div className="space-y-1">
          <p className="px-3 pb-1 text-xs font-medium text-muted-foreground">
            Storefront
          </p>
          {STOREFRONT_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="shrink-0 space-y-2.5 border-t border-sidebar-border p-3.5">
        <div className="rounded-2xl border border-sidebar-border bg-card p-3">
          <div className="flex items-center gap-3">
            <Avatar size="default">
              {user.image ? (
                <AvatarImage src={user.image} alt={user.name} />
              ) : null}
              <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {user.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <Badge className="gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
              <ShieldCheck className="size-3" aria-hidden="true" />
              Administrator
            </Badge>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={isSigningOut}
          onClick={onSignOut}
          className="h-9 w-full justify-start gap-2 rounded-xl bg-card text-muted-foreground hover:text-foreground"
        >
          <LogOut className="size-4" aria-hidden="true" />
          <span>{isSigningOut ? "Signing out..." : "Sign Out"}</span>
        </Button>
      </div>
    </div>
  );
}

export function AdminDashboardShell({
  user,
  children,
}: {
  user: AdminSessionProfile;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { signOut } = useAuthSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await signOut("/");
    } finally {
      setIsSigningOut(false);
    }
  };

  const contextValue = useMemo(() => user, [user]);

  return (
    <AdminProfileContext.Provider value={contextValue}>
      <div className="flex min-h-dvh w-full bg-background text-foreground">
        <aside
          aria-label="Admin navigation"
          className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col"
        >
          <AdminSidebarContent
            user={user}
            pathname={pathname}
            isSigningOut={isSigningOut}
            onSignOut={handleSignOut}
          />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
            <div className="flex items-center gap-2.5">
              <div className="lg:hidden">
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                  <SheetTrigger
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Open admin navigation menu"
                        className="rounded-xl bg-card"
                      />
                    }
                  >
                    <Menu className="size-5" aria-hidden="true" />
                  </SheetTrigger>
                  <SheetContent side="left" className="w-72 bg-sidebar p-0">
                    <SheetHeader className="sr-only">
                      <SheetTitle>Admin Navigation</SheetTitle>
                      <SheetDescription>
                        Navigate PizzaHub admin moderation and user management
                        views.
                      </SheetDescription>
                    </SheetHeader>
                    <AdminSidebarContent
                      user={user}
                      pathname={pathname}
                      isSigningOut={isSigningOut}
                      onSignOut={handleSignOut}
                      onNavigate={() => setMobileOpen(false)}
                    />
                  </SheetContent>
                </Sheet>
              </div>
              <span className="truncate font-heading text-base font-semibold tracking-tight text-foreground">
                PizzaHub Admin
              </span>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <NotificationBell />
              <Button
                render={<Link href="/dashboard/admin/menu" />}
                size="sm"
                className="hidden h-9 rounded-xl px-3 font-medium sm:inline-flex"
              >
                <ClipboardCheck className="size-4" aria-hidden="true" />
                Moderation
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSigningOut}
                onClick={handleSignOut}
                className="h-9 gap-1.5 rounded-xl bg-card px-3 font-medium text-muted-foreground hover:text-foreground"
              >
                <LogOut className="size-4" aria-hidden="true" />
                <span>{isSigningOut ? "Signing out..." : "Sign Out"}</span>
              </Button>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="mx-auto w-full max-w-6xl"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </AdminProfileContext.Provider>
  );
}
