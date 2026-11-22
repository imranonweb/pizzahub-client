import { ApiClientError, apiRequest } from "./api-client";
import { getAuthToken } from "./auth-client";
import type { CartItem } from "./cart-rules";
import { fetchPublicMenuItemById } from "./menu-api";
import {
  type CustomerOrder,
  type CustomerOrderItem,
  normalizeOrderStatus,
  type OrderTimelineEvent,
} from "./order-rules";

export type OrderMutationFailureReason =
  | "backend-unavailable"
  | "unauthorized"
  | "validation"
  | "error";

export type OrderMutationResult<T = CustomerOrder> =
  | {
      ok: true;
      order?: T;
      message: string;
    }
  | {
      ok: false;
      reason: OrderMutationFailureReason;
      message: string;
    };

export interface CustomerOrdersListResponse {
  source: "live" | "unavailable";
  orders: CustomerOrder[];
  notice?: string;
}

export type CustomerOrderDetailResult =
  | { state: "found"; order: CustomerOrder }
  | { state: "not-found" }
  | { state: "unavailable"; notice: string };

export interface CartServerValidationResult {
  ok: boolean;
  reason?:
    | "backend-unavailable"
    | "item-unavailable"
    | "own-vendor"
    | "price-changed"
    | "empty";
  message?: string;
  unavailableIds?: string[];
  priceUpdates?: { menuItemId: string; itemName: string; newPrice: number }[];
}

const ORDERS_API_UNAVAILABLE_NOTICE =
  "The Express customer ordering API (/api/orders) is not implemented yet. Live order submission, tracking history, and cancellation require those server endpoints.";

function toPositiveNumber(val: unknown): number {
  const n = typeof val === "number" ? val : Number(val ?? 0);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function normalizeOrderItem(
  raw: Record<string, unknown>,
  index: number,
): CustomerOrderItem {
  const quantity = Math.max(1, Math.trunc(toPositiveNumber(raw.quantity) || 1));
  const unitPrice = toPositiveNumber(raw.unitPrice ?? raw.price);
  const lineTotal =
    raw.lineTotal !== undefined
      ? toPositiveNumber(raw.lineTotal)
      : Math.round(unitPrice * quantity * 100) / 100;

  return {
    menuItemId:
      typeof raw.menuItemId === "string"
        ? raw.menuItemId
        : typeof raw.id === "string"
          ? raw.id
          : `item-${index}`,
    itemName:
      typeof raw.itemName === "string"
        ? raw.itemName
        : typeof raw.name === "string"
          ? raw.name
          : "Menu Item",
    image:
      typeof raw.image === "string" && raw.image.trim()
        ? raw.image.trim()
        : "/images/auth-pizza-hero.jpg",
    quantity,
    unitPrice,
    lineTotal,
  };
}

function normalizeTimeline(rawHistory: unknown): OrderTimelineEvent[] {
  if (!Array.isArray(rawHistory)) return [];
  return rawHistory
    .filter(
      (entry): entry is Record<string, unknown> =>
        typeof entry === "object" && entry !== null,
    )
    .map((entry) => ({
      status: normalizeOrderStatus(entry.status),
      timestamp:
        typeof entry.timestamp === "string" && entry.timestamp.trim()
          ? entry.timestamp.trim()
          : typeof entry.createdAt === "string" && entry.createdAt.trim()
            ? entry.createdAt.trim()
            : null,
      note:
        typeof entry.note === "string" && entry.note.trim()
          ? entry.note.trim()
          : typeof entry.description === "string" && entry.description.trim()
            ? entry.description.trim()
            : null,
    }));
}

function normalizeCustomerOrder(raw: Record<string, unknown>): CustomerOrder {
  const rawVendor =
    typeof raw.vendor === "object" && raw.vendor !== null
      ? (raw.vendor as Record<string, unknown>)
      : {};

  const rawItems = Array.isArray(raw.items) ? raw.items : [];
  const items = rawItems
    .filter(
      (entry): entry is Record<string, unknown> =>
        typeof entry === "object" && entry !== null,
    )
    .map(normalizeOrderItem);

  const subtotal = toPositiveNumber(
    raw.subtotal ?? items.reduce((sum, item) => sum + item.lineTotal, 0),
  );
  const total = toPositiveNumber(raw.total ?? raw.totalAmount ?? subtotal);

  return {
    id:
      typeof raw.id === "string"
        ? raw.id
        : typeof raw._id === "string"
          ? raw._id
          : String(raw._id ?? ""),
    customerId:
      typeof raw.customerId === "string"
        ? raw.customerId
        : String(raw.customerId ?? ""),
    vendorId:
      typeof raw.vendorId === "string"
        ? raw.vendorId
        : String(raw.vendorId ?? ""),
    vendorName:
      typeof raw.vendorName === "string" && raw.vendorName
        ? raw.vendorName
        : typeof rawVendor.businessName === "string" && rawVendor.businessName
          ? rawVendor.businessName
          : typeof rawVendor.name === "string" && rawVendor.name
            ? rawVendor.name
            : "Local Kitchen",
    vendorLocation:
      typeof raw.vendorLocation === "string"
        ? raw.vendorLocation
        : typeof rawVendor.location === "string"
          ? rawVendor.location
          : "",
    items,
    subtotal,
    total,
    status: normalizeOrderStatus(raw.status),
    deliveryAddress:
      typeof raw.deliveryAddress === "string" ? raw.deliveryAddress : "",
    contactPhone: typeof raw.contactPhone === "string" ? raw.contactPhone : "",
    orderNotes: typeof raw.orderNotes === "string" ? raw.orderNotes : "",
    createdAt:
      typeof raw.createdAt === "string"
        ? raw.createdAt
        : new Date(0).toISOString(),
    updatedAt:
      typeof raw.updatedAt === "string"
        ? raw.updatedAt
        : typeof raw.createdAt === "string"
          ? raw.createdAt
          : new Date(0).toISOString(),
    statusHistory: normalizeTimeline(raw.statusHistory ?? raw.timeline),
  };
}

function classifyOrderError(error: unknown): {
  reason: OrderMutationFailureReason;
  message: string;
} {
  if (error instanceof ApiClientError) {
    if (error.isRouteNotFound || error.isNetworkError) {
      return {
        reason: "backend-unavailable",
        message: ORDERS_API_UNAVAILABLE_NOTICE,
      };
    }

    if (error.status === 401 || error.status === 403) {
      return {
        reason: "unauthorized",
        message: error.message,
      };
    }

    if (error.status === 400 || error.status === 422) {
      return {
        reason: "validation",
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
  if (!token) return null;
  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function validateCartItemsAgainstServer(
  items: readonly CartItem[],
  customerId: string,
): Promise<CartServerValidationResult> {
  if (items.length === 0) {
    return {
      ok: false,
      reason: "empty",
      message: "Add at least one menu item before placing an order.",
    };
  }

  try {
    const results = await Promise.all(
      items.map(async (item) => ({
        cartItem: item,
        detail: await fetchPublicMenuItemById(item.menuItemId),
      })),
    );

    if (results.some((entry) => entry.detail.source !== "live")) {
      return {
        ok: false,
        reason: "backend-unavailable",
        message:
          "Live item availability and pricing cannot be verified because the Express /api/menu endpoint is not implemented yet.",
      };
    }

    const unavailableIds: string[] = [];
    const priceUpdates: {
      menuItemId: string;
      itemName: string;
      newPrice: number;
    }[] = [];

    for (const entry of results) {
      if (entry.detail.state !== "found") {
        unavailableIds.push(entry.cartItem.menuItemId);
        continue;
      }

      const liveItem = entry.detail.item;
      if (customerId && liveItem.vendorId === customerId) {
        return {
          ok: false,
          reason: "own-vendor",
          message:
            "Customers cannot order items from their own vendor kitchen.",
        };
      }

      if (Math.abs(liveItem.price - entry.cartItem.unitPrice) > 0.005) {
        priceUpdates.push({
          menuItemId: liveItem.id,
          itemName: liveItem.itemName,
          newPrice: liveItem.price,
        });
      }
    }

    if (unavailableIds.length > 0) {
      return {
        ok: false,
        reason: "item-unavailable",
        unavailableIds,
        message:
          "One or more items in your cart are no longer active or approved. Remove them to proceed.",
      };
    }

    if (priceUpdates.length > 0) {
      return {
        ok: false,
        reason: "price-changed",
        priceUpdates,
        message:
          "Authoritative menu prices updated on the server. Review your updated cart summary before placing the order.",
      };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: "backend-unavailable",
      message:
        error instanceof Error
          ? error.message
          : "Unable to verify cart items against the menu server.",
    };
  }
}

export async function createCustomerOrder(input: {
  items: { menuItemId: string; quantity: number }[];
  deliveryAddress: string;
  contactPhone: string;
  orderNotes?: string;
}): Promise<OrderMutationResult<CustomerOrder>> {
  const authHeaders = await getBearerHeaders();
  if (!authHeaders) {
    return {
      ok: false,
      reason: "unauthorized",
      message: "Your session expired. Sign in again to place your order.",
    };
  }

  try {
    const response = await apiRequest<{
      order?: Record<string, unknown>;
      data?: Record<string, unknown>;
      message?: string;
    }>("/api/orders", {
      method: "POST",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: input.items,
        deliveryAddress: input.deliveryAddress,
        contactPhone: input.contactPhone,
        ...(input.orderNotes?.trim()
          ? { orderNotes: input.orderNotes.trim() }
          : {}),
      }),
    });

    const rawOrder = response.order ?? response.data;
    return {
      ok: true,
      order: rawOrder ? normalizeCustomerOrder(rawOrder) : undefined,
      message: response.message || "Order placed successfully.",
    };
  } catch (error) {
    return {
      ok: false,
      ...classifyOrderError(error),
    };
  }
}

export async function fetchCustomerOrders(): Promise<CustomerOrdersListResponse> {
  const authHeaders = await getBearerHeaders();
  if (!authHeaders) {
    return {
      source: "unavailable",
      orders: [],
      notice:
        "Unable to issue an API token for your current session. Sign out and sign in again if this persists.",
    };
  }

  try {
    const payload = await apiRequest<{
      orders?: Record<string, unknown>[];
      data?: Record<string, unknown>[];
    }>("/api/orders/my", { headers: authHeaders });

    const rawOrders = Array.isArray(payload.orders)
      ? payload.orders
      : Array.isArray(payload.data)
        ? payload.data
        : [];

    return {
      source: "live",
      orders: rawOrders.map(normalizeCustomerOrder),
    };
  } catch (error) {
    if (
      error instanceof ApiClientError &&
      (error.isRouteNotFound || error.isNetworkError)
    ) {
      return {
        source: "unavailable",
        orders: [],
        notice: ORDERS_API_UNAVAILABLE_NOTICE,
      };
    }

    throw error;
  }
}

export async function fetchCustomerOrderById(
  rawId: string,
): Promise<CustomerOrderDetailResult> {
  const id = rawId.trim();
  if (!id || !/^[a-zA-Z0-9_-]{2,64}$/.test(id)) {
    return { state: "not-found" };
  }

  const authHeaders = await getBearerHeaders();
  if (!authHeaders) {
    return {
      state: "unavailable",
      notice:
        "Unable to issue an API token for your current session. Sign out and sign in again if this persists.",
    };
  }

  try {
    const payload = await apiRequest<{
      order?: Record<string, unknown>;
      data?: Record<string, unknown>;
    }>(`/api/orders/${encodeURIComponent(id)}`, {
      headers: authHeaders,
    });

    const rawOrder = payload.order ?? payload.data;
    if (!rawOrder) {
      return { state: "not-found" };
    }

    return {
      state: "found",
      order: normalizeCustomerOrder(rawOrder),
    };
  } catch (error) {
    if (error instanceof ApiClientError) {
      if (error.status === 404 && !error.isRouteNotFound) {
        return { state: "not-found" };
      }

      if (error.isRouteNotFound || error.isNetworkError) {
        return {
          state: "unavailable",
          notice: ORDERS_API_UNAVAILABLE_NOTICE,
        };
      }
    }

    throw error;
  }
}

export async function cancelCustomerOrder(
  id: string,
): Promise<OrderMutationResult<CustomerOrder>> {
  const authHeaders = await getBearerHeaders();
  if (!authHeaders) {
    return {
      ok: false,
      reason: "unauthorized",
      message: "Your session expired. Sign in again to cancel an order.",
    };
  }

  try {
    const response = await apiRequest<{
      order?: Record<string, unknown>;
      data?: Record<string, unknown>;
      message?: string;
    }>(`/api/orders/${encodeURIComponent(id)}/cancel`, {
      method: "PATCH",
      headers: authHeaders,
    });

    const rawOrder = response.order ?? response.data;
    return {
      ok: true,
      order: rawOrder ? normalizeCustomerOrder(rawOrder) : undefined,
      message: response.message || "Order cancelled successfully.",
    };
  } catch (error) {
    return {
      ok: false,
      ...classifyOrderError(error),
    };
  }
}
