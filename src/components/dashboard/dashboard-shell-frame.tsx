"use client";

import { LogOut, type LucideIcon, Menu } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";
import { PizzaHubBrandMark } from "@/components/brand/pizzahub-logo";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { useLanguage } from "@/components/providers/language-provider";
import { useAuthSession } from "@/components/providers/session-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
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

export interface DashboardNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact: boolean;
  badgeCount?: number;
}

export interface DashboardStorefrontLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface SidebarContentProps {
  workspaceLabel: string;
  navItems: readonly DashboardNavItem[];
  storefrontLinks: readonly DashboardStorefrontLink[];
  displayName: string;
  email: string;
  image?: string | null;
  roleBadge: ReactNode;
  roleSecondaryLabel?: string;
  pathname: string;
  isSigningOut: boolean;
  onSignOut: () => void;
  onNavigate?: () => void;
}

function DashboardSidebarContent({
  workspaceLabel,
  navItems,
  storefrontLinks,
  displayName,
  email,
  image,
  roleBadge,
  roleSecondaryLabel,
  pathname,
  isSigningOut,
  onSignOut,
  onNavigate,
}: SidebarContentProps) {
  const { t } = useLanguage();

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

        <nav aria-label={workspaceLabel} className="space-y-1">
          {navItems.map((item) => {
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
                  "flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                  active
                    ? "bg-sidebar-primary font-semibold text-sidebar-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_1px_2px_rgba(22,15,12,0.12)]"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <span className="flex items-center gap-3">
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </span>
                {item.badgeCount && item.badgeCount > 0 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-full px-2 py-0 font-mono text-[11px] tabular-nums"
                  >
                    {item.badgeCount}
                  </Badge>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <Separator />

        <div className="space-y-1">
          <p className="px-3 pb-1 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
            {t.dashboard.storefrontSection}
          </p>
          {storefrontLinks.map((item) => {
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
        <div className="rounded-2xl border border-sidebar-border/80 bg-sidebar-accent/55 p-3">
          <div className="flex items-center gap-3">
            <Avatar size="default">
              {image ? <AvatarImage src={image} alt={displayName} /> : null}
              <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {displayName}
              </p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            {roleBadge}
            {roleSecondaryLabel ? (
              <span className="text-xs font-medium text-muted-foreground">
                {roleSecondaryLabel}
              </span>
            ) : null}
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
          <span>{isSigningOut ? t.nav.signingOut : t.nav.signOut}</span>
        </Button>
      </div>
    </div>
  );
}

export interface DashboardShellFrameProps {
  workspaceLabel: string;
  drawerTitle: string;
  drawerDescription: string;
  openMenuAriaLabel: string;
  headerTitle: string;
  navItems: readonly DashboardNavItem[];
  storefrontLinks: readonly DashboardStorefrontLink[];
  displayName: string;
  email: string;
  image?: string | null;
  roleBadge: ReactNode;
  roleSecondaryLabel?: string;
  headerActions?: ReactNode;
  children: ReactNode;
}

export function DashboardShellFrame({
  workspaceLabel,
  drawerTitle,
  drawerDescription,
  openMenuAriaLabel,
  headerTitle,
  navItems,
  storefrontLinks,
  displayName,
  email,
  image,
  roleBadge,
  roleSecondaryLabel,
  headerActions,
  children,
}: DashboardShellFrameProps) {
  const pathname = usePathname();
  const { t } = useLanguage();
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

  return (
    <div className="flex min-h-dvh w-full bg-background text-foreground">
      <aside
        aria-label={workspaceLabel}
        className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col"
      >
        <DashboardSidebarContent
          workspaceLabel={workspaceLabel}
          navItems={navItems}
          storefrontLinks={storefrontLinks}
          displayName={displayName}
          email={email}
          image={image}
          roleBadge={roleBadge}
          roleSecondaryLabel={roleSecondaryLabel}
          pathname={pathname}
          isSigningOut={isSigningOut}
          onSignOut={handleSignOut}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border/80 bg-background/92 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="lg:hidden">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label={openMenuAriaLabel}
                      className="rounded-xl bg-card"
                    />
                  }
                >
                  <Menu className="size-5" aria-hidden="true" />
                </SheetTrigger>
                <SheetContent side="left" className="w-72 bg-sidebar p-0">
                  <SheetHeader className="sr-only">
                    <SheetTitle>{drawerTitle}</SheetTitle>
                    <SheetDescription>{drawerDescription}</SheetDescription>
                  </SheetHeader>
                  <DashboardSidebarContent
                    workspaceLabel={workspaceLabel}
                    navItems={navItems}
                    storefrontLinks={storefrontLinks}
                    displayName={displayName}
                    email={email}
                    image={image}
                    roleBadge={roleBadge}
                    roleSecondaryLabel={roleSecondaryLabel}
                    pathname={pathname}
                    isSigningOut={isSigningOut}
                    onSignOut={handleSignOut}
                    onNavigate={() => setMobileOpen(false)}
                  />
                </SheetContent>
              </Sheet>
            </div>
            <span className="truncate font-heading text-base font-bold tracking-tight text-foreground">
              {headerTitle}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <LanguageSwitcher compact />
            <ThemeToggle />
            <NotificationBell />
            {headerActions}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSigningOut}
              aria-label={isSigningOut ? t.nav.signingOut : t.nav.signOut}
              onClick={handleSignOut}
              className="h-9 gap-1.5 rounded-full bg-card px-2.5 font-medium text-muted-foreground hover:text-foreground sm:px-3.5"
            >
              <LogOut className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">
                {isSigningOut ? t.nav.signingOut : t.nav.signOut}
              </span>
            </Button>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto w-full max-w-6xl"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
