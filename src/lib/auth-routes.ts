import type { PizzaHubRole } from "./auth";

export const ROLE_DASHBOARD_PATHS: Record<PizzaHubRole, string> = {
  customer: "/dashboard/customer",
  vendor: "/dashboard/vendor",
  admin: "/dashboard/admin",
};

const VALID_ROLES = new Set<PizzaHubRole>(["customer", "vendor", "admin"]);

export function isValidPizzaHubRole(role: unknown): role is PizzaHubRole {
  return typeof role === "string" && VALID_ROLES.has(role as PizzaHubRole);
}

export function getDashboardPathForRole(role: unknown): string {
  if (isValidPizzaHubRole(role)) {
    return ROLE_DASHBOARD_PATHS[role];
  }
  return ROLE_DASHBOARD_PATHS.customer;
}

export function getRequiredRoleForPath(pathname: string): PizzaHubRole | null {
  if (
    pathname === ROLE_DASHBOARD_PATHS.customer ||
    pathname.startsWith(`${ROLE_DASHBOARD_PATHS.customer}/`)
  ) {
    return "customer";
  }
  if (
    pathname === ROLE_DASHBOARD_PATHS.vendor ||
    pathname.startsWith(`${ROLE_DASHBOARD_PATHS.vendor}/`)
  ) {
    return "vendor";
  }
  if (
    pathname === ROLE_DASHBOARD_PATHS.admin ||
    pathname.startsWith(`${ROLE_DASHBOARD_PATHS.admin}/`)
  ) {
    return "admin";
  }
  if (pathname === "/checkout" || pathname.startsWith("/checkout/")) {
    return "customer";
  }
  return null;
}

export function sanitizeCallbackUrl(
  rawUrl: string | null | undefined,
  fallback = "/",
): string {
  if (!rawUrl) {
    return fallback;
  }

  const trimmed = rawUrl.trim();
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\") ||
    /[\r\n\t\0]/.test(trimmed)
  ) {
    return fallback;
  }

  const pathname = trimmed.split(/[?#]/, 1)[0] ?? "";
  if (pathname === "/sign-in" || pathname === "/sign-up") {
    return fallback;
  }

  return trimmed;
}

export type SignInNoticeReason = "blocked" | "session-expired";

export function buildSignInRedirectUrl(
  returnPath?: string,
  reason?: SignInNoticeReason,
): string {
  const params = new URLSearchParams();
  const safePath = sanitizeCallbackUrl(returnPath, "");

  if (safePath && safePath !== "/") {
    params.set("callbackUrl", safePath);
  }

  if (reason) {
    params.set("error", reason);
  }

  const query = params.toString();
  return query ? `/sign-in?${query}` : "/sign-in";
}
