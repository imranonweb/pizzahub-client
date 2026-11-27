"use client";

import {
  Bell,
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
import { NotificationBell } from "@/components/notifications/notification-bell";
import { useCart } from "@/components/providers/cart-provider";
import { useLanguage } from "@/components/providers/language-provider";
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
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { toast } from "@/components/ui/toast";
import { getDashboardPathForRole } from "@/lib/auth-routes";
import { translateRole } from "@/lib/i18n/translations";
import { cn, getInitials } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const { locale, t } = useLanguage();
  const { user, role, isLoading, isAuthenticated, signOut } = useAuthSession();
  const { summary, isHydrated, openDrawer } = useCart();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const showCartButton = !isAuthenticated || role === "customer";

  const dashboardHref = getDashboardPathForRole(role);
  const profileHref =
    role === "vendor"
      ? "/dashboard/vendor/profile"
      : role === "admin"
        ? "/dashboard/admin/profile"
        : "/profile";

  const navItems = [
    { label: t.nav.home, href: "/", matchExact: true },
    { label: t.nav.browseMenu, href: "/menu", matchExact: false },
    { label: t.nav.pricing, href: "/pricing", matchExact: false },
    ...(isAuthenticated
      ? [{ label: t.nav.dashboard, href: dashboardHref, matchExact: false }]
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
        title: t.nav.signedOutTitle,
        description: t.nav.signedOutDesc,
        type: "success",
      });
    } catch {
      toast.add({
        title: t.nav.signOutFailedTitle,
        description: t.nav.signOutFailedDesc,
        type: "error",
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/75 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-17 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 md:grid md:grid-cols-[auto_1fr_auto] lg:px-8">
        <div className="flex min-w-0 items-center justify-self-start">
          <Link
            href="/"
            className="shrink-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <PizzaHubBrandMark tone="dark" />
          </Link>
        </div>

        <nav
          aria-label="Primary navigation"
          className="hidden items-center justify-center justify-self-center md:flex"
        >
          <div className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-card/85 p-1 shadow-2xs">
            {navItems.map((item) => {
              const active = isActiveLink(item.href, item.matchExact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-sm whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "bg-primary font-semibold text-primary-foreground shadow-2xs"
                      : "font-medium text-muted-foreground hover:bg-secondary/75 hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="hidden items-center justify-end gap-2 justify-self-end md:flex">
          <LanguageSwitcher />
          <ThemeToggle />
          {showCartButton ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label={`${t.nav.openCartAria}${isHydrated && summary.itemCount > 0 ? ` (${summary.itemCount})` : ""}`}
              onClick={openDrawer}
              className="h-9 gap-2 rounded-full border-border/85 bg-card px-3.5 font-medium shadow-2xs"
            >
              <ShoppingBag className="size-4 text-primary" aria-hidden="true" />
              <span className="hidden xl:inline">{t.nav.cart}</span>
              {isHydrated && summary.itemCount > 0 ? (
                <Badge className="h-5 min-w-5 rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground tabular-nums">
                  {summary.itemCount}
                </Badge>
              ) : null}
            </Button>
          ) : null}
          <span
            aria-hidden="true"
            className="mx-0.5 hidden h-5 w-px bg-border/80 lg:block"
          />
          {isLoading ? (
            <div className="flex items-center gap-2" aria-hidden="true">
              <Skeleton className="h-9 w-20 rounded-full" />
              <Skeleton className="h-9 w-24 rounded-full" />
            </div>
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="inline-flex h-9.5 items-center gap-2 rounded-full border border-border/85 bg-card py-1 pr-3 pl-1.5 text-sm font-medium text-foreground shadow-2xs transition-colors hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={t.nav.accountMenuAria}
                >
                  <Avatar size="sm" className="size-7">
                    {user.image ? (
                      <AvatarImage src={user.image} alt={user.name} />
                    ) : null}
                    <AvatarFallback className="bg-primary/12 text-xs font-semibold text-primary">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="max-w-28 truncate">{user.name}</span>
                  <ChevronDown
                    className="size-3.5 text-muted-foreground"
                    aria-hidden="true"
                  />
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  className="w-62 rounded-2xl p-1.5"
                >
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="px-2.5 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-foreground">
                          {user.name}
                        </span>
                        {role ? (
                          <Badge variant="secondary" className="text-[11px]">
                            {translateRole(role, locale)}
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
                    className="cursor-pointer rounded-xl px-2.5 py-2"
                  >
                    <LayoutDashboard className="size-4" aria-hidden="true" />
                    <span>{t.nav.dashboard}</span>
                  </DropdownMenuItem>

                  {role === "vendor" ? (
                    <DropdownMenuItem
                      render={<Link href="/dashboard/vendor/subscription" />}
                      className="cursor-pointer rounded-xl px-2.5 py-2"
                    >
                      <Crown
                        className="size-4 text-primary"
                        aria-hidden="true"
                      />
                      <span>{t.nav.subscriptionPlan}</span>
                    </DropdownMenuItem>
                  ) : null}

                  <DropdownMenuItem
                    render={<Link href={profileHref} />}
                    className="cursor-pointer rounded-xl px-2.5 py-2"
                  >
                    <UserCog className="size-4" aria-hidden="true" />
                    <span>{t.nav.profileSettings}</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    render={<Link href="/notifications" />}
                    className="cursor-pointer rounded-xl px-2.5 py-2"
                  >
                    <Bell className="size-4" aria-hidden="true" />
                    <span>{t.nav.notifications}</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    variant="destructive"
                    disabled={isSigningOut}
                    onClick={handleSignOut}
                    className="cursor-pointer rounded-xl px-2.5 py-2"
                  >
                    <LogOut className="size-4" aria-hidden="true" />
                    <span>
                      {isSigningOut ? t.nav.signingOut : t.nav.signOut}
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <>
              <Link
                href="/sign-in"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "default" }),
                  "h-9 rounded-full px-3.5 font-medium",
                )}
              >
                {t.nav.signIn}
              </Link>
              <Link
                href="/sign-up"
                className={cn(
                  buttonVariants({ variant: "default", size: "default" }),
                  "h-9 rounded-full px-4 font-semibold shadow-2xs",
                )}
              >
                {t.nav.signUp}
              </Link>
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 md:hidden sm:gap-2">
          <LanguageSwitcher compact />
          <ThemeToggle />
          {showCartButton ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label={`${t.nav.openCartAria}${isHydrated && summary.itemCount > 0 ? ` (${summary.itemCount})` : ""}`}
              onClick={openDrawer}
              className="h-9 gap-1.5 rounded-full bg-card px-2.5 font-medium"
            >
              <ShoppingBag className="size-4 text-primary" aria-hidden="true" />
              {isHydrated && summary.itemCount > 0 ? (
                <Badge className="h-5 min-w-5 rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground tabular-nums">
                  {summary.itemCount}
                </Badge>
              ) : null}
            </Button>
          ) : null}
          {isAuthenticated ? <NotificationBell /> : null}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={t.nav.openMenuAria}
                  className="size-9 rounded-full bg-card"
                />
              }
            >
              <Menu className="size-4.5" aria-hidden="true" />
            </SheetTrigger>

            <SheetContent side="right" className="w-80 max-w-[88vw] p-0">
              <SheetHeader className="border-b border-border px-5 py-4">
                <div className="flex items-center justify-between gap-2 pr-6">
                  <SheetTitle>
                    <PizzaHubBrandMark tone="dark" />
                  </SheetTitle>
                </div>
              </SheetHeader>

              <div className="flex flex-1 flex-col justify-between p-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-muted/40 px-3.5 py-2.5">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {t.nav.languageLabel}
                    </span>
                    <LanguageSwitcher compact />
                  </div>

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
                              ? "bg-primary font-semibold text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          )}
                        >
                          {item.label}
                        </SheetClose>
                      );
                    })}

                    {isAuthenticated ? (
                      <>
                        <SheetClose
                          render={
                            <Link
                              href={profileHref}
                              aria-current={
                                isActiveLink(profileHref, false)
                                  ? "page"
                                  : undefined
                              }
                            />
                          }
                          className={cn(
                            "flex items-center rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                            isActiveLink(profileHref, false)
                              ? "bg-primary font-semibold text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          )}
                        >
                          {t.nav.profileSettings}
                        </SheetClose>
                        <SheetClose
                          render={
                            <Link
                              href="/notifications"
                              aria-current={
                                isActiveLink("/notifications", false)
                                  ? "page"
                                  : undefined
                              }
                            />
                          }
                          className={cn(
                            "flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                            isActiveLink("/notifications", false)
                              ? "bg-primary font-semibold text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          )}
                        >
                          <Bell
                            className="size-4 shrink-0"
                            aria-hidden="true"
                          />
                          <span>{t.nav.notifications}</span>
                        </SheetClose>
                      </>
                    ) : null}
                  </nav>
                </div>

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
                          {isSigningOut ? t.nav.signingOut : t.nav.signOut}
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
                        {t.nav.signIn}
                      </SheetClose>
                      <SheetClose
                        render={<Link href="/sign-up" />}
                        className={cn(
                          buttonVariants({ variant: "default" }),
                          "h-10 w-full rounded-xl font-semibold",
                        )}
                      >
                        {t.nav.signUp}
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
