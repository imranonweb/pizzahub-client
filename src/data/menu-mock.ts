import type {
  MenuQueryParams,
  MenuVendorInfo,
  PublicMenuItem,
} from "@/lib/menu-api";

// Temporary isolated sample menu catalog used ONLY until Express exposes
// GET /api/menu and GET /api/menu/:id endpoints.
const VENDORS: Record<string, MenuVendorInfo> = {
  fornoAntico: {
    id: "vendor-forno-antico",
    name: "Marco Rossi",
    businessName: "Forno Antico",
    subscriptionPlan: "premium",
  },
  vesuvio: {
    id: "vendor-vesuvio",
    name: "Elena Conti",
    businessName: "Vesuvio Kitchen",
    subscriptionPlan: "premium",
  },
  bricco: {
    id: "vendor-bricco",
    name: "Luca Moretti",
    businessName: "Bricco Oven",
    subscriptionPlan: "premium",
  },
  oliveCrust: {
    id: "vendor-olive-crust",
    name: "Sofia Greco",
    businessName: "Olive & Crust",
    subscriptionPlan: "free",
  },
  hearthDough: {
    id: "vendor-hearth-dough",
    name: "Daniel Mercer",
    businessName: "Hearth & Dough",
    subscriptionPlan: "free",
  },
};

export const TEMPORARY_MENU_CATALOG: readonly PublicMenuItem[] = [
  {
    id: "preview-margherita",
    vendorId: VENDORS.fornoAntico.id,
    itemName: "Artisan San Marzano Margherita",
    category: "Classic Pizzas",
    description:
      "Crushed San Marzano tomatoes, fior di latte mozzarella, fresh basil, and cold-pressed olive oil baked on 48-hour sourdough.",
    price: 15.5,
    location: "Downtown District",
    images: ["/images/auth-pizza-hero.jpg", "/images/pizza-diavola.jpg"],
    status: "approved",
    createdAt: "2026-11-18T12:00:00.000Z",
    vendor: VENDORS.fornoAntico,
  },
  {
    id: "preview-diavola",
    vendorId: VENDORS.vesuvio.id,
    itemName: "Wood-Fired Spicy Diavola",
    category: "Meat Lovers",
    description:
      "Crisp cupped pepperoni, Calabrian chili oil, aged provolone, and San Marzano tomato sauce on a blistered Neapolitan crust.",
    price: 18.0,
    location: "Westside Market",
    images: ["/images/pizza-diavola.jpg", "/images/auth-pizza-hero.jpg"],
    status: "approved",
    createdAt: "2026-11-19T14:30:00.000Z",
    vendor: VENDORS.vesuvio,
  },
  {
    id: "preview-forno-bianca",
    vendorId: VENDORS.bricco.id,
    itemName: "Brick-Oven Heritage Mozzarella Pie",
    category: "Specialty / Gourmet Pizzas",
    description:
      "Blistered brick-oven crust topped with slow-simmered tomato sauce, hand-pulled mozzarella, extra-virgin olive oil, and basil.",
    price: 17.25,
    location: "Midtown Arts",
    images: ["/images/auth-pizza-hero.jpg"],
    status: "approved",
    createdAt: "2026-11-20T10:15:00.000Z",
    vendor: VENDORS.bricco,
  },
  {
    id: "preview-garden-roast",
    vendorId: VENDORS.oliveCrust.id,
    itemName: "Mediterranean Roasted Garden Pie",
    category: "Vegetarian Pizzas",
    description:
      "Charred bell peppers, Kalamata olives, caramelized red onions, and fresh mozzarella finished with garden basil.",
    price: 16.5,
    location: "Riverside Quarter",
    images: ["/images/auth-pizza-hero.jpg"],
    status: "approved",
    createdAt: "2026-11-17T16:45:00.000Z",
    vendor: VENDORS.oliveCrust,
  },
  {
    id: "preview-marinara-classica",
    vendorId: VENDORS.fornoAntico.id,
    itemName: "Traditional Napoli Marinara",
    category: "Classic Pizzas",
    description:
      "Bright crushed tomato sauce, shaved roasted garlic, wild Sicilian oregano, and olive oil on a light crisp crust.",
    price: 13.75,
    location: "Downtown District",
    images: ["/images/auth-pizza-hero.jpg"],
    status: "approved",
    createdAt: "2026-11-16T09:00:00.000Z",
    vendor: VENDORS.fornoAntico,
  },
  {
    id: "preview-double-pepperoni",
    vendorId: VENDORS.hearthDough.id,
    itemName: "Smoked Provolone & Double Pepperoni",
    category: "Meat Lovers",
    description:
      "Generous layers of artisan cured pepperoni, smoked provolone, and oregano over tangy hearth-baked crust.",
    price: 19.5,
    location: "Harbor Point",
    images: ["/images/pizza-diavola.jpg"],
    status: "approved",
    createdAt: "2026-11-21T11:20:00.000Z",
    vendor: VENDORS.hearthDough,
  },
  {
    id: "preview-garlic-knots",
    vendorId: VENDORS.oliveCrust.id,
    itemName: "Brick-Oven Garlic Herb Knots",
    category: "Sides & Appetizers",
    description:
      "Six warm wood-fired dough knots brushed with roasted garlic butter, sea salt, parsley, and warm marinara dip.",
    price: 7.5,
    location: "Riverside Quarter",
    images: ["/images/auth-pizza-hero.jpg"],
    status: "approved",
    createdAt: "2026-11-15T18:00:00.000Z",
    vendor: VENDORS.oliveCrust,
  },
  {
    id: "preview-blood-orange-soda",
    vendorId: VENDORS.hearthDough.id,
    itemName: "Sparkling Sicilian Blood Orange",
    category: "Beverages & Desserts",
    description:
      "Chilled sparkling Italian blood orange craft soda served crisp alongside your wood-fired pizza order.",
    price: 4.5,
    location: "Harbor Point",
    images: ["/images/pizza-diavola.jpg"],
    status: "approved",
    createdAt: "2026-11-14T15:10:00.000Z",
    vendor: VENDORS.hearthDough,
  },
  {
    // Intentionally inactive item: strictly excluded from /menu listings,
    // used to verify unavailable state behavior on /menu/[id].
    id: "preview-seasonal-inactive",
    vendorId: VENDORS.bricco.id,
    itemName: "Seasonal Truffle Hearth Flatbread",
    category: "Specialty / Gourmet Pizzas",
    description: "Limited seasonal flatbread currently paused by the kitchen.",
    price: 21.0,
    location: "Midtown Arts",
    images: ["/images/auth-pizza-hero.jpg"],
    status: "inactive",
    createdAt: "2026-11-10T10:00:00.000Z",
    vendor: VENDORS.bricco,
  },
];

export function queryTemporaryMenu(params: MenuQueryParams) {
  const approvedCatalog = TEMPORARY_MENU_CATALOG.filter(
    (item) => item.status === "approved",
  );

  const locations = Array.from(
    new Set(approvedCatalog.map((item) => item.location)),
  ).sort((a, b) => a.localeCompare(b));

  const searchLower = params.search?.trim().toLowerCase() ?? "";
  const categoryFilter = params.category?.trim() ?? "";
  const locationFilter = params.location?.trim() ?? "";

  const filtered = approvedCatalog.filter((item) => {
    if (
      searchLower &&
      !item.itemName.toLowerCase().includes(searchLower) &&
      !item.description.toLowerCase().includes(searchLower)
    ) {
      return false;
    }

    if (categoryFilter && item.category !== categoryFilter) {
      return false;
    }

    if (locationFilter && item.location !== locationFilter) {
      return false;
    }

    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (params.sort) {
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "newest":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      default: {
        const aPrem = a.vendor.subscriptionPlan === "premium" ? 1 : 0;
        const bPrem = b.vendor.subscriptionPlan === "premium" ? 1 : 0;
        if (bPrem !== aPrem) {
          return bPrem - aPrem;
        }
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
    }
  });

  const limit = Math.max(1, params.limit ?? 6);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const page = Math.min(Math.max(1, params.page ?? 1), totalPages);
  const start = (page - 1) * limit;

  return {
    items: sorted.slice(start, start + limit),
    locations,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
    catalogEmpty: approvedCatalog.length === 0,
  };
}

export function findTemporaryMenuItemById(id: string): PublicMenuItem | null {
  return TEMPORARY_MENU_CATALOG.find((item) => item.id === id) ?? null;
}
