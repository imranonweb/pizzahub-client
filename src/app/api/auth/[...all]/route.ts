import { toNextJsHandler } from "better-auth/next-js";
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { getMongoClientPromise } from "@/lib/mongodb";

let cachedHandlers: ReturnType<typeof toNextJsHandler> | null = null;

function getHandlers() {
  if (!cachedHandlers) {
    cachedHandlers = toNextJsHandler(getAuth());
  }
  return cachedHandlers;
}

function isHealthCheckPath(request: Request): boolean {
  try {
    const pathname = new URL(request.url).pathname;
    return pathname.endsWith("/api/auth/ok");
  } catch {
    return false;
  }
}

async function handleAuthRequest(
  request: Request,
  method: "GET" | "POST",
): Promise<Response> {
  try {
    if (!isHealthCheckPath(request)) {
      await getMongoClientPromise();
    }
  } catch (dbError) {
    const detail =
      dbError instanceof Error ? dbError.message : "Unknown database error";
    console.error("[PizzaHub Auth] MongoDB connection failed:", detail);
    return NextResponse.json(
      {
        code: "AUTH_DATABASE_UNAVAILABLE",
        message:
          "Authentication database connection failed. Please verify DB_URI / MONGODB_URI and MongoDB Atlas network access.",
      },
      { status: 503 },
    );
  }

  try {
    const handlers = getHandlers();
    return method === "GET"
      ? await handlers.GET(request)
      : await handlers.POST(request);
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Unexpected auth error";
    console.error(`[PizzaHub Auth] ${method} handler failed:`, detail);
    return NextResponse.json(
      {
        code: "INTERNAL_SERVER_ERROR",
        message:
          "Authentication service encountered an internal error. Please try again shortly.",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return handleAuthRequest(request, "GET");
}

export async function POST(request: Request) {
  return handleAuthRequest(request, "POST");
}
