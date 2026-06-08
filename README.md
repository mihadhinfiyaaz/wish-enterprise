# Wish Enterprise — Full-Stack Wholesale & Retail Hanger Catalogue

A production-quality full-stack web app for a hanger wholesaler/retailer, built strictly to the
provided design, with a premium dual theme (Scandinavian light / industrial-luxury dark) and a
real local studio-photo catalogue.

- **Frontend** — React 18 + Vite + Tailwind CSS + React Router
- **Backend** — Node.js + Express REST API
- **Database** — SQLite via Node's built-in `node:sqlite` (no native build step, zero install pain)

The catalogue, filtering, product detail and the "Contact to Order" enquiry flow are all wired end to
end: the UI reads from the API, the API reads/writes SQLite, and enquiries are persisted.

### Dual-theme design system

The UI ships with two distinct, premium identities, switchable from the header toggle:

- **Light — Scandinavian / Nordic showroom**: warm off-white (`#F7F5F2`), generous whitespace,
  soft shadows, natural wood accent, dark charcoal CTAs, elegant `Space Grotesk` display type.
- **Dark — Industrial luxury showroom**: deep charcoal gradient background, titanium-silver text,
  bronze accents and soft glows, elevated surface cards.

Theming is driven by **CSS custom properties (design tokens)** defined in
[`client/src/index.css`](client/src/index.css) and mapped to semantic Tailwind colours
(`bg-surface`, `text-fg`, `text-accent`, `border-line`, …) in
[`tailwind.config.js`](client/tailwind.config.js). The choice is persisted to `localStorage`,
respects the OS `prefers-color-scheme` on first visit, is applied before paint (no flash), and
cross-fades smoothly between themes.

---

## Requirements

- **Node.js ≥ 22.5** (uses the built-in `node:sqlite` module). Tested on Node 24.
- npm (ships with Node).

Check with: `node --version`

---

## Quick start (development)

```bash
cd hanger-co
npm install        # installs client + server, then seeds the database
npm run dev        # starts API (:4000) and Vite client (:5173) together
```

Then open **http://localhost:5173**.

The Vite dev server proxies `/api/*` to the Express server on port 4000, so you only browse the one URL.

## Production / local deployment

```bash
cd hanger-co
npm install
npm run build      # builds the React client into client/dist
npm start          # Express serves the built client + API on ONE port (:4000)
```

Then open **http://localhost:4000**. Express serves the static SPA (with client-side-route fallback)
and the API from the same origin.

---

## Useful scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Run API + client together (hot reload) |
| `npm run dev:server` | Run only the API (`node --watch`) on :4000 |
| `npm run dev:client` | Run only the Vite client on :5173 |
| `npm run build` | Production build of the client |
| `npm start` | Run the API and serve the built client on :4000 |
| `npm run seed` | Seed the DB if empty (idempotent) |
| `npm run seed -w server -- --force` | Wipe & re-seed the DB (also via `npm run seed:reset -w server`) |

### Environment variables (optional)

Server reads these (see `server/.env.example`):

- `PORT` — API port (default `4000`)
- `DB_PATH` — SQLite file path (default `server/data/hanger.db`)

---

## Project structure

```
hanger-co/
├── package.json            # npm workspaces + root scripts (concurrently)
├── server/                 # Express API + SQLite
│   └── src/
│       ├── index.js        # app entry, API mounting, static SPA serving
│       ├── db.js           # node:sqlite connection + schema
│       ├── seed.js         # catalogue data matching the design
│       └── routes/         # categories, products, inquiries, site
└── client/                 # React + Vite + Tailwind
    └── src/
        ├── pages/          # Home, Catalogue (All Hangers), Product, Wholesale, About, Contact
        ├── components/     # Header, Footer, ProductCard, HangerArt (SVG), Stars, …
        ├── context/        # SiteContext (site settings)
        └── lib/            # api client + formatters
```

---

## REST API

Base URL: `/api`

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/health` | Health check |
| `GET` | `/site` | Site settings (company, contact, hours, hero copy) |
| `GET` | `/categories` | Categories with live product counts |
| `GET` | `/products` | Filtered/sorted/paginated list **+ facet counts** |
| `GET` | `/products/:slug` | Single product (with colour options) |
| `GET` | `/products/:slug/related` | Same-category suggestions |
| `POST` | `/inquiries` | Create a "Contact to Order" enquiry (validated) |
| `POST` | `/admin/login` | Admin login (bcrypt, rate-limited) → bearer token |
| `*` | `/admin/*` | Token-protected admin CRUD + inquiry inbox + stats |

### `GET /products` query params

`material` (csv: Wood,Metal,Plastic) · `type` (csv: Suit,Shirt,Trouser,Clip) ·
`setting` (`clip` | `non-clip`) · `category` (slug) · `q` (search) ·
`sort` (`popular`|`price-asc`|`price-desc`|`rating`|`newest`|`name`) · `page` · `pageSize`

Example:

```bash
curl "http://localhost:4000/api/products?material=Wood&type=Suit&sort=price-asc&page=1"
```

### `POST /inquiries` body

```json
{
  "name": "Ava Retailer",
  "email": "ava@boutique.example",
  "phone": "+1 555 0100",
  "company": "Ava's Boutique",
  "productId": 1,
  "quantity": 300,
  "message": "Please send wholesale pricing."
}
```

Returns `201` with the created record, or `422` with field-level `errors`.

---

## Data model

`categories` · `products` · `product_colors` · `inquiries` · `site_settings` · `admin_users`
(see `server/src/db.js`). The catalogue is seeded with 24 products across Wood, Metal, Plastic and
Clip categories. Prices are in **Sri Lankan rupees (LKR)** — each product has a retail price and a
single **wholesale price** (no tiered pricing). All catalogue data is editable from the admin panel.

## Admin panel & security

The admin panel lives at **`/admin`** (linked discreetly in the footer). Sign in with the password from
`ADMIN_PASSWORD` (default `wishadmin`, **change it in production**). It provides a dashboard, full product
& category CRUD, single-image upload, and an inquiry inbox.

Security: passwords are **bcrypt-hashed** in `admin_users`; login is **rate-limited** (5/15 min per IP);
requests use a **token + role** with auth middleware (`requireAdmin` / `requireRole`); all input is
validated. Set `HTTPS=true` to serve over TLS (a self-signed cert is generated if none is supplied; point
`SSL_KEY_FILE`/`SSL_CERT_FILE` at real certs for production).

---

## Notes

- The SQLite file (`server/data/hanger.db`) is git-ignored and regenerated by the seed script.
- Product imagery uses **real local studio photos** in `client/src/assets/products/` (curated from the
  provided `WE product images/` folder — no external/stock assets). [`lib/productImages.js`](client/src/lib/productImages.js)
  clusters them into consistent sets (`{set}-{n}.jpg`; `-1` = primary, `-2..4` = alternate angles) and maps
  each product to its best set. [`ProductImage.jsx`](client/src/components/ProductImage.jsx) shows them on a
  light "studio" niche (`.studio-stage`) that stays light in both themes, blending the white photo background
  via `mix-blend-multiply` (object-contain, uniform padding, lazy load, fade-in, 6% hover zoom). The product
  detail page shows the primary photo plus alternate-angle thumbnails. Decorative SVG renders
  (`HangerRender.jsx`) remain only on the hero/about/404 and as a no-photo fallback.
- WhatsApp / call / maps links are generated from the site settings, with product-specific prefilled
  WhatsApp messages on each product page.
```
