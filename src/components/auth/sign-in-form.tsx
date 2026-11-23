"use client";

import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import { useAuthSession } from "@/components/providers/session-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
import { signIn } from "@/lib/auth-client";
import {
  getDashboardPathForRole,
  sanitizeCallbackUrl,
} from "@/lib/auth-routes";
import { getSafeAuthErrorMessage, isValidEmail } from "./auth-errors";
import { GoogleAuthButton } from "./google-auth-button";

interface SignInFormProps {
  googleEnabled: boolean;
}

interface SignInFieldErrors {
  email?: string;
  password?: string;
}

export function SignInForm({ googleEnabled }: SignInFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshSession } = useAuthSession();

  const rawCallbackUrl = searchParams.get("callbackUrl");
  const explicitCallback = sanitizeCallbackUrl(rawCallbackUrl, "");
  const redirectTo = explicitCallback || "/dashboard";
  const errorParam = searchParams.get("error");
  const redirectNotice =
    errorParam === "blocked"
      ? "Your account has been blocked. Please contact support or an administrator."
      : errorParam === "session-expired"
        ? "Your session expired. Please sign in again to continue."
        : null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<SignInFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const isBusy = isSubmitting || isGoogleLoading;
  const activeAlertMessage = formError ?? redirectNotice;

  const validateFields = (): boolean => {
    const errors: SignInFieldErrors = {};

    if (!email.trim()) {
      errors.email = "Email address is required.";
    } else if (!isValidEmail(email)) {
      errors.email = "Please enter a valid email address.";
    }

    if (!password) {
      errors.password = "Password is required.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isBusy) {
      return;
    }

    setFormError(null);
    if (!validateFields()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await signIn.email({
        email: email.trim().toLowerCase(),
        password,
        rememberMe,
      });

      if (response.error) {
        const message = getSafeAuthErrorMessage(response.error, "sign-in");
        setFormError(message);
        toast.add({
          title: "Sign in failed",
          description: message,
          type: "error",
        });
        setIsSubmitting(false);
        return;
      }

      await refreshSession().catch(() => undefined);

      const signedInRole = (
        response.data?.user as { role?: unknown } | undefined
      )?.role;
      const destination =
        explicitCallback || getDashboardPathForRole(signedInRole);

      toast.add({
        title: "Welcome back",
        description: "Signed in to your PizzaHub account.",
        type: "success",
      });
      if (typeof window !== "undefined") {
        window.location.assign(destination);
      } else {
        router.refresh();
        router.push(destination);
      }
    } catch {
      const message = getSafeAuthErrorMessage({ status: 500 }, "sign-in");
      setFormError(message);
      toast.add({
        title: "Sign in failed",
        description: message,
        type: "error",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {activeAlertMessage ? (
        <Alert variant="destructive" className="rounded-xl">
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertTitle>Could not sign in</AlertTitle>
          <AlertDescription>{activeAlertMessage}</AlertDescription>
        </Alert>
      ) : null}

      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="sign-in-email">Email address</Label>
          <Input
            id="sign-in-email"
            name="email"
            type="email"
            autoComplete="username"
            spellCheck={false}
            enterKeyHint="next"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (fieldErrors.email) {
                setFieldErrors((prev) => ({ ...prev, email: undefined }));
              }
            }}
            disabled={isBusy}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={
              fieldErrors.email ? "sign-in-email-error" : undefined
            }
            required
            className="h-11 rounded-xl bg-card px-3.5 shadow-2xs"
          />
          {fieldErrors.email ? (
            <p
              id="sign-in-email-error"
              role="alert"
              className="text-xs font-medium text-destructive"
            >
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sign-in-password">Password</Label>
          <div className="relative">
            <Input
              id="sign-in-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              enterKeyHint="done"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              disabled={isBusy}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={
                fieldErrors.password ? "sign-in-password-error" : undefined
              }
              required
              className="h-11 rounded-xl bg-card pr-11 pl-3.5 shadow-2xs"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              disabled={isBusy}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute inset-y-1 right-1 flex w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {fieldErrors.password ? (
            <p
              id="sign-in-password-error"
              role="alert"
              className="text-xs font-medium text-destructive"
            >
              {fieldErrors.password}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between pt-0.5">
          <Label
            htmlFor="sign-in-remember"
            className="cursor-pointer gap-2.5 text-sm font-normal text-muted-foreground hover:text-foreground"
          >
            <Checkbox
              id="sign-in-remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
              disabled={isBusy}
            />
            <span>Remember me on this device</span>
          </Label>
        </div>

        <Button
          type="submit"
          disabled={isBusy}
          className="h-11 w-full rounded-xl text-sm font-semibold shadow-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              <span>Signing in…</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </Button>
      </form>

      <div className="relative flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs font-medium text-muted-foreground">
          or continue with
        </span>
        <Separator className="flex-1" />
      </div>

      <GoogleAuthButton
        enabled={googleEnabled}
        mode="sign-in"
        callbackURL={redirectTo}
        disabled={isSubmitting}
        onLoadingChange={setIsGoogleLoading}
        onError={(message) => setFormError(message)}
      />

      <p className="text-center text-sm text-muted-foreground">
        New to PizzaHub?{" "}
        <Link
          href={
            explicitCallback
              ? `/sign-up?callbackUrl=${encodeURIComponent(explicitCallback)}`
              : "/sign-up"
          }
          className="font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
