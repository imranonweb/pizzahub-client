"use client";

import {
  ChevronDown,
  Crown,
  LayoutDashboard,
  LogOut,
  Menu,
  ShoppingBag,
  UserCog,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { PizzaHubBrandMark } from "@/components/brand/pizzahub-logo";
import { useCart } from "@/components/providers/cart-provider";
import { useAuthSession } from "@/components/providers/session-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { getDashboardPathForRole } from "@/lib/auth-routes";
import { cn } from "@/lib/utils";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "PH";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatRoleLabel(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function Navbar() {
  const pathname = usePathname();
  const { user, role, isLoading, isAuthenticated, signOut } = useAuthSession();
  const { summary, isHydrated, openDrawer } = useCart();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const showCartButton = !isAuthenticated || role === "customer";

  const dashboardHref = getDashboardPathForRole(role);

  const navItems = [
    { label: "Home", href: "/", matchExact: true },
    { label: "Browse Menu", href: "/menu", matchExact: false },
    { label: "Pricing", href: "/pricing", matchExact: false },
    ...(isAuthenticated
      ? [{ label: "Dashboard", href: dashboardHref, matchExact: false }]
      : []),
  ];

  const isActiveLink = (href: string, matchExact: boolean) => {
    if (matchExact) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }
    setIsSigningOut(true);
    try {
      await signOut("/");
      setMobileOpen(false);
      toast.add({
        title: "Signed out",
        description: "You have been signed out of PizzaHub.",
        type: "success",
      });
    } catch {
      toast.add({
        title: "Sign out failed",
        description: "Unable to sign out right now. Please try again.",
        type: "error",
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/92 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <PizzaHubBrandMark tone="dark" />
          </Link>

          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-1"
          >
            {navItems.map((item) => {
              const active = isActiveLink(item.href, item.matchExact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "bg-accent text-foreground font-semibold"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-2.5">
          {showCartButton ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label={`Open shopping cart${isHydrated && summary.itemCount > 0 ? ` (${summary.itemCount} items)` : ""}`}
              onClick={openDrawer}
              className="h-9 gap-2 rounded-xl bg-card px-3 font-medium"
            >
              <ShoppingBag className="size-4 text-primary" aria-hidden="true" />
              <span>Cart</span>
              {isHydrated && summary.itemCount > 0 ? (
                <Badge className="h-5 min-w-5 rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground tabular-nums">
                  {summary.itemCount}
                </Badge>
              ) : null}
            </Button>
          ) : null}
          {isLoading ? (
            <div className="flex items-center gap-2" aria-hidden="true">
              <Skeleton className="h-9 w-20 rounded-xl" />
              <Skeleton className="h-9 w-24 rounded-xl" />
            </div>
          ) : isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex h-10 items-center gap-2.5 rounded-full border border-border bg-card py-1 pr-3 pl-1.5 text-sm font-medium text-foreground shadow-2xs transition-colors hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Account menu"
              >
                <Avatar size="sm" className="size-7">
                  {user.image ? (
                    <AvatarImage src={user.image} alt={user.name} />
                  ) : null}
                  <AvatarFallback className="bg-primary/12 text-xs font-semibold text-primary">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="max-w-32 truncate">{user.name}</span>
                <ChevronDown
                  className="size-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-60 rounded-xl p-1.5"
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="px-2.5 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-foreground">
                        {user.name}
                      </span>
                      {role ? (
                        <Badge variant="secondary" className="text-[11px]">
                          {formatRoleLabel(role)}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-0.5 truncate text-xs font-normal text-muted-foreground">
                      {user.email}
                    </p>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  render={<Link href={dashboardHref} />}
                  className="cursor-pointer rounded-lg px-2.5 py-2"
                >
                  <LayoutDashboard className="size-4" aria-hidden="true" />
                  <span>Dashboard</span>
                </DropdownMenuItem>

                {role === "vendor" ? (
                  <DropdownMenuItem
                    render={<Link href="/dashboard/vendor/subscription" />}
                    className="cursor-pointer rounded-lg px-2.5 py-2"
                  >
                    <Crown className="size-4 text-primary" aria-hidden="true" />
                    <span>Subscription Plan</span>
                  </DropdownMenuItem>
                ) : null}

                <DropdownMenuItem
                  render={<Link href="/profile" />}
                  className="cursor-pointer rounded-lg px-2.5 py-2"
                >
                  <UserCog className="size-4" aria-hidden="true" />
                  <span>Profile Settings</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  variant="destructive"
                  disabled={isSigningOut}
                  onClick={handleSignOut}
                  className="cursor-pointer rounded-lg px-2.5 py-2"
                >
                  <LogOut className="size-4" aria-hidden="true" />
                  <span>{isSigningOut ? "Signing out…" : "Sign Out"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link
                href="/sign-in"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "default" }),
                  "h-9 rounded-xl px-3.5 font-medium",
                )}
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className={cn(
                  buttonVariants({ variant: "default", size: "default" }),
                  "h-9 rounded-xl px-4 font-semibold shadow-2xs",
                )}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        <div className="flex md:hidden items-center gap-2">
          {showCartButton ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label={`Open shopping cart${isHydrated && summary.itemCount > 0 ? ` (${summary.itemCount} items)` : ""}`}
              onClick={openDrawer}
              className="h-9 gap-1.5 rounded-xl bg-card px-2.5 font-medium"
            >
              <ShoppingBag className="size-4 text-primary" aria-hidden="true" />
              {isHydrated && summary.itemCount > 0 ? (
                <Badge className="h-5 min-w-5 rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground tabular-nums">
                  {summary.itemCount}
                </Badge>
              ) : null}
            </Button>
          ) : null}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Open navigation menu"
                  className="size-9 rounded-xl bg-card"
                />
              }
            >
              <Menu className="size-4.5" aria-hidden="true" />
            </SheetTrigger>

            <SheetContent side="right" className="w-80 max-w-[88vw] p-0">
              <SheetHeader className="border-b border-border px-5 py-4">
                <SheetTitle>
                  <PizzaHubBrandMark tone="dark" />
                </SheetTitle>
              </SheetHeader>

              <div className="flex flex-1 flex-col justify-between p-5">
                <nav
                  aria-label="Mobile navigation"
                  className="flex flex-col gap-1.5"
                >
                  {navItems.map((item) => {
                    const active = isActiveLink(item.href, item.matchExact);
                    return (
                      <SheetClose
                        key={item.href}
                        render={
                          <Link
                            href={item.href}
                            aria-current={active ? "page" : undefined}
                          />
                        }
                        className={cn(
                          "flex items-center rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                          active
                            ? "bg-accent font-semibold text-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        {item.label}
                      </SheetClose>
                    );
                  })}

                  {isAuthenticated ? (
                    <SheetClose
                      render={
                        <Link
                          href="/profile"
                          aria-current={
                            isActiveLink("/profile", false) ? "page" : undefined
                          }
                        />
                      }
                      className={cn(
                        "flex items-center rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                        isActiveLink("/profile", false)
                          ? "bg-accent font-semibold text-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      Profile Settings
                    </SheetClose>
                  ) : null}
                </nav>

                <div className="border-t border-border pt-4">
                  {isLoading ? (
                    <div className="space-y-2.5" aria-hidden="true">
                      <Skeleton className="h-10 w-full rounded-xl" />
                      <Skeleton className="h-10 w-full rounded-xl" />
                    </div>
                  ) : isAuthenticated && user ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 rounded-xl bg-muted/60 px-3 py-2.5">
                        <Avatar size="default">
                          {user.image ? (
                            <AvatarImage src={user.image} alt={user.name} />
                          ) : null}
                          <AvatarFallback className="bg-primary/12 text-xs font-semibold text-primary">
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

                      <Button
                        type="button"
                        variant="destructive"
                        disabled={isSigningOut}
                        onClick={handleSignOut}
                        className="h-10 w-full rounded-xl font-medium"
                      >
                        <LogOut className="size-4" aria-hidden="true" />
                        <span>
                          {isSigningOut ? "Signing out…" : "Sign Out"}
                        </span>
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-2.5">
                      <SheetClose
                        render={<Link href="/sign-in" />}
                        className={cn(
                          buttonVariants({ variant: "outline" }),
                          "h-10 w-full rounded-xl font-medium",
                        )}
                      >
                        Sign In
                      </SheetClose>
                      <SheetClose
                        render={<Link href="/sign-up" />}
                        className={cn(
                          buttonVariants({ variant: "default" }),
                          "h-10 w-full rounded-xl font-semibold",
                        )}
                      >
                        Sign Up
                      </SheetClose>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
