import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import {
  buildSignInRedirectUrl,
  getDashboardPathForRole,
  getRequiredRoleForPath,
  isValidPizzaHubRole,
} from "@/lib/auth-routes";

export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const returnPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  if (!sessionCookie) {
    return NextResponse.redirect(
      new URL(buildSignInRedirectUrl(returnPath), request.url),
    );
  }

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
    return NextResponse.redirect(
      new URL(
        buildSignInRedirectUrl(returnPath, "session-expired"),
        request.url,
      ),
    );
  }

  const userRecord = sessionResult.user as typeof sessionResult.user & {
    role?: unknown;
    isBlocked?: unknown;
  };

  if (userRecord.isBlocked === true) {
    return NextResponse.redirect(
      new URL(buildSignInRedirectUrl(undefined, "blocked"), request.url),
    );
  }

  const userRole = isValidPizzaHubRole(userRecord.role)
    ? userRecord.role
    : "customer";
  const pathname = request.nextUrl.pathname;

  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    return NextResponse.redirect(
      new URL(getDashboardPathForRole(userRole), request.url),
    );
  }

  const requiredRole = getRequiredRoleForPath(pathname);
  if (requiredRole && userRole !== requiredRole) {
    return NextResponse.redirect(
      new URL(getDashboardPathForRole(userRole), request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/checkout",
    "/checkout/:path*",
    "/profile",
    "/profile/:path*",
    "/payment/:path*",
  ],
};
