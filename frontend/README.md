# AI Communication — E-Commerce Website (Phase 2)

Online shop for **AI Communication, Shahjahan Electronics Market, Saddar, Karachi**.
Mobile accessories only — earbuds, smartwatches, power banks, speakers, fast
chargers, handsfree. Cash on Delivery across Pakistan. WhatsApp 0335-5186552.

## Stack

- **Next.js 15** (App Router, JavaScript — not TypeScript), React 19, Tailwind CSS v4
- **Backend inside Next.js:** API routes under `src/app/api/...`, Mongoose
  models in `src/models/`, JWT auth in an httpOnly cookie.
- **Database:** MongoDB Atlas (free M0). **Photos:** Cloudinary.
- **DB-or-seed fallback:** when `MONGODB_URI` is not set, the shop reads the
  local seed in `src/lib/products.js` and everything still builds, previews
  and works — checkout keeps its local order + WhatsApp flow, and the admin
  panel shows the launch catalogue read-only with a "DB not connected" note.
  No route crashes and no fake server order is ever created without a DB.

## Run it

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
npm run build      # production build (must pass before any deploy)
npm start          # serve the production build
```

## Environment variables (`.env.local` — never commit)

Copy `.env.example` to `.env.local` and fill it in:

```bash
cp .env.example .env.local
```

| Variable | What it is |
| --- | --- |
| `MONGODB_URI` | MongoDB Atlas connection string (database `ai-communication`) |
| `JWT_SECRET` | Random secret for login cookies — generate with `openssl rand -base64 32` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account (free) |
| `CLOUDINARY_API_KEY` | Cloudinary account |
| `CLOUDINARY_API_SECRET` | Cloudinary account |
| `NEXT_PUBLIC_SITE_URL` | Public URL of the site (e.g. `https://ai-communication.vercel.app`) |

Without `MONGODB_URI` the site runs on the seed (see fallback above).
Without the Cloudinary vars, photo upload returns 503 `upload_not_configured`
and the admin form offers a clearly labelled manual-URL fallback instead.

## Seed the database + make an admin

```bash
# 1. Load the 4 hero products + 6 categories (idempotent — safe to re-run;
#    it never overwrites a price/stock set in the admin panel).
MONGODB_URI="mongodb+srv://..." node scripts/seed.mjs
#    or: node --env-file=.env.local scripts/seed.mjs

# 2. Register an account on the site first, then promote it to admin:
node scripts/make-admin.mjs you@example.com
#    (with .env.local: node --env-file=.env.local scripts/make-admin.mjs you@example.com)
```

There is no default admin account or password anywhere in the code.

## API routes

```
GET  /api/products?category=&brand=&search=&sort=featured|newest|nameAsc|nameDesc&page=&limit=
GET  /api/products/[slug]            + related products (same category)
GET  /api/categories
POST /api/auth/register              {name, email, phone?, password} → 201 + cookie, 409 email exists
POST /api/auth/login                 → httpOnly cookie (7 days), 401 wrong email/password
GET  /api/auth/me                    from cookie — 401 when signed out
POST /api/auth/logout                clears the cookie
POST /api/orders                     guest allowed; server re-prices from DB,
                                     never trusts client totals; returns orderNo
                                     (AIC-0001, …) + prefilled WhatsApp link.
                                     503 orders_db_not_configured without a DB.
GET  /api/orders/my                  signed-in customer's orders
GET  /api/orders/[id]                owner or admin (by _id or orderNo)
GET  /api/admin/stats                totals; totalRevenuePKR null when no prices set
GET  /api/admin/products             list incl. inactive
POST /api/admin/products             create (slug from name, 409 duplicate)
GET  /api/admin/products/[id]        one product (_id or slug)
PATCH/DELETE /api/admin/products/[id]
GET  /api/admin/orders               list
GET  /api/admin/orders/[id]
PATCH /api/admin/orders/[id]         {status} only
GET  /api/admin/users                no password hashes, ever
POST /api/upload                    admin only, image/* ≤ 5 MB → Cloudinary {url}
```

Admin API routes require an admin JWT cookie; `/admin` pages are also
guarded server-side (redirect to `/login` when the DB is configured).

## Project layout

```
frontend/
  src/app/                 App Router pages
    (shop)/                Shop pages with Header + Footer
      page.js              Home — hero, categories, new arrivals, best sellers
      collections/[slug]/  Category pages (earbuds, smartwatches, power-banks,
                           speakers, chargers, handsfree, all)
      product/[slug]/      Product detail (gallery, specs, add to cart)
      checkout/            COD checkout — POSTs /api/orders, falls back to the
                           local order + WhatsApp flow on 503
      order-confirmation/  Order placed → confirm on WhatsApp
      order/[id]/          Order details (server first, local fallback)
      my-orders/           Account orders, or this device's orders for guests
      login/ register/ profile/   Wired to /api/auth/* (cookie only, no localStorage)
    admin/                 Admin (server-guarded when DB is configured)
      page.js              Dashboard — /api/admin/stats, seed counts fallback
      products/            Table (API or seed), Add (new/), Edit ([id]/edit/)
      users/ orders/       API lists, local fallbacks with a note
    api/                   All routes above
  src/components/           Navbar, Footer, Hero, ProductCard/Grid, CartDrawer,
                           CheckoutForm, FilterSidebar, ProductDetails,
                           AdminShell (sidebar), AdminProductForm (add/edit)
  src/lib/
    products.js            4 HERO products only (Zain's choice) — OX-PD10,
                           DV-1089, SY-777, i20 ULTRA MAX SUIT. NO invented
                           prices/specs. pricePKR is null everywhere: the UI
                           shows "WhatsApp for price" until Zain supplies
                           prices. The other 12 products are added by Zain
                           himself from the admin panel.
    catalog.js             Catalogue access — MongoDB when configured, seed
                           otherwise (used by shop pages server-side).
    mongodb.js             Mongoose cached singleton; isDbConfigured()
    auth.js                JWT sign/verify, httpOnly cookie, getSession,
                           requireAuth / requireAdmin
    cloudinary.js          Lazy config + uploadImageBuffer()
    api-helpers.js         json/jsonError, slugify, PAK_PHONE, WhatsApp text
    validation.js          zod schemas (auth, order, product, order status)
    cart-context.jsx       Cart + local orders (localStorage)
    site.js                Shop facts: WhatsApp 0335-5186552, address, links
  src/models/              User, Category, Product, Order (Mongoose)
  scripts/
    seed.mjs               Idempotent seed of the 4 heroes + 6 categories
    make-admin.mjs         Promote a registered user to admin by email
  public/
    brand-banner.jpg       Shop banner (light)
    brand-logo-dark.png    Shop logo (dark)
    products/              Real product photos from Zain
```

## What works without a database vs what needs one

| Feature | No DB (seed mode) | With Atlas + Cloudinary |
| --- | --- | --- |
| Browse, search, filter, product pages | ✅ seed catalogue | ✅ live catalogue |
| Cart, COD checkout, WhatsApp confirm | ✅ local orders | ✅ server orders (AIC-…) |
| Register / login / profile / my orders | ❌ clear 503 / guest flow | ✅ |
| Admin products add/edit/delete + photo upload | ❌ read-only + note | ✅ |
| Admin orders / users / stats | ❌ local/empty + note | ✅ |

## Brand

- Orange `#FF7A1A` · Black `#111418` · Ink `#1A1D21` · Charcoal `#23282E`
- Cream `#F5F1E8` · Paper `#F5F3EF` · White `#FFFFFF`
- Poppins headings (bold, uppercase), Inter body.

## What is NOT done yet

- No PKR prices — every product shows "WhatsApp for price" until Zain sets
  prices in the admin panel.
- No delivery fee — checkout says "Calculated on WhatsApp confirmation".
- No deploy. `vercel.json` from the old Vite app was removed — Next.js on
  Vercel needs no SPA rewrite.

## Deploy (Phase 5)

Single Vercel project, root directory `frontend/`. Set the env vars above in
Vercel → Settings → Environment Variables. Vercel Hobby is for
non-commercial use — a selling shop needs Pro ($20/month, budget from first
sales). Domain attaches in Vercel → Settings → Domains.
