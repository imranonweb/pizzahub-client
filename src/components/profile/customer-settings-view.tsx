"use client";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  KeyRound,
  LogOut,
  Mail,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { useAuthSession } from "@/components/providers/session-provider";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ContactAddressCard } from "./contact-address-card";
import { PasswordChangeForm } from "./password-change-form";
import { ProfileEditForm } from "./profile-edit-form";
import type { AuthenticatedProfileData } from "./profile-types";

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

export function CustomerSettingsView({
  initialProfile,
}: {
  initialProfile: AuthenticatedProfileData;
}) {
  const { user: sessionUser, signOut } = useAuthSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

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
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-border/70 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <Link
            href="/profile"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "-ml-2.5 w-fit rounded-xl px-2.5 text-muted-foreground hover:text-foreground",
            )}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            View Public Profile Card
          </Link>
          <h1 className="font-heading text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-3xl">
            Account Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Update your personal details, avatar, delivery address, and
            password.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={isSigningOut}
          onClick={handleSignOut}
          className="h-10 w-fit rounded-xl bg-card px-4 text-destructive hover:text-destructive"
        >
          <LogOut className="size-4" aria-hidden="true" />
          {isSigningOut ? "Signing out..." : "Sign Out"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        <div className="space-y-6 lg:col-span-7">
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            aria-labelledby="settings-personal-heading"
            className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-2xs"
          >
            <div className="flex items-center gap-2 border-b border-border/70 pb-4">
              <UserCog className="size-4.5 text-primary" aria-hidden="true" />
              <div>
                <h2
                  id="settings-personal-heading"
                  className="font-heading text-lg font-semibold text-foreground"
                >
                  Personal Information & Avatar
                </h2>
                <p className="text-xs text-muted-foreground">
                  Saved directly to your authenticated PizzaHub session.
                </p>
              </div>
            </div>

            <ProfileEditForm
              initialName={activeName}
              initialImage={activeImage}
            />
          </motion.section>

          <ContactAddressCard />
        </div>

        <div className="space-y-6 lg:col-span-5">
          <section
            aria-labelledby="settings-account-heading"
            className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-2xs"
          >
            <div className="flex items-center justify-between gap-2 border-b border-border/70 pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck
                  className="size-4.5 text-primary"
                  aria-hidden="true"
                />
                <h2
                  id="settings-account-heading"
                  className="font-heading text-lg font-semibold text-foreground"
                >
                  Account Summary
                </h2>
              </div>
              <Badge
                variant="secondary"
                className="rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
              >
                {initialProfile.role}
              </Badge>
            </div>

            <dl className="space-y-3 text-sm">
              <div className="rounded-xl border border-border/80 bg-background p-3.5">
                <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Mail className="size-3.5 text-primary" aria-hidden="true" />
                  Registered Email
                </dt>
                <dd className="mt-1 flex flex-wrap items-center justify-between gap-2 font-medium text-foreground">
                  <span className="truncate">{initialProfile.email}</span>
                  {activeEmailVerified ? (
                    <Badge
                      variant="outline"
                      className="gap-1 rounded-full border-emerald-200 bg-emerald-50 px-2 py-0 text-[11px] font-medium text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-200"
                    >
                      <CheckCircle2 className="size-3" aria-hidden="true" />
                      Verified
                    </Badge>
                  ) : null}
                </dd>
              </div>

              <div className="rounded-xl border border-border/80 bg-background p-3.5">
                <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <CalendarDays
                    className="size-3.5 text-primary"
                    aria-hidden="true"
                  />
                  Account Created
                </dt>
                <dd className="mt-1 font-medium text-foreground">
                  {formatMemberSince(initialProfile.createdAt)}
                </dd>
              </div>
            </dl>

            <p className="text-xs leading-relaxed text-muted-foreground">
              Email changes and account role/access attributes are restricted
              server-side to protect customer order history and authorization.
            </p>
          </section>

          <section
            aria-labelledby="settings-password-heading"
            className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-2xs"
          >
            <div className="flex items-center gap-2 border-b border-border/70 pb-4">
              <KeyRound className="size-4.5 text-primary" aria-hidden="true" />
              <div>
                <h2
                  id="settings-password-heading"
                  className="font-heading text-lg font-semibold text-foreground"
                >
                  Change Password
                </h2>
                <p className="text-xs text-muted-foreground">
                  Requires your current email/password credentials.
                </p>
              </div>
            </div>

            <PasswordChangeForm />
          </section>
        </div>
      </div>
    </div>
  );
}
