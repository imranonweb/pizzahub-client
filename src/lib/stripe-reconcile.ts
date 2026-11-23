import { type Filter, ObjectId } from "mongodb";
import { connectDB } from "./mongodb";

interface StripeSubscriptionExpanded {
  id?: string;
  status?: string;
  current_period_end?: number;
  items?: {
    data?: Array<{
      current_period_end?: number;
    }>;
  };
}

interface StripeCheckoutSessionPayload {
  id?: string;
  object?: string;
  mode?: string;
  status?: string;
  payment_status?: string;
  amount_total?: number | null;
  currency?: string | null;
  created?: number;
  client_reference_id?: string | null;
  customer?: string | { id?: string } | null;
  subscription?: string | StripeSubscriptionExpanded | null;
  metadata?: Record<string, string | undefined> | null;
}

interface UserVendorDoc {
  _id?: ObjectId | string;
  id?: string;
  role?: string;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  subscriptionExpiresAt?: Date | string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}

function buildVendorFilter(vendorId: string): Filter<UserVendorDoc> {
  const trimmed = vendorId.trim();
  const clauses: Filter<UserVendorDoc>[] = [{ id: trimmed }, { _id: trimmed }];
  if (ObjectId.isValid(trimmed)) {
    clauses.unshift({ _id: new ObjectId(trimmed) });
  }
  return { $or: clauses };
}

function extractCustomerId(
  rawCustomer: StripeCheckoutSessionPayload["customer"],
): string | null {
  if (typeof rawCustomer === "string" && rawCustomer.trim()) {
    return rawCustomer.trim();
  }
  if (
    rawCustomer &&
    typeof rawCustomer === "object" &&
    typeof rawCustomer.id === "string" &&
    rawCustomer.id.trim()
  ) {
    return rawCustomer.id.trim();
  }
  return null;
}

function extractSubscriptionId(
  rawSub: StripeCheckoutSessionPayload["subscription"],
): string | null {
  if (typeof rawSub === "string" && rawSub.trim()) {
    return rawSub.trim();
  }
  if (
    rawSub &&
    typeof rawSub === "object" &&
    typeof rawSub.id === "string" &&
    rawSub.id.trim()
  ) {
    return rawSub.id.trim();
  }
  return null;
}

function extractPeriodEndDate(
  rawSub: StripeCheckoutSessionPayload["subscription"],
  fallbackDate: Date,
): Date {
  if (rawSub && typeof rawSub === "object") {
    const rawEpoch =
      rawSub.current_period_end ??
      rawSub.items?.data?.[0]?.current_period_end ??
      null;
    if (
      typeof rawEpoch === "number" &&
      Number.isFinite(rawEpoch) &&
      rawEpoch > 0
    ) {
      return new Date(rawEpoch * 1000);
    }
  }
  return fallbackDate;
}

async function fetchStripeSessionById(
  sessionId: string,
  stripeSecretKey: string,
): Promise<StripeCheckoutSessionPayload | null> {
  const trimmed = sessionId.trim();
  if (!trimmed.startsWith("cs_")) {
    return null;
  }

  const url = `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(trimmed)}?expand[]=subscription`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return null;
  }

  return (await res.json()) as StripeCheckoutSessionPayload;
}

async function fetchLatestCompletedSessionForCustomer(
  stripeCustomerId: string,
  stripeSecretKey: string,
): Promise<StripeCheckoutSessionPayload | null> {
  const url = `https://api.stripe.com/v1/checkout/sessions?customer=${encodeURIComponent(stripeCustomerId)}&limit=5&expand[]=data.subscription`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return null;
  }

  const payload = (await res.json()) as {
    data?: StripeCheckoutSessionPayload[];
  };
  const sessions = Array.isArray(payload.data) ? payload.data : [];

  return (
    sessions.find(
      (s) =>
        s.status === "complete" &&
        (s.payment_status === "paid" ||
          s.payment_status === "no_payment_required"),
    ) ?? null
  );
}

export interface StripeReconcileResult {
  reconciled: boolean;
  alreadyActive?: boolean;
  plan?: "free" | "premium";
  sessionId?: string;
  reason?: string;
}

export async function reconcileVendorStripeCheckout({
  vendorId,
  sessionId,
}: {
  vendorId: string;
  sessionId?: string;
}): Promise<StripeReconcileResult> {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!stripeSecretKey) {
    return { reconciled: false, reason: "stripe-key-not-configured" };
  }

  try {
    const db = await connectDB();
    const vendorFilter = buildVendorFilter(vendorId);
    const vendorDoc = await db
      .collection<UserVendorDoc>("users")
      .findOne(vendorFilter);

    if (!vendorDoc) {
      return { reconciled: false, reason: "vendor-not-found" };
    }

    const vendorIdStr = String(vendorDoc._id ?? vendorDoc.id ?? vendorId);

    let stripeSession: StripeCheckoutSessionPayload | null = null;
    if (sessionId?.trim()) {
      stripeSession = await fetchStripeSessionById(sessionId, stripeSecretKey);
    }

    if (!stripeSession && vendorDoc.stripeCustomerId) {
      stripeSession = await fetchLatestCompletedSessionForCustomer(
        vendorDoc.stripeCustomerId,
        stripeSecretKey,
      );
    }

    if (!stripeSession || !stripeSession.id) {
      return {
        reconciled: false,
        alreadyActive: vendorDoc.subscriptionPlan === "premium",
        plan: vendorDoc.subscriptionPlan === "premium" ? "premium" : "free",
        reason: "no-matching-stripe-session",
      };
    }

    const sessionVendorId =
      stripeSession.metadata?.vendorId?.trim() ||
      stripeSession.client_reference_id?.trim() ||
      null;
    const sessionCustomerId = extractCustomerId(stripeSession.customer);

    const belongsToVendor =
      (sessionVendorId &&
        (sessionVendorId === vendorIdStr || sessionVendorId === vendorId)) ||
      (sessionCustomerId &&
        vendorDoc.stripeCustomerId &&
        sessionCustomerId === vendorDoc.stripeCustomerId);

    if (!belongsToVendor) {
      return { reconciled: false, reason: "session-owner-mismatch" };
    }

    const isPaid =
      stripeSession.status === "complete" &&
      (stripeSession.payment_status === "paid" ||
        stripeSession.payment_status === "no_payment_required");

    if (!isPaid) {
      return {
        reconciled: false,
        sessionId: stripeSession.id,
        reason: "session-not-paid",
      };
    }

    const now = new Date();
    const defaultExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const periodEnd = extractPeriodEndDate(
      stripeSession.subscription,
      defaultExpiry,
    );
    const subId = extractSubscriptionId(stripeSession.subscription);
    const eventCreatedAt =
      typeof stripeSession.created === "number" &&
      Number.isFinite(stripeSession.created)
        ? stripeSession.created
        : Math.floor(now.getTime() / 1000);

    await db.collection<UserVendorDoc>("users").updateOne(vendorFilter, {
      $set: {
        subscriptionPlan: "premium",
        subscriptionStatus: "active",
        cancelAtPeriodEnd: false,
        subscriptionExpiresAt: periodEnd,
        ...(sessionCustomerId ? { stripeCustomerId: sessionCustomerId } : {}),
        ...(subId ? { stripeSubscriptionId: subId } : {}),
        subscriptionLastEventAt: eventCreatedAt,
        updatedAt: now,
      },
    });

    // Idempotently insert transaction if webhook hasn't recorded this session yet
    const existingTx = await db.collection("transactions").findOne({
      $or: [
        { stripeSessionId: stripeSession.id },
        { stripeEventId: `reconcile:${stripeSession.id}` },
      ],
    });

    const storedVendorId = ObjectId.isValid(vendorIdStr)
      ? new ObjectId(vendorIdStr)
      : vendorIdStr;

    if (!existingTx) {
      await db.collection("transactions").insertOne({
        vendorId: storedVendorId,
        plan: "premium",
        amount:
          typeof stripeSession.amount_total === "number"
            ? stripeSession.amount_total
            : 2900,
        currency:
          typeof stripeSession.currency === "string"
            ? stripeSession.currency.toLowerCase()
            : "usd",
        stripeSessionId: stripeSession.id,
        stripeSubscriptionId: subId,
        stripeEventId: `reconcile:${stripeSession.id}`,
        eventType: "checkout.session.completed",
        status: "paid",
        createdAt: now,
      });
    }

    // Idempotently create vendor notification if not created yet
    const eventKey = `sub:activated:${stripeSession.id}`;
    const existingNotif = await db
      .collection("notifications")
      .findOne({ eventKey });

    if (!existingNotif) {
      await db.collection("notifications").insertOne({
        userId: storedVendorId,
        role: "vendor",
        type: "subscription_status",
        title: "Premium Subscription Activated",
        message:
          "Your PizzaHub Premium subscription is now active with unlimited menu listings.",
        relatedResourceId: subId || stripeSession.id,
        link: "/dashboard/vendor/subscription",
        metadata: { subscriptionPlan: "premium", status: "active" },
        eventKey,
        isRead: false,
        readAt: null,
        createdAt: now,
      });
    }

    return {
      reconciled: true,
      plan: "premium",
      sessionId: stripeSession.id,
    };
  } catch (error) {
    console.error("[StripeReconcile] Error verifying checkout session:", error);
    return {
      reconciled: false,
      reason: error instanceof Error ? error.message : "reconcile-error",
    };
  }
}
