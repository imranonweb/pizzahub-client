import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/auth";

let cachedHandlers: ReturnType<typeof toNextJsHandler> | null = null;

function getHandlers() {
  if (!cachedHandlers) {
    cachedHandlers = toNextJsHandler(getAuth());
  }
  return cachedHandlers;
}

export async function GET(request: Request) {
  return getHandlers().GET(request);
}

export async function POST(request: Request) {
  return getHandlers().POST(request);
}
