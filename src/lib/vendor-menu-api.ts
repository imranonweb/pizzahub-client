import { ApiClientError, apiRequest } from "./api-client";
import { getAuthToken } from "./auth-client";
import type { MenuItemStatus } from "./menu-api";
import {
  FREE_PLAN_ACTIVE_ITEM_LIMIT,
  type PizzaFormPayload,
} from "./vendor-menu-validation";

export { FREE_PLAN_ACTIVE_ITEM_LIMIT };

export interface VendorMenuItem {
  id: string;
  vendorId: string;
  itemName: string;
  category: string;
  description: string;
  price: number;
  location: string;
  images: string[];
  status: MenuItemStatus;
  createdAt: string;
}

export interface VendorMenuStats {
  total: number;
  active: number;
  pending: number;
  rejected: number;
  inactive: number;
}

export interface VendorMenuListResponse {
  source: "live" | "unavailable";
  items: VendorMenuItem[];
  stats: VendorMenuStats;
  notice?: string;
}

export type VendorMutationFailureReason =
  | "backend-unavailable"
  | "unauthorized"
  | "plan-limit"
  | "error";

export type VendorMutationResult<T = VendorMenuItem> =
  | {
      ok: true;
      item?: T;
      message: string;
    }
  | {
      ok: false;
      reason: VendorMutationFailureReason;
      message: string;
    };

export type VendorStatusFilter = "all" | MenuItemStatus;

const VALID_STATUSES = new Set<MenuItemStatus>([
  "pending",
  "approved",
  "rejected",
  "inactive",
]);

const VENDOR_API_UNAVAILABLE_NOTICE =
  "The Express vendor menu API (/api/vendor/menu) is not implemented yet. Real menu counts, listings, and changes will sync automatically once those server endpoints are deployed.";

export function createEmptyVendorMenuStats(): VendorMenuStats {
  return {
    total: 0,
    active: 0,
    pending: 0,
    rejected: 0,
    inactive: 0,
  };
}

export function computeVendorMenuStats(
  items: readonly VendorMenuItem[],
): VendorMenuStats {
  const stats = createEmptyVendorMenuStats();
  stats.total = items.length;

  for (const item of items) {
    if (item.status === "approved") stats.active += 1;
    else if (item.status === "pending") stats.pending += 1;
    else if (item.status === "rejected") stats.rejected += 1;
    else if (item.status === "inactive") stats.inactive += 1;
  }

  return stats;
}

function normalizeVendorMenuItem(raw: Record<string, unknown>): VendorMenuItem {
  const id =
    typeof raw.id === "string"
      ? raw.id
      : typeof raw._id === "string"
        ? raw._id
        : String(raw._id ?? "");

  const images = Array.from(
    new Set(
      Array.isArray(raw.images)
        ? raw.images.filter(
            (img): img is string =>
              typeof img === "string" && img.trim().length > 0,
          )
        : typeof raw.images === "string" && raw.images.trim().length > 0
          ? [raw.images.trim()]
          : [],
    ),
  );

  const rawStatus =
    typeof raw.status === "string" ? raw.status.trim().toLowerCase() : "";
  const status: MenuItemStatus = VALID_STATUSES.has(rawStatus as MenuItemStatus)
    ? (rawStatus as MenuItemStatus)
    : "pending";

  return {
    id,
    vendorId:
      typeof raw.vendorId === "string"
        ? raw.vendorId
        : String(raw.vendorId ?? ""),
    itemName: typeof raw.itemName === "string" ? raw.itemName : "Untitled Item",
    category:
      typeof raw.category === "string" ? raw.category : "Classic Pizzas",
    description: typeof raw.description === "string" ? raw.description : "",
    price: typeof raw.price === "number" ? raw.price : Number(raw.price ?? 0),
    location: typeof raw.location === "string" ? raw.location : "",
    images,
    status,
    createdAt:
      typeof raw.createdAt === "string"
        ? raw.createdAt
        : new Date(0).toISOString(),
  };
}

export interface VendorMenuFilterOptions {
  search?: string;
  category?: string;
  status?: VendorStatusFilter;
  page?: number;
  pageSize?: number;
}

export interface FilteredVendorMenuResult {
  items: VendorMenuItem[];
  totalFiltered: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function filterVendorMenuItems(
  items: readonly VendorMenuItem[],
  options: VendorMenuFilterOptions = {},
): FilteredVendorMenuResult {
  const search = options.search?.trim().toLowerCase() ?? "";
  const category = options.category?.trim() ?? "";
  const status = options.status ?? "all";
  const pageSize = Math.max(1, options.pageSize ?? 6);

  const filtered = items.filter((item) => {
    if (status !== "all" && item.status !== status) {
      return false;
    }

    if (category && category !== "all" && item.category !== category) {
      return false;
    }

    if (search) {
      const haystack =
        `${item.itemName} ${item.location} ${item.description} ${item.category}`.toLowerCase();
      if (!haystack.includes(search)) {
        return false;
      }
    }

    return true;
  });

  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const page = Math.min(Math.max(1, options.page ?? 1), totalPages);
  const startIndex = (page - 1) * pageSize;

  return {
    items: filtered.slice(startIndex, startIndex + pageSize),
    totalFiltered,
    page,
    pageSize,
    totalPages,
  };
}

function classifyApiError(error: unknown): {
  reason: VendorMutationFailureReason;
  message: string;
} {
  if (error instanceof ApiClientError) {
    if (error.isRouteNotFound || error.isNetworkError) {
      return {
        reason: "backend-unavailable",
        message: VENDOR_API_UNAVAILABLE_NOTICE,
      };
    }

    if (error.status === 401 || error.status === 403) {
      return {
        reason: "unauthorized",
        message: error.message,
      };
    }

    if (
      error.status === 402 ||
      error.status === 409 ||
      /limit|plan|upgrade|3 active/i.test(error.message)
    ) {
      return {
        reason: "plan-limit",
        message: error.message,
      };
    }

    return {
      reason: "error",
      message: error.message,
    };
  }

  return {
    reason: "error",
    message:
      error instanceof Error ? error.message : "An unexpected error occurred.",
  };
}

async function getBearerHeaders(): Promise<Record<string, string> | null> {
  const token = await getAuthToken().catch(() => null);
  if (!token) {
    return null;
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchVendorMenuItems(): Promise<VendorMenuListResponse> {
  const authHeaders = await getBearerHeaders();
  if (!authHeaders) {
    return {
      source: "unavailable",
      items: [],
      stats: createEmptyVendorMenuStats(),
      notice:
        "Unable to issue an API token for your current session. Sign out and sign in again if this persists.",
    };
  }

  try {
    const payload = await apiRequest<{
      items?: Record<string, unknown>[];
      data?: Record<string, unknown>[];
    }>("/api/vendor/menu", {
      headers: authHeaders,
    });

    const rawItems = Array.isArray(payload.items)
      ? payload.items
      : Array.isArray(payload.data)
        ? payload.data
        : [];

    const items = rawItems.map(normalizeVendorMenuItem);
    return {
      source: "live",
      items,
      stats: computeVendorMenuStats(items),
    };
  } catch (error) {
    if (
      error instanceof ApiClientError &&
      (error.isRouteNotFound || error.isNetworkError)
    ) {
      return {
        source: "unavailable",
        items: [],
        stats: createEmptyVendorMenuStats(),
        notice: VENDOR_API_UNAVAILABLE_NOTICE,
      };
    }

    throw error;
  }
}

export async function createVendorMenuItem(
  payload: PizzaFormPayload,
): Promise<VendorMutationResult<VendorMenuItem>> {
  const authHeaders = await getBearerHeaders();
  if (!authHeaders) {
    return {
      ok: false,
      reason: "unauthorized",
      message: "Your session expired. Sign in again to add menu items.",
    };
  }

  try {
    const response = await apiRequest<{
      item?: Record<string, unknown>;
      data?: Record<string, unknown>;
      message?: string;
    }>("/api/vendor/menu", {
      method: "POST",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const rawItem = response.item ?? response.data;
    return {
      ok: true,
      item: rawItem ? normalizeVendorMenuItem(rawItem) : undefined,
      message:
        response.message ||
        "Menu item created and queued as Pending for admin approval.",
    };
  } catch (error) {
    return {
      ok: false,
      ...classifyApiError(error),
    };
  }
}

export async function updateVendorMenuItem(
  id: string,
  payload: PizzaFormPayload,
): Promise<VendorMutationResult<VendorMenuItem>> {
  const authHeaders = await getBearerHeaders();
  if (!authHeaders) {
    return {
      ok: false,
      reason: "unauthorized",
      message: "Your session expired. Sign in again to edit menu items.",
    };
  }

  try {
    const response = await apiRequest<{
      item?: Record<string, unknown>;
      data?: Record<string, unknown>;
      message?: string;
    }>(`/api/vendor/menu/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const rawItem = response.item ?? response.data;
    return {
      ok: true,
      item: rawItem ? normalizeVendorMenuItem(rawItem) : undefined,
      message: response.message || "Menu item updated successfully.",
    };
  } catch (error) {
    return {
      ok: false,
      ...classifyApiError(error),
    };
  }
}

export async function updateVendorMenuItemStatus(
  id: string,
  status: "approved" | "inactive",
): Promise<VendorMutationResult<VendorMenuItem>> {
  const authHeaders = await getBearerHeaders();
  if (!authHeaders) {
    return {
      ok: false,
      reason: "unauthorized",
      message: "Your session expired. Sign in again to update status.",
    };
  }

  try {
    const response = await apiRequest<{
      item?: Record<string, unknown>;
      data?: Record<string, unknown>;
      message?: string;
    }>(`/api/vendor/menu/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    const rawItem = response.item ?? response.data;
    return {
      ok: true,
      item: rawItem ? normalizeVendorMenuItem(rawItem) : undefined,
      message:
        response.message ||
        (status === "approved"
          ? "Menu item is now active on the public menu."
          : "Menu item deactivated."),
    };
  } catch (error) {
    return {
      ok: false,
      ...classifyApiError(error),
    };
  }
}

export async function deleteVendorMenuItem(
  id: string,
): Promise<VendorMutationResult<null>> {
  const authHeaders = await getBearerHeaders();
  if (!authHeaders) {
    return {
      ok: false,
      reason: "unauthorized",
      message: "Your session expired. Sign in again to delete menu items.",
    };
  }

  try {
    const response = await apiRequest<{ message?: string }>(
      `/api/vendor/menu/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: authHeaders,
      },
    );

    return {
      ok: true,
      item: null,
      message: response.message || "Menu item deleted.",
    };
  } catch (error) {
    return {
      ok: false,
      ...classifyApiError(error),
    };
  }
}

export function uploadMenuImage(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<{ url: string }> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("image", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload/image");
    xhr.responseType = "json";

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.min(
          100,
          Math.max(1, Math.round((event.loaded / event.total) * 100)),
        );
        onProgress(percent);
      }
    });

    xhr.addEventListener("load", () => {
      const payload =
        typeof xhr.response === "object" && xhr.response !== null
          ? (xhr.response as {
              success?: boolean;
              url?: string;
              message?: string;
            })
          : null;

      if (
        xhr.status >= 200 &&
        xhr.status < 300 &&
        payload?.success &&
        payload.url
      ) {
        onProgress?.(100);
        resolve({ url: payload.url });
        return;
      }

      reject(
        new Error(
          payload?.message || `Upload failed with status ${xhr.status || 500}.`,
        ),
      );
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network error while uploading image."));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Image upload was canceled."));
    });

    xhr.send(formData);
  });
}
