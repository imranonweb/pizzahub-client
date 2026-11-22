const DEFAULT_API_URL = "http://localhost:5000";
const DEFAULT_TIMEOUT_MS = 4500;

export function getApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  return (configured || DEFAULT_API_URL).replace(/\/+$/, "");
}

export class ApiClientError extends Error {
  readonly status: number;
  readonly isNetworkError: boolean;
  readonly isRouteNotFound: boolean;

  constructor(
    message: string,
    options: {
      status?: number;
      isNetworkError?: boolean;
      isRouteNotFound?: boolean;
      cause?: unknown;
    } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "ApiClientError";
    this.status = options.status ?? 0;
    this.isNetworkError = Boolean(options.isNetworkError);
    this.isRouteNotFound = Boolean(options.isRouteNotFound);
  }
}

export interface ApiRequestOptions extends RequestInit {
  timeoutMs?: number;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, headers, signal, ...rest } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const combinedSignal = signal
    ? AbortSignal.any([signal, controller.signal])
    : controller.signal;

  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  try {
    const response = await fetch(url, {
      ...rest,
      headers: {
        Accept: "application/json",
        ...headers,
      },
      signal: combinedSignal,
    });

    const contentType = response.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const payload = isJson
      ? ((await response.json().catch(() => null)) as Record<
          string,
          unknown
        > | null)
      : null;

    if (!response.ok) {
      const serverMessage =
        typeof payload?.message === "string"
          ? payload.message
          : `Request failed with status ${response.status}`;

      const isRouteNotFound =
        response.status === 404 && serverMessage === "Route not found";

      throw new ApiClientError(serverMessage, {
        status: response.status,
        isRouteNotFound,
      });
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }

    const message =
      error instanceof Error && error.name === "AbortError"
        ? "Request timed out while contacting PizzaHub API."
        : "Unable to reach the PizzaHub API server.";

    throw new ApiClientError(message, {
      status: 0,
      isNetworkError: true,
      cause: error,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}
