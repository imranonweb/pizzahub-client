import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

interface AuthShellProps {
  title: string;
  description: string;
  heroHeadline: string;
  heroSubheadline: string;
  switchPrompt: string;
  switchLabel: string;
  switchHref: "/sign-in" | "/sign-up";
  children: ReactNode;
}

export function PizzaHubBrandMark({
  tone = "dark",
}: {
  tone?: "dark" | "light";
}) {
  const textColor = tone === "light" ? "text-white" : "text-foreground";

  return (
    <span className={`inline-flex items-center gap-2.5 ${textColor}`}>
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M12 3L20.5 19.2C20.8 19.78 20.38 20.48 19.72 20.48H4.28C3.62 20.48 3.2 19.78 3.5 19.2L12 3Z"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="1.4" fill="currentColor" />
          <circle cx="9.6" cy="16.2" r="1.25" fill="currentColor" />
          <circle cx="14.5" cy="16.4" r="1.15" fill="currentColor" />
        </svg>
      </span>
      <span className="font-heading text-xl font-bold tracking-[-0.03em]">
        PizzaHub
      </span>
    </span>
  );
}

export function AuthShell({
  title,
  description,
  heroHeadline,
  heroSubheadline,
  switchPrompt,
  switchLabel,
  switchHref,
  children,
}: AuthShellProps) {
  return (
    <div className="min-h-dvh grid lg:grid-cols-[minmax(0,1.02fr)_minmax(0,1fr)] bg-background text-foreground">
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[#1a110e] p-10 xl:p-12">
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
          className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/15 to-black/85"
        />

        <div className="relative z-10 flex items-center justify-between">
          <Link
            href="/"
            className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          >
            <PizzaHubBrandMark tone="light" />
          </Link>
        </div>

        <div className="relative z-10 max-w-md space-y-4">
          <h2 className="font-heading text-3xl xl:text-4xl font-semibold tracking-[-0.03em] leading-[1.12] text-white text-balance">
            {heroHeadline}
          </h2>
          <p className="text-base leading-relaxed text-white/85">
            {heroSubheadline}
          </p>
          <div className="h-px w-full bg-white/20" />
          <p className="text-xs tracking-wide text-white/75">
            Local brick-oven pizzerias, curated menus, and real-time order
            updates.
          </p>
        </div>
      </aside>

      <main className="flex min-h-dvh flex-col justify-between px-5 py-6 sm:px-8 sm:py-8 lg:px-12 xl:px-16">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="lg:hidden rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <PizzaHubBrandMark tone="dark" />
            </Link>
            <Link
              href="/"
              className="hidden lg:inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              <span>Back to home</span>
            </Link>
          </div>

          <p className="text-sm text-muted-foreground">
            <span className="hidden sm:inline">{switchPrompt} </span>
            <Link
              href={switchHref}
              className="font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              {switchLabel}
            </Link>
          </p>
        </header>

        <section
          aria-labelledby="auth-page-heading"
          className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-8 sm:py-10"
        >
          <div className="mb-7 space-y-2">
            <h1
              id="auth-page-heading"
              className="font-heading text-2xl sm:text-[1.75rem] font-semibold tracking-[-0.025em] leading-tight text-foreground text-balance"
            >
              {title}
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>

          {children}
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4 text-xs text-muted-foreground">
          <span>© 2026 PizzaHub</span>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              Home
            </Link>
            <Link
              href={switchHref}
              className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              {switchLabel}
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
