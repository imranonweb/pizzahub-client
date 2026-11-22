// Temporary isolated preview data for the public homepage until Express
// menu endpoints (GET /api/menu) are connected in a later task.

export interface FeaturedPizzaPreview {
  id: string;
  itemName: string;
  category: string;
  description: string;
  price: number;
  location: string;
  vendorName: string;
  isPremiumVendor: boolean;
  image: string;
}

export interface PizzaCategoryLink {
  name: string;
  slug: string;
  description: string;
}

export const TEMPORARY_FEATURED_PIZZAS: readonly FeaturedPizzaPreview[] = [
  {
    id: "preview-margherita",
    itemName: "Artisan San Marzano Margherita",
    category: "Classic Pizzas",
    description:
      "Crushed San Marzano tomatoes, fior di latte mozzarella, fresh basil, and cold-pressed olive oil on 48-hour dough.",
    price: 15.5,
    location: "Downtown District",
    vendorName: "Forno Antico",
    isPremiumVendor: true,
    image: "/images/auth-pizza-hero.jpg",
  },
  {
    id: "preview-diavola",
    itemName: "Wood-Fired Spicy Diavola",
    category: "Meat Lovers",
    description:
      "Crisp cupped pepperoni, Calabrian chili oil, aged provolone, and charred Neapolitan crust.",
    price: 18.0,
    location: "Westside Market",
    vendorName: "Vesuvio Kitchen",
    isPremiumVendor: true,
    image: "/images/pizza-diavola.jpg",
  },
  {
    id: "preview-forno-bianca",
    itemName: "Brick-Oven Heritage Mozzarella Pie",
    category: "Specialty / Gourmet Pizzas",
    description:
      "Blistered brick-oven sourdough crust with slow-simmered tomato sauce, hand-pulled mozzarella, and fresh basil.",
    price: 17.25,
    location: "Midtown Arts",
    vendorName: "Bricco Oven",
    isPremiumVendor: true,
    image: "/images/auth-pizza-hero.jpg",
  },
];

export const PIZZA_CATEGORIES: readonly PizzaCategoryLink[] = [
  {
    name: "Classic Pizzas",
    slug: "classic-pizzas",
    description: "Margherita, Marinara & timeless pies",
  },
  {
    name: "Vegetarian Pizzas",
    slug: "vegetarian-pizzas",
    description: "Roasted seasonal produce & herbs",
  },
  {
    name: "Meat Lovers",
    slug: "meat-lovers",
    description: "Cupped pepperoni, sausage & cured cuts",
  },
  {
    name: "Specialty / Gourmet Pizzas",
    slug: "specialty-gourmet-pizzas",
    description: "Chef-crafted artisan combinations",
  },
  {
    name: "Sides & Appetizers",
    slug: "sides-appetizers",
    description: "Garlic knots, salads & oven dips",
  },
  {
    name: "Beverages & Desserts",
    slug: "beverages-desserts",
    description: "Italian sodas, tiramisu & sweets",
  },
];
