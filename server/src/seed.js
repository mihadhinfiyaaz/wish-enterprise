/**
 * seed.js — populate the database with catalogue data that mirrors the design.
 *
 *   node src/seed.js          → seed only if the catalogue is empty (idempotent)
 *   node src/seed.js --force  → wipe and re-seed
 *
 * Run automatically on `npm install` (root postinstall) and on server boot.
 */
import { pathToFileURL } from 'node:url';
import { db, initSchema, DB_PATH } from './db.js';

/* ──────────────────────────────────────────────────────────────
   Reference data shared across products (specs, colours, tiers)
   ────────────────────────────────────────────────────────────── */
const MATERIAL_SPECS = {
  Wood: {
    detail: 'Solid Wood (Lotus)',
    size: '44.5 cm (L) x 22 cm (W)',
    durability: 'High — Built to last',
    finish: 'Smooth Natural Finish',
    colors: [
      ['Natural', '#b07b4f'],
      ['Walnut', '#5c3a21'],
      ['Mahogany', '#74362b'],
      ['Black', '#1c1c1c'],
      ['White', '#ece8e1'],
    ],
  },
  Metal: {
    detail: 'Chrome-Plated Steel',
    size: '42 cm (L) x 20 cm (W)',
    durability: 'Very High — Heavy-duty steel',
    finish: 'Polished Chrome',
    colors: [
      ['Chrome', '#c8ccce'],
      ['Graphite', '#3a3d40'],
      ['Black', '#1c1c1c'],
      ['Gold', '#c9a24b'],
    ],
  },
  Plastic: {
    detail: 'Recyclable Polypropylene',
    size: '41 cm (L) x 19 cm (W)',
    durability: 'Medium — Everyday use',
    finish: 'Matte Polypropylene',
    colors: [
      ['White', '#f2f2f2'],
      ['Black', '#1c1c1c'],
      ['Clear', '#cfd8dc'],
      ['Blue', '#3b82f6'],
      ['Pink', '#ec4899'],
    ],
  },
};

// Tiered wholesale pricing: per-piece price = retail × factor, cheaper at higher volume.
const PRICE_TIERS = [
  { label: '50 – 99', min_qty: 50, max_qty: 99, factor: 0.65 },
  { label: '150 – 299', min_qty: 150, max_qty: 299, factor: 0.58 },
  { label: '300 – 499', min_qty: 300, max_qty: 499, factor: 0.52 },
  { label: '500+', min_qty: 500, max_qty: null, factor: 0.45 },
];

const money = (n) => Math.round(n * 100) / 100;
// Headline "Wholesale Price" = the entry (smallest-quantity) tier.
const wholesaleBase = (retail) => money(retail * PRICE_TIERS[0].factor);

const CATEGORIES = [
  { slug: 'wood', name: 'Wood Hangers', icon: 'suit', sort_order: 1,
    description: 'Premium solid-wood hangers with a smooth, durable finish — built for suits, shirts and formal wear.' },
  { slug: 'metal', name: 'Metal Hangers', icon: 'trouser', sort_order: 2,
    description: 'Heavy-duty chrome-plated steel hangers for high-volume retail, dry-cleaning and everyday use.' },
  { slug: 'plastic', name: 'Plastic Hangers', icon: 'shirt', sort_order: 3,
    description: 'Lightweight, stackable and cost-effective plastic hangers in a wide range of colours and sizes.' },
  { slug: 'clip', name: 'Clip Hangers', icon: 'clip', sort_order: 4,
    description: 'Adjustable clip hangers with non-slip grips — ideal for trousers, skirts and bottoms.' },
];

/* ──────────────────────────────────────────────────────────────
   Catalogue. Order here defines "Most Popular" (popularity is auto
   assigned 100, 99, 98 … so page one matches the design exactly).
   ────────────────────────────────────────────────────────────── */
const RAW_PRODUCTS = [
  // ── Page 1 — exactly matches the provided design ──
  { sku: 'WH-1001', name: 'Wood Suit Hanger',          material: 'Wood',    type: 'Suit',    style: 'suit',    price: 8.50, rating: 4.8, reviews: 128,
    desc: 'A premium solid-wood suit hanger with a wide, contoured shoulder that protects the structure of jackets and blazers. Finished with a smooth natural coat and a polished chrome swivel hook.' },
  { sku: 'WH-1002', name: 'Wood Shirt Hanger',         material: 'Wood',    type: 'Shirt',   style: 'shirt',   price: 5.20, rating: 4.7, reviews: 96,
    desc: 'Classic wooden shirt hanger with gently rounded shoulders that keep collars crisp and prevent shoulder bumps.' },
  { sku: 'MH-2001', name: 'Metal Suit Hanger',         material: 'Metal',   type: 'Suit',    style: 'suit',    price: 4.90, rating: 4.6, reviews: 74,
    desc: 'Heavy-duty chrome-plated suit hanger with contoured shoulders and an integrated trouser bar for a complete suit.' },
  { sku: 'MH-2002', name: 'Metal Trouser Hanger',      material: 'Metal',   type: 'Trouser', style: 'trouser', price: 5.10, rating: 4.5, reviews: 61,
    desc: 'Open-bar metal trouser hanger with a non-slip coated rail that grips trousers firmly without creasing.' },
  { sku: 'MH-2003', name: 'Metal Shirt Hanger',        material: 'Metal',   type: 'Shirt',   style: 'shirt',   price: 2.90, rating: 4.4, reviews: 53,
    desc: 'Slim chrome shirt hanger with a smooth 360° swivel hook — a retail and dry-cleaning workhorse.' },
  { sku: 'PH-3001', name: 'Plastic Suit Hanger',       material: 'Plastic', type: 'Suit',    style: 'suit',    price: 2.20, rating: 4.3, reviews: 48,
    desc: 'Wide-shoulder plastic suit hanger with a trouser bar — a cost-effective alternative to wood for high volume.' },
  { sku: 'CH-4001', name: 'Clip Hanger (Wood)',        cat: 'clip', material: 'Wood',    type: 'Clip', clip: true, style: 'clip', price: 6.00, rating: 4.7, reviews: 82,
    desc: 'Solid-wood clip hanger with padded, adjustable clips that hold skirts and trousers securely without marks.' },
  { sku: 'CH-4002', name: 'Clip Hanger (Plastic)',     cat: 'clip', material: 'Plastic', type: 'Clip', clip: true, style: 'clip', price: 3.50, rating: 4.2, reviews: 39,
    desc: 'Durable plastic clip hanger with strong spring clips and a rubberised grip surface.' },
  { sku: 'CH-4003', name: 'Clip Hanger (Plastic Slim)',cat: 'clip', material: 'Plastic', type: 'Clip', clip: true, style: 'clip', price: 3.10, rating: 4.1, reviews: 27,
    desc: 'Space-saving slim-profile plastic clip hanger — fit more bottoms per rail without sacrificing grip.' },

  // ── Page 2 ──
  { sku: 'WH-1003', name: 'Wood Trouser Hanger',       material: 'Wood',    type: 'Trouser', style: 'trouser', price: 6.40, rating: 4.6, reviews: 44,
    desc: 'Solid-wood trouser hanger with a smooth lacquered clamp bar that grips firmly and looks premium on display.' },
  { sku: 'WH-1004', name: 'Wood Coat Hanger',          material: 'Wood',    type: 'Suit',    style: 'suit',    price: 7.20, rating: 4.7, reviews: 58,
    desc: 'Extra-wide wooden coat hanger engineered for heavy outerwear, blazers and tailored jackets.' },
  { sku: 'WH-1005', name: 'Cedar Wood Hanger',         material: 'Wood',    type: 'Shirt',   style: 'shirt',   price: 9.10, rating: 4.9, reviews: 71,
    desc: 'Aromatic cedar hanger with natural moth-repellent properties — perfect for seasonal and luxury storage.' },
  { sku: 'WH-1006', name: 'Bamboo Wood Hanger',        material: 'Wood',    type: 'Shirt',   style: 'shirt',   price: 4.80, rating: 4.5, reviews: 35,
    desc: 'Sustainably sourced bamboo hanger — lightweight, strong and naturally beautiful for eco-conscious ranges.' },
  { sku: 'MH-2004', name: 'Metal Wire Hanger',         material: 'Metal',   type: 'Shirt',   style: 'shirt',   price: 0.90, rating: 4.0, reviews: 22,
    desc: 'Classic steel wire hanger — ultra-thin profile, sold in bulk for laundry and high-volume storage.' },
  { sku: 'MH-2005', name: 'Chrome Coat Hanger',        material: 'Metal',   type: 'Suit',    style: 'suit',    price: 3.80, rating: 4.4, reviews: 41,
    desc: 'Powder-coated chrome coat hanger rated for heavy winter coats, with a wide anti-distortion shoulder.' },
  { sku: 'MH-2006', name: 'Metal Cascading Hanger',    material: 'Metal',   type: 'Shirt',   style: 'shirt',   price: 2.40, rating: 4.2, reviews: 29,
    desc: 'Space-saving chrome cascading hanger that links vertically to multiply rail capacity in small spaces.' },
  { sku: 'PH-3002', name: 'Plastic Shirt Hanger',      material: 'Plastic', type: 'Shirt',   style: 'shirt',   price: 1.20, rating: 4.1, reviews: 33,
    desc: 'Everyday plastic shirt hanger with notched shoulders for strappy garments and a stackable design.' },
  { sku: 'PH-3003', name: 'Plastic Trouser Hanger',    material: 'Plastic', type: 'Trouser', style: 'trouser', price: 1.40, rating: 4.0, reviews: 18,
    desc: 'Open-ended plastic trouser hanger for easy slide-on hanging of trousers and skirts.' },

  // ── Page 3 ──
  { sku: 'PH-3004', name: 'Plastic Kids Hanger',       material: 'Plastic', type: 'Shirt',   style: 'shirt',   price: 0.80, rating: 4.3, reviews: 24,
    desc: 'Small-sized plastic hanger designed for children’s clothing — bright, lightweight and safe rounded edges.' },
  { sku: 'PH-3005', name: 'Plastic Slim Hanger',       material: 'Plastic', type: 'Shirt',   style: 'shirt',   price: 1.10, rating: 4.2, reviews: 26,
    desc: 'Ultra-slim plastic hanger that lets you fit nearly twice as many garments in the same rail space.' },
  { sku: 'CH-4004', name: 'Clip Hanger (Metal)',       cat: 'clip', material: 'Metal',   type: 'Clip', clip: true, style: 'clip', price: 4.20, rating: 4.5, reviews: 37,
    desc: 'Chrome metal clip hanger with heavy-duty spring clips and a smooth swivel hook for retail display.' },
  { sku: 'CH-4005', name: 'Skirt Clip Hanger',         cat: 'clip', material: 'Metal',   type: 'Clip', clip: true, style: 'clip', price: 3.60, rating: 4.3, reviews: 30,
    desc: 'Adjustable skirt clip hanger with padded grips that protect delicate waistbands from marks.' },
  { sku: 'CH-4006', name: 'Multi-Bar Clip Hanger',     cat: 'clip', material: 'Metal',   type: 'Clip', clip: true, style: 'clip', price: 4.80, rating: 4.4, reviews: 21,
    desc: 'Tiered multi-bar clip hanger that hangs several skirts or trousers on a single, space-saving frame.' },
  { sku: 'CH-4007', name: 'Velvet Clip Hanger',        cat: 'clip', material: 'Plastic', type: 'Clip', clip: true, style: 'clip', price: 2.80, rating: 4.2, reviews: 19,
    desc: 'Velvet-finished clip hanger with a non-slip surface — keeps bottoms in place on slim, elegant frames.' },
];

/* ──────────────────────────────────────────────────────────────
   Site settings (footer, contact, hero, hours …)
   ────────────────────────────────────────────────────────────── */
const SITE_SETTINGS = {
  company_name: 'Wish Enterprise',
  tagline: 'Quality Hangers for Wholesale & Retail',
  hero_title: 'Quality Hangers for Wholesale & Retail',
  hero_subtitle: 'Premium materials. Superior durability. Designed for every need.',
  about: 'Wish Enterprise supplies premium hangers to retailers, boutiques, dry cleaners and distributors. From solid-wood suit hangers to heavy-duty metal and cost-effective plastic, every product is built to last and priced for bulk.',
  email: 'minfiyaaz@yahoo.com',
  phone_primary: '+94 77 751 8286',
  phone_secondary: '+94 11 244 9134',
  whatsapp_number: '94777518286',
  address_line1: '223, 10 2nd Cross Street',
  address_line2: 'Colombo 11',
  hours_weekday: 'Monday – Friday: 9:00 AM – 6:00 PM',
  hours_saturday: 'Saturday: 9:00 AM – 1:00 PM',
  hours_sunday: 'Sunday: Closed',
  map_query: '223 2nd Cross Street Colombo 11',
  map_url: 'https://maps.app.goo.gl/zAhtt37NwMJT5qh26',
};

/* ──────────────────────────────────────────────────────────────
   Seed routine
   ────────────────────────────────────────────────────────────── */
function clearTables() {
  // Order matters because of FK constraints.
  for (const t of ['inquiries', 'price_tiers', 'product_colors', 'products', 'categories', 'site_settings']) {
    db.exec(`DELETE FROM ${t};`);
  }
  // Reset autoincrement counters if the sqlite_sequence table exists.
  try { db.exec("DELETE FROM sqlite_sequence;"); } catch { /* no-op */ }
}

export function seed({ force = false } = {}) {
  initSchema();

  const count = db.prepare('SELECT COUNT(*) AS n FROM products').get().n;
  if (count > 0 && !force) {
    return { seeded: false, products: count };
  }
  if (force) clearTables();

  const insertCategory = db.prepare(
    `INSERT INTO categories (slug, name, description, icon, sort_order)
     VALUES (?, ?, ?, ?, ?)`
  );
  const insertProduct = db.prepare(
    `INSERT INTO products
       (sku, slug, name, category_id, material, type, is_clip, retail_price,
        wholesale_price, rating, review_count, size, durability, finish, material_detail,
        description, hanger_style, popularity)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertColor = db.prepare(
    `INSERT INTO product_colors (product_id, name, hex, sort_order) VALUES (?, ?, ?, ?)`
  );
  const insertTier = db.prepare(
    `INSERT INTO price_tiers (product_id, label, min_qty, max_qty, price, sort_order)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const insertSetting = db.prepare(
    `INSERT INTO site_settings (key, value) VALUES (?, ?)`
  );

  // node:sqlite has no helper transaction wrapper — do it manually.
  db.exec('BEGIN');
  try {
    // Categories
    const catId = {};
    for (const c of CATEGORIES) {
      const res = insertCategory.run(c.slug, c.name, c.description, c.icon, c.sort_order);
      catId[c.slug] = Number(res.lastInsertRowid);
    }

    // Products
    RAW_PRODUCTS.forEach((p, i) => {
      const isClip = p.clip ? 1 : 0;
      // A clip product lives in the "clip" category; otherwise it maps to its material.
      const categorySlug = p.cat === 'clip' || isClip
        ? 'clip'
        : p.material.toLowerCase();
      const specs = MATERIAL_SPECS[p.material];
      const slug = p.name
        .toLowerCase()
        .replace(/[()]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const res = insertProduct.run(
        p.sku,
        slug,
        p.name,
        catId[categorySlug],
        p.material,
        p.type,
        isClip,
        p.price,
        wholesaleBase(p.price),
        p.rating ?? 4.5,
        p.reviews ?? 0,
        specs.size,
        specs.durability,
        specs.finish,
        specs.detail,
        p.desc,
        p.style,
        100 - i // first item = most popular
      );
      const productId = Number(res.lastInsertRowid);

      specs.colors.forEach(([name, hex], idx) => insertColor.run(productId, name, hex, idx));
      PRICE_TIERS.forEach((t, idx) =>
        insertTier.run(productId, t.label, t.min_qty, t.max_qty, money(p.price * t.factor), idx)
      );
    });

    // Site settings
    for (const [key, value] of Object.entries(SITE_SETTINGS)) {
      insertSetting.run(key, String(value));
    }

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  const total = db.prepare('SELECT COUNT(*) AS n FROM products').get().n;
  return { seeded: true, products: total };
}

// Run directly:  node src/seed.js [--force]
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const force = process.argv.includes('--force');
  const result = seed({ force });
  if (result.seeded) {
    console.log(`✓ Seeded database (${result.products} products) → ${DB_PATH}`);
  } else {
    console.log(`• Database already has ${result.products} products — skipping seed (use --force to reset).`);
  }
}
