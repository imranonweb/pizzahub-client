"use client";

import {
  ArrowLeft,
  Bell,
  Crown,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  ShoppingBag,
  Sparkles,
  Store,
  UserCircle,
  UtensilsCrossed,
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
import { cn } from "@/lib/utils";
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

const VENDOR_NAV_ITEMS = [
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
] as const;

const STOREFRONT_LINKS = [
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
] as const;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "VN";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function SidebarContent({
  user,
  pathname,
  isSigningOut,
  onSignOut,
  onNavigate,
}: {
  user: VendorSessionProfile;
  pathname: string;
  isSigningOut: boolean;
  onSignOut: () => void;
  onNavigate?: () => void;
}) {
  const displayName = user.businessName.trim() || user.name;
  const isPremium = user.subscriptionPlan === "premium";

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

        <nav aria-label="Vendor workspace" className="space-y-1">
          {VENDOR_NAV_ITEMS.map((item) => {
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
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {displayName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            {isPremium ? (
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
            )}
            <span className="text-xs font-medium text-muted-foreground">
              Vendor
            </span>
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

export function VendorDashboardShell({
  user,
  children,
}: {
  user: VendorSessionProfile;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { user: sessionUser, signOut } = useAuthSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

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

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await signOut("/");
    } finally {
      setIsSigningOut(false);
    }
  };

  const contextValue = syncedUser;
  const displayName = syncedUser.businessName.trim() || syncedUser.name;

  return (
    <VendorProfileContext.Provider value={contextValue}>
      <div className="flex min-h-dvh w-full bg-background text-foreground">
        <aside
          aria-label="Vendor navigation"
          className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col"
        >
          <SidebarContent
            user={syncedUser}
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
                        aria-label="Open vendor navigation menu"
                        className="rounded-xl bg-card"
                      />
                    }
                  >
                    <Menu className="size-5" aria-hidden="true" />
                  </SheetTrigger>
                  <SheetContent side="left" className="w-72 bg-sidebar p-0">
                    <SheetHeader className="sr-only">
                      <SheetTitle>Vendor Navigation</SheetTitle>
                      <SheetDescription>
                        Navigate vendor dashboard views and account actions.
                      </SheetDescription>
                    </SheetHeader>
                    <SidebarContent
                      user={syncedUser}
                      pathname={pathname}
                      isSigningOut={isSigningOut}
                      onSignOut={handleSignOut}
                      onNavigate={() => setMobileOpen(false)}
                    />
                  </SheetContent>
                </Sheet>
              </div>
              <span className="truncate font-heading text-base font-semibold tracking-tight text-foreground">
                {displayName}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <NotificationBell />
              <Button
                render={<Link href="/dashboard/vendor/add" />}
                size="sm"
                className="hidden h-9 rounded-xl px-3 font-medium sm:inline-flex"
              >
                <PlusCircle className="size-4" aria-hidden="true" />
                Add Pizza
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
    </VendorProfileContext.Provider>
  );
}
