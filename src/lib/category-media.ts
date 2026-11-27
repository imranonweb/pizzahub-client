export interface CategoryMediaPreset {
  category: string;
  categoryBn: string;
  slug: string;
  shortLabel: string;
  shortLabelBn: string;
  tagline: string;
  taglineBn: string;
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
  titleBn: string;
  locationTag: string;
  locationTagBn: string;
  caption: string;
  captionBn: string;
  image: string;
  imageAlt: string;
}

export const CATEGORY_MEDIA_PRESETS: readonly CategoryMediaPreset[] = [
  {
    category: "Classic Pizzas",
    categoryBn: "ক্লাসিক পিৎজা",
    slug: "classic-pizzas",
    shortLabel: "Classic Margherita",
    shortLabelBn: "ক্লাসিক মার্গেরিটা",
    tagline:
      "San Marzano tomatoes, hand-pulled fior di latte & fresh sweet basil",
    taglineBn: "সান মারজানো টমেটো সস, তাজা মোৎজারেলা চিজ ও সুগন্ধি বেসিল পাতা",
    image: "/images/auth-pizza-hero.jpg",
    imageAlt:
      "Wood-fired Neapolitan Margherita pizza with melted mozzarella and fresh basil leaves",
    demoItem: {
      itemName: "Artisan San Marzano Margherita",
      category: "Classic Pizzas",
      price: "15.50",
      location: "Dhanmondi 27, Dhaka",
      description:
        "Crushed DOP San Marzano tomatoes, hand-pulled fior di latte mozzarella, fresh sweet basil leaves, and cold-pressed extra-virgin olive oil baked on 48-hour fermented sourdough crust.",
      images: ["/images/auth-pizza-hero.jpg"],
    },
  },
  {
    category: "Vegetarian Pizzas",
    categoryBn: "ভেজিটেরিয়ান পিৎজা",
    slug: "vegetarian-pizzas",
    shortLabel: "Garden Harvest",
    shortLabelBn: "গার্ডেন হারভেস্ট",
    tagline:
      "Roasted heirloom cherry tomatoes, Kalamata olives & charred bell peppers",
    taglineBn: "রোস্টেড চেরি টমেটো, কালামাতা অলিভ, ক্যাপসিকাম ও তাজা হার্বস",
    image: "/images/pizza-vegetarian.jpg",
    imageAlt:
      "Wood-fired vegetarian Neapolitan pizza with heirloom cherry tomatoes, olives, artichokes, and basil",
    demoItem: {
      itemName: "Mediterranean Garden Harvest Pie",
      category: "Vegetarian Pizzas",
      price: "16.75",
      location: "Gulshan-2, Dhaka",
      description:
        "Roasted red and yellow heirloom cherry tomatoes, marinated artichoke hearts, Kalamata olives, charred sweet bell pepper ribbons, creamy fior di latte, and fresh garden basil.",
      images: ["/images/pizza-vegetarian.jpg"],
    },
  },
  {
    category: "Meat Lovers",
    categoryBn: "মিট লাভার্স",
    slug: "meat-lovers",
    shortLabel: "Chili-Honey Diavola",
    shortLabelBn: "চিলি-হানি দিয়াভোলা",
    tagline: "Crisp beef pepperoni, Naga-kissed chili honey & aged provolone",
    taglineBn: "মচমচে বিফ পেপেরোনি, হালকা নাগা-চিলি হানি ও গলানো প্রোভোলন চিজ",
    image: "/images/pizza-diavola.jpg",
    imageAlt:
      "Wood-fired Spicy Diavola pizza with crispy cupped pepperoni in front of a glowing brick oven",
    demoItem: {
      itemName: "Wood-Fired Chili-Honey Beef Diavola",
      category: "Meat Lovers",
      price: "18.50",
      location: "Banani Road 11, Dhaka",
      description:
        "Charred Neapolitan crust layered with crushed tomato sauce, aged provolone, crispy artisan beef pepperoni, smoked sausage, and warm chili-infused wildflower honey drizzle.",
      images: ["/images/pizza-diavola.jpg"],
    },
  },
  {
    category: "Specialty / Gourmet Pizzas",
    categoryBn: "স্পেশালিটি ও গুরমেট পিৎজা",
    slug: "specialty-gourmet-pizzas",
    shortLabel: "Truffle & Wild Mushroom",
    shortLabelBn: "ট্রাফল ও মাশরুম",
    tagline: "Roasted wild mushrooms, fontina, creamy burrata & truffle oil",
    taglineBn: "রোস্টেড মাশরুম, ক্রিমি বুরাতা চিজ, থাইম ও হোয়াইট ট্রাফল অয়েল",
    image: "/images/pizza-specialty-truffle.jpg",
    imageAlt:
      "Gourmet Truffle and Wild Mushroom artisan white pizza with burrata and thyme on dark stoneware",
    demoItem: {
      itemName: "White Truffle & Wild Chanterelle Pie",
      category: "Specialty / Gourmet Pizzas",
      price: "21.00",
      location: "Uttara Sector 7, Dhaka",
      description:
        "Artisan white pizza topped with roasted chanterelle and cremini mushrooms, melted fontina, creamy torn burrata, caramelized shallots, fresh thyme sprigs, and white truffle oil.",
      images: ["/images/pizza-specialty-truffle.jpg"],
    },
  },
  {
    category: "Sides & Appetizers",
    categoryBn: "সাইডস ও অ্যাপেটাইজার",
    slug: "sides-appetizers",
    shortLabel: "Herb Garlic Knots",
    shortLabelBn: "হার্ব গার্লিক নটস",
    tagline: "Cast-iron sourdough knots, roasted garlic butter & warm marinara",
    taglineBn: "ওভেন-বেকড গার্লিক বাটার নটস, পারমেজান ও গরম মারিনারা ডিপ",
    image: "/images/pizza-oven-spread.jpg",
    imageAlt:
      "Wood-fired artisan pizza and oven-baked starters served fresh from the brick oven",
    demoItem: {
      itemName: "Cast-Iron Herb Garlic Knots & Marinara",
      category: "Sides & Appetizers",
      price: "9.50",
      location: "GEC Circle, Chattogram",
      description:
        "Six hand-twisted sourdough knots baked golden in our wood-fired oven, brushed with roasted garlic-herb butter, aged Parmigiano-Reggiano, and served with warm San Marzano marinara.",
      images: ["/images/pizza-oven-spread.jpg"],
    },
  },
  {
    category: "Beverages & Desserts",
    categoryBn: "পানীয় ও ডেজার্ট",
    slug: "beverages-desserts",
    shortLabel: "Tiramisu & Citrus Soda",
    shortLabelBn: "তিরামিসু ও সাইট্রাস সোডা",
    tagline: "Mascarpone espresso tiramisu & chilled blood-orange craft soda",
    taglineBn: "মাস্কারপোন এসপ্রেসো তিরামিসু ও ঠান্ডা ব্লাড-অরেঞ্জ ক্রাফট সোডা",
    image: "/images/pizza-dessert-tiramisu.jpg",
    imageAlt:
      "Artisanal cocoa-dusted tiramisu slice paired with chilled sparkling blood-orange Italian sodas",
    demoItem: {
      itemName: "House Tiramisu & Sparkling Blood-Orange Duo",
      category: "Beverages & Desserts",
      price: "11.50",
      location: "Zindabazar, Sylhet",
      description:
        "Espresso-soaked savoiardi layered with whipped mascarpone and Dutch cocoa, paired with a chilled Sicilian blood-orange sparkling craft soda garnished with fresh citrus and mint.",
      images: ["/images/pizza-dessert-tiramisu.jpg"],
    },
  },
];

export const PIZZERIA_SHOWCASE_PHOTOS: readonly PizzeriaShowcasePhoto[] = [
  {
    id: "brick-oven-kitchen",
    title: "Inside Dhaka's 480°C Brick-Oven Kitchens",
    titleBn: "ঢাকার ৪৮০°C ব্রিক-ওভেন কিচেনের ভেতরের দৃশ্য",
    locationTag: "Dhanmondi & Banani · Wood-Fired Tiled Dome",
    locationTagBn: "ধানমন্ডি ও বনানী · কাঠ-কয়লার ইটের চুলা",
    caption:
      "Partner pizzaiolos hand-stretch 48-hour fermented dough on floured wooden peels before firing each pie for 90 seconds over glowing embers.",
    captionBn:
      "প্রতিটি পার্টনার কিচেনে ৪৮ ঘণ্টা ফার্মেন্টেড ডো হাতে তৈরি করে জ্বলন্ত ইটের চুলায় মাত্র ৯০ সেকেন্ডে বেক করা হয়।",
    image: "/images/pizza-oven-spread.jpg",
    imageAlt:
      "Warm pizzeria kitchen interior with glowing wood-fired brick oven and pizza on a wooden peel",
  },
  {
    id: "artisan-table-spread",
    title: "Blistered Crust & Bold Local Favorites",
    titleBn: "মচমচে ক্রাস্ট ও অনন্য স্বাদের মেলবন্ধন",
    locationTag: "Gulshan & Uttara · Fresh Mozzarella & Chili Honey",
    locationTagBn: "গুলশান ও উত্তরা · তাজা মোৎজারেলা ও চিলি হানি",
    caption:
      "From classic San Marzano Margherita to spicy chili-honey beef Diavola and wild mushroom burrata pies crafted for evening adda.",
    captionBn:
      "ক্লাসিক মার্গেরিটা থেকে শুরু করে স্পাইসি বিফ দিয়াভোলা ও মাশরুম বুরাতা পিৎজা — সন্ধ্যার আড্ডা ও পরিবারের জন্য তাজা পরিবেশন।",
    image: "/images/auth-pizza-hero.jpg",
    imageAlt:
      "Artisan Neapolitan Margherita pizza with melted fior di latte and basil on a dark pizzeria table",
  },
  {
    id: "trattoria-terrace-evening",
    title: "Evening Rooftop Adda & Sweet Pairings",
    titleBn: "সন্ধ্যার রুফটপ আড্ডা ও ডেজার্ট পেয়ারিং",
    locationTag: "Chattogram & Sylhet · Tiramisu & Craft Sodas",
    locationTagBn: "চট্টগ্রাম ও সিলেট · তিরামিসু ও ক্রাফট সোডা",
    caption:
      "Complete your table with cast-iron herb garlic knots, cocoa-dusted tiramisu, and chilled citrus sodas delivered across neighborhood hubs.",
    captionBn:
      "গার্লিক নটস, কোকো-ডাস্টেড তিরামিসু এবং ঠান্ডা ব্লাড-অরেঞ্জ সোডার সাথে আপনার ডিনার টেবিলকে করুন পরিপূর্ণ।",
    image: "/images/pizza-dessert-tiramisu.jpg",
    imageAlt:
      "Evening trattoria table with artisanal tiramisu and chilled glasses of sparkling Sicilian blood-orange soda",
  },
];
