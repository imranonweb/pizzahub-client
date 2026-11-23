import { type NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { reconcileVendorStripeCheckout } from "@/lib/stripe-reconcile";

export async function POST(request: NextRequest) {
  let sessionResult: Awaited<
    ReturnType<ReturnType<typeof getAuth>["api"]["getSession"]>
  > = null;
  try {
    sessionResult = await getAuth().api.getSession({
      headers: request.headers,
    });
  } catch {
    sessionResult = null;
  }

  if (!sessionResult?.session || !sessionResult?.user) {
    return NextResponse.json(
      { success: false, message: "Authentication required." },
      { status: 401 },
    );
  }

  const userRecord = sessionResult.user as typeof sessionResult.user & {
    role?: unknown;
    isBlocked?: unknown;
  };

  if (userRecord.isBlocked === true) {
    return NextResponse.json(
      { success: false, message: "Your account has been blocked." },
      { status: 403 },
    );
  }

  if (userRecord.role !== "vendor") {
    return NextResponse.json(
      {
        success: false,
        message: "Only vendor accounts can verify subscription sessions.",
      },
      { status: 403 },
    );
  }

  let sessionId: string | undefined;
  try {
    const body = (await request.json()) as { sessionId?: unknown };
    if (typeof body?.sessionId === "string" && body.sessionId.trim()) {
      sessionId = body.sessionId.trim();
    }
  } catch {
    // Allow empty JSON body when reconciling by customer ID
  }

  const result = await reconcileVendorStripeCheckout({
    vendorId: String(userRecord.id),
    sessionId,
  });

  return NextResponse.json({
    success: true,
    ...result,
  });
}
