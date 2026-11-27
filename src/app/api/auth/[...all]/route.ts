import { toNextJsHandler } from "better-auth/next-js";
import { NextResponse } from "next/server";
import { type Auth, getAuth, resetAuthInstance } from "@/lib/auth";
import {
  getMongoClientPromise,
  isMongoTopologyClosed,
  isRecoverableMongoError,
  resetMongoCache,
} from "@/lib/mongodb";

let cachedHandlers: ReturnType<typeof toNextJsHandler> | null = null;
let cachedHandlersAuth: Auth | null = null;

function getHandlers() {
  const activeAuth = getAuth();
  if (!cachedHandlers || cachedHandlersAuth !== activeAuth) {
    cachedHandlers = toNextJsHandler(activeAuth);
    cachedHandlersAuth = activeAuth;
  }
  return cachedHandlers;
}

function resetHandlerCache(): void {
  cachedHandlers = null;
  cachedHandlersAuth = null;
}

function isHealthCheckPath(request: Request): boolean {
  try {
    const pathname = new URL(request.url).pathname;
    return pathname.endsWith("/api/auth/ok");
  } catch {
    return false;
  }
}

async function ensureActiveMongoConnection(): Promise<void> {
  const client = await getMongoClientPromise();
  if (isMongoTopologyClosed(client)) {
    resetMongoCache();
    resetAuthInstance();
    resetHandlerCache();
    await getMongoClientPromise();
  }
}

async function handleAuthRequest(
  request: Request,
  method: "GET" | "POST",
): Promise<Response> {
  if (!isHealthCheckPath(request)) {
    try {
      await ensureActiveMongoConnection();
    } catch (dbError) {
      resetMongoCache();
      resetAuthInstance();
      resetHandlerCache();
      try {
        await ensureActiveMongoConnection();
      } catch (retryDbError) {
        const detail =
          retryDbError instanceof Error
            ? retryDbError.message
            : dbError instanceof Error
              ? dbError.message
              : "Unknown database error";
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
    }
  }

  const backupRequest = method === "POST" ? request.clone() : null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const handlers = getHandlers();
      const activeRequest =
        attempt === 0 ? request : (backupRequest ?? request);
      return method === "GET"
        ? await handlers.GET(activeRequest)
        : await handlers.POST(activeRequest);
    } catch (error) {
      if (attempt === 0 && isRecoverableMongoError(error)) {
        resetMongoCache();
        resetAuthInstance();
        resetHandlerCache();
        try {
          await ensureActiveMongoConnection();
          continue;
        } catch {
          // Fall through to structured error response below
        }
      }

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

  return NextResponse.json(
    {
      code: "INTERNAL_SERVER_ERROR",
      message: "Authentication request could not be completed.",
    },
    { status: 500 },
  );
}

export async function GET(request: Request) {
  return handleAuthRequest(request, "GET");
}

export async function POST(request: Request) {
  return handleAuthRequest(request, "POST");
}
