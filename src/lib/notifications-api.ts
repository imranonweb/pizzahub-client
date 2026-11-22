import { ApiClientError, apiRequest } from "./api-client";
import { getAuthToken } from "./auth-client";

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

export interface NotificationListResponse {
  source: "live" | "unavailable";
  items: AppNotification[];
  unreadCount: number;
  totalCount: number;
  notice?: string;
}

export interface NotificationFilterOptions {
  unreadOnly?: boolean;
  type?: NotificationType | "all";
  page?: number;
  limit?: number;
}

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
): "orders" | "kitchen" | "moderation" | "general" {
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
    case "subscription_status":
      return "kitchen";
    case "menu_moderation":
    case "platform_event":
      return "moderation";
    default:
      return "general";
  }
}

/**
 * Fetches notifications from the backend API if available,
 * or gracefully returns an honest unavailable response when
 * the Express server does not implement notification endpoints.
 */
export async function fetchNotifications(
  options: NotificationFilterOptions = {},
): Promise<NotificationListResponse> {
  const token = await getAuthToken();
  const searchParams = new URLSearchParams();
  if (options.unreadOnly) {
    searchParams.set("unread", "true");
  }
  if (options.type && options.type !== "all") {
    searchParams.set("type", options.type);
  }
  if (options.page) {
    searchParams.set("page", String(options.page));
  }
  if (options.limit) {
    searchParams.set("limit", String(options.limit));
  }

  const queryString = searchParams.toString();
  const path = `/api/notifications${queryString ? `?${queryString}` : ""}`;

  try {
    const data = await apiRequest<{
      notifications: AppNotification[];
      unreadCount: number;
      totalCount: number;
    }>(path, {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    return {
      source: "live",
      items: Array.isArray(data.notifications) ? data.notifications : [],
      unreadCount: typeof data.unreadCount === "number" ? data.unreadCount : 0,
      totalCount: typeof data.totalCount === "number" ? data.totalCount : 0,
    };
  } catch (error) {
    const isExpectedUnavailable =
      error instanceof ApiClientError &&
      (error.isRouteNotFound || error.isNetworkError || error.status === 404);

    return {
      source: "unavailable",
      items: [],
      unreadCount: 0,
      totalCount: 0,
      notice: isExpectedUnavailable
        ? "Notification service is pending backend implementation on the Express server (D:\\PizzaHub-server). Push events, order updates, and moderation alerts will sync here automatically once deployed."
        : error instanceof Error
          ? error.message
          : "Unable to load notifications at this time.",
    };
  }
}

/**
 * Marks an individual notification as read.
 */
export async function markNotificationAsRead(
  id: string,
): Promise<{ ok: boolean; message: string }> {
  const token = await getAuthToken();
  try {
    await apiRequest(`/api/notifications/${encodeURIComponent(id)}/read`, {
      method: "PATCH",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return { ok: true, message: "Notification marked as read." };
  } catch {
    return {
      ok: false,
      message:
        "Notification service is pending backend implementation on Express server.",
    };
  }
}

/**
 * Marks all notifications as read for the authenticated user.
 */
export async function markAllNotificationsAsRead(): Promise<{
  ok: boolean;
  count: number;
  message: string;
}> {
  const token = await getAuthToken();
  try {
    const res = await apiRequest<{ count: number }>(
      "/api/notifications/mark-all-read",
      {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );
    return {
      ok: true,
      count: res.count ?? 0,
      message: "All notifications marked as read.",
    };
  } catch {
    return {
      ok: false,
      count: 0,
      message:
        "Notification service is pending backend implementation on Express server.",
    };
  }
}
