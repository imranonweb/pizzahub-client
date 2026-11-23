# PizzaHub — Hot & Fresh Pizza Ordering & Delivery Platform (Client)

PizzaHub is a full-stack, multi-role pizza marketplace and delivery platform built with **Next.js (App Router)**, **React 19**, **Tailwind CSS v4**, **Better Auth**, and **Stripe**, connected to the PizzaHub **Express.js + MongoDB** REST API.

Customers can discover wood-fired pizzas from local approved kitchens, customize orders with a delivery date, and track preparation status in real time. Vendors manage their menus (with Free tier 3-item active slot limits and Stripe-powered Premium upgrades) and fulfill incoming orders. Administrators moderate menu submissions, manage user accounts, and audit platform transactions.

---

## Live Links & Repositories

- **Client Live URL:** _Add your deployed Vercel / Netlify URL here_
- **Server API URL:** _Add your deployed Express API URL here_
- **Client Repository:** `pizza-hub-client`
- **Server Repository:** `PizzaHub-server`

---

## Key Features

### Public Storefront & Discovery
- **Homepage:** Branded hero with live menu search bar, quick category chips, featured menu grid (6 live approved pizzas fetched from `GET /api/menu?sort=featured&limit=6`), how-it-works guide, vendor call-to-action, and footer.
- **Browse Menu (`/menu`):** Debounced keyword search, exact category filter, dynamic vendor location filter, price sorting (`featured`, `price-asc`, `price-desc`, `newest`), active filter pills, URL-synchronized query state, and server-side pagination.
- **Pizza Details (`/menu/[id]`):** Validated 24-character MongoDB ObjectId routing, photo gallery, ingredients, vendor storefront metadata, quantity selector, and Add-to-Cart action.
- **Vendor Pricing (`/pricing`):** Transparent Free vs. Premium vendor plan comparison synced with `GET /api/vendor/subscription/plans`.

### Customer Experience (`/dashboard/customer`)
- **Dashboard Overview:** Live **Total, Pending, Accepted, and Rejected** order stat cards, interactive **Order Status Breakdown** visual chart, current cart snapshot, and recent order feed.
- **Persistent Cart & Checkout (`/checkout`):** Slide-over cart drawer persisted in local storage, single-vendor order validation, delivery address, contact phone, **delivery date picker** (`YYYY-MM-DD`, non-past validation), and order notes.
- **Order History & Tracking (`/dashboard/customer/orders` & `/dashboard/customer/orders/[id]`):** Filterable order history, cancellation action for pending orders (`PATCH /api/orders/:id/cancel`), and an interactive **Order Status Timeline** (`Pending → Accepted → Preparing → Ready → Out for Delivery → Delivered`).
- **Profile & Security (`/profile` & `/dashboard/customer/settings`):** Avatar/name updates, saved contact phone & delivery address (`GET/PATCH /api/profile`), and password management.

### Vendor Experience (`/dashboard/vendor`)
- **Vendor Overview:** Live KPI cards for **Total Menu Items, Active Items, Pending Approvals, Rejected Items, Pending Customer Orders, and Accepted Orders**, Free plan slot progress bar, and two visual distribution charts (**Menu Status Breakdown** & **Incoming Order Status**).
- **Menu Manager (`/dashboard/vendor/menu` & `/dashboard/vendor/add`):** Full CRUD for pizza listings, ImgBB photo uploads (`/api/upload/image`), active/inactive status toggle enforcing the Free plan limit (max 3 active approved items), and admin rejection feedback display.
- **Incoming Orders (`/dashboard/vendor/orders`):** View customer orders with delivery dates and transition statuses (`Accept`, `Reject`, `Start Preparing`, `Mark Ready`) via `PATCH /api/vendor/orders/:id/status`.
- **Subscriptions & Stripe Checkout (`/dashboard/vendor/subscription`):** View live plan status, upgrade via Stripe Hosted Checkout (`POST /api/vendor/subscription/checkout`), open Stripe Billing Portal (`POST /api/vendor/subscription/portal`), and return cleanly through `/payment/success` and `/payment/cancel`.
- **Vendor Profile Settings (`/dashboard/vendor/profile`):** Manage kitchen/restaurant name (`businessName`), contact phone, kitchen address (`PATCH /api/profile`), personal avatar/name, and account password.

### Admin Experience (`/dashboard/admin`)
- **Admin Overview:** Live platform KPIs (**Total Users, Vendors, Customers, Total Menu Items, Pending Approvals, Total Transactions & Paid Revenue**) plus **Account Distribution** and **Menu Moderation Breakdown** charts.
- **Menu Moderation (`/dashboard/admin/menu`):** Inspect submissions and **Approve**, **Reject** (with reason), **Deactivate**, or **Delete** menu listings (`PATCH /api/admin/menu/:id/status`, `DELETE /api/admin/menu/:id`).
- **User Management (`/dashboard/admin/users`):** Search and filter all accounts and toggle **Block / Unblock** status (`PATCH /api/admin/users/:id/block`, with self-lockout safeguards).
- **Platform Transactions (`/dashboard/admin/transactions`):** Strictly read-only subscription payment ledger (`GET /api/admin/transactions`) with search, status/plan/sort filters, revenue summary, and server-side pagination.

### Cross-Cutting & Optional Features
- **Live Notification Center (`/notifications` & Navbar Bell):** Role-aware notification popover and full inbox backed by `/api/notifications`, unread badge polling, individual mark-as-read, and mark-all-read mutations.
- **Optional Feature #2 — Dark / Light Mode Toggle:** Accessible theme switcher in the public navbar and all three dashboard shells (persisted in `localStorage`, respects `prefers-color-scheme`, uses custom warm charcoal `.dark` theme tokens).
- **Optional Feature #3 — Order Status Timeline:** Visual step-by-step order progress tracker displaying timestamps and kitchen notes for every status transition.
- **Custom Error & Loading UX:** Branded `not-found.tsx` (404), `error.tsx` boundary with retry action, and `loading.tsx` route loader.

---

## Tech Stack & Key Packages

| Category | Packages / Tools |
| --- | --- |
| Framework | `next` (`16.4.6`), `react` (`19.3.0`), `react-dom` (`19.3.0`), TypeScript 5 |
| Styling & UI | `tailwindcss` (`4.3.3`), `shadcn`, `@base-ui/react`, `lucide-react`, `motion`, `class-variance-authority`, `tw-animate-css` |
| Auth & Database | `better-auth` (`1.7.27`, JWT/JWKS + Google OAuth + Email/Password), `@better-auth/mongo-adapter`, `mongodb` |
| Code Quality | `@biomejs/biome` (`2.4.2`) |

---

## Challenge Highlights

### Challenge 1 — Server-Side Search, Multi-Filter & Price Sorting
The menu catalog (`/menu`) synchronizes `search`, `category`, `location`, `sort`, and `page` directly with URL search parameters and queries the Express backend at `GET /api/menu`:
- Debounces search typing (300ms) before issuing network requests and aborts stale fetches.
- Supports `sort=featured`, `sort=price-asc`, `sort=price-desc`, and `sort=newest` directly on MongoDB queries.
- Displays live active filter pills with one-click clear actions and server-driven pagination metadata (`page`, `totalPages`, `hasNextPage`, `hasPrevPage`).

### Challenge 2 — Better Auth JWT (EdDSA JWKS) Verification Across Client & Express Server
Authentication uses **Better Auth** mounted on Next.js (`/api/auth/[...all]`) with the `jwt()` plugin:
1. Users authenticate via Email/Password or Google OAuth, receiving an HTTP-only Better Auth session cookie.
2. When calling protected Express endpoints (`/api/orders`, `/api/vendor/*`, `/api/admin/*`, `/api/notifications`, `/api/profile`), the client requests a short-lived EdDSA JWT via `authClient.token()` and attaches `Authorization: Bearer <token>`.
3. The Express backend verifies the token signature cryptographically against Better Auth's public JWKS endpoint (`${BETTER_AUTH_URL}/api/auth/jwks`) using `jose`, checks `user.isBlocked` in MongoDB, and enforces role-based guards (`customer`, `vendor`, `admin`).
4. Next.js route protection (`src/proxy.ts`) + server layouts enforce role isolation and redirect unauthorized users cleanly.

---

## Local Setup & Running Locally

### Prerequisites
- Node.js `>= 20.9.0`
- Running MongoDB database (shared with `PizzaHub-server`)
- Running Express API (`PizzaHub-server`, default `http://localhost:5000`)

### 1. Install Dependencies
```bash
cd pizza-hub-client
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` and fill in your values:

```env
BETTER_AUTH_SECRET=<random-32-plus-char-secret>
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_TRUSTED_ORIGINS=http://localhost:3000

DB_URI=mongodb+srv://<user>:<password>@<cluster>/<db>
DB_NAME=pizzahub

GOOGLE_CLIENT_ID=<optional-google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<optional-google-oauth-client-secret>

NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

IMGBB_API_KEY=<imgbb-api-key-for-pizza-photo-uploads>
NEXT_PUBLIC_PREMIUM_MONTHLY_PRICE=29
```

> Never commit `.env` or `.env.local` files containing real credentials.

### 3. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser while the Express API runs at `http://localhost:5000`.

### 4. Production Build & Quality Checks
```bash
npm run lint        # Biome lint & format check
npx tsc --noEmit    # TypeScript strict typecheck
npm run build       # Next.js production build
npm run start       # Serve production build
```

---

## Testing Vendor Subscriptions (Stripe Test Mode)

When testing vendor upgrades to the **Premium** plan from `/dashboard/vendor/subscription` or `/pricing`:
- Ensure `STRIPE_SECRET_KEY`, `STRIPE_PREMIUM_PRICE_ID`, and `STRIPE_WEBHOOK_SECRET` are configured in `PizzaHub-server`.
- Use Stripe's standard test card (`4242 4242 4242 4242`, any future expiry, any 3-digit CVC) on the hosted Stripe Checkout page.
- Upon completion, Stripe redirects to `/payment/success` and delivers the webhook to `/api/webhooks/stripe` to activate the vendor's Premium plan and record the transaction in `/dashboard/admin/transactions`.
