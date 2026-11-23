export const ORDER_STATUSES = [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
  "rejected",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_LIFECYCLE_STEPS: readonly OrderStatus[] = [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
];

export type CustomerOrderStatusFilter = "all" | "active" | OrderStatus;

export interface OrderTimelineEvent {
  status: OrderStatus;
  timestamp: string | null;
  note?: string | null;
}

export interface CustomerOrderItem {
  menuItemId: string;
  itemName: string;
  image: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface CustomerOrder {
  id: string;
  customerId: string;
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
  createdAt: string;
  updatedAt: string;
  statusHistory: OrderTimelineEvent[];
}

export interface CheckoutFormValues {
  deliveryDate: string;
  deliveryAddress: string;
  contactPhone: string;
  orderNotes: string;
}

export type CheckoutFormField = keyof CheckoutFormValues;
export type CheckoutFormErrors = Partial<Record<CheckoutFormField, string>>;

const ACTIVE_STATUS_SET = new Set<OrderStatus>([
  "pending",
  "accepted",
  "preparing",
  "ready",
  "out_for_delivery",
]);

export function normalizeOrderStatus(raw: unknown): OrderStatus {
  if (typeof raw !== "string") return "pending";
  const normalized = raw
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (normalized === "canceled") return "cancelled";
  if ((ORDER_STATUSES as readonly string[]).includes(normalized)) {
    return normalized as OrderStatus;
  }
  return "pending";
}

export function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function validateCheckoutForm(values: CheckoutFormValues): {
  valid: boolean;
  errors: CheckoutFormErrors;
  sanitized?: CheckoutFormValues;
} {
  const errors: CheckoutFormErrors = {};

  const deliveryDate = values.deliveryDate.trim();
  if (!deliveryDate) {
    errors.deliveryDate = "Select a preferred delivery date.";
  } else if (
    !/^\d{4}-\d{2}-\d{2}$/.test(deliveryDate) ||
    Number.isNaN(new Date(`${deliveryDate}T00:00:00Z`).getTime())
  ) {
    errors.deliveryDate = "Delivery date must use YYYY-MM-DD format.";
  } else if (deliveryDate < getTodayIsoDate()) {
    errors.deliveryDate = "Delivery date cannot be in the past.";
  }

  const deliveryAddress = values.deliveryAddress.trim();
  if (!deliveryAddress) {
    errors.deliveryAddress = "Enter a delivery street address.";
  } else if (deliveryAddress.length < 8) {
    errors.deliveryAddress =
      "Provide a complete delivery address (at least 8 characters).";
  } else if (deliveryAddress.length > 240) {
    errors.deliveryAddress =
      "Delivery address must be 240 characters or fewer.";
  }

  const contactPhone = values.contactPhone.trim();
  const digitsOnly = contactPhone.replace(/\D/g, "");
  if (!contactPhone) {
    errors.contactPhone = "Enter a contact phone number for delivery updates.";
  } else if (
    !/^[+\d().\-\s]{7,20}$/.test(contactPhone) ||
    digitsOnly.length < 7
  ) {
    errors.contactPhone = "Enter a valid phone number (7 to 20 characters).";
  }

  const orderNotes = values.orderNotes.trim();
  if (orderNotes.length > 300) {
    errors.orderNotes = "Order notes must be 300 characters or fewer.";
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: {},
    sanitized: {
      deliveryDate,
      deliveryAddress,
      contactPhone,
      orderNotes,
    },
  };
}

export function canCustomerCancelOrder(status: OrderStatus): {
  allowed: boolean;
  reason?: string;
} {
  if (status === "pending") {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason:
      "Only orders in Pending status can be cancelled. Once accepted or completed, cancellation is locked.",
  };
}

export function filterCustomerOrders(
  orders: readonly CustomerOrder[],
  options: {
    search?: string;
    statusFilter?: CustomerOrderStatusFilter;
    page?: number;
    pageSize?: number;
  } = {},
) {
  const search = options.search?.trim().toLowerCase() ?? "";
  const statusFilter = options.statusFilter ?? "all";
  const pageSize = Math.max(1, options.pageSize ?? 6);

  const filtered = orders.filter((order) => {
    if (statusFilter === "active") {
      if (!ACTIVE_STATUS_SET.has(order.status)) return false;
    } else if (statusFilter !== "all" && order.status !== statusFilter) {
      return false;
    }

    if (search) {
      const tokens = search
        .split(/\s+/)
        .map((t) => t.replace(/^[#$]+/, ""))
        .filter(Boolean);
      const itemNames = order.items.map((i) => i.itemName).join(" ");
      const haystack = [
        order.id,
        order.vendorName,
        order.vendorLocation,
        order.deliveryAddress,
        order.contactPhone,
        order.deliveryDate ?? "",
        order.orderNotes,
        order.status,
        order.total.toFixed(2),
        "cash on delivery cod",
        itemNames,
      ]
        .join(" ")
        .toLowerCase();

      if (!tokens.every((token) => haystack.includes(token))) {
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
    orders: filtered.slice(start, start + pageSize),
    totalFiltered,
    page,
    pageSize,
    totalPages,
  };
}
