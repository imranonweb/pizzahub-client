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

export type AdminTransactionStatusFilter =
  | "all"
  | "paid"
  | "failed"
  | "pending"
  | "active"
  | "cancelling"
  | "cancelled";

export type AdminTransactionPlanFilter = "all" | "free" | "premium";

export type AdminTransactionSortOption =
  | "newest"
  | "oldest"
  | "amount-asc"
  | "amount-desc";

export interface AdminTransactionRecord {
  id: string;
  vendorId: string;
  vendor: {
    id: string;
    name: string;
    email: string;
    businessName: string;
    subscriptionPlan: SubscriptionPlan;
  };
  plan: string;
  amount: number;
  amountFormatted: number;
  currency: string;
  stripeSessionId: string | null;
  stripeSubscriptionId: string | null;
  stripeInvoiceId: string | null;
  eventType: string | null;
  status: string;
  createdAt: string | null;
}

export interface AdminTransactionCounts {
  total: number;
  paid: number;
  failed: number;
  pending: number;
  cancelled: number;
  totalRevenueCents: number;
}

export interface AdminTransactionsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface AdminTransactionsListResponse {
  source: "live" | "unavailable";
  transactions: AdminTransactionRecord[];
  counts: AdminTransactionCounts | null;
  pagination: AdminTransactionsPagination;
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
  "Unable to load live platform overview metrics from the PizzaHub admin API. Please check your connection or retry.";

const ADMIN_MENU_UNAVAILABLE_NOTICE =
  "Unable to reach the PizzaHub admin moderation API (/api/admin/menu). Please check your connection or retry.";

const ADMIN_USERS_UNAVAILABLE_NOTICE =
  "Unable to reach the PizzaHub admin user management API (/api/admin/users). Please check your connection or retry.";

function toNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(n) && n >= 0 ? n : 0;
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
    const [usersPayload, activeVendorsPayload, menuPayload, txPayload] =
      await Promise.all([
        apiRequest<{
          users?: Record<string, unknown>[];
          counts?: Record<string, unknown>;
        }>("/api/admin/users?limit=5", { headers: authHeaders }),
        apiRequest<{
          pagination?: { total?: unknown };
          users?: Record<string, unknown>[];
        }>("/api/admin/users?role=vendor&status=active&limit=1", {
          headers: authHeaders,
        }),
        apiRequest<{
          items?: Record<string, unknown>[];
          counts?: Record<string, unknown>;
        }>("/api/admin/menu?limit=5", { headers: authHeaders }),
        apiRequest<{
          counts?: Record<string, unknown>;
        }>("/api/admin/transactions?limit=1", { headers: authHeaders }).catch(
          () => ({ counts: undefined }),
        ),
      ]);

    const userCounts = usersPayload.counts ?? {};
    const menuCounts = menuPayload.counts ?? {};
    const txCounts = txPayload.counts ?? {};
    const activeVendorsCount =
      activeVendorsPayload.pagination?.total !== undefined
        ? toNumber(activeVendorsPayload.pagination.total)
        : Array.isArray(activeVendorsPayload.users)
          ? activeVendorsPayload.users.length
          : 0;

    const stats: AdminPlatformStats = {
      totalUsers: toNumber(userCounts.total),
      totalCustomers: toNumber(userCounts.customers),
      totalVendors: toNumber(userCounts.vendors),
      activeVendors: activeVendorsCount,
      totalMenuItems: toNumber(menuCounts.total ?? menuCounts.all),
      pendingMenuApprovals: toNumber(menuCounts.pending),
      approvedMenuItems: toNumber(menuCounts.approved),
      rejectedMenuItems: toNumber(menuCounts.rejected),
      inactiveMenuItems: toNumber(menuCounts.inactive),
      totalTransactions: toNumber(txCounts.total),
      totalRevenueCents: toNumber(txCounts.totalRevenueCents),
    };

    const recentMenuItems = Array.isArray(menuPayload.items)
      ? menuPayload.items.map(normalizeAdminMenuItem)
      : [];
    const recentUsers = Array.isArray(usersPayload.users)
      ? usersPayload.users.map(normalizeAdminUser)
      : [];

    const derivedActivity: AdminActivityEntry[] = [
      ...recentMenuItems.map((item) => ({
        id: `menu-${item.id}`,
        type: "menu" as const,
        summary: `${item.vendor.businessName} submitted "${item.itemName}" (${item.status})`,
        actorName: item.vendor.businessName,
        targetLabel: item.itemName,
        createdAt: item.createdAt,
      })),
      ...recentUsers.map((user) => ({
        id: `user-${user.id}`,
        type: "user" as const,
        summary: `New ${user.role} account registered: ${user.name}`,
        actorName: user.name,
        targetLabel: user.email,
        createdAt: user.createdAt,
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 6);

    return {
      source: "live",
      stats,
      recentActivity: derivedActivity,
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
      counts?: Record<string, unknown>;
    }>("/api/admin/menu?limit=100", { headers: authHeaders });

    const rawItems = Array.isArray(payload.items)
      ? payload.items
      : Array.isArray(payload.data)
        ? payload.data
        : [];

    const items = rawItems.map(normalizeAdminMenuItem);
    const computed = computeMenuCounts(items);
    const counts: AdminMenuCounts = payload.counts
      ? {
          all: toNumber(payload.counts.total ?? payload.counts.all),
          pending: toNumber(payload.counts.pending),
          approved: toNumber(payload.counts.approved),
          rejected: toNumber(payload.counts.rejected),
          inactive: toNumber(payload.counts.inactive),
        }
      : computed;

    return {
      source: "live",
      items,
      counts,
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
  decision: "approved" | "rejected" | "inactive",
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
    status: "approved" | "rejected" | "inactive";
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
          : decision === "rejected"
            ? "Menu item rejected."
            : "Menu item deactivated."),
    };
  } catch (error) {
    return {
      ok: false,
      ...classifyAdminError(
        error,
        "Unable to reach the admin menu moderation API. No status change was saved.",
      ),
    };
  }
}

export async function deleteAdminMenuItem(
  id: string,
): Promise<AdminMutationResult<null>> {
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
      `/api/admin/menu/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: authHeaders,
      },
    );

    return {
      ok: true,
      data: null,
      message: response.message || "Menu item deleted permanently.",
    };
  } catch (error) {
    return {
      ok: false,
      ...classifyAdminError(
        error,
        "Unable to reach the admin menu API. Item was not deleted.",
      ),
    };
  }
}

function normalizeAdminTransaction(
  raw: Record<string, unknown>,
): AdminTransactionRecord {
  const rawVendor =
    typeof raw.vendor === "object" && raw.vendor !== null
      ? (raw.vendor as Record<string, unknown>)
      : {};
  const amount = toNumber(raw.amount);

  return {
    id:
      typeof raw.id === "string"
        ? raw.id
        : typeof raw._id === "string"
          ? raw._id
          : String(raw._id ?? ""),
    vendorId: String(raw.vendorId ?? ""),
    vendor: {
      id: String(rawVendor.id ?? raw.vendorId ?? ""),
      name:
        typeof rawVendor.name === "string" && rawVendor.name.trim()
          ? rawVendor.name.trim()
          : "Vendor",
      email: typeof rawVendor.email === "string" ? rawVendor.email : "",
      businessName:
        typeof rawVendor.businessName === "string" &&
        rawVendor.businessName.trim()
          ? rawVendor.businessName.trim()
          : typeof rawVendor.name === "string" && rawVendor.name.trim()
            ? rawVendor.name.trim()
            : "Local Pizzeria",
      subscriptionPlan:
        rawVendor.subscriptionPlan === "premium" ? "premium" : "free",
    },
    plan: typeof raw.plan === "string" ? raw.plan : "premium",
    amount,
    amountFormatted:
      typeof raw.amountFormatted === "number"
        ? raw.amountFormatted
        : Math.round((amount / 100) * 100) / 100,
    currency: typeof raw.currency === "string" ? raw.currency : "usd",
    stripeSessionId:
      typeof raw.stripeSessionId === "string" ? raw.stripeSessionId : null,
    stripeSubscriptionId:
      typeof raw.stripeSubscriptionId === "string"
        ? raw.stripeSubscriptionId
        : null,
    stripeInvoiceId:
      typeof raw.stripeInvoiceId === "string" ? raw.stripeInvoiceId : null,
    eventType: typeof raw.eventType === "string" ? raw.eventType : null,
    status: typeof raw.status === "string" ? raw.status : "unknown",
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : null,
  };
}

export async function fetchAdminTransactions(
  params: {
    search?: string;
    status?: AdminTransactionStatusFilter;
    plan?: AdminTransactionPlanFilter;
    sort?: AdminTransactionSortOption;
    page?: number;
    limit?: number;
  } = {},
): Promise<AdminTransactionsListResponse> {
  const limit = Math.min(100, Math.max(1, params.limit ?? 15));
  const requestedPage = Math.max(1, params.page ?? 1);
  const emptyPagination: AdminTransactionsPagination = {
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
      transactions: [],
      counts: null,
      pagination: emptyPagination,
      notice:
        "Unable to issue an API token for your current session. Sign out and sign in again if this persists.",
    };
  }

  const searchTerm = params.search?.trim().toLowerCase() ?? "";
  const query = new URLSearchParams();
  if (params.status && params.status !== "all") {
    query.set("status", params.status);
  }
  if (params.plan && params.plan !== "all") query.set("plan", params.plan);
  if (params.sort && params.sort !== "newest") query.set("sort", params.sort);
  if (searchTerm) {
    query.set("limit", "100");
  } else {
    if (requestedPage > 1) query.set("page", String(requestedPage));
    query.set("limit", String(limit));
  }

  const qs = query.toString();
  const path = qs ? `/api/admin/transactions?${qs}` : "/api/admin/transactions";

  try {
    const payload = await apiRequest<{
      transactions?: Record<string, unknown>[];
      counts?: Record<string, unknown>;
      pagination?: Partial<AdminTransactionsPagination>;
    }>(path, { headers: authHeaders });

    const allTransactions = Array.isArray(payload.transactions)
      ? payload.transactions.map(normalizeAdminTransaction)
      : [];

    const counts: AdminTransactionCounts | null = payload.counts
      ? {
          total: toNumber(payload.counts.total),
          paid: toNumber(payload.counts.paid),
          failed: toNumber(payload.counts.failed),
          pending: toNumber(payload.counts.pending),
          cancelled: toNumber(payload.counts.cancelled),
          totalRevenueCents: toNumber(payload.counts.totalRevenueCents),
        }
      : null;

    if (searchTerm) {
      const tokens = searchTerm
        .split(/\s+/)
        .map((t) => t.replace(/^[#$]+/, ""))
        .filter(Boolean);
      const matched = allTransactions.filter((tx) => {
        const haystack = [
          tx.id,
          tx.stripeSessionId ?? "",
          tx.stripeSubscriptionId ?? "",
          tx.stripeInvoiceId ?? "",
          tx.vendor.businessName,
          tx.vendor.name,
          tx.vendor.email,
          tx.plan,
          tx.status,
          tx.amountFormatted.toFixed(2),
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
        transactions: matched.slice(start, start + limit),
        counts,
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

    const transactions = allTransactions;
    const total =
      typeof payload.pagination?.total === "number"
        ? payload.pagination.total
        : transactions.length;
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
      transactions,
      counts,
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
    const message =
      error instanceof ApiClientError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Unable to load platform transactions.";

    return {
      source: "unavailable",
      transactions: [],
      counts: null,
      pagination: emptyPagination,
      notice: message,
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
      counts?: Record<string, unknown>;
    }>("/api/admin/users?limit=100", { headers: authHeaders });

    const rawUsers = Array.isArray(payload.users)
      ? payload.users
      : Array.isArray(payload.data)
        ? payload.data
        : [];

    const users = rawUsers.map(normalizeAdminUser);
    const computed = computeUsersCounts(users);
    const counts: AdminUsersCounts = payload.counts
      ? {
          total: toNumber(payload.counts.total),
          active: toNumber(payload.counts.active),
          blocked: toNumber(payload.counts.blocked),
          customers: toNumber(payload.counts.customers),
          vendors: toNumber(payload.counts.vendors),
          admins: toNumber(payload.counts.admins),
        }
      : computed;

    return {
      source: "live",
      users,
      counts,
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
        "Unable to reach the admin user management API. Account access was not changed.",
      ),
    };
  }
}
