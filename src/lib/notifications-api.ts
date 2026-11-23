import { apiRequest } from "./api-client";
import {
  getBearerHeaders,
  resolveApiUnavailableNotice,
} from "./authenticated-api";

export type NotificationRole = "customer" | "vendor" | "admin";

export type NotificationType =
  // Customer categories
  | "order_placed"
  | "order_status"
  | "order_delivered"
  | "order_cancelled"
  // Vendor categories
  | "new_order"
  | "vendor_order_cancelled"
  | "menu_approved"
  | "menu_rejected"
  | "subscription_status"
  // Admin categories
  | "menu_moderation"
  | "platform_event";

export interface AppNotification {
  id: string;
  userId: string;
  role: NotificationRole;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
  metadata?: {
    orderId?: string;
    orderNumber?: string;
    orderStatus?: string;
    menuItemId?: string;
    itemName?: string;
    rejectionReason?: string;
    subscriptionPlan?: string;
    [key: string]: unknown;
  };
}

export interface NotificationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface NotificationListResponse {
  source: "live" | "unavailable";
  items: AppNotification[];
  unreadCount: number;
  totalCount: number;
  pagination: NotificationPagination;
  notice?: string;
}

export interface NotificationFilterOptions {
  unreadOnly?: boolean;
  type?: NotificationType | "all";
  page?: number;
  limit?: number;
}

const OBJECT_ID_HEX_REGEX = /^[a-f\d]{24}$/i;

export function formatRelativeTime(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime()) || parsed.getTime() === 0) {
    return "Recently";
  }
  const diffMs = Date.now() - parsed.getTime();
  if (diffMs < 0) {
    return "Just now";
  }
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) {
    return "Just now";
  }
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `${diffMin}m ago`;
  }
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

export function getNotificationCategory(
  type: NotificationType,
): "orders" | "moderation" | "subscriptions" | "general" {
  switch (type) {
    case "order_placed":
    case "order_status":
    case "order_delivered":
    case "order_cancelled":
    case "new_order":
    case "vendor_order_cancelled":
      return "orders";
    case "menu_approved":
    case "menu_rejected":
    case "menu_moderation":
      return "moderation";
    case "subscription_status":
      return "subscriptions";
    default:
      return "general";
  }
}

export async function fetchNotifications(
  options: NotificationFilterOptions = {},
): Promise<NotificationListResponse> {
  const authHeaders = await getBearerHeaders();
  const limit = Math.min(100, Math.max(1, options.limit ?? 20));
  const requestedPage = Math.max(1, options.page ?? 1);

  if (!authHeaders) {
    return {
      source: "unavailable",
      items: [],
      unreadCount: 0,
      totalCount: 0,
      pagination: {
        page: requestedPage,
        limit,
        total: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
      notice: "Sign in to load your notifications.",
    };
  }

  const searchParams = new URLSearchParams();
  if (options.unreadOnly) {
    searchParams.set("unread", "true");
  }
  if (options.type && options.type !== "all") {
    searchParams.set("type", options.type);
  }
  if (requestedPage > 1) {
    searchParams.set("page", String(requestedPage));
  }
  searchParams.set("limit", String(limit));

  const queryString = searchParams.toString();
  const path = `/api/notifications${queryString ? `?${queryString}` : ""}`;

  try {
    const data = await apiRequest<{
      success?: boolean;
      notifications?: AppNotification[];
      unreadCount?: number;
      totalCount?: number;
      pagination?: Partial<NotificationPagination>;
    }>(path, {
      method: "GET",
      headers: authHeaders,
    });

    const items = Array.isArray(data.notifications) ? data.notifications : [];
    const total =
      typeof data.pagination?.total === "number"
        ? data.pagination.total
        : items.length;
    const totalPages = Math.max(
      1,
      typeof data.pagination?.totalPages === "number"
        ? data.pagination.totalPages
        : Math.ceil(total / limit),
    );
    const page = Math.min(
      Math.max(1, data.pagination?.page ?? requestedPage),
      totalPages,
    );

    return {
      source: "live",
      items,
      unreadCount: typeof data.unreadCount === "number" ? data.unreadCount : 0,
      totalCount: typeof data.totalCount === "number" ? data.totalCount : total,
      pagination: {
        page,
        limit: data.pagination?.limit ?? limit,
        total,
        totalPages,
        hasNextPage:
          typeof data.pagination?.hasNextPage === "boolean"
            ? data.pagination.hasNextPage
            : page < totalPages,
        hasPrevPage:
          typeof data.pagination?.hasPrevPage === "boolean"
            ? data.pagination.hasPrevPage
            : page > 1,
      },
    };
  } catch (error) {
    return {
      source: "unavailable",
      items: [],
      unreadCount: 0,
      totalCount: 0,
      pagination: {
        page: requestedPage,
        limit,
        total: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
      notice: resolveApiUnavailableNotice(
        error,
        "Unable to load notifications at this time.",
      ),
    };
  }
}

export async function markNotificationAsRead(id: string): Promise<{
  ok: boolean;
  notification?: AppNotification;
  message: string;
}> {
  const trimmedId = id.trim();
  if (!OBJECT_ID_HEX_REGEX.test(trimmedId)) {
    return {
      ok: false,
      message: "Invalid notification identifier.",
    };
  }

  const authHeaders = await getBearerHeaders();
  if (!authHeaders) {
    return {
      ok: false,
      message: "Authentication required to update notifications.",
    };
  }

  try {
    const res = await apiRequest<{
      success?: boolean;
      notification?: AppNotification;
      message?: string;
    }>(`/api/notifications/${encodeURIComponent(trimmedId)}/read`, {
      method: "PATCH",
      headers: authHeaders,
    });
    return {
      ok: true,
      notification: res.notification,
      message: res.message || "Notification marked as read.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to mark notification as read.",
    };
  }
}

export async function markAllNotificationsAsRead(): Promise<{
  ok: boolean;
  count: number;
  message: string;
}> {
  const authHeaders = await getBearerHeaders();
  if (!authHeaders) {
    return {
      ok: false,
      count: 0,
      message: "Authentication required to update notifications.",
    };
  }

  try {
    const res = await apiRequest<{
      success?: boolean;
      count?: number;
      message?: string;
    }>("/api/notifications/mark-all-read", {
      method: "POST",
      headers: authHeaders,
    });
    return {
      ok: true,
      count: typeof res.count === "number" ? res.count : 0,
      message: res.message || "All notifications marked as read.",
    };
  } catch (error) {
    return {
      ok: false,
      count: 0,
      message:
        error instanceof Error
          ? error.message
          : "Unable to mark all notifications as read.",
    };
  }
}
