import type {
  AdminActivityEntry,
  AdminModerationMenuItem,
  AdminPlatformStats,
  AdminUserRecord,
} from "./admin-rules";
import { ApiClientError, apiRequest } from "./api-client";
import type { PizzaHubRole, SubscriptionPlan } from "./auth";
import { getAuthToken } from "./auth-client";
import { isValidPizzaHubRole } from "./auth-routes";
import type { MenuItemStatus } from "./menu-api";

export interface AdminOverviewResponse {
  source: "live" | "unavailable";
  stats: AdminPlatformStats | null;
  recentActivity: AdminActivityEntry[];
  notice?: string;
}

export interface AdminMenuCounts {
  all: number;
  pending: number;
  approved: number;
  rejected: number;
  inactive: number;
}

export interface AdminMenuListResponse {
  source: "live" | "unavailable";
  items: AdminModerationMenuItem[];
  counts: AdminMenuCounts | null;
  notice?: string;
}

export interface AdminUsersCounts {
  total: number;
  active: number;
  blocked: number;
  customers: number;
  vendors: number;
  admins: number;
}

export interface AdminUsersListResponse {
  source: "live" | "unavailable";
  users: AdminUserRecord[];
  counts: AdminUsersCounts | null;
  notice?: string;
}

export type AdminMutationFailureReason =
  | "backend-unavailable"
  | "unauthorized"
  | "error";

export type AdminMutationResult<T = unknown> =
  | {
      ok: true;
      data?: T;
      message: string;
    }
  | {
      ok: false;
      reason: AdminMutationFailureReason;
      message: string;
    };

const VALID_MENU_STATUSES = new Set<MenuItemStatus>([
  "pending",
  "approved",
  "rejected",
  "inactive",
]);

const ADMIN_OVERVIEW_UNAVAILABLE_NOTICE =
  "The Express admin overview API (/api/admin/overview) is not implemented yet. Real user counts, menu approval backlogs, and platform activity will appear here once deployed.";

const ADMIN_MENU_UNAVAILABLE_NOTICE =
  "The Express admin moderation API (/api/admin/menu) is not implemented yet. Menu submissions awaiting review and approve/reject actions require those backend endpoints.";

const ADMIN_USERS_UNAVAILABLE_NOTICE =
  "The Express admin user management API (/api/admin/users) is not implemented yet. Platform account records and block controls require those backend endpoints.";

function toNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function normalizeStats(raw: Record<string, unknown>): AdminPlatformStats {
  return {
    totalUsers: toNumber(raw.totalUsers),
    totalCustomers: toNumber(raw.totalCustomers),
    totalVendors: toNumber(raw.totalVendors),
    activeVendors: toNumber(raw.activeVendors),
    totalMenuItems: toNumber(raw.totalMenuItems),
    pendingMenuApprovals: toNumber(raw.pendingMenuApprovals),
    approvedMenuItems: toNumber(raw.approvedMenuItems),
    rejectedMenuItems: toNumber(raw.rejectedMenuItems),
  };
}

function normalizeActivityEntry(
  raw: Record<string, unknown>,
  index: number,
): AdminActivityEntry {
  const rawType = typeof raw.type === "string" ? raw.type : "";
  const type =
    rawType === "menu" || rawType === "user" || rawType === "platform"
      ? rawType
      : "platform";

  return {
    id:
      typeof raw.id === "string"
        ? raw.id
        : typeof raw._id === "string"
          ? raw._id
          : `activity-${index}`,
    type,
    summary:
      typeof raw.summary === "string" && raw.summary.trim()
        ? raw.summary
        : "Platform update",
    actorName: typeof raw.actorName === "string" ? raw.actorName : undefined,
    targetLabel:
      typeof raw.targetLabel === "string" ? raw.targetLabel : undefined,
    createdAt:
      typeof raw.createdAt === "string"
        ? raw.createdAt
        : new Date(0).toISOString(),
  };
}

function normalizeAdminMenuItem(
  raw: Record<string, unknown>,
): AdminModerationMenuItem {
  const id =
    typeof raw.id === "string"
      ? raw.id
      : typeof raw._id === "string"
        ? raw._id
        : String(raw._id ?? "");

  const rawVendor =
    typeof raw.vendor === "object" && raw.vendor !== null
      ? (raw.vendor as Record<string, unknown>)
      : typeof raw.vendorInfo === "object" && raw.vendorInfo !== null
        ? (raw.vendorInfo as Record<string, unknown>)
        : {};

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
  const status: MenuItemStatus = VALID_MENU_STATUSES.has(
    rawStatus as MenuItemStatus,
  )
    ? (rawStatus as MenuItemStatus)
    : "pending";

  const subscriptionPlan: SubscriptionPlan =
    rawVendor.subscriptionPlan === "premium" ? "premium" : "free";

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
    rejectionReason:
      typeof raw.rejectionReason === "string" && raw.rejectionReason.trim()
        ? raw.rejectionReason.trim()
        : null,
    vendor: {
      id:
        typeof rawVendor.id === "string"
          ? rawVendor.id
          : typeof raw.vendorId === "string"
            ? raw.vendorId
            : "",
      name:
        typeof rawVendor.name === "string" && rawVendor.name
          ? rawVendor.name
          : "Vendor",
      email: typeof rawVendor.email === "string" ? rawVendor.email : "",
      businessName:
        typeof rawVendor.businessName === "string" && rawVendor.businessName
          ? rawVendor.businessName
          : typeof rawVendor.name === "string" && rawVendor.name
            ? rawVendor.name
            : "Local Pizzeria",
      subscriptionPlan,
    },
  };
}

function normalizeAdminUser(raw: Record<string, unknown>): AdminUserRecord {
  const id =
    typeof raw.id === "string"
      ? raw.id
      : typeof raw._id === "string"
        ? raw._id
        : String(raw._id ?? "");

  const role: PizzaHubRole = isValidPizzaHubRole(raw.role)
    ? raw.role
    : "customer";

  const subscriptionPlan: SubscriptionPlan =
    raw.subscriptionPlan === "premium" ? "premium" : "free";

  return {
    id,
    name: typeof raw.name === "string" ? raw.name : "Unnamed User",
    email: typeof raw.email === "string" ? raw.email : "",
    image: typeof raw.image === "string" ? raw.image : null,
    role,
    isBlocked: raw.isBlocked === true,
    businessName: typeof raw.businessName === "string" ? raw.businessName : "",
    subscriptionPlan,
    subscriptionExpiresAt:
      typeof raw.subscriptionExpiresAt === "string"
        ? raw.subscriptionExpiresAt
        : null,
    createdAt:
      typeof raw.createdAt === "string"
        ? raw.createdAt
        : new Date(0).toISOString(),
  };
}

function computeMenuCounts(
  items: readonly AdminModerationMenuItem[],
): AdminMenuCounts {
  const counts: AdminMenuCounts = {
    all: items.length,
    pending: 0,
    approved: 0,
    rejected: 0,
    inactive: 0,
  };
  for (const item of items) {
    counts[item.status] += 1;
  }
  return counts;
}

function computeUsersCounts(
  users: readonly AdminUserRecord[],
): AdminUsersCounts {
  const counts: AdminUsersCounts = {
    total: users.length,
    active: 0,
    blocked: 0,
    customers: 0,
    vendors: 0,
    admins: 0,
  };
  for (const user of users) {
    if (user.isBlocked) counts.blocked += 1;
    else counts.active += 1;

    if (user.role === "customer") counts.customers += 1;
    else if (user.role === "vendor") counts.vendors += 1;
    else if (user.role === "admin") counts.admins += 1;
  }
  return counts;
}

function classifyAdminError(
  error: unknown,
  unavailableMessage: string,
): {
  reason: AdminMutationFailureReason;
  message: string;
} {
  if (error instanceof ApiClientError) {
    if (error.isRouteNotFound || error.isNetworkError) {
      return {
        reason: "backend-unavailable",
        message: unavailableMessage,
      };
    }

    if (error.status === 401 || error.status === 403) {
      return {
        reason: "unauthorized",
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

export async function fetchAdminOverview(): Promise<AdminOverviewResponse> {
  const authHeaders = await getBearerHeaders();
  if (!authHeaders) {
    return {
      source: "unavailable",
      stats: null,
      recentActivity: [],
      notice:
        "Unable to issue an API token for your current session. Sign out and sign in again if this persists.",
    };
  }

  try {
    const payload = await apiRequest<{
      stats?: Record<string, unknown>;
      recentActivity?: Record<string, unknown>[];
      data?: {
        stats?: Record<string, unknown>;
        recentActivity?: Record<string, unknown>[];
      };
    }>("/api/admin/overview", { headers: authHeaders });

    const rawStats = payload.stats ?? payload.data?.stats;
    const rawActivity =
      payload.recentActivity ?? payload.data?.recentActivity ?? [];

    return {
      source: "live",
      stats: rawStats ? normalizeStats(rawStats) : null,
      recentActivity: Array.isArray(rawActivity)
        ? rawActivity.map(normalizeActivityEntry)
        : [],
    };
  } catch (error) {
    if (
      error instanceof ApiClientError &&
      (error.isRouteNotFound || error.isNetworkError)
    ) {
      return {
        source: "unavailable",
        stats: null,
        recentActivity: [],
        notice: ADMIN_OVERVIEW_UNAVAILABLE_NOTICE,
      };
    }

    throw error;
  }
}

export async function fetchAdminMenuItems(): Promise<AdminMenuListResponse> {
  const authHeaders = await getBearerHeaders();
  if (!authHeaders) {
    return {
      source: "unavailable",
      items: [],
      counts: null,
      notice:
        "Unable to issue an API token for your current session. Sign out and sign in again if this persists.",
    };
  }

  try {
    const payload = await apiRequest<{
      items?: Record<string, unknown>[];
      data?: Record<string, unknown>[];
    }>("/api/admin/menu", { headers: authHeaders });

    const rawItems = Array.isArray(payload.items)
      ? payload.items
      : Array.isArray(payload.data)
        ? payload.data
        : [];

    const items = rawItems.map(normalizeAdminMenuItem);
    return {
      source: "live",
      items,
      counts: computeMenuCounts(items),
    };
  } catch (error) {
    if (
      error instanceof ApiClientError &&
      (error.isRouteNotFound || error.isNetworkError)
    ) {
      return {
        source: "unavailable",
        items: [],
        counts: null,
        notice: ADMIN_MENU_UNAVAILABLE_NOTICE,
      };
    }

    throw error;
  }
}

export async function moderateAdminMenuItem(
  id: string,
  decision: "approved" | "rejected",
  rejectionReason?: string,
): Promise<AdminMutationResult<AdminModerationMenuItem>> {
  const authHeaders = await getBearerHeaders();
  if (!authHeaders) {
    return {
      ok: false,
      reason: "unauthorized",
      message: "Your session expired. Sign in again to moderate listings.",
    };
  }

  const bodyPayload: {
    status: "approved" | "rejected";
    rejectionReason?: string;
  } = {
    status: decision,
  };

  if (decision === "rejected" && rejectionReason?.trim()) {
    bodyPayload.rejectionReason = rejectionReason.trim();
  }

  try {
    const response = await apiRequest<{
      item?: Record<string, unknown>;
      data?: Record<string, unknown>;
      message?: string;
    }>(`/api/admin/menu/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyPayload),
    });

    const rawItem = response.item ?? response.data;
    return {
      ok: true,
      data: rawItem ? normalizeAdminMenuItem(rawItem) : undefined,
      message:
        response.message ||
        (decision === "approved"
          ? "Menu item approved and published."
          : "Menu item rejected."),
    };
  } catch (error) {
    return {
      ok: false,
      ...classifyAdminError(
        error,
        "The Express menu moderation endpoint is not available yet. No status change was saved.",
      ),
    };
  }
}

export async function fetchAdminUsers(): Promise<AdminUsersListResponse> {
  const authHeaders = await getBearerHeaders();
  if (!authHeaders) {
    return {
      source: "unavailable",
      users: [],
      counts: null,
      notice:
        "Unable to issue an API token for your current session. Sign out and sign in again if this persists.",
    };
  }

  try {
    const payload = await apiRequest<{
      users?: Record<string, unknown>[];
      data?: Record<string, unknown>[];
    }>("/api/admin/users", { headers: authHeaders });

    const rawUsers = Array.isArray(payload.users)
      ? payload.users
      : Array.isArray(payload.data)
        ? payload.data
        : [];

    const users = rawUsers.map(normalizeAdminUser);
    return {
      source: "live",
      users,
      counts: computeUsersCounts(users),
    };
  } catch (error) {
    if (
      error instanceof ApiClientError &&
      (error.isRouteNotFound || error.isNetworkError)
    ) {
      return {
        source: "unavailable",
        users: [],
        counts: null,
        notice: ADMIN_USERS_UNAVAILABLE_NOTICE,
      };
    }

    throw error;
  }
}

export async function updateAdminUserBlockStatus(
  userId: string,
  isBlocked: boolean,
): Promise<AdminMutationResult<AdminUserRecord>> {
  const authHeaders = await getBearerHeaders();
  if (!authHeaders) {
    return {
      ok: false,
      reason: "unauthorized",
      message: "Your session expired. Sign in again to update account access.",
    };
  }

  try {
    const response = await apiRequest<{
      user?: Record<string, unknown>;
      data?: Record<string, unknown>;
      message?: string;
    }>(`/api/admin/users/${encodeURIComponent(userId)}/block`, {
      method: "PATCH",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isBlocked }),
    });

    const rawUser = response.user ?? response.data;
    return {
      ok: true,
      data: rawUser ? normalizeAdminUser(rawUser) : undefined,
      message:
        response.message ||
        (isBlocked ? "User account blocked." : "User account unblocked."),
    };
  } catch (error) {
    return {
      ok: false,
      ...classifyAdminError(
        error,
        "The Express user management endpoint is not available yet. Account access was not changed.",
      ),
    };
  }
}
