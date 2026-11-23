import { sanitizeCallbackUrl } from "@/lib/auth-routes";

export interface PasswordPolicyStatus {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  isValid: boolean;
}

export interface AuthErrorLike {
  code?: string;
  message?: string;
  status?: number;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}

export function validatePasswordPolicy(password: string): PasswordPolicyStatus {
  const minLength = password.length >= 6;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);

  return {
    minLength,
    hasUppercase,
    hasLowercase,
    isValid: minLength && hasUppercase && hasLowercase,
  };
}

export function getSafeRedirectPath(rawPath: string | null): string {
  return sanitizeCallbackUrl(rawPath, "/");
}

export function getSafeAuthErrorMessage(
  error: AuthErrorLike | null | undefined,
  context: "sign-in" | "sign-up" | "google",
): string {
  const code = error?.code?.toUpperCase() ?? "";
  const rawMessage = error?.message?.toLowerCase() ?? "";
  const status = error?.status;

  if (rawMessage.includes("blocked")) {
    return "Your account has been blocked. Please contact support or an administrator.";
  }

  if (
    code === "INVALID_EMAIL_OR_PASSWORD" ||
    rawMessage.includes("invalid email or password") ||
    rawMessage.includes("invalid password")
  ) {
    return "Invalid email or password. Please check your credentials and try again.";
  }

  if (
    code === "USER_ALREADY_EXISTS" ||
    code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" ||
    rawMessage.includes("already exists")
  ) {
    return "An account with this email already exists. Try signing in instead.";
  }

  if (code === "INVALID_EMAIL" || rawMessage.includes("invalid email")) {
    return "Please enter a valid email address.";
  }

  if (
    code === "PASSWORD_TOO_SHORT" ||
    rawMessage.includes("password must be at least")
  ) {
    return "Password must be at least 6 characters long and contain both an uppercase and lowercase letter.";
  }

  if (
    context === "google" ||
    code === "PROVIDER_NOT_FOUND" ||
    rawMessage.includes("provider")
  ) {
    return "Google sign-in is currently unavailable. Please use email and password or try again shortly.";
  }

  if (
    code === "AUTH_DATABASE_UNAVAILABLE" ||
    rawMessage.includes("database connection failed")
  ) {
    return "Authentication database is temporarily unavailable. Please try again shortly.";
  }

  if (status === 403 || code === "FORBIDDEN") {
    return "Access denied. Please verify your account status or try again.";
  }

  if (status === 429) {
    return "Too many attempts right now. Please wait a moment and try again.";
  }

  if (status !== undefined && status >= 500) {
    return "We could not reach the authentication service. Please try again in a moment.";
  }

  if (
    status === 400 &&
    error?.message &&
    error.message.trim().length > 0 &&
    error.message.trim().length <= 160
  ) {
    return error.message.trim();
  }

  if (context === "sign-up") {
    return "Unable to create your account right now. Please check your details and try again.";
  }

  return "Unable to sign in right now. Please verify your details and try again.";
}
