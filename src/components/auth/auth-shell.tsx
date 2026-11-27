"use client";

import { ArrowLeft, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { PizzaHubBrandMark } from "@/components/brand/pizzahub-logo";
import { useLanguage } from "@/components/providers/language-provider";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export { PizzaHubBrandMark };

interface AuthShellProps {
  mode?: "sign-in" | "sign-up";
  title?: string;
  description?: string;
  heroHeadline?: string;
  heroSubheadline?: string;
  switchPrompt?: string;
  switchLabel?: string;
  switchHref: "/sign-in" | "/sign-up";
  children: ReactNode;
}

export function AuthShell({
  mode,
  title,
  description,
  heroHeadline,
  heroSubheadline,
  switchPrompt,
  switchLabel,
  switchHref,
  children,
}: AuthShellProps) {
  const { t } = useLanguage();

  const resolvedTitle =
    mode === "sign-in"
      ? t.auth.signInTitle
      : mode === "sign-up"
        ? t.auth.signUpTitle
        : (title ?? "");
  const resolvedDescription =
    mode === "sign-in"
      ? t.auth.signInDesc
      : mode === "sign-up"
        ? t.auth.signUpDesc
        : (description ?? "");
  const resolvedHeroHeadline =
    mode === "sign-in"
      ? t.auth.signInHeroHeadline
      : mode === "sign-up"
        ? t.auth.signUpHeroHeadline
        : (heroHeadline ?? "");
  const resolvedHeroSub =
    mode === "sign-in"
      ? t.auth.signInHeroSub
      : mode === "sign-up"
        ? t.auth.signUpHeroSub
        : (heroSubheadline ?? "");
  const resolvedSwitchPrompt =
    mode === "sign-in"
      ? t.auth.needAccount
      : mode === "sign-up"
        ? t.auth.alreadyRegistered
        : (switchPrompt ?? "");
  const resolvedSwitchLabel =
    mode === "sign-in"
      ? t.auth.signUpLink
      : mode === "sign-up"
        ? t.auth.signInLink
        : (switchLabel ?? "");

  return (
    <div className="grid min-h-dvh bg-background text-foreground lg:grid-cols-[minmax(0,1.02fr)_minmax(0,1fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#150e0b] p-10 lg:flex xl:p-12">
        <Image
          src="/images/auth-pizza-hero.jpg"
          alt="Wood-fired Neapolitan Margherita pizza fresh from a brick oven"
          fill
          priority
          sizes="50vw"
          className="object-cover object-center"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,13,10,0.76)_0%,rgba(20,13,10,0.22)_42%,rgba(20,13,10,0.90)_100%)]"
        />

        <div className="relative z-10 flex items-center justify-between">
          <Link
            href="/"
            className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f26d4f]"
          >
            <PizzaHubBrandMark tone="light" />
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#faf6f0]/20 bg-[#150e0b]/75 px-3 py-1 text-xs font-medium text-[#f5dec3] backdrop-blur-md">
            <MapPin className="size-3.5 text-[#f26d4f]" aria-hidden="true" />
            <span>{t.brand.cities}</span>
          </span>
        </div>

        <div className="relative z-10 max-w-md space-y-4">
          <h2 className="font-heading text-3xl font-extrabold leading-[1.12] tracking-[-0.03em] text-[#faf6f0] text-balance xl:text-4xl">
            {resolvedHeroHeadline}
          </h2>
          <p className="text-base leading-relaxed text-[#e4dbd1]">
            {resolvedHeroSub}
          </p>
          <div className="h-px w-full bg-[#faf6f0]/18" />
          <p className="text-xs tracking-wide text-[#cfc4b8]">
            {t.auth.footerTagline}
          </p>
        </div>
      </aside>

      <main className="flex min-h-dvh flex-col justify-between px-5 py-6 sm:px-8 sm:py-8 lg:px-12 xl:px-16">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
            >
              <PizzaHubBrandMark tone="dark" />
            </Link>
            <Link
              href="/"
              className="hidden items-center gap-1.5 rounded-full border border-border/80 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:inline-flex"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              <span>{t.auth.backToHome}</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <ThemeToggle />
            <p className="hidden text-sm text-muted-foreground sm:block">
              <span className="hidden xl:inline">{resolvedSwitchPrompt} </span>
              <Link
                href={switchHref}
                className="rounded-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {resolvedSwitchLabel}
              </Link>
            </p>
          </div>
        </header>

        <section
          aria-labelledby="auth-page-heading"
          className="mx-auto flex w-full max-w-[430px] flex-1 flex-col justify-center py-8 sm:py-10"
        >
          <div className="mb-7 space-y-2">
            <h1
              id="auth-page-heading"
              className="font-heading text-2xl font-bold leading-tight tracking-[-0.025em] text-foreground text-balance sm:text-[1.8rem]"
            >
              {resolvedTitle}
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {resolvedDescription}
            </p>
          </div>

          {children}
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4 text-xs text-muted-foreground">
          <span>© 2026 PizzaHub Bangladesh</span>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t.nav.home}
            </Link>
            <Link
              href={switchHref}
              className="rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {resolvedSwitchLabel}
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
