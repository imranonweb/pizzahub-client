"use client";

import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import { useAuthSession } from "@/components/providers/session-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
import type { PublicRegistrationRole } from "@/lib/auth";
import { signUp } from "@/lib/auth-client";
import { getDashboardPathForRole } from "@/lib/auth-routes";
import {
  getSafeAuthErrorMessage,
  isValidEmail,
  validatePasswordPolicy,
} from "./auth-errors";
import { GoogleAuthButton } from "./google-auth-button";

interface SignUpFormProps {
  googleEnabled: boolean;
}

interface SignUpFieldErrors {
  name?: string;
  businessName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const ROLE_OPTIONS: ReadonlyArray<{
  value: PublicRegistrationRole;
  title: string;
  subtitle: string;
  icon: typeof UtensilsCrossed;
}> = [
  {
    value: "customer",
    title: "Customer",
    subtitle: "Browse menus & order pizza",
    icon: UtensilsCrossed,
  },
  {
    value: "vendor",
    title: "Vendor",
    subtitle: "List your kitchen & orders",
    icon: Store,
  },
];

export function SignUpForm({ googleEnabled }: SignUpFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshSession } = useAuthSession();

  const requestedRole = searchParams.get("role");
  const initialRole: PublicRegistrationRole =
    requestedRole === "vendor" ? "vendor" : "customer";

  const [role, setRole] = useState<PublicRegistrationRole>(initialRole);
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<SignUpFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const isBusy = isSubmitting || isGoogleLoading;
  const passwordStatus = validatePasswordPolicy(password);
  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;

  const validateFields = (): boolean => {
    const errors: SignUpFieldErrors = {};

    if (!name.trim()) {
      errors.name = "Full name is required.";
    } else if (name.trim().length < 2) {
      errors.name = "Please enter at least 2 characters for your name.";
    }

    if (role === "vendor" && !businessName.trim()) {
      errors.businessName = "Restaurant or business name is required.";
    }

    if (!email.trim()) {
      errors.email = "Email address is required.";
    } else if (!isValidEmail(email)) {
      errors.email = "Please enter a valid email address.";
    }

    if (!password) {
      errors.password = "Password is required.";
    } else if (!passwordStatus.isValid) {
      errors.password =
        "Password must be at least 6 characters with 1 uppercase and 1 lowercase letter.";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRoleSelect = (selectedRole: PublicRegistrationRole) => {
    if (isBusy) {
      return;
    }

    setRole(selectedRole);
    if (selectedRole === "customer" && fieldErrors.businessName) {
      setFieldErrors((prev) => ({ ...prev, businessName: undefined }));
    }
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
      const response = await signUp.email({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        businessName: role === "vendor" ? businessName.trim() : "",
      });

      if (response.error) {
        const message = getSafeAuthErrorMessage(response.error, "sign-up");
        setFormError(message);
        toast.add({
          title: "Registration failed",
          description: message,
          type: "error",
        });
        setIsSubmitting(false);
        return;
      }

      await refreshSession();

      toast.add({
        title: "Account created",
        description:
          role === "vendor"
            ? "Your vendor account is ready. Welcome to PizzaHub."
            : "Your customer account is ready. Welcome to PizzaHub.",
        type: "success",
      });
      router.refresh();
      router.push(getDashboardPathForRole(role));
    } catch {
      const message = getSafeAuthErrorMessage({ status: 500 }, "sign-up");
      setFormError(message);
      toast.add({
        title: "Registration failed",
        description: message,
        type: "error",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {formError ? (
        <Alert variant="destructive" className="rounded-xl">
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertTitle>Could not create account</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <fieldset className="space-y-2 border-0 p-0">
          <legend className="text-sm font-medium text-foreground">
            Account type
          </legend>
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {ROLE_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = role === option.value;
              const inputId = `sign-up-role-${option.value}`;

              return (
                <label
                  key={option.value}
                  htmlFor={inputId}
                  className={`relative flex cursor-pointer flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all has-focus-visible:ring-2 has-focus-visible:ring-ring ${
                    isBusy ? "pointer-events-none opacity-60" : ""
                  } ${
                    isSelected
                      ? "border-primary bg-accent/80 text-foreground shadow-2xs"
                      : "border-border bg-card text-muted-foreground hover:border-foreground/25 hover:text-foreground"
                  }`}
                >
                  <input
                    id={inputId}
                    type="radio"
                    name="accountRole"
                    value={option.value}
                    checked={isSelected}
                    disabled={isBusy}
                    onChange={() => handleRoleSelect(option.value)}
                    className="sr-only"
                  />
                  <span className="flex w-full items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      <Icon
                        className={`size-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                        aria-hidden="true"
                      />
                      {option.title}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`flex size-4 items-center justify-center rounded-full border ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background"
                      }`}
                    >
                      {isSelected ? <Check className="size-2.5" /> : null}
                    </span>
                  </span>
                  <span className="text-xs leading-snug text-muted-foreground">
                    {option.subtitle}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="space-y-1.5">
          <Label htmlFor="sign-up-name">Full name</Label>
          <Input
            id="sign-up-name"
            name="name"
            type="text"
            autoComplete="name"
            enterKeyHint="next"
            placeholder="Marco Rossi"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (fieldErrors.name) {
                setFieldErrors((prev) => ({ ...prev, name: undefined }));
              }
            }}
            disabled={isBusy}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={
              fieldErrors.name ? "sign-up-name-error" : undefined
            }
            required
            className="h-11 rounded-xl bg-card px-3.5 shadow-2xs"
          />
          {fieldErrors.name ? (
            <p
              id="sign-up-name-error"
              role="alert"
              className="text-xs font-medium text-destructive"
            >
              {fieldErrors.name}
            </p>
          ) : null}
        </div>

        {role === "vendor" ? (
          <div className="space-y-1.5">
            <Label htmlFor="sign-up-business-name">
              Restaurant / business name
            </Label>
            <Input
              id="sign-up-business-name"
              name="businessName"
              type="text"
              autoComplete="organization"
              enterKeyHint="next"
              placeholder="Napoli Brick Oven Pizzeria"
              value={businessName}
              onChange={(event) => {
                setBusinessName(event.target.value);
                if (fieldErrors.businessName) {
                  setFieldErrors((prev) => ({
                    ...prev,
                    businessName: undefined,
                  }));
                }
              }}
              disabled={isBusy}
              aria-invalid={Boolean(fieldErrors.businessName)}
              aria-describedby={
                fieldErrors.businessName
                  ? "sign-up-business-name-error"
                  : undefined
              }
              required
              className="h-11 rounded-xl bg-card px-3.5 shadow-2xs"
            />
            {fieldErrors.businessName ? (
              <p
                id="sign-up-business-name-error"
                role="alert"
                className="text-xs font-medium text-destructive"
              >
                {fieldErrors.businessName}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="sign-up-email">Email address</Label>
          <Input
            id="sign-up-email"
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
              fieldErrors.email ? "sign-up-email-error" : undefined
            }
            required
            className="h-11 rounded-xl bg-card px-3.5 shadow-2xs"
          />
          {fieldErrors.email ? (
            <p
              id="sign-up-email-error"
              role="alert"
              className="text-xs font-medium text-destructive"
            >
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sign-up-password">Password</Label>
          <div className="relative">
            <Input
              id="sign-up-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              enterKeyHint="next"
              placeholder="Create a strong password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              disabled={isBusy}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby="sign-up-password-rules"
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

          <ul
            id="sign-up-password-rules"
            className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs"
          >
            <li
              className={`inline-flex items-center gap-1 ${
                passwordStatus.minLength
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              <Check
                className={`size-3.5 ${
                  passwordStatus.minLength
                    ? "text-primary"
                    : "text-muted-foreground/60"
                }`}
                aria-hidden="true"
              />
              6+ characters
            </li>
            <li
              className={`inline-flex items-center gap-1 ${
                passwordStatus.hasUppercase
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              <Check
                className={`size-3.5 ${
                  passwordStatus.hasUppercase
                    ? "text-primary"
                    : "text-muted-foreground/60"
                }`}
                aria-hidden="true"
              />
              1 uppercase
            </li>
            <li
              className={`inline-flex items-center gap-1 ${
                passwordStatus.hasLowercase
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              <Check
                className={`size-3.5 ${
                  passwordStatus.hasLowercase
                    ? "text-primary"
                    : "text-muted-foreground/60"
                }`}
                aria-hidden="true"
              />
              1 lowercase
            </li>
          </ul>

          {fieldErrors.password ? (
            <p role="alert" className="text-xs font-medium text-destructive">
              {fieldErrors.password}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sign-up-confirm-password">Confirm password</Label>
          <div className="relative">
            <Input
              id="sign-up-confirm-password"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              enterKeyHint="done"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                if (fieldErrors.confirmPassword) {
                  setFieldErrors((prev) => ({
                    ...prev,
                    confirmPassword: undefined,
                  }));
                }
              }}
              disabled={isBusy}
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
              aria-describedby={
                fieldErrors.confirmPassword
                  ? "sign-up-confirm-password-error"
                  : undefined
              }
              required
              className="h-11 rounded-xl bg-card pr-11 pl-3.5 shadow-2xs"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              disabled={isBusy}
              aria-label={
                showConfirmPassword
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
              aria-pressed={showConfirmPassword}
              className="absolute inset-y-1 right-1 flex w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              {showConfirmPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {fieldErrors.confirmPassword ? (
            <p
              id="sign-up-confirm-password-error"
              role="alert"
              className="text-xs font-medium text-destructive"
            >
              {fieldErrors.confirmPassword}
            </p>
          ) : passwordsMatch ? (
            <p className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
              <Check className="size-3.5 text-primary" aria-hidden="true" />
              Passwords match
            </p>
          ) : null}
        </div>

        <Button
          type="submit"
          disabled={isBusy}
          className="h-11 w-full rounded-xl text-sm font-semibold shadow-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              <span>Creating account…</span>
            </>
          ) : (
            <span>
              {role === "vendor"
                ? "Create Vendor Account"
                : "Create Customer Account"}
            </span>
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
        mode="sign-up"
        callbackURL="/dashboard"
        disabled={isSubmitting}
        onLoadingChange={setIsGoogleLoading}
        onError={(message) => setFormError(message)}
      />

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
