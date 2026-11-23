"use client";

import { Lock, LogOut, Mail, ShieldCheck, Store } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAuthSession } from "@/components/providers/session-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdminProfile } from "./admin-dashboard-shell";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "AD";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function AdminProfileView() {
  const user = useAdminProfile();
  const { signOut } = useAuthSession();
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
    <div className="space-y-6">
      <div className="border-b border-border/70 pb-6">
        <h1 className="font-heading text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-3xl">
          Administrator Profile
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Verified session details and administrative security controls for your
          account.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <section
          aria-labelledby="admin-identity-heading"
          className="rounded-2xl border border-border bg-card p-6 lg:col-span-7"
        >
          <div className="flex flex-wrap items-center gap-4 border-b border-border/70 pb-5">
            <Avatar size="lg" className="size-14">
              {user.image ? (
                <AvatarImage src={user.image} alt={user.name} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-base font-bold text-primary">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-1">
              <h2
                id="admin-identity-heading"
                className="font-heading text-xl font-semibold text-foreground"
              >
                {user.name}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
                  <ShieldCheck className="size-3" aria-hidden="true" />
                  Administrator
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-full border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-200"
                >
                  Active Session
                </Badge>
              </div>
            </div>
          </div>

          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <div className="rounded-xl border border-border/80 bg-background p-4">
              <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Mail className="size-3.5 text-primary" aria-hidden="true" />
                Email Address
              </dt>
              <dd className="mt-1 truncate font-medium text-foreground">
                {user.email}
              </dd>
            </div>

            <div className="rounded-xl border border-border/80 bg-background p-4">
              <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Lock className="size-3.5 text-primary" aria-hidden="true" />
                Role Assignment
              </dt>
              <dd className="mt-1 font-medium text-foreground capitalize">
                {user.role}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
            <Button
              render={<Link href="/menu" />}
              variant="outline"
              size="sm"
              className="h-9 rounded-xl bg-background px-4"
            >
              <Store className="size-4" aria-hidden="true" />
              Open Storefront
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSigningOut}
              onClick={handleSignOut}
              className="h-9 rounded-xl bg-background px-4 text-destructive hover:text-destructive"
            >
              <LogOut className="size-4" aria-hidden="true" />
              {isSigningOut ? "Signing out..." : "Sign Out"}
            </Button>
          </div>
        </section>

        <section
          aria-labelledby="admin-protection-heading"
          className="rounded-2xl border border-border bg-card p-6 lg:col-span-5"
        >
          <h2
            id="admin-protection-heading"
            className="font-heading text-lg font-semibold text-foreground"
          >
            Session Safeguards
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Protected boundaries applied automatically to your administrator
            account.
          </p>
          <ul className="mt-4 space-y-3 text-xs leading-relaxed text-muted-foreground">
            <li className="rounded-xl border border-border/80 bg-background p-3">
              Admin privileges cannot be self-assigned during sign-up or updated
              through client profile endpoints.
            </li>
            <li className="rounded-xl border border-border/80 bg-background p-3">
              User Management prevents blocking your own active admin account to
              avoid accidental platform lockout.
            </li>
            <li className="rounded-xl border border-border/80 bg-background p-3">
              All administrative moderation and user management actions require
              an active, verified administrator session.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
