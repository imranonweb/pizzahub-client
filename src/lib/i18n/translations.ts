import type { MenuItemStatus } from "@/lib/menu-api";
import type { OrderStatus } from "@/lib/order-rules";

export type Locale = "en" | "bn";

export const CATEGORY_TRANSLATIONS: Record<
  string,
  { en: string; bn: string; shortBn: string }
> = {
  "Classic Pizzas": {
    en: "Classic Pizzas",
    bn: "ক্লাসিক পিৎজা",
    shortBn: "ক্লাসিক মার্গেরিটা",
  },
  "Vegetarian Pizzas": {
    en: "Vegetarian Pizzas",
    bn: "ভেজিটেরিয়ান পিৎজা",
    shortBn: "গার্ডেন হারভেস্ট",
  },
  "Meat Lovers": {
    en: "Meat Lovers",
    bn: "মিট লাভার্স",
    shortBn: "স্পাইসি দিয়াভোলা",
  },
  "Specialty / Gourmet Pizzas": {
    en: "Specialty / Gourmet Pizzas",
    bn: "স্পেশালিটি ও গুরমেট পিৎজা",
    shortBn: "ট্রাফল মাশরুম",
  },
  "Sides & Appetizers": {
    en: "Sides & Appetizers",
    bn: "সাইডস ও অ্যাপেটাইজার",
    shortBn: "হার্ব গার্লিক নটস",
  },
  "Beverages & Desserts": {
    en: "Beverages & Desserts",
    bn: "পানীয় ও ডেজার্ট",
    shortBn: "তিরামিসু ও ক্রাফট সোডা",
  },
};

export function translateCategory(category: string, locale: Locale): string {
  if (locale === "en") {
    return category;
  }
  return CATEGORY_TRANSLATIONS[category]?.bn ?? category;
}

const ORDER_STATUS_TRANSLATIONS: Record<
  OrderStatus,
  {
    en: { label: string; description: string };
    bn: { label: string; description: string };
  }
> = {
  pending: {
    en: {
      label: "Pending",
      description: "Waiting for the kitchen to confirm your order.",
    },
    bn: {
      label: "অপেক্ষমাণ",
      description: "কিচেনের কনফার্মেশনের অপেক্ষায় রয়েছে।",
    },
  },
  accepted: {
    en: {
      label: "Accepted",
      description: "The vendor confirmed and queued your order.",
    },
    bn: {
      label: "গৃহীত",
      description: "ভেন্ডর কিচেন আপনার অর্ডার গ্রহণ করেছে।",
    },
  },
  preparing: {
    en: {
      label: "Preparing",
      description: "Your pizza is being stretched and baked fresh.",
    },
    bn: {
      label: "প্রস্তুত হচ্ছে",
      description: "আপনার পিৎজা তাজা ডো থেকে ইটের চুলায় বেক করা হচ্ছে।",
    },
  },
  ready: {
    en: {
      label: "Ready",
      description: "Hot out of the oven and packed for dispatch.",
    },
    bn: {
      label: "প্রস্তুত",
      description: "চুলা থেকে গরম গরম বের করে ডেলিভারির জন্য প্যাক করা হয়েছে।",
    },
  },
  out_for_delivery: {
    en: {
      label: "Out for Delivery",
      description: "On the way to your delivery address.",
    },
    bn: {
      label: "ডেলিভারির পথে",
      description: "রাইডার আপনার ঠিকানার উদ্দেশ্যে রওনা হয়েছে।",
    },
  },
  delivered: {
    en: {
      label: "Delivered",
      description: "Completed and delivered to your address.",
    },
    bn: {
      label: "ডেলিভারি সম্পন্ন",
      description: "আপনার ঠিকানায় সফলভাবে পৌঁছে দেওয়া হয়েছে।",
    },
  },
  rejected: {
    en: {
      label: "Rejected",
      description: "The vendor could not fulfill this order.",
    },
    bn: {
      label: "প্রত্যাখ্যাত",
      description: "কিচেন এই মুহূর্তে অর্ডারটি গ্রহণ করতে পারেনি।",
    },
  },
  cancelled: {
    en: {
      label: "Cancelled",
      description: "Cancelled before kitchen acceptance.",
    },
    bn: {
      label: "বাতিল",
      description: "কিচেন গ্রহণের আগেই অর্ডারটি বাতিল করা হয়েছে।",
    },
  },
};

export function translateOrderStatus(
  status: OrderStatus,
  locale: Locale,
): { label: string; description: string } {
  const entry =
    ORDER_STATUS_TRANSLATIONS[status] ?? ORDER_STATUS_TRANSLATIONS.pending;
  return entry[locale];
}

const MENU_STATUS_TRANSLATIONS: Record<
  MenuItemStatus,
  { en: string; enCompact: string; bn: string; bnCompact: string }
> = {
  approved: {
    en: "Approved (Active)",
    enCompact: "Active",
    bn: "অনুমোদিত (সক্রিয়)",
    bnCompact: "সক্রিয়",
  },
  pending: {
    en: "Pending Review",
    enCompact: "Pending Review",
    bn: "পর্যালোচনাধীন",
    bnCompact: "পর্যালোচনাধীন",
  },
  rejected: {
    en: "Rejected",
    enCompact: "Rejected",
    bn: "প্রত্যাখ্যাত",
    bnCompact: "প্রত্যাখ্যাত",
  },
  inactive: {
    en: "Inactive",
    enCompact: "Inactive",
    bn: "নিষ্ক্রিয়",
    bnCompact: "নিষ্ক্রিয়",
  },
};

export function translateMenuStatus(
  status: MenuItemStatus,
  locale: Locale,
  compact = false,
): string {
  const entry =
    MENU_STATUS_TRANSLATIONS[status] ?? MENU_STATUS_TRANSLATIONS.pending;
  if (locale === "bn") {
    return compact ? entry.bnCompact : entry.bn;
  }
  return compact ? entry.enCompact : entry.en;
}

export function translateRole(role: string, locale: Locale): string {
  const normalized = role.trim().toLowerCase();
  if (locale === "bn") {
    if (normalized === "customer") return "কাস্টমার";
    if (normalized === "vendor") return "ভেন্ডর";
    if (normalized === "admin") return "অ্যাডমিন";
    return role;
  }
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export const TRANSLATIONS = {
  en: {
    brand: {
      tagline: "Bangladesh's Artisan Brick-Oven Marketplace",
      cities: "Dhaka · Chattogram · Sylhet",
    },
    nav: {
      home: "Home",
      browseMenu: "Browse Menu",
      pricing: "Pricing",
      dashboard: "Dashboard",
      cart: "Cart",
      signIn: "Sign In",
      signUp: "Sign Up",
      signOut: "Sign Out",
      signingOut: "Signing out…",
      profileSettings: "Profile Settings",
      notifications: "Notifications",
      subscriptionPlan: "Subscription Plan",
      openCartAria: "Open shopping cart",
      openMenuAria: "Open navigation menu",
      accountMenuAria: "Account menu",
      signedOutTitle: "Signed out",
      signedOutDesc: "You have been signed out of PizzaHub.",
      signOutFailedTitle: "Sign out failed",
      signOutFailedDesc: "Unable to sign out right now. Please try again.",
      languageLabel: "Language",
    },
    hero: {
      headline:
        "Wood-fired brick-oven pizza from neighborhood kitchens to your table.",
      subheadline:
        "Explore verified artisan pizzerias across Dhanmondi, Banani, Gulshan, Chattogram, and Sylhet — schedule your delivery date, pay Cash on Delivery, and follow every stage live.",
      exploreCta: "Explore Pizza Menu",
      vendorCta: "Become a Vendor",
      trustVerifiedTitle: "Admin-Verified Menus",
      trustVerifiedSub: "Curated local ovens",
      trustTrackingTitle: "Live Kitchen Status",
      trustTrackingSub: "Prep to doorstep",
      trustCodTitle: "Cash on Delivery",
      trustCodSub: "Dhaka, Ctg & Sylhet",
      ovenCardTitle: "480°C Brick-Oven Craft",
      ovenCardSubtitle:
        "48-hour fermented dough · Baked fresh in neighborhood kitchens across Bangladesh",
      ovenCardBadge: "Cash on Delivery",
      searchPlaceholder:
        "Search pizza, topping, or kitchen (e.g. Margherita, Diavola, Dhanmondi)...",
      searchAria: "Search pizza by name",
      clearSearchAria: "Clear search input",
      findPizzaBtn: "Find Pizza",
      popularLabel: "Popular:",
      suggestionMatching: "Matching Pizzas & Kitchens",
      suggestionPopular: "Popular Searches",
      popularBadge: "Popular",
      categoryBadge: "Category",
    },
    home: {
      featuredHeading: "Fresh from neighborhood brick ovens",
      featuredSubheading:
        "Signature Neapolitan pies, fiery chili specialties, and house sides baked to order by approved PizzaHub kitchens.",
      viewFullMenu: "View Full Menu",
      featuredErrorTitle: "Featured Menu Unavailable",
      retry: "Retry",
      noFeaturedHeading: "No approved pizzas published yet",
      noFeaturedDesc:
        "Local kitchens have not published approved menu items yet. Check back soon or browse the menu catalog.",
      categoriesHeading: "Curated culinary categories",
      categoriesSubheading:
        "From classic San Marzano Margherita and spicy Diavola for evening adda to truffle mushroom pies, garlic knots, and chilled craft sodas.",
      howHeading: "From local hearth to your doorstep",
      howSubheading:
        "Three transparent stages designed around Bangladeshi neighborhood dining and scheduled family gatherings.",
      stepLabel: "Stage",
      steps: [
        {
          title: "Explore verified local kitchens",
          description:
            "Search approved pizzas, sides, and beverages by category, neighborhood hub (Dhanmondi, Banani, Gulshan, GEC), or price.",
        },
        {
          title: "Pick delivery date & doorstep notes",
          description:
            "Choose today or an upcoming date for family dinner or office adda, add your street address, and pay Cash on Delivery.",
        },
        {
          title: "Track oven-to-door progress live",
          description:
            "Watch your order move from Pending to Accepted, Preparing, and Out for Delivery — or cancel cleanly while pending.",
        },
      ],
      showcaseHeading: "Inside Bangladesh's independent woodfire rooms",
      showcaseSubheading:
        "Partnering with artisan trattorias and neighborhood brick-oven kitchens — from roaring 480°C prep counters in Dhaka to evening rooftop tables.",
      dinerHeading: "Crafted for discerning pizza lovers",
      dinerSubheading:
        "Straightforward ordering, admin-verified photography, and real kitchen accountability with zero hidden checkout fees.",
      dinerBenefits: [
        "Only admin-reviewed and active menu items appear on the public catalog.",
        "Filter effortlessly by pizza style, neighborhood location, and price order.",
        "Duplicate orders for the same pizza and delivery date are automatically prevented.",
        "Pay Cash on Delivery at your doorstep or cancel any pending order before acceptance.",
      ],
      vendorHeading: "Built for independent Bangladeshi pizzerias",
      vendorSubheading:
        "Open your digital storefront in minutes, publish wood-fired specialties, and manage incoming neighborhood orders from one calm workspace.",
      vendorBenefits: [
        "Start completely free with up to 3 active approved menu items live at once.",
        "Upgrade to Premium for unlimited active listings, priority placement, and a Verified Kitchen badge.",
        "Accept, prepare, and dispatch incoming orders directly from your Vendor Dashboard.",
      ],
      registerVendorCta: "Register as a Vendor",
      vendorSignIn: "Vendor Sign In",
      finalCtaHeading: "Ready for hot brick-oven pizza tonight?",
      finalCtaSubheading:
        "Browse approved kitchens across Dhaka, Chattogram, and Sylhet — or launch your own pizzeria account in under a minute.",
      createAccount: "Create Account",
    },
    menu: {
      pageHeading: "Artisan Pizza & Kitchen Directory",
      pageSubheading:
        "Discover admin-verified wood-fired pizzas, cast-iron sides, and craft drinks across neighborhood kitchens in Bangladesh.",
      searchPlaceholder:
        "Search pizzas, toppings, or kitchens (press / to focus)...",
      searchAria: "Search pizza menu items by name",
      clearSearchAria: "Clear search",
      suggestionHeader: "Matching Menu Items",
      allLocations: "All locations",
      filterLocationAria: "Filter by location",
      sortAria: "Sort menu items",
      sortFeatured: "Featured first",
      sortPriceAsc: "Price: Low to High",
      sortPriceDesc: "Price: High to Low",
      sortNewest: "Newest items",
      allCategories: "All categories",
      updatingMenu: "Updating menu...",
      itemShown: "item shown",
      itemsShown: "items shown",
      searchFilterPrefix: "Search",
      resetFilters: "Reset filters",
      resetAllFilters: "Reset all filters",
      clearSearch: "Clear search",
      serviceUnavailable: "Menu Service Unavailable",
      retryConnection: "Retry connection",
      emptyCatalogHeading: "No approved pizzas published yet",
      emptyCatalogDesc:
        "Check back soon as local kitchens publish and receive admin approval for new menu items.",
      noMatchSearchPrefix: "No pizzas matching",
      noMatchSearchDesc:
        "We could not find any pizzas matching your query. Check spelling, clear your keywords, or explore a popular category below:",
      noMatchFilterHeading: "No matching menu items",
      noMatchFilterDesc:
        "No approved items matched your current filter selection. Reset filters to view all available dishes.",
      page: "Page",
      of: "of",
      previous: "Previous",
      next: "Next",
      premiumBadge: "Premium",
      premiumKitchen: "Premium Kitchen",
      available: "Available",
      unavailable: "Unavailable",
      viewDetails: "View Details",
      addCompact: "Add",
      addToCart: "Add to Cart",
      added: "Added",
      addedToastTitle: "Added to cart",
      viewCartAction: "View cart",
      backToMenu: "Back to Menu",
      preparedBy: "Prepared by",
      quantity: "Quantity",
      orderNowPrefix: "Order Now",
      codLabel: "Cash on Delivery",
      signInPrompt: "Ready to complete your order?",
      signInCustomerLink: "Sign in as a Customer",
      signInPromptSuffix: "to check out.",
      ownKitchenNotice: "You cannot order items from your own vendor kitchen.",
      vendorRoleNotice: "Vendor accounts cannot place customer pizza orders.",
      vendorRoleSub:
        "Switch to a Customer account to order, or manage your kitchen from your dashboard.",
      goVendorDashboard: "Go to Vendor Dashboard",
      adminRoleNotice: "Admin accounts cannot place customer orders.",
      adminRoleSub:
        "Admin accounts moderate menu items, users, and platform transactions.",
      goAdminDashboard: "Go to Admin Dashboard",
      directOrderTitle: "Place Direct Pizza Order",
      directOrderDesc:
        "Confirm your delivery date and doorstep address. Cash on Delivery — no upfront card required.",
      customerLabel: "Customer",
      vendorKitchenLabel: "Vendor Kitchen",
      selectedItemLabel: "Selected Item",
      deliveryDateLabel: "Delivery Date",
      contactPhoneLabel: "Contact Phone",
      phonePlaceholder: "+880 1712-345678",
      deliveryAddressLabel: "Delivery Address",
      addressPlaceholder: "House 24, Road 9/A, Dhanmondi, Dhaka 1209",
      notesLabel: "Special Instructions / Doorstep Notes",
      optional: "Optional",
      notesPlaceholder:
        "Extra chili flakes, light char, call on arrival at gate...",
      cancelBtn: "Cancel",
      placingOrder: "Placing order…",
      confirmOrderPrefix: "Confirm Order",
      orderSentTitle: "Order Request Sent!",
      orderSentDescPrefix: "Your order",
      orderSentDescMiddle: "is now Pending review by",
      dishLabel: "Dish",
      paymentLabel: "Payment",
      trackOrderStatus: "Track Order Status",
      viewMyOrders: "View My Orders",
    },
    cart: {
      title: "Your Cart",
      clearCart: "Clear cart",
      drawerDesc:
        "Review selected dishes and adjust quantities before server checkout verification.",
      emptyHeading: "Your cart is empty",
      emptyDesc:
        "Explore wood-fired pizzas and sides from approved neighborhood kitchens to start an order.",
      subtotalLabel: "Estimated subtotal",
      itemsWord: "items",
      itemWord: "item",
      totalLabel: "Estimated total",
      codNote:
        "Pay with Cash on Delivery upon arrival. Menu availability and totals are verified live at checkout.",
      checkingAccount: "Checking account...",
      signInCheckout: "Sign in to Checkout",
      proceedCheckout: "Proceed to Checkout",
      customerOnlyNotice:
        "Only signed-in Customer accounts can submit pizza orders.",
    },
    checkout: {
      heading: "Checkout & Delivery Ticket",
      subheading:
        "Provide your doorstep address in Dhaka, Chattogram, or Sylhet and review your kitchen ticket before placing your order.",
      customerInfoHeading: "Customer Information",
      nameLabel: "Name",
      emailLabel: "Email",
      deliveryDetailsHeading: "Delivery & Contact Details",
      deliveryDateLabel: "Delivery date",
      deliveryAddressLabel: "Delivery address",
      addressPlaceholder: "House 24, Road 9/A, Flat 4B, Dhanmondi, Dhaka 1209",
      contactPhoneLabel: "Contact phone",
      phonePlaceholder: "e.g. +880 1712-345678",
      orderNotesLabel: "Order notes (optional)",
      notesPlaceholder:
        "Intercom code, landmark near mosque/road, extra chili oil or napkins",
      paymentMethodLabel: "Payment method",
      codTitle: "Cash on Delivery (COD)",
      selectedBadge: "Selected",
      codDesc:
        "Pay directly in cash when your hot pizza arrives at your doorstep. No upfront online card payment required.",
      verifyingBtn: "Verifying & Placing Order...",
      placeOrderPrefix: "Place Order (Cash on Delivery",
      summaryHeading: "Kitchen Order Ticket",
      subtotal: "Estimated subtotal",
      total: "Estimated total",
      ratesNote:
        "Prices reflect authoritative kitchen menu rates. Payment is collected in cash upon delivery.",
      confirmedHeading: "Order confirmed",
      orderRef: "Order reference",
      orderedItems: "Ordered Items",
      additionalOrders: "Additional Kitchen Orders Placed",
      continueBrowsing: "Continue Browsing",
      viewOrderTracking: "View Order Tracking",
    },
    pricing: {
      heading: "Transparent plans for independent pizzerias",
      subheadingPrefix: "Launch completely free with up to",
      subheadingSuffix:
        "active menu listings. Upgrade to PizzaHub Premium anytime via Stripe Checkout for unlimited dishes, priority discovery across Bangladesh, and our Verified Kitchen badge.",
      vendorReqTitle: "Vendor Account Required for Subscription Purchase",
      freeBadge: "Free Kitchen Tier",
      currentPlanBadge: "Your Current Plan",
      cancellingSoonBadge: "Cancelling Soon",
      freeTitle: "Free Plan",
      freeDesc:
        "Ideal for boutique brick-oven kitchens testing neighborhood demand in Dhaka, Chattogram, or Sylhet.",
      perMonth: "/ month",
      freeForever: "· Free forever",
      whatsIncluded: "What's included:",
      startFreeVendor: "Start Free as a Vendor",
      mostPopular: "Most Popular",
      premiumBadge: "PizzaHub Premium",
      premiumTitle: "Premium Plan",
      premiumDesc:
        "Built for high-volume pizzerias, multi-category menus, and kitchens scaling neighborhood delivery.",
      billedStripe: "· Billed monthly via Stripe",
      cancelAnytime: "Cancel anytime · Secure Stripe Checkout",
      everythingInFree: "Everything in Free, plus:",
      joinVendorUpgrade: "Join as Vendor to Upgrade",
      viewSubDetails: "View Subscription Details",
      upgradePremium: "Upgrade to Premium",
      renewPremium: "Renew Premium Plan",
      vendorOnlyBtn: "Vendor Accounts Only",
      comparisonHeading: "Detailed Capability Matrix",
      comparisonSubheading:
        "Compare every kitchen tool across Free and Premium vendor tiers.",
      featureCol: "Feature & Benefit",
      faqHeading: "Frequently Asked Questions for Kitchens",
      faqSubheading:
        "Everything you need to know about active item slots, admin moderation, and billing.",
      bottomHeading: "Ready to share your wood-fired craft with the city?",
      bottomSubheading:
        "Join PizzaHub today. Publish your first 3 signature pizzas free forever, or unlock unlimited capacity with Premium.",
      becomeVendorFree: "Become a Vendor Free",
      browseCustomerMenu: "Browse Customer Menu",
      goKitchenDashboard: "Go to Kitchen Dashboard",
      subSettings: "Subscription Settings",
      returnDashboard: "Return to Your Dashboard",
    },
    auth: {
      backToHome: "Back to home",
      footerTagline:
        "Verified brick-oven pizzerias across Dhaka, Chattogram & Sylhet.",
      signInTitle: "Welcome back",
      signInDesc:
        "Sign in with your email or Google account to track pizza deliveries or manage your kitchen.",
      signInHeroHeadline: "Hot from the brick oven to your neighborhood table.",
      signInHeroSub:
        "Sign in to follow live order updates, reorder Dhanmondi & Banani favorites, or run your vendor kitchen.",
      needAccount: "Need an account?",
      signUpLink: "Sign up",
      signUpTitle: "Create your account",
      signUpDesc:
        "Join PizzaHub as a customer to order wood-fired pizza or as a vendor to publish your restaurant menu.",
      signUpHeroHeadline:
        "One table for pizza lovers and independent Bangladeshi kitchens.",
      signUpHeroSub:
        "Register in seconds as a Customer or Vendor — artisan crust, Cash on Delivery, and live kitchen status.",
      alreadyRegistered: "Already registered?",
      signInLink: "Sign in",
      emailLabel: "Email address",
      emailPlaceholder: "tariqul@example.com",
      passwordLabel: "Password",
      passwordPlaceholder: "Enter your password",
      createPasswordPlaceholder: "Create a strong password",
      confirmPasswordLabel: "Confirm password",
      confirmPasswordPlaceholder: "Re-enter your password",
      rememberMe: "Remember me on this device",
      signingIn: "Signing in…",
      orContinueWith: "or continue with",
      newToPizzaHub: "New to PizzaHub?",
      createAnAccount: "Create an account",
      accountType: "Account type",
      customerRoleTitle: "Customer",
      customerRoleSub: "Browse menus & order pizza",
      vendorRoleTitle: "Vendor",
      vendorRoleSub: "List your kitchen & orders",
      fullNameLabel: "Full name",
      fullNamePlaceholder: "Tariqul Islam",
      businessNameLabel: "Restaurant / business name",
      businessNamePlaceholder: "Banani Brick Oven Pizzeria",
      profileImageLabel: "Profile image URL",
      profileImagePlaceholder:
        "https://example.com/avatar.jpg (leave blank to skip)",
      ruleMinChars: "6+ characters",
      ruleUpper: "1 uppercase",
      ruleLower: "1 lowercase",
      passwordsMatch: "Passwords match",
      creatingAccount: "Creating account…",
      createVendorAccount: "Create Vendor Account",
      createCustomerAccount: "Create Customer Account",
      alreadyHaveAccount: "Already have an account?",
    },
    dashboard: {
      storefrontSection: "Storefront",
      backToHome: "Back to Home",
      welcomeBack: "Welcome back",
      customerPortal: "Customer Portal",
      customerAccount: "Customer Account",
      overview: "Overview",
      myOrders: "My Orders",
      checkout: "Checkout",
      accountSettings: "Account Settings",
      profile: "Profile",
      myMenuItems: "My Menu Items",
      addPizza: "Add Pizza",
      incomingOrders: "Incoming Orders",
      subscription: "Subscription",
      vendorPricing: "Vendor Pricing",
      publicMenu: "Public Menu",
      freePlan: "Free Plan",
      premiumPlan: "Premium Plan",
      adminPortal: "PizzaHub Admin",
      administrator: "Administrator",
      menuModeration: "Menu Moderation",
      moderationShort: "Moderation",
      userManagement: "User Management",
      transactions: "Transactions",
      refresh: "Refresh",
      orderMore: "Order More",
      orderDetails: "Order Details",
      cancelOrder: "Cancel",
      allOrders: "All orders",
      inProgress: "In progress",
    },
    footer: {
      description:
        "Connecting pizza lovers across Dhaka, Chattogram, and Sylhet with independent brick-oven kitchens — transparent ordering, Cash on Delivery, and live tracking.",
      exploreHeading: "Explore",
      partnerHeading: "Partner & Account",
      contactHeading: "Dhaka Hub & Support",
      vendorPricingPlans: "Vendor Pricing & Plans",
      becomeVendor: "Become a Vendor",
      myDashboard: "My Dashboard",
      addressLine: "Gulshan-2, Dhaka 1212 · Serving Dhaka, Chattogram & Sylhet",
      hoursLine: "Daily brick-oven service · 11:30 AM – 11:30 PM BST",
      rights: "© 2026 PizzaHub Bangladesh. All rights reserved.",
      platformNote:
        "Artisanal wood-fired pizza ordering & neighborhood kitchen platform.",
    },
  },
  bn: {
    brand: {
      tagline: "বাংলাদেশের আর্টিজান ব্রিক-ওভেন মার্কেটপ্লেস",
      cities: "ঢাকা · চট্টগ্রাম · সিলেট",
    },
    nav: {
      home: "হোম",
      browseMenu: "মেনু দেখুন",
      pricing: "ভেন্ডর প্ল্যান",
      dashboard: "ড্যাশবোর্ড",
      cart: "কার্ট",
      signIn: "সাইন ইন",
      signUp: "রেজিস্টার",
      signOut: "সাইন আউট",
      signingOut: "সাইন আউট হচ্ছে…",
      profileSettings: "প্রোফাইল সেটিংস",
      notifications: "নোটিফিকেশন",
      subscriptionPlan: "সাবস্ক্রিপশন প্ল্যান",
      openCartAria: "শপিং কার্ট খুলুন",
      openMenuAria: "নেভিগেশন মেনু খুলুন",
      accountMenuAria: "অ্যাকাউন্ট মেনু",
      signedOutTitle: "সাইন আউট সম্পন্ন",
      signedOutDesc: "আপনি PizzaHub থেকে সফলভাবে সাইন আউট করেছেন।",
      signOutFailedTitle: "সাইন আউট ব্যর্থ হয়েছে",
      signOutFailedDesc: "এই মুহূর্তে সাইন আউট করা যায়নি। আবার চেষ্টা করুন।",
      languageLabel: "ভাষা",
    },
    hero: {
      headline: "পাড়ার ইটের চুলা থেকে গরম, কাঠ-পোড়া স্বাদের পিৎজা সরাসরি আপনার টেবিলে।",
      subheadline:
        "ধানমন্ডি, বনানী, গুলশান, চট্টগ্রাম ও সিলেটের যাচাইকৃত আর্টিজান পিৎজারিয়াগুলোর মেনু দেখুন — ডেলিভারির তারিখ বেছে নিন, ক্যাশ অন ডেলিভারিতে পেমেন্ট করুন এবং লাইভ স্ট্যাটাস ট্র্যাক করুন।",
      exploreCta: "পিৎজা মেনু দেখুন",
      vendorCta: "ভেন্ডর হিসেবে যুক্ত হোন",
      trustVerifiedTitle: "অ্যাডমিন-যাচাইকৃত মেনু",
      trustVerifiedSub: "সেরা লোকাল কিচেন",
      trustTrackingTitle: "লাইভ কিচেন ট্র্যাকিং",
      trustTrackingSub: "চুলা থেকে দরজা পর্যন্ত",
      trustCodTitle: "ক্যাশ অন ডেলিভারি",
      trustCodSub: "ঢাকা, চট্টগ্রাম ও সিলেট",
      ovenCardTitle: "৪৮০°C ব্রিক-ওভেন ক্রাফট",
      ovenCardSubtitle:
        "৪৮ ঘণ্টা ফার্মেন্টেড ডো · বাংলাদেশের স্থানীয় কিচেনে অর্ডারমতো তাজা বেকড",
      ovenCardBadge: "ক্যাশ অন ডেলিভারি",
      searchPlaceholder:
        "পিৎজা, টপিং বা কিচেন খুঁজুন (যেমন: Margherita, Diavola, Dhanmondi)...",
      searchAria: "নাম দিয়ে পিৎজা খুঁজুন",
      clearSearchAria: "সার্চ মুছুন",
      findPizzaBtn: "পিৎজা খুঁজুন",
      popularLabel: "জনপ্রিয়:",
      suggestionMatching: "মিলে যাওয়া পিৎজা ও কিচেন",
      suggestionPopular: "জনপ্রিয় সার্চ",
      popularBadge: "জনপ্রিয়",
      categoryBadge: "ক্যাটাগরি",
    },
    home: {
      featuredHeading: "স্থানীয় ইটের চুলার সেরা আয়োজন",
      featuredSubheading:
        "অনুমোদিত PizzaHub কিচেনে অর্ডার পাওয়ার পরপরই তাজা বেক করা সিগনেচার মার্গেরিটা, ঝাল দিয়াভোলা এবং গরম সাইডস।",
      viewFullMenu: "সম্পূর্ণ মেনু দেখুন",
      featuredErrorTitle: "ফিচার্ড মেনু লোড করা যায়নি",
      retry: "আবার চেষ্টা করুন",
      noFeaturedHeading: "এখনও কোনো অনুমোদিত পিৎজা প্রকাশিত হয়নি",
      noFeaturedDesc:
        "স্থানীয় কিচেনগুলো শীঘ্রই তাদের অনুমোদিত মেনু প্রকাশ করবে। কিছুক্ষণ পর আবার দেখুন অথবা মেনু পেজ ঘুরে দেখুন।",
      categoriesHeading: "পছন্দের ক্যাটাগরি বেছে নিন",
      categoriesSubheading:
        "সন্ধ্যার আড্ডা কিংবা পারিবারিক ডিনারের জন্য ক্লাসিক নেপোলিটান পিৎজা, স্পাইসি মিট লাভার্স, গুরমেট ট্রাফল, গার্লিক নটস এবং ঠান্ডা পানীয়।",
      howHeading: "কীভাবে PizzaHub কাজ করে",
      howSubheading:
        "পাড়ার সেরা ওভেন খুঁজে পাওয়া থেকে শুরু করে গরম পিৎজা হাতে পাওয়া পর্যন্ত তিনটি সহজ ধাপ।",
      stepLabel: "ধাপ",
      steps: [
        {
          title: "যাচাইকৃত লোকাল মেনু খুঁজুন",
          description:
            "ক্যাটাগরি, এলাকা (ধানমন্ডি, বনানী, গুলশান, উত্তরা, জিইসি) অথবা দাম অনুযায়ী অনুমোদিত পিৎজা ও সাইডস বাছাই করুন।",
        },
        {
          title: "ডেলিভারির তারিখ ও ঠিকানা দিন",
          description:
            "আজকের ডিনার বা আগামী অনুষ্ঠানের তারিখ নির্বাচন করুন, বাসার ঠিকানা লিখুন এবং ক্যাশ অন ডেলিভারিতে অর্ডার দিন।",
        },
        {
          title: "লাইভ অর্ডার স্ট্যাটাস দেখুন",
          description:
            "অপেক্ষমাণ থেকে গৃহীত, প্রস্তুত হচ্ছে এবং ডেলিভারির পথে — প্রতিটি ধাপ ড্যাশবোর্ডে দেখুন, অথবা গৃহীত হওয়ার আগে বাতিল করুন।",
        },
      ],
      showcaseHeading: "জ্বলন্ত ব্রিক-ওভেন কিচেন থেকে আপনার পাড়ার টেবিলে",
      showcaseSubheading:
        "ঢাকা, চট্টগ্রাম ও সিলেটের আসল উড-ফায়ারড পিৎজারিয়া ও আর্টিজান কিচেনের সাথে আমাদের পথচলা — যেখানে প্রতিটি পিৎজা হাতে তৈরি হয়।",
      dinerHeading: "পিৎজা প্রেমীদের জন্য কেন সেরা PizzaHub",
      dinerSubheading:
        "সহজ অর্ডার প্রক্রিয়া, অ্যাডমিন-যাচাইকৃত মেনু এবং স্বচ্ছ ডেলিভারি ট্র্যাকিং — কোনো লুকানো ঝামেলা ছাড়াই।",
      dinerBenefits: [
        "শুধুমাত্র অ্যাডমিন অনুমোদিত ও সক্রিয় মেনু আইটেমগুলো পাবলিক মেনুতে দেখানো হয়।",
        "পিৎজা ক্যাটাগরি, এলাকা এবং দাম অনুযায়ী দ্রুত ফিল্টার করার সুবিধা।",
        "একই দিনে একই আইটেমের ভুল ডুপ্লিকেট অর্ডার স্বয়ংক্রিয়ভাবে রোধ করা হয়।",
        "বাসায় পিৎজা পৌঁছে ক্যাশ অন ডেলিভারি দিন, অথবা কিচেন গ্রহণের আগে পেন্ডিং অর্ডার বাতিল করুন।",
      ],
      vendorHeading: "স্থানীয় রেস্তোরাঁ ও পিৎজারিয়াগুলোর জন্য নির্মিত",
      vendorSubheading:
        "কয়েক মিনিটেই আপনার রেস্তোরাঁর প্রোফাইল খুলুন, সিগনেচার পিৎজা যুক্ত করুন এবং ভেন্ডর ড্যাশবোর্ড থেকে অর্ডার পরিচালনা করুন।",
      vendorBenefits: [
        "ফ্রি প্ল্যানে কোনো খরচ ছাড়াই একসাথে সর্বোচ্চ ৩টি সক্রিয় মেনু আইটেম প্রকাশ করুন।",
        "প্রিমিয়াম প্ল্যানে আনলিমিটেড সক্রিয় মেনু, প্রিমিয়াম ব্যাজ এবং সার্চে অগ্রাধিকার পান।",
        "ডেডিকেটেড ভেন্ডর ড্যাশবোর্ড থেকে কাস্টমারের অর্ডার গ্রহণ, প্রস্তুতি ও ডেলিভারি আপডেট করুন।",
      ],
      registerVendorCta: "ভেন্ডর হিসেবে রেজিস্টার করুন",
      vendorSignIn: "ভেন্ডর সাইন ইন",
      finalCtaHeading: "আজ রাতে আসল ব্রিক-ওভেন পিৎজা হোক?",
      finalCtaSubheading:
        "ঢাকা, চট্টগ্রাম ও সিলেটের অনুমোদিত কিচেনগুলোর মেনু দেখুন অথবা এক মিনিটেই কাস্টমার বা ভেন্ডর অ্যাকাউন্ট খুলুন।",
      createAccount: "অ্যাকাউন্ট খুলুন",
    },
    menu: {
      pageHeading: "আর্টিজান পিৎজা ও কিচেন মেনু",
      pageSubheading:
        "বাংলাদেশের স্থানীয় কিচেনগুলোর অনুমোদিত উড-ফায়ারড পিৎজা, গার্লিক নটস এবং পানীয় ক্যাটাগরি, এলাকা বা দাম অনুযায়ী খুঁজুন।",
      searchPlaceholder: "পিৎজা, টপিং বা কিচেন খুঁজুন (ফোকাস করতে / চাপুন)...",
      searchAria: "নাম দিয়ে পিৎজা মেনু খুঁজুন",
      clearSearchAria: "সার্চ মুছুন",
      suggestionHeader: "মিলে যাওয়া মেনু আইটেম",
      allLocations: "সব এলাকা",
      filterLocationAria: "এলাকা অনুযায়ী ফিল্টার করুন",
      sortAria: "মেনু সাজান",
      sortFeatured: "ফিচার্ড প্রথমে",
      sortPriceAsc: "দাম: কম থেকে বেশি",
      sortPriceDesc: "দাম: বেশি থেকে কম",
      sortNewest: "নতুন আইটেম",
      allCategories: "সব ক্যাটাগরি",
      updatingMenu: "মেনু আপডেট হচ্ছে...",
      itemShown: "টি আইটেম দেখানো হচ্ছে",
      itemsShown: "টি আইটেম দেখানো হচ্ছে",
      searchFilterPrefix: "সার্চ",
      resetFilters: "ফিল্টার রিসেট",
      resetAllFilters: "সব ফিল্টার রিসেট করুন",
      clearSearch: "সার্চ মুছুন",
      serviceUnavailable: "মেনু সার্ভিস সাময়িকভাবে বন্ধ",
      retryConnection: "পুনরায় সংযোগ করুন",
      emptyCatalogHeading: "এখনও কোনো অনুমোদিত পিৎজা প্রকাশিত হয়নি",
      emptyCatalogDesc:
        "স্থানীয় কিচেনগুলো নতুন আইটেম যোগ ও অনুমোদন পেলেই এখানে দেখা যাবে।",
      noMatchSearchPrefix: "কোনো পিৎজা পাওয়া যায়নি:",
      noMatchSearchDesc:
        "আপনার সার্চের সাথে মিলে এমন কোনো পিৎজা পাওয়া যায়নি। বানান যাচাই করুন অথবা নিচের জনপ্রিয় ক্যাটাগরিগুলো দেখুন:",
      noMatchFilterHeading: "মিলে যাওয়া কোনো আইটেম নেই",
      noMatchFilterDesc:
        "আপনার বর্তমান ফিল্টারে কোনো অনুমোদিত আইটেম পাওয়া যায়নি। সব পিৎজা দেখতে ফিল্টার রিসেট করুন।",
      page: "পৃষ্ঠা",
      of: "এর মধ্যে",
      previous: "পূর্ববর্তী",
      next: "পরবর্তী",
      premiumBadge: "প্রিমিয়াম",
      premiumKitchen: "প্রিমিয়াম কিচেন",
      available: "পাওয়া যাচ্ছে",
      unavailable: "পাওয়া যাচ্ছে না",
      viewDetails: "বিস্তারিত দেখুন",
      addCompact: "যোগ করুন",
      addToCart: "কার্টে যোগ করুন",
      added: "যোগ হয়েছে",
      addedToastTitle: "কার্টে যোগ করা হয়েছে",
      viewCartAction: "কার্ট দেখুন",
      backToMenu: "মেনুতে ফিরে যান",
      preparedBy: "প্রস্তুতকারক:",
      quantity: "পরিমাণ",
      orderNowPrefix: "এখনই অর্ডার করুন",
      codLabel: "ক্যাশ অন ডেলিভারি",
      signInPrompt: "অর্ডার সম্পন্ন করতে চান?",
      signInCustomerLink: "কাস্টমার হিসেবে সাইন ইন করুন",
      signInPromptSuffix: "চেকআউট করতে।",
      ownKitchenNotice: "আপনি নিজের ভেন্ডর কিচেন থেকে অর্ডার করতে পারবেন না।",
      vendorRoleNotice: "ভেন্ডর অ্যাকাউন্ট থেকে পিৎজা অর্ডার করা যায় না।",
      vendorRoleSub:
        "অর্ডার করতে কাস্টমার অ্যাকাউন্টে সাইন ইন করুন, অথবা ড্যাশবোর্ড থেকে কিচেন পরিচালনা করুন।",
      goVendorDashboard: "ভেন্ডর ড্যাশবোর্ডে যান",
      adminRoleNotice: "অ্যাডমিন অ্যাকাউন্ট থেকে অর্ডার করা যায় না।",
      adminRoleSub: "অ্যাডমিন অ্যাকাউন্ট মেনু অনুমোদন, ইউজার ও লেনদেন তদারকি করে।",
      goAdminDashboard: "অ্যাডমিন ড্যাশবোর্ডে যান",
      directOrderTitle: "সরাসরি পিৎজা অর্ডার করুন",
      directOrderDesc:
        "ডেলিভারির তারিখ ও বাসার ঠিকানা নিশ্চিত করুন। ক্যাশ অন ডেলিভারি — অগ্রিম কার্ড পেমেন্টের প্রয়োজন নেই।",
      customerLabel: "কাস্টমার",
      vendorKitchenLabel: "ভেন্ডর কিচেন",
      selectedItemLabel: "নির্বাচিত আইটেম",
      deliveryDateLabel: "ডেলিভারির তারিখ",
      contactPhoneLabel: "মোবাইল নম্বর",
      phonePlaceholder: "+880 1712-345678",
      deliveryAddressLabel: "ডেলিভারি ঠিকানা",
      addressPlaceholder: "বাড়ি ২৪, রোড ৯/এ, ধানমন্ডি, ঢাকা ১২০৯",
      notesLabel: "বিশেষ নির্দেশনা / ডেলিভারি নোট",
      optional: "ঐচ্ছিক",
      notesPlaceholder: "অতিরিক্ত চিলি ফ্লেক্স, গেটে এসে কল দেবেন...",
      cancelBtn: "বাতিল",
      placingOrder: "অর্ডার পাঠানো হচ্ছে…",
      confirmOrderPrefix: "অর্ডার নিশ্চিত করুন",
      orderSentTitle: "অর্ডার অনুরোধ পাঠানো হয়েছে!",
      orderSentDescPrefix: "আপনার অর্ডার",
      orderSentDescMiddle: "এখন অনুমোদনের অপেক্ষায় রয়েছে — কিচেন:",
      dishLabel: "আইটেম",
      paymentLabel: "পেমেন্ট",
      trackOrderStatus: "অর্ডার স্ট্যাটাস ট্র্যাক করুন",
      viewMyOrders: "আমার অর্ডারসমূহ দেখুন",
    },
    cart: {
      title: "আপনার কার্ট",
      clearCart: "কার্ট খালি করুন",
      drawerDesc: "চেকআউটের আগে নির্বাচিত পিৎজা ও পরিমাণ যাচাই করে নিন।",
      emptyHeading: "আপনার কার্ট খালি",
      emptyDesc:
        "অর্ডার শুরু করতে অনুমোদিত লোকাল কিচেন থেকে উড-ফায়ারড পিৎজা ও সাইডস যোগ করুন।",
      subtotalLabel: "আনুমানিক সাবটোটাল",
      itemsWord: "টি আইটেম",
      itemWord: "টি আইটেম",
      totalLabel: "আনুমানিক মোট",
      codNote:
        "ডেলিভারি হাতে পেয়ে ক্যাশ অন ডেলিভারিতে পরিশোধ করুন। চেকআউটে মেনুর প্রাপ্যতা ও মূল্য নিশ্চিত করা হয়।",
      checkingAccount: "অ্যাকাউন্ট যাচাই হচ্ছে...",
      signInCheckout: "চেকআউট করতে সাইন ইন করুন",
      proceedCheckout: "চেকআউটে এগিয়ে যান",
      customerOnlyNotice: "শুধুমাত্র সাইন-ইন করা কাস্টমার অ্যাকাউন্ট পিৎজা অর্ডার করতে পারে।",
    },
    checkout: {
      heading: "চেকআউট ও ডেলিভারি টিকিট",
      subheading:
        "আপনার ডেলিভারি ঠিকানা ও মোবাইল নম্বর দিন এবং অর্ডার পাঠানোর আগে আইটেমগুলো মিলিয়ে নিন।",
      customerInfoHeading: "কাস্টমারের তথ্য",
      nameLabel: "নাম",
      emailLabel: "ইমেইল",
      deliveryDetailsHeading: "ডেলিভারি ও যোগাযোগের তথ্য",
      deliveryDateLabel: "ডেলিভারির তারিখ",
      deliveryAddressLabel: "ডেলিভারি ঠিকানা",
      addressPlaceholder: "বাড়ি ২৪, রোড ৯/এ, ফ্ল্যাট ৪বি, ধানমন্ডি, ঢাকা ১২০৯",
      contactPhoneLabel: "মোবাইল নম্বর",
      phonePlaceholder: "যেমন: +880 1712-345678",
      orderNotesLabel: "অর্ডার নোট (ঐচ্ছিক)",
      notesPlaceholder: "বাসার ল্যান্ডমার্ক, ইন্টারকম নম্বর বা অতিরিক্ত ন্যাপকিনের নির্দেশনা",
      paymentMethodLabel: "পেমেন্ট পদ্ধতি",
      codTitle: "ক্যাশ অন ডেলিভারি (COD)",
      selectedBadge: "নির্বাচিত",
      codDesc:
        "গরম পিৎজা আপনার দরজায় পৌঁছালে সরাসরি নগদে পরিশোধ করুন। অগ্রিম অনলাইন কার্ড পেমেন্টের প্রয়োজন নেই।",
      verifyingBtn: "যাচাই ও অর্ডার সম্পন্ন হচ্ছে...",
      placeOrderPrefix: "অর্ডার সম্পন্ন করুন (ক্যাশ অন ডেলিভারি",
      summaryHeading: "কিচেন অর্ডার টিকিট",
      subtotal: "আনুমানিক সাবটোটাল",
      total: "সর্বমোট",
      ratesNote:
        "কিচেনের নির্ধারিত মেনু মূল্য অনুসারে হিসাব করা হয়েছে। ডেলিভারির সময় নগদে মূল্য পরিশোধযোগ্য।",
      confirmedHeading: "অর্ডার নিশ্চিত হয়েছে",
      orderRef: "অর্ডার রেফারেন্স",
      orderedItems: "অর্ডারকৃত আইটেম",
      additionalOrders: "অন্যান্য কিচেনের অর্ডারসমূহ",
      continueBrowsing: "আরও মেনু দেখুন",
      viewOrderTracking: "অর্ডার ট্র্যাকিং দেখুন",
    },
    pricing: {
      heading: "স্বাধীন পিৎজারিয়াগুলোর জন্য সহজ ও স্বচ্ছ প্ল্যান",
      subheadingPrefix: "সম্পূর্ণ ফ্রিতে শুরু করুন একসাথে সর্বোচ্চ",
      subheadingSuffix:
        "টি সক্রিয় মেনু আইটেম নিয়ে। আনলিমিটেড আইটেম, প্রিমিয়াম ব্যাজ এবং সার্চে অগ্রাধিকার পেতে যেকোনো সময় Stripe Checkout-এর মাধ্যমে PizzaHub Premium-এ আপগ্রেড করুন।",
      vendorReqTitle: "সাবস্ক্রিপশন কেনার জন্য ভেন্ডর অ্যাকাউন্ট প্রয়োজন",
      freeBadge: "ফ্রি কিচেন টিয়ার",
      currentPlanBadge: "আপনার বর্তমান প্ল্যান",
      cancellingSoonBadge: "মেয়াদ শেষে বন্ধ হবে",
      freeTitle: "ফ্রি প্ল্যান",
      freeDesc:
        "ঢাকা, চট্টগ্রাম বা সিলেটে নতুন কিচেন ও নির্বাচিত সিগনেচার মেনুর জন্য আদর্শ।",
      perMonth: "/ মাস",
      freeForever: "· আজীবন ফ্রি",
      whatsIncluded: "যা যা থাকছে:",
      startFreeVendor: "ভেন্ডর হিসেবে ফ্রিতে শুরু করুন",
      mostPopular: "সবচেয়ে জনপ্রিয়",
      premiumBadge: "PizzaHub প্রিমিয়াম",
      premiumTitle: "প্রিমিয়াম প্ল্যান",
      premiumDesc: "ব্যস্ত পিৎজারিয়া, বড় মেনু এবং দ্রুত ডেলিভারি সম্প্রসারণের জন্য তৈরি।",
      billedStripe: "· Stripe-এর মাধ্যমে মাসিক বিলিং",
      cancelAnytime: "যেকোনো সময় বাতিলযোগ্য · নিরাপদ Stripe Checkout",
      everythingInFree: "ফ্রি প্ল্যানের সবকিছু, সাথে আরও:",
      joinVendorUpgrade: "আপগ্রেড করতে ভেন্ডর হিসেবে যুক্ত হোন",
      viewSubDetails: "সাবস্ক্রিপশন বিস্তারিত দেখুন",
      upgradePremium: "প্রিমিয়ামে আপগ্রেড করুন",
      renewPremium: "প্রিমিয়াম প্ল্যান নবায়ন করুন",
      vendorOnlyBtn: "শুধুমাত্র ভেন্ডর অ্যাকাউন্টের জন্য",
      comparisonHeading: "বিস্তারিত ফিচার তুলনা",
      comparisonSubheading: "ফ্রি এবং প্রিমিয়াম ভেন্ডর প্ল্যানের প্রতিটি সুবিধা তুলনা করুন।",
      featureCol: "ফিচার ও সুবিধা",
      faqHeading: "কিচেন পার্টনারদের সচরাচর জিজ্ঞাসিত প্রশ্ন",
      faqSubheading:
        "সক্রিয় আইটেম সীমা, অ্যাডমিন অনুমোদন এবং বিলিং সম্পর্কে প্রয়োজনীয় তথ্য।",
      bottomHeading: "আপনার কিচেনের সেরা পিৎজা শহরে পৌঁছে দিতে প্রস্তুত?",
      bottomSubheading:
        "আজই PizzaHub-এ যুক্ত হোন। ফ্রি প্ল্যানে প্রথম ৩টি পিৎজা প্রকাশ করুন অথবা আনলিমিটেড মেনুর জন্য প্রিমিয়ামে আপগ্রেড করুন।",
      becomeVendorFree: "ফ্রিতে ভেন্ডর হোন",
      browseCustomerMenu: "কাস্টমার মেনু দেখুন",
      goKitchenDashboard: "কিচেন ড্যাশবোর্ডে যান",
      subSettings: "সাবস্ক্রিপশন সেটিংস",
      returnDashboard: "আপনার ড্যাশবোর্ডে ফিরে যান",
    },
    auth: {
      backToHome: "হোমে ফিরে যান",
      footerTagline: "ঢাকা, চট্টগ্রাম ও সিলেটের যাচাইকৃত ব্রিক-ওভেন পিৎজারিয়া।",
      signInTitle: "আবার স্বাগতম",
      signInDesc:
        "অর্ডার ট্র্যাক করতে অথবা আপনার রেস্তোরাঁর মেনু পরিচালনা করতে ইমেইল বা Google দিয়ে সাইন ইন করুন।",
      signInHeroHeadline: "ইটের চুলা থেকে গরম গরম সরাসরি আপনার দরজায়।",
      signInHeroSub:
        "চলমান ডেলিভারি ট্র্যাক করতে, প্রিয় পিৎজা পুনরায় অর্ডার করতে বা কিচেন সামলাতে সাইন ইন করুন।",
      needAccount: "অ্যাকাউন্ট নেই?",
      signUpLink: "রেজিস্টার করুন",
      signUpTitle: "নতুন অ্যাকাউন্ট খুলুন",
      signUpDesc:
        "তাজা পিৎজা অর্ডার করতে কাস্টমার হিসেবে অথবা আপনার রেস্তোরাঁর মেনু প্রকাশ করতে ভেন্ডর হিসেবে যুক্ত হোন।",
      signUpHeroHeadline:
        "পিৎজা প্রেমী ও স্থানীয় কিচেনগুলোর জন্য একটিই নির্ভরযোগ্য ঠিকানা।",
      signUpHeroSub:
        "কয়েক সেকেন্ডেই কাস্টমার বা ভেন্ডর হিসেবে রেজিস্টার করুন — তাজা ক্রাস্ট, ক্যাশ অন ডেলিভারি ও লাইভ আপডেট।",
      alreadyRegistered: "আগে থেকেই অ্যাকাউন্ট আছে?",
      signInLink: "সাইন ইন করুন",
      emailLabel: "ইমেইল ঠিকানা",
      emailPlaceholder: "tariqul@example.com",
      passwordLabel: "পাসওয়ার্ড",
      passwordPlaceholder: "আপনার পাসওয়ার্ড লিখুন",
      createPasswordPlaceholder: "শক্তিশালী পাসওয়ার্ড দিন",
      confirmPasswordLabel: "পাসওয়ার্ড নিশ্চিত করুন",
      confirmPasswordPlaceholder: "পাসওয়ার্ডটি পুনরায় লিখুন",
      rememberMe: "এই ডিভাইসে আমাকে মনে রাখুন",
      signingIn: "সাইন ইন হচ্ছে…",
      orContinueWith: "অথবা চালিয়ে যান",
      newToPizzaHub: "PizzaHub-এ নতুন?",
      createAnAccount: "নতুন অ্যাকাউন্ট খুলুন",
      accountType: "অ্যাকাউন্টের ধরন",
      customerRoleTitle: "কাস্টমার",
      customerRoleSub: "মেনু দেখুন ও পিৎজা অর্ডার করুন",
      vendorRoleTitle: "ভেন্ডর",
      vendorRoleSub: "কিচেন ও অর্ডার পরিচালনা করুন",
      fullNameLabel: "পূর্ণ নাম",
      fullNamePlaceholder: "তারিকুল ইসলাম",
      businessNameLabel: "রেস্তোরাঁ / প্রতিষ্ঠানের নাম",
      businessNamePlaceholder: "বনানী ব্রিক ওভেন পিৎজারিয়া",
      profileImageLabel: "প্রোফাইল ছবির লিংক (URL)",
      profileImagePlaceholder: "https://example.com/avatar.jpg (ঐচ্ছিক)",
      ruleMinChars: "কমপক্ষে ৬ অক্ষর",
      ruleUpper: "১টি বড় হাতের অক্ষর",
      ruleLower: "১টি ছোট হাতের অক্ষর",
      passwordsMatch: "পাসওয়ার্ড মিলেছে",
      creatingAccount: "অ্যাকাউন্ট তৈরি হচ্ছে…",
      createVendorAccount: "ভেন্ডর অ্যাকাউন্ট তৈরি করুন",
      createCustomerAccount: "কাস্টমার অ্যাকাউন্ট তৈরি করুন",
      alreadyHaveAccount: "ইতিমধ্যে অ্যাকাউন্ট আছে?",
    },
    dashboard: {
      storefrontSection: "স্টোরফ্রন্ট",
      backToHome: "হোমে ফিরে যান",
      welcomeBack: "স্বাগতম",
      customerPortal: "কাস্টমার পোর্টাল",
      customerAccount: "কাস্টমার অ্যাকাউন্ট",
      overview: "ওভারভিউ",
      myOrders: "আমার অর্ডার",
      checkout: "চেকআউট",
      accountSettings: "অ্যাকাউন্ট সেটিংস",
      profile: "প্রোফাইল",
      myMenuItems: "আমার মেনু আইটেম",
      addPizza: "পিৎজা যোগ করুন",
      incomingOrders: "আগত অর্ডার",
      subscription: "সাবস্ক্রিপশন",
      vendorPricing: "ভেন্ডর প্ল্যান",
      publicMenu: "পাবলিক মেনু",
      freePlan: "ফ্রি প্ল্যান",
      premiumPlan: "প্রিমিয়াম প্ল্যান",
      adminPortal: "PizzaHub অ্যাডমিন",
      administrator: "অ্যাডমিনিস্ট্রেটর",
      menuModeration: "মেনু অনুমোদন",
      moderationShort: "মডারেশন",
      userManagement: "ইউজার ম্যানেজমেন্ট",
      transactions: "লেনদেনসমূহ",
      refresh: "রিফ্রেশ",
      orderMore: "আরও অর্ডার করুন",
      orderDetails: "বিস্তারিত",
      cancelOrder: "বাতিল",
      allOrders: "সব অর্ডার",
      inProgress: "চলমান",
    },
    footer: {
      description:
        "ঢাকা, চট্টগ্রাম ও সিলেটের পিৎজা প্রেমীদের সাথে স্বাধীন ব্রিক-ওভেন কিচেনগুলোর মেলবন্ধন — সহজ অর্ডার, ক্যাশ অন ডেলিভারি এবং লাইভ ডেলিভারি ট্র্যাকিং।",
      exploreHeading: "এক্সপ্লোর",
      partnerHeading: "পার্টনার ও অ্যাকাউন্ট",
      contactHeading: "ঢাকা হাব ও সাপোর্ট",
      vendorPricingPlans: "ভেন্ডর প্ল্যান ও মূল্য",
      becomeVendor: "ভেন্ডর হিসেবে যুক্ত হোন",
      myDashboard: "আমার ড্যাশবোর্ড",
      addressLine: "গুলশান-২, ঢাকা ১২১২ · ঢাকা, চট্টগ্রাম ও সিলেটে সেবা চালু",
      hoursLine: "প্রতিদিন ব্রিক-ওভেন ডেলিভারি · সকাল ১১:৩০ – রাত ১১:৩০",
      rights: "© ২০২৬ PizzaHub বাংলাদেশ। সর্বস্বত্ব সংরক্ষিত।",
      platformNote: "আর্টিজান উড-ফায়ারড পিৎজা অর্ডার ও ডেলিভারি প্ল্যাটফর্ম।",
    },
  },
} as const;

export type TranslationDictionary = (typeof TRANSLATIONS)[Locale];
