import type { PizzaHubRole, SubscriptionPlan } from "./auth";
import type { MenuItemStatus } from "./menu-api";

export interface AdminPlatformStats {
  totalUsers: number;
  totalCustomers: number;
  totalVendors: number;
  activeVendors: number;
  totalMenuItems: number;
  pendingMenuApprovals: number;
  approvedMenuItems: number;
  rejectedMenuItems: number;
  inactiveMenuItems: number;
  totalTransactions: number;
  totalRevenueCents: number;
}

export interface AdminModerationMenuItem {
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
  rejectionReason: string | null;
  vendor: {
    id: string;
    name: string;
    email: string;
    businessName: string;
    subscriptionPlan: SubscriptionPlan;
  };
}

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: PizzaHubRole;
  isBlocked: boolean;
  businessName: string;
  subscriptionPlan: SubscriptionPlan;
  subscriptionExpiresAt: string | null;
  createdAt: string;
}

export interface AdminActivityEntry {
  id: string;
  type: "menu" | "user" | "platform";
  summary: string;
  actorName?: string;
  targetLabel?: string;
  createdAt: string;
}

export type AdminMenuStatusFilter = "all" | MenuItemStatus;
export type AdminUserRoleFilter = "all" | PizzaHubRole;
export type AdminUserStatusFilter = "all" | "active" | "blocked";

export const MAX_REJECTION_REASON_LENGTH = 300;

export interface ActionEligibilityResult {
  allowed: boolean;
  reason?: string;
}

export function canAdminModerateItem(params: {
  actorRole: PizzaHubRole;
  actorBlocked: boolean;
  actorId: string;
  itemVendorId: string;
  itemStatus: MenuItemStatus;
  action: "approve" | "reject" | "deactivate" | "delete";
}): ActionEligibilityResult {
  const { actorRole, actorBlocked, actorId, itemVendorId, itemStatus, action } =
    params;

  if (actorBlocked) {
    return {
      allowed: false,
      reason: "Blocked accounts cannot moderate platform listings.",
    };
  }

  if (actorRole !== "admin") {
    return {
      allowed: false,
      reason: "Only administrator accounts can moderate menu items.",
    };
  }

  if (action === "delete") {
    return { allowed: true };
  }

  if (actorId && itemVendorId && actorId === itemVendorId) {
    return {
      allowed: false,
      reason: "Vendors cannot moderate their own listings.",
    };
  }

  if (action === "approve" && itemStatus === "approved") {
    return {
      allowed: false,
      reason: "This menu item is already approved.",
    };
  }

  if (action === "approve" && itemStatus === "rejected") {
    return {
      allowed: false,
      reason: "Rejected items must be updated by the vendor before re-review.",
    };
  }

  if (action === "reject" && itemStatus === "rejected") {
    return {
      allowed: false,
      reason: "This menu item is already rejected.",
    };
  }

  if (action === "deactivate" && itemStatus !== "approved") {
    return {
      allowed: false,
      reason: "Only approved active items can be deactivated.",
    };
  }

  return { allowed: true };
}

export function canAdminToggleUserBlock(params: {
  actorId: string;
  actorRole: PizzaHubRole;
  actorBlocked: boolean;
  targetUserId: string;
  targetRole: PizzaHubRole;
  nextBlocked: boolean;
}): ActionEligibilityResult {
  const { actorId, actorRole, actorBlocked, targetUserId, nextBlocked } =
    params;

  if (actorBlocked) {
    return {
      allowed: false,
      reason: "Blocked accounts cannot manage user access.",
    };
  }

  if (actorRole !== "admin") {
    return {
      allowed: false,
      reason: "Only administrators can block or unblock platform accounts.",
    };
  }

  if (actorId && targetUserId && actorId === targetUserId && nextBlocked) {
    return {
      allowed: false,
      reason: "You cannot block your own administrator account.",
    };
  }

  return { allowed: true };
}

export function validateRejectionReason(raw: string): {
  valid: boolean;
  value: string;
  error?: string;
} {
  const trimmed = raw.trim();
  if (trimmed.length > MAX_REJECTION_REASON_LENGTH) {
    return {
      valid: false,
      value: trimmed,
      error: `Rejection reason must be ${MAX_REJECTION_REASON_LENGTH} characters or fewer.`,
    };
  }
  return {
    valid: true,
    value: trimmed,
  };
}

export function filterAdminMenuItems(
  items: readonly AdminModerationMenuItem[],
  options: {
    search?: string;
    category?: string;
    status?: AdminMenuStatusFilter;
    page?: number;
    pageSize?: number;
  } = {},
) {
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
      const haystack = [
        item.itemName,
        item.description,
        item.location,
        item.category,
        item.vendor.businessName,
        item.vendor.name,
        item.vendor.email,
      ]
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(search)) {
        return false;
      }
    }

    return true;
  });

  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const page = Math.min(Math.max(1, options.page ?? 1), totalPages);
  const start = (page - 1) * pageSize;

  return {
    items: filtered.slice(start, start + pageSize),
    totalFiltered,
    page,
    pageSize,
    totalPages,
  };
}

export function filterAdminUsers(
  users: readonly AdminUserRecord[],
  options: {
    search?: string;
    role?: AdminUserRoleFilter;
    accountStatus?: AdminUserStatusFilter;
    page?: number;
    pageSize?: number;
  } = {},
) {
  const search = options.search?.trim().toLowerCase() ?? "";
  const role = options.role ?? "all";
  const accountStatus = options.accountStatus ?? "all";
  const pageSize = Math.max(1, options.pageSize ?? 8);

  const filtered = users.filter((user) => {
    if (role !== "all" && user.role !== role) {
      return false;
    }

    if (accountStatus === "active" && user.isBlocked) {
      return false;
    }

    if (accountStatus === "blocked" && !user.isBlocked) {
      return false;
    }

    if (search) {
      const haystack = [user.name, user.email, user.businessName]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) {
        return false;
      }
    }

    return true;
  });

  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const page = Math.min(Math.max(1, options.page ?? 1), totalPages);
  const start = (page - 1) * pageSize;

  return {
    users: filtered.slice(start, start + pageSize),
    totalFiltered,
    page,
    pageSize,
    totalPages,
  };
}
