import type { PizzaHubRole } from "./auth";
import type { MenuItemStatus } from "./menu-api";

export const CART_STORAGE_KEY = "pizzahub_cart_v1";
export const MAX_CART_ITEM_QUANTITY = 20;

export interface CartItem {
  menuItemId: string;
  vendorId: string;
  vendorName: string;
  itemName: string;
  category: string;
  image: string;
  unitPrice: number;
  quantity: number;
  location: string;
}

export interface CartSummary {
  itemCount: number;
  distinctItems: number;
  subtotal: number;
  vendorNames: string[];
}

export interface AddToCartEligibility {
  allowed: boolean;
  reason?: string;
}

export function canAddItemToCart(params: {
  itemStatus: MenuItemStatus;
  itemVendorId: string;
  actorRole: PizzaHubRole | null;
  actorId: string | null;
}): AddToCartEligibility {
  const { itemStatus, itemVendorId, actorRole, actorId } = params;

  if (itemStatus !== "approved") {
    return {
      allowed: false,
      reason: "Only approved and active menu items can be added to your cart.",
    };
  }

  if (actorRole === "vendor") {
    return {
      allowed: false,
      reason: "Vendor accounts cannot place customer pizza orders.",
    };
  }

  if (actorRole === "admin") {
    return {
      allowed: false,
      reason: "Admin accounts cannot place customer pizza orders.",
    };
  }

  if (actorId && itemVendorId && actorId === itemVendorId) {
    return {
      allowed: false,
      reason: "You cannot order items from your own vendor kitchen.",
    };
  }

  return { allowed: true };
}

function clampQuantity(qty: number): number {
  if (!Number.isFinite(qty)) return 1;
  return Math.min(MAX_CART_ITEM_QUANTITY, Math.max(1, Math.trunc(qty)));
}

export function addItemToCartList(
  items: readonly CartItem[],
  nextItem: Omit<CartItem, "quantity">,
  quantity = 1,
): CartItem[] {
  const safeUnitPrice =
    Number.isFinite(nextItem.unitPrice) && nextItem.unitPrice >= 0
      ? Math.round(nextItem.unitPrice * 100) / 100
      : 0;
  const safeQuantity = clampQuantity(quantity);

  const existingIndex = items.findIndex(
    (item) => item.menuItemId === nextItem.menuItemId,
  );

  if (existingIndex === -1) {
    return [
      ...items,
      {
        ...nextItem,
        unitPrice: safeUnitPrice,
        quantity: safeQuantity,
      },
    ];
  }

  return items.map((item, idx) =>
    idx === existingIndex
      ? {
          ...item,
          ...nextItem,
          unitPrice: safeUnitPrice,
          quantity: clampQuantity(item.quantity + safeQuantity),
        }
      : item,
  );
}

export function updateCartItemQuantity(
  items: readonly CartItem[],
  menuItemId: string,
  quantity: number,
): CartItem[] {
  if (!Number.isFinite(quantity) || Math.trunc(quantity) <= 0) {
    return items.filter((item) => item.menuItemId !== menuItemId);
  }

  const clamped = clampQuantity(quantity);
  return items.map((item) =>
    item.menuItemId === menuItemId ? { ...item, quantity: clamped } : item,
  );
}

export function removeCartItem(
  items: readonly CartItem[],
  menuItemId: string,
): CartItem[] {
  return items.filter((item) => item.menuItemId !== menuItemId);
}

export function computeCartSummary(items: readonly CartItem[]): CartSummary {
  let itemCount = 0;
  let rawSubtotal = 0;
  const vendorSet = new Set<string>();

  for (const item of items) {
    const qty = Math.max(0, Math.trunc(item.quantity));
    const price = Number.isFinite(item.unitPrice) ? item.unitPrice : 0;
    itemCount += qty;
    rawSubtotal += qty * price;
    if (item.vendorName.trim()) {
      vendorSet.add(item.vendorName.trim());
    }
  }

  return {
    itemCount,
    distinctItems: items.length,
    subtotal: Math.round(rawSubtotal * 100) / 100,
    vendorNames: Array.from(vendorSet),
  };
}

export function sanitizeStoredCartItems(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const seenIds = new Set<string>();
  const sanitized: CartItem[] = [];

  for (const entry of raw) {
    if (typeof entry !== "object" || entry === null) continue;
    const record = entry as Record<string, unknown>;

    const menuItemId =
      typeof record.menuItemId === "string" ? record.menuItemId.trim() : "";
    const itemName =
      typeof record.itemName === "string" ? record.itemName.trim() : "";
    const unitPrice =
      typeof record.unitPrice === "number" ? record.unitPrice : Number.NaN;
    const quantity =
      typeof record.quantity === "number" ? record.quantity : Number.NaN;

    if (
      !menuItemId ||
      !itemName ||
      !Number.isFinite(unitPrice) ||
      unitPrice < 0 ||
      !Number.isFinite(quantity) ||
      quantity < 1 ||
      seenIds.has(menuItemId)
    ) {
      continue;
    }

    seenIds.add(menuItemId);
    sanitized.push({
      menuItemId,
      vendorId:
        typeof record.vendorId === "string" ? record.vendorId.trim() : "",
      vendorName:
        typeof record.vendorName === "string" && record.vendorName.trim()
          ? record.vendorName.trim()
          : "Local Pizzeria",
      itemName,
      category:
        typeof record.category === "string" && record.category.trim()
          ? record.category.trim()
          : "Classic Pizzas",
      image:
        typeof record.image === "string" && record.image.trim()
          ? record.image.trim()
          : "/images/auth-pizza-hero.jpg",
      unitPrice: Math.round(unitPrice * 100) / 100,
      quantity: clampQuantity(quantity),
      location:
        typeof record.location === "string" ? record.location.trim() : "",
    });
  }

  return sanitized;
}
