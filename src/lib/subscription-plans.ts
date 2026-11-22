import { FREE_PLAN_ACTIVE_ITEM_LIMIT } from "./vendor-menu-api";

export { FREE_PLAN_ACTIVE_ITEM_LIMIT };
export const DEFAULT_PREMIUM_MONTHLY_PRICE = 29;
export const FREE_PLAN_MONTHLY_PRICE = 0;

/**
 * Returns the configurable monthly price for the Premium vendor subscription.
 * Used as fallback display on public pages where unauthenticated visitors
 * cannot query /api/vendor/subscription/plans; authenticated vendors use
 * the authoritative backend plan configuration.
 */
export function getPremiumMonthlyPrice(): number {
  const envPrice = process.env.NEXT_PUBLIC_PREMIUM_MONTHLY_PRICE;
  if (!envPrice) {
    return DEFAULT_PREMIUM_MONTHLY_PRICE;
  }
  const parsed = Number(envPrice);
  if (Number.isFinite(parsed) && parsed >= 0) {
    return Math.round(parsed * 100) / 100;
  }
  return DEFAULT_PREMIUM_MONTHLY_PRICE;
}

export interface PlanFeature {
  name: string;
  free: string | boolean;
  premium: string | boolean;
  highlight?: boolean;
  description?: string;
}

export interface PlanComparisonCategory {
  category: string;
  features: PlanFeature[];
}

export const PLAN_COMPARISON_CATEGORIES: PlanComparisonCategory[] = [
  {
    category: "Menu Catalog & Active Capacity",
    features: [
      {
        name: "Active approved menu listings",
        free: `${FREE_PLAN_ACTIVE_ITEM_LIMIT} items max`,
        premium: "Unlimited",
        highlight: true,
        description:
          "Approved items currently live and orderable by customers on the public /menu.",
      },
      {
        name: "Total catalog items & drafts",
        free: "Unlimited",
        premium: "Unlimited",
        description:
          "Keep inactive recipes or upcoming seasonal pizzas saved in your kitchen dashboard.",
      },
      {
        name: "Self-service listing rotation",
        free: true,
        premium: true,
        description:
          "Pause or reactivate dishes anytime within your active capacity limit.",
      },
      {
        name: "High-resolution dish photos",
        free: "Up to 5 photos",
        premium: "Up to 5 photos",
        description:
          "Showcase crust, toppings, and cheese pulls with multi-photo gallery support.",
      },
    ],
  },
  {
    category: "Storefront & Discovery",
    features: [
      {
        name: "Verified Premium Kitchen badge",
        free: false,
        premium: true,
        highlight: true,
        description:
          "Distinctive gold crown badge shown on all your pizzas and detail pages.",
      },
      {
        name: "Public menu discovery placement",
        free: "Standard catalog placement",
        premium: "Priority catalog visibility",
        description:
          "Premium vendor listings are highlighted and prioritized in public menu search.",
      },
      {
        name: "Kitchen location & contact details",
        free: true,
        premium: true,
        description:
          "Display your kitchen area, neighborhood delivery radius, and vendor identity.",
      },
    ],
  },
  {
    category: "Kitchen Operations & Ordering",
    features: [
      {
        name: "Customer ordering & cart checkout",
        free: true,
        premium: true,
        description:
          "Customers can add your active pizzas to their cart and submit online orders.",
      },
      {
        name: "Vendor dashboard & item metrics",
        free: true,
        premium: true,
        description:
          "Summary statistics for total, active, pending review, and rejected dishes.",
      },
      {
        name: "Admin moderation review",
        free: "Standard queue",
        premium: "Priority queue",
        description:
          "Every new dish is moderated by platform admins for quality food photography.",
      },
      {
        name: "Contract commitment",
        free: "None (Free forever)",
        premium: "Month-to-month",
        description:
          "No long-term contracts. Upgrade, downgrade, or cancel anytime.",
      },
    ],
  },
];

export interface VendorFaqItem {
  question: string;
  answer: string;
}

export const VENDOR_FAQS: VendorFaqItem[] = [
  {
    question: "How does the Free plan 3-active-item limit work?",
    answer:
      "On the Free plan, you can create and store as many draft or inactive pizzas as you want. However, only up to 3 approved pizzas can be active (visible to customers on /menu) at any single time. If you want to offer a different dish, simply deactivate an active pizza to immediately free up a slot.",
  },
  {
    question: "What extra benefits do Premium vendors receive?",
    answer:
      "Premium vendors unlock unlimited simultaneously active menu listings, a Verified Premium Kitchen gold badge on all pizza cards and detail pages, and priority placement in public menu browsing.",
  },
  {
    question: "How much does PizzaHub Premium cost?",
    answer:
      "PizzaHub Premium is billed monthly at the rate returned by the platform billing configuration (typically $29/month). Payments are processed securely through Stripe Checkout.",
  },
  {
    question: "Do new pizzas appear immediately to customers?",
    answer:
      "No. Every newly submitted pizza starts in 'Pending' status and is reviewed by a platform administrator to verify high-quality food photography and clear menu descriptions. Once approved, it can be activated within your plan capacity.",
  },
  {
    question: "Can I rotate my menu seasonally on the Free plan?",
    answer:
      "Yes! You can toggle any approved pizza between 'Active' and 'Inactive' with one click from your vendor dashboard. Pausing a winter specialty immediately allows you to activate a summer special without paying anything.",
  },
  {
    question: "How do billing, renewals, and cancellations work?",
    answer:
      "Premium vendors can manage payment methods, review billing history, and schedule cancellations anytime via the Stripe Customer Billing Portal in their Subscription Settings. Cancelled plans retain Premium access through the end of the current billing period.",
  },
];

export interface SubscriptionStatusInfo {
  planLabel: string;
  statusLabel: string;
  badgeVariant: "default" | "secondary" | "outline" | "destructive";
  isExpiringSoon: boolean;
  isExpired: boolean;
  isCancelling: boolean;
  isPaymentFailed: boolean;
  isPending: boolean;
  formattedExpiry: string | null;
}

export function getSubscriptionStatusDetails(params: {
  subscriptionPlan: "free" | "premium";
  subscriptionExpiresAt: string | Date | null;
  subscriptionStatus?: string | null;
  cancelAtPeriodEnd?: boolean;
}): SubscriptionStatusInfo {
  const {
    subscriptionPlan,
    subscriptionExpiresAt,
    subscriptionStatus,
    cancelAtPeriodEnd,
  } = params;

  const normalizedStatus = subscriptionStatus?.trim().toLowerCase() ?? "";

  let expiryDate: Date | null = null;
  if (subscriptionExpiresAt instanceof Date) {
    expiryDate = subscriptionExpiresAt;
  } else if (
    typeof subscriptionExpiresAt === "string" &&
    subscriptionExpiresAt.trim()
  ) {
    const parsed = new Date(subscriptionExpiresAt);
    if (!Number.isNaN(parsed.getTime()) && parsed.getTime() > 0) {
      expiryDate = parsed;
    }
  }

  const formattedExpiry = expiryDate
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }).format(expiryDate)
    : null;

  const now = Date.now();
  const isDateExpired = expiryDate !== null && expiryDate.getTime() <= now;
  const isExpired =
    normalizedStatus === "expired" ||
    (subscriptionPlan === "premium" && isDateExpired);
  const isPaymentFailed =
    normalizedStatus === "past_due" ||
    normalizedStatus === "unpaid" ||
    normalizedStatus === "failed";
  const isPending =
    normalizedStatus === "pending" || normalizedStatus === "incomplete";
  const isCancelled =
    normalizedStatus === "cancelled" || normalizedStatus === "canceled";
  const isCancelling =
    subscriptionPlan === "premium" &&
    !isExpired &&
    (Boolean(cancelAtPeriodEnd) || normalizedStatus === "cancelling");

  if (isPaymentFailed) {
    return {
      planLabel: "Free Kitchen Plan",
      statusLabel: "Payment Failed (Past Due)",
      badgeVariant: "destructive",
      isExpiringSoon: false,
      isExpired: false,
      isCancelling: false,
      isPaymentFailed: true,
      isPending: false,
      formattedExpiry,
    };
  }

  if (isExpired) {
    return {
      planLabel: "Free Kitchen Plan",
      statusLabel: "Expired",
      badgeVariant: "outline",
      isExpiringSoon: false,
      isExpired: true,
      isCancelling: false,
      isPaymentFailed: false,
      isPending: false,
      formattedExpiry,
    };
  }

  if (isCancelled && subscriptionPlan === "free") {
    return {
      planLabel: "Free Kitchen Plan",
      statusLabel: "Cancelled",
      badgeVariant: "outline",
      isExpiringSoon: false,
      isExpired: false,
      isCancelling: false,
      isPaymentFailed: false,
      isPending: false,
      formattedExpiry,
    };
  }

  if (isPending && subscriptionPlan === "free") {
    return {
      planLabel: "Free Kitchen Plan",
      statusLabel: "Payment Pending",
      badgeVariant: "secondary",
      isExpiringSoon: false,
      isExpired: false,
      isCancelling: false,
      isPaymentFailed: false,
      isPending: true,
      formattedExpiry,
    };
  }

  if (subscriptionPlan === "free") {
    return {
      planLabel: "Free Kitchen Plan",
      statusLabel: "Free Forever Tier",
      badgeVariant: "secondary",
      isExpiringSoon: false,
      isExpired: false,
      isCancelling: false,
      isPaymentFailed: false,
      isPending: false,
      formattedExpiry: null,
    };
  }

  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const isExpiringSoon =
    expiryDate !== null &&
    !isDateExpired &&
    expiryDate.getTime() - now < sevenDaysMs;

  if (isCancelling) {
    return {
      planLabel: "PizzaHub Premium Plan",
      statusLabel: "Cancelling at period end",
      badgeVariant: "outline",
      isExpiringSoon,
      isExpired: false,
      isCancelling: true,
      isPaymentFailed: false,
      isPending: false,
      formattedExpiry,
    };
  }

  return {
    planLabel: "PizzaHub Premium Plan",
    statusLabel:
      normalizedStatus === "trialing"
        ? "Trial Active"
        : isExpiringSoon
          ? "Renews soon"
          : "Active",
    badgeVariant: "default",
    isExpiringSoon,
    isExpired: false,
    isCancelling: false,
    isPaymentFailed: false,
    isPending: false,
    formattedExpiry,
  };
}
