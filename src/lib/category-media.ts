export interface CategoryMediaPreset {
  category: string;
  slug: string;
  shortLabel: string;
  tagline: string;
  image: string;
  imageAlt: string;
  demoItem: {
    itemName: string;
    category: string;
    price: string;
    location: string;
    description: string;
    images: string[];
  };
}

export interface PizzeriaShowcasePhoto {
  id: string;
  title: string;
  locationTag: string;
  caption: string;
  image: string;
  imageAlt: string;
}

export const CATEGORY_MEDIA_PRESETS: readonly CategoryMediaPreset[] = [
  {
    category: "Classic Pizzas",
    slug: "classic-pizzas",
    shortLabel: "Classic Margherita",
    tagline: "San Marzano tomatoes, fior di latte & fresh sweet basil",
    image: "/images/auth-pizza-hero.jpg",
    imageAlt:
      "Wood-fired Neapolitan Margherita pizza with melted mozzarella and fresh basil leaves",
    demoItem: {
      itemName: "Artisan San Marzano Margherita",
      category: "Classic Pizzas",
      price: "15.50",
      location: "Downtown Brick Oven District",
      description:
        "Crushed DOP San Marzano tomatoes, hand-pulled fior di latte mozzarella, fresh sweet basil leaves, and cold-pressed extra-virgin olive oil baked on 48-hour fermented sourdough crust.",
      images: ["/images/auth-pizza-hero.jpg"],
    },
  },
  {
    category: "Vegetarian Pizzas",
    slug: "vegetarian-pizzas",
    shortLabel: "Mediterranean Harvest",
    tagline: "Heirloom cherry tomatoes, Kalamata olives & artichokes",
    image: "/images/pizza-vegetarian.jpg",
    imageAlt:
      "Wood-fired vegetarian Neapolitan pizza with heirloom cherry tomatoes, olives, artichokes, and basil",
    demoItem: {
      itemName: "Mediterranean Garden Harvest Pie",
      category: "Vegetarian Pizzas",
      price: "16.75",
      location: "Greenmarket Quarter",
      description:
        "Roasted red and yellow heirloom cherry tomatoes, marinated artichoke hearts, Kalamata olives, charred sweet bell pepper ribbons, creamy fior di latte, and fresh garden basil.",
      images: ["/images/pizza-vegetarian.jpg"],
    },
  },
  {
    category: "Meat Lovers",
    slug: "meat-lovers",
    shortLabel: "Spicy Diavola",
    tagline: "Crisp cupped pepperoni, Calabrian chili & aged provolone",
    image: "/images/pizza-diavola.jpg",
    imageAlt:
      "Wood-fired Spicy Diavola pizza with crispy cupped pepperoni in front of a glowing brick oven",
    demoItem: {
      itemName: "Wood-Fired Calabrian Diavola",
      category: "Meat Lovers",
      price: "18.50",
      location: "Westside Piazza",
      description:
        "Charred Neapolitan crust layered with crushed tomato sauce, aged provolone, crispy artisan cupped pepperoni, spicy soppressata, and warm Calabrian chili honey drizzle.",
      images: ["/images/pizza-diavola.jpg"],
    },
  },
  {
    category: "Specialty / Gourmet Pizzas",
    slug: "specialty-gourmet-pizzas",
    shortLabel: "Truffle & Wild Mushroom",
    tagline: "Roasted chanterelles, fontina, burrata & white truffle oil",
    image: "/images/pizza-specialty-truffle.jpg",
    imageAlt:
      "Gourmet Truffle and Wild Mushroom artisan white pizza with burrata and thyme on dark stoneware",
    demoItem: {
      itemName: "White Truffle & Wild Chanterelle Pie",
      category: "Specialty / Gourmet Pizzas",
      price: "21.00",
      location: "Midtown Culinary Row",
      description:
        "Artisan white pizza topped with roasted chanterelle and cremini mushrooms, melted fontina, creamy torn burrata, caramelized shallots, fresh thyme sprigs, and white truffle oil.",
      images: ["/images/pizza-specialty-truffle.jpg"],
    },
  },
  {
    category: "Sides & Appetizers",
    slug: "sides-appetizers",
    shortLabel: "Herb Garlic Knots",
    tagline: "Cast-iron garlic knots, pecorino & warm marinara dip",
    image: "/images/pizza-oven-spread.jpg",
    imageAlt:
      "Wood-fired artisan pizza and oven-baked starters served fresh from the brick oven",
    demoItem: {
      itemName: "Cast-Iron Herb Garlic Knots & Marinara",
      category: "Sides & Appetizers",
      price: "9.50",
      location: "Little Italy Corner",
      description:
        "Six hand-twisted sourdough knots baked golden in our wood-fired oven, brushed with roasted garlic-herb butter, aged Parmigiano-Reggiano, and served with warm San Marzano marinara.",
      images: ["/images/pizza-oven-spread.jpg"],
    },
  },
  {
    category: "Beverages & Desserts",
    slug: "beverages-desserts",
    shortLabel: "Tiramisu & Sicilian Soda",
    tagline: "Mascarpone espresso tiramisu & sparkling blood-orange soda",
    image: "/images/pizza-dessert-tiramisu.jpg",
    imageAlt:
      "Artisanal cocoa-dusted tiramisu slice paired with chilled sparkling blood-orange Italian sodas",
    demoItem: {
      itemName: "House Tiramisu & Sparkling Blood-Orange Duo",
      category: "Beverages & Desserts",
      price: "11.50",
      location: "Harbor Terrace",
      description:
        "Espresso-soaked savoiardi layered with whipped mascarpone and Dutch cocoa, paired with a chilled Sicilian blood-orange sparkling craft soda garnished with fresh citrus and mint.",
      images: ["/images/pizza-dessert-tiramisu.jpg"],
    },
  },
];

export const PIZZERIA_SHOWCASE_PHOTOS: readonly PizzeriaShowcasePhoto[] = [
  {
    id: "brick-oven-kitchen",
    title: "Inside the 900°F Brick-Oven Kitchen",
    locationTag: "Oak-Fueled Tiled Dome · Marble Prep Counter",
    caption:
      "Every partner kitchen hand-stretches 48-hour fermented dough on floured peel boards before firing pies for 90 seconds in glowing brick ovens.",
    image: "/images/pizza-oven-spread.jpg",
    imageAlt:
      "Warm Italian pizzeria kitchen interior with glowing wood-fired brick oven and pizza on a wooden peel",
  },
  {
    id: "artisan-table-spread",
    title: "Hand-Pulled Fior di Latte & Heritage Crust",
    locationTag: "DOP San Marzano · Cold-Pressed Olive Oil",
    caption:
      "From blistered Neapolitan Margherita and spicy Calabrian Diavola to white truffle chanterelle pies, baked fresh to order by local pizzaiolos.",
    image: "/images/auth-pizza-hero.jpg",
    imageAlt:
      "Artisan Neapolitan Margherita pizza with melted fior di latte and basil on a dark pizzeria table",
  },
  {
    id: "trattoria-terrace-evening",
    title: "Evening Trattoria Table & Craft Pairings",
    locationTag: "House Tiramisu · Sicilian Blood-Orange Soda",
    caption:
      "Round out dinner with wood-fired garlic knots, cocoa-dusted mascarpone tiramisu, and sparkling Sicilian blood-orange sodas from neighborhood dining rooms.",
    image: "/images/pizza-dessert-tiramisu.jpg",
    imageAlt:
      "Evening trattoria table with artisanal tiramisu and chilled glasses of sparkling Sicilian blood-orange soda",
  },
];
