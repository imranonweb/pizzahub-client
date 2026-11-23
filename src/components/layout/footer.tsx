import { Mail, MapPin } from "lucide-react";
import Link from "next/link";
import { PizzaHubBrandMark } from "@/components/brand/pizzahub-logo";

export function Footer() {
  return (
    <footer className="border-t border-[#2f221c] bg-[#160f0c] text-[#faf6f0]">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.55fr_1fr_1fr_1.15fr]">
          <div className="space-y-4">
            <Link
              href="/"
              className="inline-flex rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f26d4f]"
            >
              <PizzaHubBrandMark tone="light" />
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-[#cfc4b8]">
              Connecting neighborhood pizza lovers with independent brick-oven
              kitchens for simple ordering and transparent delivery tracking.
            </p>
            <div className="flex items-center gap-2.5 pt-1">
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="PizzaHub on X"
                className="flex size-9 items-center justify-center rounded-xl border border-[#faf6f0]/14 bg-[#faf6f0]/5 text-[#d9cfc4] transition-colors hover:border-[#faf6f0]/35 hover:bg-[#faf6f0]/12 hover:text-[#faf6f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f26d4f]"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-4 fill-current"
                  aria-hidden="true"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span className="sr-only">PizzaHub on X</span>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="PizzaHub on Instagram"
                className="flex size-9 items-center justify-center rounded-xl border border-[#faf6f0]/14 bg-[#faf6f0]/5 text-[#d9cfc4] transition-colors hover:border-[#faf6f0]/35 hover:bg-[#faf6f0]/12 hover:text-[#faf6f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f26d4f]"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
                <span className="sr-only">PizzaHub on Instagram</span>
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="PizzaHub on Facebook"
                className="flex size-9 items-center justify-center rounded-xl border border-[#faf6f0]/14 bg-[#faf6f0]/5 text-[#d9cfc4] transition-colors hover:border-[#faf6f0]/35 hover:bg-[#faf6f0]/12 hover:text-[#faf6f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f26d4f]"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
                <span className="sr-only">PizzaHub on Facebook</span>
              </a>
            </div>
          </div>

          <div className="space-y-3.5">
            <h3 className="font-heading text-sm font-semibold tracking-tight text-[#faf6f0]">
              Explore
            </h3>
            <ul className="space-y-2.5 text-sm text-[#cfc4b8]">
              <li>
                <Link
                  href="/"
                  className="transition-colors hover:text-[#faf6f0]"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/menu"
                  className="transition-colors hover:text-[#faf6f0]"
                >
                  Browse Menu
                </Link>
              </li>
              <li>
                <Link
                  href="/sign-in"
                  className="transition-colors hover:text-[#faf6f0]"
                >
                  Sign In
                </Link>
              </li>
              <li>
                <Link
                  href="/sign-up"
                  className="transition-colors hover:text-[#faf6f0]"
                >
                  Create Account
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3.5">
            <h3 className="font-heading text-sm font-semibold tracking-tight text-[#faf6f0]">
              Partner & Account
            </h3>
            <ul className="space-y-2.5 text-sm text-[#cfc4b8]">
              <li>
                <Link
                  href="/pricing"
                  className="transition-colors hover:text-[#faf6f0]"
                >
                  Vendor Pricing & Plans
                </Link>
              </li>
              <li>
                <Link
                  href="/sign-up?role=vendor"
                  className="transition-colors hover:text-[#faf6f0]"
                >
                  Become a Vendor
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  prefetch={false}
                  className="transition-colors hover:text-[#faf6f0]"
                >
                  My Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/profile"
                  prefetch={false}
                  className="transition-colors hover:text-[#faf6f0]"
                >
                  Profile Settings
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3.5">
            <h3 className="font-heading text-sm font-semibold tracking-tight text-[#faf6f0]">
              Contact
            </h3>
            <ul className="space-y-3 text-sm text-[#cfc4b8]">
              <li className="flex items-start gap-2.5">
                <Mail
                  className="mt-0.5 size-4 shrink-0 text-[#f26d4f]"
                  aria-hidden="true"
                />
                <a
                  href="mailto:support@pizzahub.app"
                  className="transition-colors hover:text-[#faf6f0]"
                >
                  support@pizzahub.app
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin
                  className="mt-0.5 size-4 shrink-0 text-[#f26d4f]"
                  aria-hidden="true"
                />
                <span>Serving neighborhood pizzerias & local kitchens</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-[#faf6f0]/12 pt-6 text-xs text-[#b5a99c] sm:flex-row sm:items-center">
          <p>© 2026 PizzaHub. All rights reserved.</p>
          <p>Hot & fresh pizza ordering and delivery platform.</p>
        </div>
      </div>
    </footer>
  );
}
