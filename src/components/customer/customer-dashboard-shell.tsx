"use client";

import {
  ArrowLeft,
  Bell,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptText,
  Settings,
  ShoppingBag,
  Store,
  UserCircle,
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
import { useCart } from "@/components/providers/cart-provider";
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
import { cn } from "@/lib/utils";
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

const CUSTOMER_NAV_ITEMS = [
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
] as const;

const STOREFRONT_LINKS = [
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
] as const;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "CU";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function CustomerSidebarContent({
  user,
  pathname,
  cartCount,
  isSigningOut,
  onSignOut,
  onNavigate,
}: {
  user: CustomerSessionProfile;
  pathname: string;
  cartCount: number;
  isSigningOut: boolean;
  onSignOut: () => void;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col justify-between">
      <div className="space-y-6 p-4">
        <div className="flex items-center justify-between px-1">
          <Link
            href="/"
            onClick={onNavigate}
            aria-label="PizzaHub home"
            className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <PizzaHubBrandMark />
          </Link>
        </div>

        <nav aria-label="Customer workspace" className="space-y-1">
          {CUSTOMER_NAV_ITEMS.map((item) => {
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
                  "flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-2xs"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <span className="flex items-center gap-3">
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </span>
                {item.href === "/checkout" && cartCount > 0 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-full px-2 py-0 text-[11px] tabular-nums"
                  >
                    {cartCount}
                  </Badge>
                ) : null}
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

      <div className="space-y-3 border-t border-sidebar-border p-4">
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
            <Badge
              variant="secondary"
              className="rounded-full px-2.5 py-0.5 text-xs font-medium"
            >
              Customer Account
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

export function CustomerDashboardShell({
  user,
  children,
}: {
  user: CustomerSessionProfile;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { user: sessionUser, signOut } = useAuthSession();
  const { summary, isHydrated, openDrawer } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const syncedUser = useMemo<CustomerSessionProfile>(
    () =>
      sessionUser && sessionUser.id === user.id
        ? {
            id: user.id,
            name: sessionUser.name,
            email: sessionUser.email,
            image: sessionUser.image ?? null,
            role: "customer",
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
  const cartCount = isHydrated ? summary.itemCount : 0;

  return (
    <CustomerProfileContext.Provider value={contextValue}>
      <div className="flex min-h-dvh w-full bg-background text-foreground">
        <aside
          aria-label="Customer navigation"
          className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col"
        >
          <CustomerSidebarContent
            user={syncedUser}
            pathname={pathname}
            cartCount={cartCount}
            isSigningOut={isSigningOut}
            onSignOut={handleSignOut}
          />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur-sm lg:hidden">
            <div className="flex items-center gap-2.5">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Open customer navigation menu"
                      className="rounded-xl bg-card"
                    />
                  }
                >
                  <Menu className="size-5" aria-hidden="true" />
                </SheetTrigger>
                <SheetContent side="left" className="w-72 bg-sidebar p-0">
                  <SheetHeader className="sr-only">
                    <SheetTitle>Customer Navigation</SheetTitle>
                    <SheetDescription>
                      Navigate your customer overview, order history, and cart
                      checkout.
                    </SheetDescription>
                  </SheetHeader>
                  <CustomerSidebarContent
                    user={syncedUser}
                    pathname={pathname}
                    cartCount={cartCount}
                    isSigningOut={isSigningOut}
                    onSignOut={handleSignOut}
                    onNavigate={() => setMobileOpen(false)}
                  />
                </SheetContent>
              </Sheet>
              <span className="font-heading text-base font-semibold tracking-tight text-foreground">
                Customer Portal
              </span>
            </div>

            <div className="flex items-center gap-2">
              <NotificationBell />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openDrawer}
                className="h-9 gap-1.5 rounded-xl bg-card px-3 font-medium"
              >
                <ShoppingBag
                  className="size-4 text-primary"
                  aria-hidden="true"
                />
                <span>Cart</span>
                {cartCount > 0 ? (
                  <Badge className="h-5 min-w-5 rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground tabular-nums">
                    {cartCount}
                  </Badge>
                ) : null}
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
    </CustomerProfileContext.Provider>
  );
}
