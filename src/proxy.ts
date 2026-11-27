import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import { getAuth, resetAuthInstance } from "@/lib/auth";
import {
  buildSignInRedirectUrl,
  getDashboardPathForRole,
  getRequiredRoleForPath,
  isValidPizzaHubRole,
} from "@/lib/auth-routes";
import {
  getMongoClientPromise,
  isMongoTopologyClosed,
  resetMongoCache,
} from "@/lib/mongodb";

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
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const client = await getMongoClientPromise();
      if (isMongoTopologyClosed(client)) {
        resetMongoCache();
        resetAuthInstance();
        await getMongoClientPromise();
      }
      sessionResult = await getAuth().api.getSession({
        headers: request.headers,
      });
      break;
    } catch {
      if (attempt === 0) {
        resetMongoCache();
        resetAuthInstance();
        continue;
      }
      sessionResult = null;
    }
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
    "/menu/:path+",
    "/checkout",
    "/checkout/:path*",
    "/profile",
    "/profile/:path*",
    "/payment/:path*",
  ],
};
