import { ApiClientError, apiRequest } from "./api-client";

export type MenuItemStatus = "pending" | "approved" | "rejected" | "inactive";

export type MenuSortOption = "featured" | "price-asc" | "price-desc" | "newest";

export interface MenuVendorInfo {
  id: string;
  name: string;
  businessName: string;
  subscriptionPlan: "free" | "premium";
}

export interface PublicMenuItem {
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
  vendor: MenuVendorInfo;
}

export interface MenuQueryParams {
  search?: string;
  category?: string;
  location?: string;
  sort?: MenuSortOption;
  page?: number;
  limit?: number;
}

export interface MenuPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface MenuListResult {
  items: PublicMenuItem[];
  locations: string[];
  pagination: MenuPagination;
  source: "live";
  catalogEmpty: boolean;
}

export type MenuItemDetailResult =
  | {
      state: "found";
      item: PublicMenuItem;
      source: "live";
    }
  | {
      state: "unavailable";
      item: PublicMenuItem;
      source: "live";
    }
  | {
      state: "not-found";
      source: "live";
      isInvalidId?: boolean;
    };

export const MENU_CATEGORIES = [
  "Classic Pizzas",
  "Vegetarian Pizzas",
  "Meat Lovers",
  "Specialty / Gourmet Pizzas",
  "Sides & Appetizers",
  "Beverages & Desserts",
] as const;

export const OBJECT_ID_HEX_REGEX = /^[a-f\d]{24}$/i;

export function isValidMenuItemId(id: string): boolean {
  return typeof id === "string" && OBJECT_ID_HEX_REGEX.test(id.trim());
}

const VALID_STATUSES = new Set<MenuItemStatus>([
  "pending",
  "approved",
  "rejected",
  "inactive",
]);

function normalizeMenuItem(raw: Record<string, unknown>): PublicMenuItem {
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

  const rawImages = Array.from(
    new Set(
      Array.isArray(raw.images)
        ? raw.images.filter(
            (img): img is string => typeof img === "string" && img.length > 0,
          )
        : typeof raw.images === "string" && raw.images.length > 0
          ? [raw.images]
          : [],
    ),
  );

  const statusCandidate =
    typeof raw.status === "string" ? raw.status.toLowerCase() : "";
  const status: MenuItemStatus = VALID_STATUSES.has(
    statusCandidate as MenuItemStatus,
  )
    ? (statusCandidate as MenuItemStatus)
    : "pending";

  const subscriptionPlan =
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
    images: rawImages.length > 0 ? rawImages : ["/images/auth-pizza-hero.jpg"],
    status,
    createdAt:
      typeof raw.createdAt === "string"
        ? raw.createdAt
        : new Date(0).toISOString(),
    vendor: {
      id:
        typeof rawVendor.id === "string"
          ? rawVendor.id
          : typeof raw.vendorId === "string"
            ? raw.vendorId
            : "",
      name:
        typeof rawVendor.name === "string" ? rawVendor.name : "Local Kitchen",
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

export async function fetchPublicMenu(
  params: MenuQueryParams = {},
): Promise<MenuListResult> {
  const query = new URLSearchParams();

  if (params.search?.trim()) {
    query.set("search", params.search.trim());
  }

  if (
    params.category?.trim() &&
    params.category.trim().toLowerCase() !== "all"
  ) {
    query.set("category", params.category.trim());
  }

  if (
    params.location?.trim() &&
    params.location.trim().toLowerCase() !== "all"
  ) {
    query.set("location", params.location.trim());
  }

  if (params.sort) {
    query.set("sort", params.sort);
  }

  if (params.page && params.page > 1) {
    query.set("page", String(params.page));
  }

  if (params.limit) {
    query.set("limit", String(params.limit));
  }

  const qs = query.toString();
  const path = qs ? `/api/menu?${qs}` : "/api/menu";

  const payload = await apiRequest<{
    success?: boolean;
    items?: Record<string, unknown>[];
    locations?: unknown[];
    pagination?: {
      page?: number;
      limit?: number;
      total?: number;
      totalPages?: number;
      hasNextPage?: boolean;
      hasPrevPage?: boolean;
    };
  }>(path);

  const rawList = Array.isArray(payload.items) ? payload.items : [];
  const approvedItems = rawList.map(normalizeMenuItem);

  const locations = Array.isArray(payload.locations)
    ? payload.locations
        .filter(
          (loc): loc is string =>
            typeof loc === "string" && loc.trim().length > 0,
        )
        .map((loc) => loc.trim())
    : [];

  const limit = Math.max(1, payload.pagination?.limit ?? params.limit ?? 12);
  const total = payload.pagination?.total ?? approvedItems.length;
  const totalPages = Math.max(
    1,
    payload.pagination?.totalPages ?? Math.ceil(total / limit),
  );
  const page = Math.min(
    Math.max(1, payload.pagination?.page ?? params.page ?? 1),
    totalPages,
  );
  const hasNextPage =
    typeof payload.pagination?.hasNextPage === "boolean"
      ? payload.pagination.hasNextPage
      : page < totalPages;
  const hasPrevPage =
    typeof payload.pagination?.hasPrevPage === "boolean"
      ? payload.pagination.hasPrevPage
      : page > 1;

  const pagination: MenuPagination = {
    page,
    limit,
    total,
    totalPages,
    hasNextPage,
    hasPrevPage,
  };

  const hasFilter = Boolean(
    params.search?.trim() ||
      (params.category?.trim() &&
        params.category.trim().toLowerCase() !== "all") ||
      (params.location?.trim() &&
        params.location.trim().toLowerCase() !== "all"),
  );

  return {
    items: approvedItems,
    locations,
    pagination,
    source: "live",
    catalogEmpty: total === 0 && !hasFilter,
  };
}

export async function fetchPublicMenuItemById(
  rawId: string,
): Promise<MenuItemDetailResult> {
  const id = rawId.trim();
  if (!id || !OBJECT_ID_HEX_REGEX.test(id)) {
    return { state: "not-found", source: "live", isInvalidId: true };
  }

  try {
    const payload = await apiRequest<{
      success?: boolean;
      item?: Record<string, unknown>;
    }>(`/api/menu/${encodeURIComponent(id)}`);

    const rawItem = payload.item;
    if (!rawItem) {
      return { state: "not-found", source: "live" };
    }

    const item = normalizeMenuItem(rawItem);
    if (item.status !== "approved") {
      return { state: "unavailable", item, source: "live" };
    }

    return { state: "found", item, source: "live" };
  } catch (error) {
    if (error instanceof ApiClientError) {
      if (error.status === 404 && !error.isRouteNotFound) {
        return { state: "not-found", source: "live" };
      }
      if (error.status === 400) {
        return { state: "not-found", source: "live", isInvalidId: true };
      }
    }

    throw error;
  }
}
