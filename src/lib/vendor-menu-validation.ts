import { MENU_CATEGORIES, type MenuItemStatus } from "./menu-api";

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_MENU_IMAGES = 5;
export const FREE_PLAN_ACTIVE_ITEM_LIMIT = 3;

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const ALLOWED_MENU_CATEGORIES_SET = new Set<string>(MENU_CATEGORIES);

export interface PizzaFormValues {
  itemName: string;
  category: string;
  description: string;
  price: string;
  location: string;
  images: string[];
}

export interface PizzaFormPayload {
  itemName: string;
  category: string;
  description: string;
  price: number;
  location: string;
  images: string[];
}

export type PizzaFormField = keyof PizzaFormValues;
export type PizzaFormErrors = Partial<Record<PizzaFormField, string>>;

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function validateImageFile(file: {
  type: string;
  size: number;
}): { valid: true } | { valid: false; error: string } {
  if (
    !ALLOWED_IMAGE_MIME_TYPES.includes(
      file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number],
    )
  ) {
    return {
      valid: false,
      error: "Only JPG, PNG, and WebP images are supported.",
    };
  }

  if (file.size <= 0) {
    return { valid: false, error: "Selected image file is empty." };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Image must be smaller than ${formatBytes(MAX_IMAGE_SIZE_BYTES)}.`,
    };
  }

  return { valid: true };
}

export function isValidMenuImageUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/images/")) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function validatePizzaFormValues(values: PizzaFormValues): {
  valid: boolean;
  errors: PizzaFormErrors;
  payload?: PizzaFormPayload;
} {
  const errors: PizzaFormErrors = {};

  const itemName = values.itemName.trim();
  if (!itemName) {
    errors.itemName = "Enter a pizza or menu item name.";
  } else if (itemName.length < 2) {
    errors.itemName = "Item name must be at least 2 characters.";
  } else if (itemName.length > 80) {
    errors.itemName = "Item name must be 80 characters or fewer.";
  }

  const category = values.category.trim();
  if (!category || !ALLOWED_MENU_CATEGORIES_SET.has(category)) {
    errors.category = "Choose one of the official menu categories.";
  }

  const description = values.description.trim();
  if (!description) {
    errors.description = "Write a concise description of this menu item.";
  } else if (description.length < 15) {
    errors.description = "Description must be at least 15 characters.";
  } else if (description.length > 500) {
    errors.description = "Description must be 500 characters or fewer.";
  }

  const rawPrice = values.price.trim();
  const parsedPrice = Number(rawPrice);
  if (!rawPrice) {
    errors.price = "Enter a menu price.";
  } else if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
    errors.price = "Price must be greater than $0.00.";
  } else if (parsedPrice > 500) {
    errors.price = "Price cannot exceed $500.00 per item.";
  } else if (!/^\d+(\.\d{1,2})?$/.test(rawPrice)) {
    errors.price = "Enter a valid price with at most two decimal places.";
  }

  const location = values.location.trim();
  if (!location) {
    errors.location = "Enter your kitchen neighborhood or delivery area.";
  } else if (location.length < 2) {
    errors.location = "Location must be at least 2 characters.";
  } else if (location.length > 80) {
    errors.location = "Location must be 80 characters or fewer.";
  }

  const uniqueImages = Array.from(
    new Set(values.images.map((img) => img.trim()).filter(isValidMenuImageUrl)),
  );

  if (uniqueImages.length === 0) {
    errors.images = "Upload at least one image before submitting.";
  } else if (uniqueImages.length > MAX_MENU_IMAGES) {
    errors.images = `You can attach up to ${MAX_MENU_IMAGES} images per listing.`;
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: {},
    payload: {
      itemName,
      category,
      description,
      price: Math.round(parsedPrice * 100) / 100,
      location,
      images: uniqueImages,
    },
  };
}

export interface ActivationCheckResult {
  allowed: boolean;
  remainingSlots: number | null;
  reason?: string;
}

export function canActivateMenuItem(params: {
  subscriptionPlan: "free" | "premium";
  activeCount: number;
  itemStatus: MenuItemStatus;
}): ActivationCheckResult {
  const { subscriptionPlan, activeCount, itemStatus } = params;
  const remainingSlots =
    subscriptionPlan === "free"
      ? Math.max(0, FREE_PLAN_ACTIVE_ITEM_LIMIT - activeCount)
      : null;

  if (itemStatus === "approved") {
    return {
      allowed: false,
      remainingSlots,
      reason: "This menu item is already active.",
    };
  }

  if (itemStatus === "pending") {
    return {
      allowed: false,
      remainingSlots,
      reason:
        "Pending items require admin approval before they can go live on the public menu.",
    };
  }

  if (itemStatus === "rejected") {
    return {
      allowed: false,
      remainingSlots,
      reason:
        "Rejected items cannot be self-activated. Update the listing details and wait for admin review once backend resubmission is supported.",
    };
  }

  if (
    subscriptionPlan === "free" &&
    activeCount >= FREE_PLAN_ACTIVE_ITEM_LIMIT
  ) {
    return {
      allowed: false,
      remainingSlots: 0,
      reason: `Free plan allows up to ${FREE_PLAN_ACTIVE_ITEM_LIMIT} active menu items. Deactivate an active item or upgrade to Premium.`,
    };
  }

  return {
    allowed: true,
    remainingSlots,
  };
}
