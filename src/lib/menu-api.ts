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

function scoreAndFilterPublicMenuItems(
  items: readonly PublicMenuItem[],
  rawSearch: string,
): PublicMenuItem[] {
  const cleaned = rawSearch.trim().toLowerCase();
  if (!cleaned) {
    return [...items];
  }

  const tokens = cleaned
    .split(/\s+/)
    .map((t) => t.replace(/^[#$]+/, ""))
    .filter(Boolean);

  if (tokens.length === 0) {
    return [...items];
  }

  const scored: { item: PublicMenuItem; score: number }[] = [];

  for (const item of items) {
    const nameLower = item.itemName.toLowerCase();
    const categoryLower = item.category.toLowerCase();
    const locationLower = item.location.toLowerCase();
    const vendorBizLower = item.vendor.businessName.toLowerCase();
    const vendorNameLower = item.vendor.name.toLowerCase();
    const descLower = item.description.toLowerCase();
    const priceStr = item.price.toFixed(2);

    const combined = `${nameLower} ${categoryLower} ${locationLower} ${vendorBizLower} ${vendorNameLower} ${descLower} ${priceStr}`;

    const matchesAllTokens = tokens.every((token) => combined.includes(token));
    if (!matchesAllTokens) {
      continue;
    }

    let score = 0;
    if (nameLower === cleaned) score += 100;
    else if (nameLower.startsWith(cleaned)) score += 60;
    else if (nameLower.includes(cleaned)) score += 40;

    for (const token of tokens) {
      if (nameLower.includes(token)) score += 20;
      if (categoryLower.includes(token)) score += 12;
      if (vendorBizLower.includes(token) || vendorNameLower.includes(token)) {
        score += 12;
      }
      if (locationLower.includes(token)) score += 10;
      if (descLower.includes(token)) score += 6;
    }

    scored.push({ item, score });
  }

  return scored.sort((a, b) => b.score - a.score).map((entry) => entry.item);
}

export async function fetchPublicMenu(
  params: MenuQueryParams = {},
): Promise<MenuListResult> {
  const searchTerm = params.search?.trim() ?? "";
  const requestedPage = Math.max(1, params.page ?? 1);
  const requestedLimit = Math.max(1, params.limit ?? 12);

  const query = new URLSearchParams();

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

  if (searchTerm) {
    // Fetch full filtered catalog (up to 50) so client can search across
    // itemName, description, category, location, and vendor kitchen name.
    query.set("limit", "50");
  } else {
    if (requestedPage > 1) {
      query.set("page", String(requestedPage));
    }
    query.set("limit", String(requestedLimit));
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
  const allApprovedItems = rawList.map(normalizeMenuItem);

  const locations = Array.isArray(payload.locations)
    ? payload.locations
        .filter(
          (loc): loc is string =>
            typeof loc === "string" && loc.trim().length > 0,
        )
        .map((loc) => loc.trim())
    : [];

  let approvedItems = allApprovedItems;
  const limit = requestedLimit;
  let total = payload.pagination?.total ?? allApprovedItems.length;
  let totalPages = Math.max(
    1,
    payload.pagination?.totalPages ?? Math.ceil(total / limit),
  );
  let page = Math.min(
    Math.max(1, payload.pagination?.page ?? requestedPage),
    totalPages,
  );
  let hasNextPage =
    typeof payload.pagination?.hasNextPage === "boolean"
      ? payload.pagination.hasNextPage
      : page < totalPages;
  let hasPrevPage =
    typeof payload.pagination?.hasPrevPage === "boolean"
      ? payload.pagination.hasPrevPage
      : page > 1;

  if (searchTerm) {
    const matched = scoreAndFilterPublicMenuItems(allApprovedItems, searchTerm);
    total = matched.length;
    totalPages = Math.max(1, Math.ceil(total / requestedLimit));
    page = Math.min(requestedPage, totalPages);
    const start = (page - 1) * requestedLimit;
    approvedItems = matched.slice(start, start + requestedLimit);
    hasNextPage = page < totalPages;
    hasPrevPage = page > 1;
  }

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
