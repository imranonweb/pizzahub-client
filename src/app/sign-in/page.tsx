import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Sign In — PizzaHub",
  description:
    "Sign in to your PizzaHub account to track orders or manage your restaurant kitchen.",
};

function SignInFormFallback() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <Skeleton className="h-11 w-full rounded-xl" />
      <Skeleton className="h-11 w-full rounded-xl" />
      <Skeleton className="h-11 w-full rounded-xl" />
    </div>
  );
}

export default function SignInPage() {
  const googleEnabled = Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim(),
  );

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in with your email or Google account to keep ordering or managing your menu."
      heroHeadline="Hot from the deck oven to your front door."
      heroSubheadline="Sign in to track active pizza deliveries, reorder neighborhood favorites, or manage your kitchen."
      switchPrompt="Need an account?"
      switchLabel="Sign up"
      switchHref="/sign-up"
    >
      <Suspense fallback={<SignInFormFallback />}>
        <SignInForm googleEnabled={googleEnabled} />
      </Suspense>
    </AuthShell>
  );
}
