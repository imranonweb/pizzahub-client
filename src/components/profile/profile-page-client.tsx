"use client";

import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Crown,
  LayoutDashboard,
  Lock,
  Mail,
  Pencil,
  ReceiptText,
  Settings,
  ShieldCheck,
  Store,
} from "lucide-react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { useAuthSession } from "@/components/providers/session-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { getDashboardPathForRole } from "@/lib/auth-routes";
import { cn } from "@/lib/utils";
import { ContactAddressCard } from "./contact-address-card";
import { ProfileEditForm } from "./profile-edit-form";
import type { AuthenticatedProfileData } from "./profile-types";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "PH";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatMemberSince(iso: string | null): string {
  if (!iso) return "Unavailable";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime()) || parsed.getTime() === 0) {
    return "Unavailable";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

export function ProfilePageClient({
  initialProfile,
}: {
  initialProfile: AuthenticatedProfileData;
}) {
  const { user: sessionUser } = useAuthSession();
  const [isEditing, setIsEditing] = useState(false);

  const activeName =
    sessionUser && sessionUser.id === initialProfile.id
      ? sessionUser.name
      : initialProfile.name;
  const activeImage =
    sessionUser && sessionUser.id === initialProfile.id
      ? (sessionUser.image ?? null)
      : initialProfile.image;
  const activeEmailVerified =
    sessionUser && sessionUser.id === initialProfile.id
      ? sessionUser.emailVerified
      : initialProfile.emailVerified;

  const dashboardHref = getDashboardPathForRole(initialProfile.role);
  const isCustomer = initialProfile.role === "customer";
  const isVendor = initialProfile.role === "vendor";

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-3xl border border-border bg-card p-6 shadow-xs sm:p-8"
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4 sm:gap-5">
              <Avatar size="lg" className="size-16 sm:size-20">
                {activeImage ? (
                  <AvatarImage src={activeImage} alt={activeName} />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-xl font-bold text-primary">
                  {getInitials(activeName)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 space-y-1.5">
                <h1 className="truncate font-heading text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-3xl">
                  {activeName}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge className="rounded-full bg-primary px-2.5 py-0.5 font-medium text-primary-foreground capitalize">
                    {initialProfile.role}
                  </Badge>
                  {activeEmailVerified ? (
                    <Badge
                      variant="outline"
                      className="gap-1 rounded-full border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-medium text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-200"
                    >
                      <CheckCircle2 className="size-3" aria-hidden="true" />
                      Verified Email
                    </Badge>
                  ) : null}
                  {isVendor ? (
                    <Badge
                      variant="secondary"
                      className="gap-1 rounded-full px-2.5 py-0.5 font-medium capitalize"
                    >
                      <Crown
                        className="size-3 text-primary"
                        aria-hidden="true"
                      />
                      {initialProfile.subscriptionPlan} plan
                    </Badge>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                type="button"
                variant={isEditing ? "secondary" : "default"}
                onClick={() => setIsEditing((prev) => !prev)}
                className="h-10 rounded-xl px-4 font-semibold"
              >
                <Pencil className="size-4" aria-hidden="true" />
                {isEditing ? "Close Editor" : "Edit Profile"}
              </Button>
              {isCustomer ? (
                <Link
                  href="/dashboard/customer/settings"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "h-10 rounded-xl bg-background px-4",
                  )}
                >
                  <Settings className="size-4" aria-hidden="true" />
                  Account Settings
                </Link>
              ) : null}
            </div>
          </div>

          <dl className="mt-6 grid gap-3 border-t border-border/70 pt-6 text-sm sm:grid-cols-3">
            <div className="rounded-2xl border border-border/80 bg-background p-4">
              <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Mail className="size-3.5 text-primary" aria-hidden="true" />
                Email Address
              </dt>
              <dd className="mt-1 truncate font-medium text-foreground">
                {initialProfile.email}
              </dd>
            </div>

            <div className="rounded-2xl border border-border/80 bg-background p-4">
              <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <CalendarDays
                  className="size-3.5 text-primary"
                  aria-hidden="true"
                />
                Member Since
              </dt>
              <dd className="mt-1 font-medium text-foreground">
                {formatMemberSince(initialProfile.createdAt)}
              </dd>
            </div>

            <div className="rounded-2xl border border-border/80 bg-background p-4">
              <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <ShieldCheck
                  className="size-3.5 text-primary"
                  aria-hidden="true"
                />
                {isVendor ? "Business Kitchen" : "Account Role"}
              </dt>
              <dd className="mt-1 truncate font-medium text-foreground capitalize">
                {isVendor
                  ? initialProfile.businessName || "Registered Kitchen"
                  : initialProfile.role}
              </dd>
            </div>
          </dl>

          <AnimatePresence initial={false}>
            {isEditing ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-6 border-t border-border/70 pt-6">
                  <h2 className="mb-4 font-heading text-lg font-semibold text-foreground">
                    Edit Personal Details
                  </h2>
                  <ProfileEditForm
                    initialName={activeName}
                    initialImage={activeImage}
                    onCancel={() => setIsEditing(false)}
                    onSaved={() => setIsEditing(false)}
                  />
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.section>

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            {isCustomer ? (
              <ContactAddressCard />
            ) : (
              <section
                aria-labelledby="role-workspace-heading"
                className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-2xs"
              >
                <h2
                  id="role-workspace-heading"
                  className="font-heading text-lg font-semibold text-foreground"
                >
                  Workspace Summary
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {isVendor
                    ? "Manage your kitchen's pizzas, image uploads, approval statuses, and subscription limits from your vendor dashboard."
                    : "Review submitted menu items, oversee vendor and customer accounts, and monitor platform moderation queues from your admin workspace."}
                </p>
                <Link
                  href={dashboardHref}
                  className={cn(
                    buttonVariants({ variant: "default" }),
                    "h-10 rounded-xl px-4 font-semibold",
                  )}
                >
                  <LayoutDashboard className="size-4" aria-hidden="true" />
                  <span>Open Dashboard</span>
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </section>
            )}
          </div>

          <aside className="space-y-6 lg:col-span-5">
            <section
              aria-labelledby="profile-shortcuts-heading"
              className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-2xs"
            >
              <h2
                id="profile-shortcuts-heading"
                className="font-heading text-lg font-semibold text-foreground"
              >
                Quick Navigation
              </h2>

              <div className="space-y-2">
                <Link
                  href={dashboardHref}
                  className="flex items-center justify-between rounded-xl border border-border/80 bg-background px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
                >
                  <span className="flex items-center gap-2.5">
                    <LayoutDashboard
                      className="size-4 text-primary"
                      aria-hidden="true"
                    />
                    Dashboard Overview
                  </span>
                  <ArrowRight
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                </Link>

                {isCustomer ? (
                  <>
                    <Link
                      href="/dashboard/customer/orders"
                      className="flex items-center justify-between rounded-xl border border-border/80 bg-background px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
                    >
                      <span className="flex items-center gap-2.5">
                        <ReceiptText
                          className="size-4 text-primary"
                          aria-hidden="true"
                        />
                        My Order History
                      </span>
                      <ArrowRight
                        className="size-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </Link>

                    <Link
                      href="/dashboard/customer/settings"
                      className="flex items-center justify-between rounded-xl border border-border/80 bg-background px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
                    >
                      <span className="flex items-center gap-2.5">
                        <Settings
                          className="size-4 text-primary"
                          aria-hidden="true"
                        />
                        Password & Account Settings
                      </span>
                      <ArrowRight
                        className="size-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </Link>
                  </>
                ) : null}

                <Link
                  href="/menu"
                  className="flex items-center justify-between rounded-xl border border-border/80 bg-background px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
                >
                  <span className="flex items-center gap-2.5">
                    <Store className="size-4 text-primary" aria-hidden="true" />
                    Browse Pizza Menu
                  </span>
                  <ArrowRight
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </section>

            <section
              aria-labelledby="profile-security-heading"
              className="space-y-3 rounded-2xl border border-border bg-card p-6 shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <Lock className="size-4 text-primary" aria-hidden="true" />
                <h2
                  id="profile-security-heading"
                  className="font-heading text-base font-semibold text-foreground"
                >
                  Account Protections
                </h2>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Your role, block status, and subscription plan are enforced on
                the server and cannot be modified through self-service profile
                updates.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </MotionConfig>
  );
}
