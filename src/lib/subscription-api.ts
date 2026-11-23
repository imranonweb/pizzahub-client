import { ApiClientError, apiRequest } from "./api-client";
import { getAuthToken } from "./auth-client";

export type VendorSubscriptionPlan = "free" | "premium";

export interface BackendSubscriptionPlanInfo {
  id: VendorSubscriptionPlan;
  name: string;
  priceCents: number;
  price: number;
  currency: string;
  interval: string | null;
  activeItemLimit: number | null;
  features: string[];
}

export interface BackendVendorSubscription {
  plan: VendorSubscriptionPlan;
  storedPlan: VendorSubscriptionPlan;
  status: string;
  cancelAtPeriodEnd: boolean;
  subscriptionExpiresAt: string | null;
  isExpired: boolean;
  hasBillingCustomer: boolean;
  activeItemLimit: number | null;
}

export interface SubscriptionTransaction {
  id: string;
  vendorId: string;
  plan: string;
  amount: number;
  currency: string;
  stripeSessionId: string | null;
  stripeSubscriptionId: string | null;
  status: string;
  createdAt: string | null;
}

export interface VendorSubscriptionSummaryResponse {
  source: "live" | "unavailable";
  subscription: BackendVendorSubscription | null;
  recentTransactions: SubscriptionTransaction[];
  plans: BackendSubscriptionPlanInfo[];
  notice?: string;
}

export interface CheckoutSessionActionResult {
  ok: boolean;
  sessionId?: string;
  checkoutUrl?: string;
  message: string;
}

export interface BillingPortalActionResult {
  ok: boolean;
  url?: string;
  message: string;
}

export function isValidRedirectHttpUrl(rawUrl: unknown): rawUrl is string {
  if (typeof rawUrl !== "string" || !rawUrl.trim()) {
    return false;
  }

  try {
    const parsed = new URL(rawUrl.trim());
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function formatCurrencyAmountFromCents(
  amountCents: number,
  currency = "usd",
): string {
  const safeCents = Number.isFinite(amountCents) ? amountCents : 0;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(safeCents / 100);
  } catch {
    return `$${(safeCents / 100).toFixed(2)}`;
  }
}

function getClientOrigin(): string | undefined {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }
  return undefined;
}

export async function verifyVendorCheckoutSession(
  sessionId?: string,
): Promise<{ reconciled: boolean; plan?: "free" | "premium" }> {
  try {
    const res = await fetch("/api/subscription/verify-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionId }),
    });
    if (!res.ok) {
      return { reconciled: false };
    }
    const data = (await res.json()) as {
      reconciled?: boolean;
      plan?: "free" | "premium";
    };
    return {
      reconciled: data.reconciled === true,
      plan: data.plan,
    };
  } catch {
    return { reconciled: false };
  }
}

export async function fetchVendorSubscription(): Promise<VendorSubscriptionSummaryResponse> {
  const token = await getAuthToken();
  if (!token) {
    return {
      source: "unavailable",
      subscription: null,
      recentTransactions: [],
      plans: [],
      notice:
        "Authentication session token unavailable. Please refresh or sign in again.",
    };
  }

  try {
    const payload = await apiRequest<{
      success?: boolean;
      subscription?: BackendVendorSubscription;
      recentTransactions?: SubscriptionTransaction[];
      plans?: BackendSubscriptionPlanInfo[];
    }>("/api/vendor/subscription", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return {
      source: "live",
      subscription: payload.subscription ?? null,
      recentTransactions: Array.isArray(payload.recentTransactions)
        ? payload.recentTransactions
        : [],
      plans: Array.isArray(payload.plans) ? payload.plans : [],
    };
  } catch (error) {
    const message =
      error instanceof ApiClientError
        ? error.message
        : "Unable to load subscription details from PizzaHub API.";

    return {
      source: "unavailable",
      subscription: null,
      recentTransactions: [],
      plans: [],
      notice: message,
    };
  }
}

export async function createVendorCheckoutSession(): Promise<CheckoutSessionActionResult> {
  const token = await getAuthToken();
  if (!token) {
    return {
      ok: false,
      message: "Sign in with a verified vendor account before checking out.",
    };
  }

  const origin = getClientOrigin();
  const body: {
    plan: "premium";
    successUrl?: string;
    cancelUrl?: string;
  } = {
    plan: "premium",
  };

  if (origin) {
    body.successUrl = `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
    body.cancelUrl = `${origin}/payment/cancel`;
  }

  try {
    const payload = await apiRequest<{
      success?: boolean;
      sessionId?: string;
      checkoutUrl?: string;
    }>("/api/vendor/subscription/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      timeoutMs: 10000,
    });

    if (!isValidRedirectHttpUrl(payload.checkoutUrl)) {
      return {
        ok: false,
        message:
          "Checkout session was created without a valid Stripe redirect URL.",
      };
    }

    return {
      ok: true,
      sessionId: payload.sessionId,
      checkoutUrl: payload.checkoutUrl,
      message: "Redirecting to Stripe Checkout...",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to start Stripe checkout at this time.",
    };
  }
}

export async function createVendorBillingPortalSession(): Promise<BillingPortalActionResult> {
  const token = await getAuthToken();
  if (!token) {
    return {
      ok: false,
      message: "Sign in with a verified vendor account to manage billing.",
    };
  }

  const origin = getClientOrigin();
  const body: { returnUrl?: string } = {};
  if (origin) {
    body.returnUrl = `${origin}/dashboard/vendor/subscription`;
  }

  try {
    const payload = await apiRequest<{
      success?: boolean;
      url?: string;
    }>("/api/vendor/subscription/portal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      timeoutMs: 10000,
    });

    if (!isValidRedirectHttpUrl(payload.url)) {
      return {
        ok: false,
        message:
          "Billing portal session was created without a valid Stripe portal URL.",
      };
    }

    return {
      ok: true,
      url: payload.url,
      message: "Opening Stripe Customer Billing Portal...",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to open Stripe Customer Portal at this time.",
    };
  }
}
