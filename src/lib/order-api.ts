import { ApiClientError, apiRequest } from "./api-client";
import { clearAuthTokenCache } from "./auth-client";
import {
  getBearerHeaders,
  resolveApiUnavailableNotice,
  TOKEN_UNAVAILABLE_NOTICE,
} from "./authenticated-api";
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
      orders?: T[];
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
  "Unable to reach the PizzaHub ordering API (/api/orders). Please check your connection or retry.";

const ORDER_OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

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
    deliveryDate:
      typeof raw.deliveryDate === "string" && raw.deliveryDate.trim()
        ? raw.deliveryDate.trim()
        : null,
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

    if (error.status === 400 || error.status === 409 || error.status === 422) {
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
        detail: await fetchPublicMenuItemById(item.menuItemId, {
          forceRefresh: true,
        }),
      })),
    );

    if (results.some((entry) => entry.detail.source !== "live")) {
      return {
        ok: false,
        reason: "backend-unavailable",
        message:
          "Live item availability and pricing cannot be verified because the menu server could not be reached.",
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
  deliveryDate?: string;
  deliveryAddress: string;
  contactPhone: string;
  orderNotes?: string;
}): Promise<OrderMutationResult<CustomerOrder>> {
  const payloadBody = JSON.stringify({
    items: input.items,
    deliveryAddress: input.deliveryAddress,
    contactPhone: input.contactPhone,
    ...(input.deliveryDate?.trim()
      ? { deliveryDate: input.deliveryDate.trim() }
      : {}),
    ...(input.orderNotes?.trim()
      ? { orderNotes: input.orderNotes.trim() }
      : {}),
  });

  const submitWithHeaders = async (forceRefresh: boolean) => {
    const authHeaders = await getBearerHeaders({ forceRefresh });
    if (!authHeaders) {
      return {
        ok: false as const,
        reason: "unauthorized" as const,
        message: "Your session expired. Sign in again to place your order.",
      };
    }

    const response = await apiRequest<{
      order?: Record<string, unknown>;
      orders?: Record<string, unknown>[];
      data?: Record<string, unknown>;
      message?: string;
    }>("/api/orders", {
      method: "POST",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: payloadBody,
    });

    const rawOrders = Array.isArray(response.orders)
      ? response.orders
      : response.order
        ? [response.order]
        : response.data
          ? [response.data]
          : [];

    const normalizedOrders = rawOrders.map(normalizeCustomerOrder);
    return {
      ok: true as const,
      order: normalizedOrders[0],
      orders: normalizedOrders,
      message: response.message || "Order placed successfully.",
    };
  };

  try {
    return await submitWithHeaders(false);
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) {
      clearAuthTokenCache();
      try {
        return await submitWithHeaders(true);
      } catch (retryError) {
        return {
          ok: false,
          ...classifyOrderError(retryError),
        };
      }
    }

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
      notice: TOKEN_UNAVAILABLE_NOTICE,
    };
  }

  try {
    const payload = await apiRequest<{
      orders?: Record<string, unknown>[];
      data?: Record<string, unknown>[];
    }>("/api/orders/my?limit=100", { headers: authHeaders });

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
    return {
      source: "unavailable",
      orders: [],
      notice: resolveApiUnavailableNotice(error, ORDERS_API_UNAVAILABLE_NOTICE),
    };
  }
}

export async function fetchCustomerOrderById(
  rawId: string,
): Promise<CustomerOrderDetailResult> {
  const id = rawId.trim();
  if (!id || !ORDER_OBJECT_ID_REGEX.test(id)) {
    return { state: "not-found" };
  }

  const authHeaders = await getBearerHeaders();
  if (!authHeaders) {
    return {
      state: "unavailable",
      notice: TOKEN_UNAVAILABLE_NOTICE,
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
    if (
      error instanceof ApiClientError &&
      error.status === 404 &&
      !error.isRouteNotFound
    ) {
      return { state: "not-found" };
    }

    return {
      state: "unavailable",
      notice: resolveApiUnavailableNotice(error, ORDERS_API_UNAVAILABLE_NOTICE),
    };
  }
}

export async function cancelCustomerOrder(
  id: string,
): Promise<OrderMutationResult<CustomerOrder>> {
  const trimmedId = id.trim();
  if (!ORDER_OBJECT_ID_REGEX.test(trimmedId)) {
    return {
      ok: false,
      reason: "validation",
      message: "Invalid order ID format.",
    };
  }

  const cancelWithHeaders = async (forceRefresh: boolean) => {
    const authHeaders = await getBearerHeaders({ forceRefresh });
    if (!authHeaders) {
      return {
        ok: false as const,
        reason: "unauthorized" as const,
        message: "Your session expired. Sign in again to cancel an order.",
      };
    }

    const response = await apiRequest<{
      order?: Record<string, unknown>;
      data?: Record<string, unknown>;
      message?: string;
    }>(`/api/orders/${encodeURIComponent(trimmedId)}/cancel`, {
      method: "PATCH",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const rawOrder = response.order ?? response.data;
    return {
      ok: true as const,
      order: rawOrder ? normalizeCustomerOrder(rawOrder) : undefined,
      message: response.message || "Order cancelled successfully.",
    };
  };

  try {
    return await cancelWithHeaders(false);
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) {
      clearAuthTokenCache();
      try {
        return await cancelWithHeaders(true);
      } catch (retryError) {
        return {
          ok: false,
          ...classifyOrderError(retryError),
        };
      }
    }

    return {
      ok: false,
      ...classifyOrderError(error),
    };
  }
}
