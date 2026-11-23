import { apiRequest } from "./api-client";
import {
  getBearerHeaders,
  resolveApiUnavailableNotice,
  TOKEN_UNAVAILABLE_NOTICE,
} from "./authenticated-api";
import {
  type CustomerOrderItem,
  normalizeOrderStatus,
  type OrderStatus,
  type OrderTimelineEvent,
} from "./order-rules";

export type VendorOrderStatusFilter = "all" | "active" | OrderStatus;
export type VendorOrderSortOption =
  | "newest"
  | "oldest"
  | "total-asc"
  | "total-desc";

export interface VendorOrder {
  id: string;
  customerId: string;
  customer: {
    id: string;
    name: string;
  };
  vendorId: string;
  vendorName: string;
  vendorLocation: string;
  items: CustomerOrderItem[];
  subtotal: number;
  total: number;
  status: OrderStatus;
  deliveryAddress: string;
  contactPhone: string;
  orderNotes: string;
  deliveryDate: string | null;
  statusHistory: OrderTimelineEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface VendorOrdersPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface VendorOrdersListResponse {
  source: "live" | "unavailable";
  orders: VendorOrder[];
  pagination: VendorOrdersPagination;
  notice?: string;
}

export interface VendorOrderMutationResult {
  ok: boolean;
  order?: VendorOrder;
  message: string;
}

export type VendorActionableOrderStatus =
  | "accepted"
  | "rejected"
  | "preparing"
  | "ready";

const OBJECT_ID_HEX_REGEX = /^[a-f\d]{24}$/i;

// Matches D:\PizzaHub-server\src\services\order.service.js VENDOR_ORDER_TRANSITIONS exactly.
const VENDOR_ALLOWED_NEXT_STATUSES: Record<
  OrderStatus,
  readonly VendorActionableOrderStatus[]
> = {
  pending: ["accepted", "rejected"],
  accepted: ["preparing"],
  preparing: ["ready"],
  ready: [],
  out_for_delivery: [],
  delivered: [],
  rejected: [],
  cancelled: [],
};

export function getAllowedVendorNextStatuses(
  status: OrderStatus,
): readonly VendorActionableOrderStatus[] {
  return VENDOR_ALLOWED_NEXT_STATUSES[status] ?? [];
}

function toPositiveNumber(val: unknown): number {
  const n = typeof val === "number" ? val : Number(val ?? 0);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function normalizeVendorOrder(raw: Record<string, unknown>): VendorOrder {
  const rawCustomer =
    typeof raw.customer === "object" && raw.customer !== null
      ? (raw.customer as Record<string, unknown>)
      : {};

  const rawItems = Array.isArray(raw.items) ? raw.items : [];
  const items: CustomerOrderItem[] = rawItems
    .filter(
      (entry): entry is Record<string, unknown> =>
        typeof entry === "object" && entry !== null,
    )
    .map((entry, idx) => {
      const quantity = Math.max(
        1,
        Math.trunc(toPositiveNumber(entry.quantity) || 1),
      );
      const unitPrice = toPositiveNumber(entry.unitPrice ?? entry.price);
      const lineTotal =
        entry.lineTotal !== undefined
          ? toPositiveNumber(entry.lineTotal)
          : Math.round(unitPrice * quantity * 100) / 100;

      return {
        menuItemId:
          typeof entry.menuItemId === "string"
            ? entry.menuItemId
            : `item-${idx}`,
        itemName:
          typeof entry.itemName === "string" ? entry.itemName : "Menu Item",
        image:
          typeof entry.image === "string" && entry.image.trim()
            ? entry.image.trim()
            : "/images/auth-pizza-hero.jpg",
        quantity,
        unitPrice,
        lineTotal,
      };
    });

  const rawHistory = Array.isArray(raw.statusHistory) ? raw.statusHistory : [];
  const statusHistory: OrderTimelineEvent[] = rawHistory
    .filter(
      (entry): entry is Record<string, unknown> =>
        typeof entry === "object" && entry !== null,
    )
    .map((entry) => ({
      status: normalizeOrderStatus(entry.status),
      timestamp:
        typeof entry.timestamp === "string" && entry.timestamp.trim()
          ? entry.timestamp.trim()
          : null,
      note:
        typeof entry.note === "string" && entry.note.trim()
          ? entry.note.trim()
          : null,
    }));

  const subtotal = toPositiveNumber(
    raw.subtotal ?? items.reduce((sum, item) => sum + item.lineTotal, 0),
  );
  const total = toPositiveNumber(raw.total ?? subtotal);

  return {
    id:
      typeof raw.id === "string"
        ? raw.id
        : typeof raw._id === "string"
          ? raw._id
          : String(raw._id ?? ""),
    customerId: String(raw.customerId ?? ""),
    customer: {
      id: String(rawCustomer.id ?? raw.customerId ?? ""),
      name:
        typeof rawCustomer.name === "string" && rawCustomer.name.trim()
          ? rawCustomer.name.trim()
          : "PizzaHub Customer",
    },
    vendorId: String(raw.vendorId ?? ""),
    vendorName:
      typeof raw.vendorName === "string" && raw.vendorName
        ? raw.vendorName
        : "Your Kitchen",
    vendorLocation:
      typeof raw.vendorLocation === "string" ? raw.vendorLocation : "",
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
    statusHistory,
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
  };
}

export async function fetchVendorOrders(
  params: {
    search?: string;
    status?: VendorOrderStatusFilter;
    sort?: VendorOrderSortOption;
    page?: number;
    limit?: number;
  } = {},
): Promise<VendorOrdersListResponse> {
  const limit = Math.min(100, Math.max(1, params.limit ?? 10));
  const requestedPage = Math.max(1, params.page ?? 1);
  const emptyPagination: VendorOrdersPagination = {
    page: requestedPage,
    limit,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };

  const authHeaders = await getBearerHeaders();
  if (!authHeaders) {
    return {
      source: "unavailable",
      orders: [],
      pagination: emptyPagination,
      notice: TOKEN_UNAVAILABLE_NOTICE,
    };
  }

  const searchTerm = params.search?.trim().toLowerCase() ?? "";
  const query = new URLSearchParams();
  if (params.status && params.status !== "all") {
    query.set("status", params.status);
  }
  if (params.sort && params.sort !== "newest") {
    query.set("sort", params.sort);
  }
  if (searchTerm) {
    query.set("limit", "100");
  } else {
    if (requestedPage > 1) {
      query.set("page", String(requestedPage));
    }
    query.set("limit", String(limit));
  }

  const qs = query.toString();
  const path = qs ? `/api/vendor/orders?${qs}` : "/api/vendor/orders";

  try {
    const payload = await apiRequest<{
      success?: boolean;
      orders?: Record<string, unknown>[];
      pagination?: Partial<VendorOrdersPagination>;
    }>(path, {
      method: "GET",
      headers: authHeaders,
    });

    const allOrders = Array.isArray(payload.orders)
      ? payload.orders.map(normalizeVendorOrder)
      : [];

    if (searchTerm) {
      const tokens = searchTerm
        .split(/\s+/)
        .map((t) => t.replace(/^[#$]+/, ""))
        .filter(Boolean);
      const matched = allOrders.filter((order) => {
        const itemNames = order.items.map((i) => i.itemName).join(" ");
        const haystack = [
          order.id,
          order.customer.name,
          order.contactPhone,
          order.deliveryAddress,
          order.deliveryDate ?? "",
          order.orderNotes,
          order.status,
          order.total.toFixed(2),
          "cash on delivery cod",
          itemNames,
        ]
          .join(" ")
          .toLowerCase();
        return tokens.every((token) => haystack.includes(token));
      });

      const total = matched.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const page = Math.min(requestedPage, totalPages);
      const start = (page - 1) * limit;

      return {
        source: "live",
        orders: matched.slice(start, start + limit),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    }

    const orders = allOrders;
    const total =
      typeof payload.pagination?.total === "number"
        ? payload.pagination.total
        : orders.length;
    const totalPages = Math.max(
      1,
      typeof payload.pagination?.totalPages === "number"
        ? payload.pagination.totalPages
        : Math.ceil(total / limit),
    );
    const page = Math.min(
      Math.max(1, payload.pagination?.page ?? requestedPage),
      totalPages,
    );

    return {
      source: "live",
      orders,
      pagination: {
        page,
        limit: payload.pagination?.limit ?? limit,
        total,
        totalPages,
        hasNextPage:
          typeof payload.pagination?.hasNextPage === "boolean"
            ? payload.pagination.hasNextPage
            : page < totalPages,
        hasPrevPage:
          typeof payload.pagination?.hasPrevPage === "boolean"
            ? payload.pagination.hasPrevPage
            : page > 1,
      },
    };
  } catch (error) {
    return {
      source: "unavailable",
      orders: [],
      pagination: emptyPagination,
      notice: resolveApiUnavailableNotice(
        error,
        "Unable to load incoming kitchen orders.",
      ),
    };
  }
}

export async function updateVendorOrderStatus(
  orderId: string,
  status: VendorActionableOrderStatus,
  note?: string,
): Promise<VendorOrderMutationResult> {
  const trimmedId = orderId.trim();
  if (!OBJECT_ID_HEX_REGEX.test(trimmedId)) {
    return {
      ok: false,
      message: "Invalid order ID format.",
    };
  }

  const authHeaders = await getBearerHeaders();
  if (!authHeaders) {
    return {
      ok: false,
      message: "Your session expired. Sign in again to update order status.",
    };
  }

  const body: { status: VendorActionableOrderStatus; note?: string } = {
    status,
  };
  if (note?.trim()) {
    body.note = note.trim();
  }

  try {
    const payload = await apiRequest<{
      success?: boolean;
      message?: string;
      order?: Record<string, unknown>;
    }>(`/api/vendor/orders/${encodeURIComponent(trimmedId)}/status`, {
      method: "PATCH",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    return {
      ok: true,
      order: payload.order ? normalizeVendorOrder(payload.order) : undefined,
      message: payload.message || `Order status updated to ${status}.`,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to update order status.",
    };
  }
}
