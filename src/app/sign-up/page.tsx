import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = {
  title: "Create Account — PizzaHub",
  description:
    "Join PizzaHub as a customer to order fresh pizza or as a vendor to showcase your restaurant menu.",
};

export default function SignUpPage() {
  const googleEnabled = Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim(),
  );

  return (
    <AuthShell
      title="Create your account"
      description="Join PizzaHub to discover wood-fired pies nearby or publish your restaurant menu."
      heroHeadline="One table for hungry neighbors and independent pizzerias."
      heroSubheadline="Register in seconds as a Customer or Vendor—fresh crust, transparent orders, zero guesswork."
      switchPrompt="Already registered?"
      switchLabel="Sign in"
      switchHref="/sign-in"
    >
      <SignUpForm googleEnabled={googleEnabled} />
    </AuthShell>
  );
}
