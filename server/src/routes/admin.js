/**
 * admin.js — protected admin API for managing the catalogue.
 *
 * Auth: POST /api/admin/login {password} → { token }. The token (in-memory,
 * 12h TTL) must be sent as `Authorization: Bearer <token>` on every other
 * /api/admin/* request. Set ADMIN_PASSWORD in the environment (default below).
 *
 * Capabilities: create/update/delete products and categories, edit every
 * product field (name, prices, category, description, specs…), and
 * upload/remove a single product image.
 */
import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { writeFileSync, mkdirSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';
import { db } from '../db.js';

const router = Router();
const __dirname = dirname(fileURLToPath(import.meta.url));
export const UPLOAD_DIR = join(__dirname, '..', '..', 'uploads', 'products');
mkdirSync(UPLOAD_DIR, { recursive: true });

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'wishadmin';
const SESSION_TTL = 1000 * 60 * 60 * 12; // 12 hours
const sessions = new Map(); // token -> expiry epoch ms

const tokenFrom = (req) => {
  const auth = req.headers.authorization || '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : req.headers['x-admin-token'] || '';
};
const validToken = (t) => {
  const exp = sessions.get(t);
  if (!exp) return false;
  if (Date.now() > exp) {
    sessions.delete(t);
    return false;
  }
  return true;
};

/* ── auth ─────────────────────────────────────────────────────── */
router.post('/login', (req, res) => {
  const { password } = req.body || {};
  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Incorrect password' });
  }
  const token = randomUUID();
  sessions.set(token, Date.now() + SESSION_TTL);
  res.json({ token, expiresIn: SESSION_TTL });
});

function requireAdmin(req, res, next) {
  if (!validToken(tokenFrom(req))) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

router.get('/session', requireAdmin, (_req, res) => res.json({ ok: true }));
router.post('/logout', requireAdmin, (req, res) => {
  sessions.delete(tokenFrom(req));
  res.json({ ok: true });
});

// Everything below requires a valid admin token.
router.use(requireAdmin);

/* ── helpers ──────────────────────────────────────────────────── */
const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

function uniqueSlug(base, excludeId = null) {
  base = base || 'product';
  let slug = base;
  let i = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const row = db.prepare('SELECT id FROM products WHERE slug = ?').get(slug);
    if (!row || row.id === excludeId) return slug;
    slug = `${base}-${++i}`;
  }
}
function uniqueSku(base, excludeId = null) {
  base = base || 'SKU';
  let sku = base;
  let i = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const row = db.prepare('SELECT id FROM products WHERE sku = ?').get(sku);
    if (!row || row.id === excludeId) return sku;
    sku = `${base}-${++i}`;
  }
}

const STYLE_BY_TYPE = { Suit: 'suit', Shirt: 'shirt', Trouser: 'trouser', Clip: 'clip' };
const TIER_FACTORS = [
  { label: '50 – 99', min: 50, max: 99, f: 0.65 },
  { label: '150 – 299', min: 150, max: 299, f: 0.58 },
  { label: '300 – 499', min: 300, max: 499, f: 0.52 },
  { label: '500+', min: 500, max: null, f: 0.45 },
];
const money = (n) => Math.round(n * 100) / 100;

function rebuildTiers(productId, retail) {
  db.prepare('DELETE FROM price_tiers WHERE product_id = ?').run(productId);
  const ins = db.prepare(
    'INSERT INTO price_tiers(product_id,label,min_qty,max_qty,price,sort_order) VALUES(?,?,?,?,?,?)'
  );
  TIER_FACTORS.forEach((t, i) => ins.run(productId, t.label, t.min, t.max, money(retail * t.f), i));
}

const PRODUCT_FULL = `
  SELECT p.*, c.slug AS category_slug, c.name AS category_name
  FROM products p JOIN categories c ON c.id = p.category_id
`;

// Validate + normalise an incoming product body.
function normaliseProduct(b, existing = null) {
  const errors = {};
  const name = (b.name ?? existing?.name ?? '').toString().trim();
  if (!name) errors.name = 'Name is required';

  const categoryId = b.category_id != null ? Number(b.category_id) : existing?.category_id;
  if (!categoryId || !db.prepare('SELECT id FROM categories WHERE id = ?').get(categoryId)) {
    errors.category_id = 'Valid category is required';
  }

  const material = (b.material ?? existing?.material ?? '').toString().trim();
  if (!material) errors.material = 'Material is required';
  const type = (b.type ?? existing?.type ?? '').toString().trim();
  if (!type) errors.type = 'Type is required';

  const retail = b.retail_price != null ? Number(b.retail_price) : existing?.retail_price;
  if (!(retail >= 0) || Number.isNaN(retail)) errors.retail_price = 'Valid retail price is required';

  if (Object.keys(errors).length) return { errors };

  let wholesale = b.wholesale_price != null && b.wholesale_price !== '' ? Number(b.wholesale_price) : null;
  if (wholesale == null || Number.isNaN(wholesale)) wholesale = money(retail * 0.65);

  const isClip = type === 'Clip' || b.is_clip === 1 || b.is_clip === true ? 1 : 0;

  return {
    values: {
      name,
      category_id: categoryId,
      material,
      type,
      is_clip: isClip,
      retail_price: money(retail),
      wholesale_price: money(wholesale),
      rating: b.rating != null ? Number(b.rating) : existing?.rating ?? 0,
      review_count: b.review_count != null ? Number(b.review_count) : existing?.review_count ?? 0,
      size: b.size ?? existing?.size ?? null,
      durability: b.durability ?? existing?.durability ?? null,
      finish: b.finish ?? existing?.finish ?? null,
      material_detail: b.material_detail ?? existing?.material_detail ?? null,
      description: b.description ?? existing?.description ?? null,
      hanger_style: b.hanger_style || existing?.hanger_style || STYLE_BY_TYPE[type] || 'suit',
      popularity: b.popularity != null ? Number(b.popularity) : existing?.popularity ?? 0,
    },
  };
}

/* ── categories ───────────────────────────────────────────────── */
router.post('/categories', (req, res) => {
  const b = req.body || {};
  const name = (b.name || '').trim();
  if (!name) return res.status(422).json({ error: 'Validation failed', errors: { name: 'Name is required' } });
  const slug = slugify(b.slug || name);
  if (db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug)) {
    return res.status(409).json({ error: 'A category with that slug already exists' });
  }
  const r = db
    .prepare('INSERT INTO categories(slug,name,description,icon,sort_order) VALUES(?,?,?,?,?)')
    .run(slug, name, b.description || null, b.icon || 'suit', b.sort_order ?? 0);
  res.status(201).json(db.prepare('SELECT * FROM categories WHERE id = ?').get(Number(r.lastInsertRowid)));
});

router.put('/categories/:id', (req, res) => {
  const id = Number(req.params.id);
  const cat = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  if (!cat) return res.status(404).json({ error: 'Category not found' });
  const b = req.body || {};
  const slug = b.slug ? slugify(b.slug) : cat.slug;
  if (db.prepare('SELECT id FROM categories WHERE slug = ? AND id <> ?').get(slug, id)) {
    return res.status(409).json({ error: 'A category with that slug already exists' });
  }
  db.prepare('UPDATE categories SET name=?, slug=?, description=?, icon=?, sort_order=? WHERE id=?').run(
    b.name ?? cat.name,
    slug,
    b.description ?? cat.description,
    b.icon ?? cat.icon,
    b.sort_order ?? cat.sort_order,
    id
  );
  res.json(db.prepare('SELECT * FROM categories WHERE id = ?').get(id));
});

router.delete('/categories/:id', (req, res) => {
  const id = Number(req.params.id);
  const cat = db.prepare('SELECT id FROM categories WHERE id = ?').get(id);
  if (!cat) return res.status(404).json({ error: 'Category not found' });
  const n = db.prepare('SELECT COUNT(*) AS n FROM products WHERE category_id = ?').get(id).n;
  if (n > 0) {
    return res.status(409).json({ error: `This category has ${n} product(s). Move or delete them first.` });
  }
  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  res.json({ ok: true });
});

/* ── products ─────────────────────────────────────────────────── */
router.get('/products', (_req, res) => {
  res.json(db.prepare(`${PRODUCT_FULL} ORDER BY p.popularity DESC, p.id DESC`).all());
});

router.get('/products/:id', (req, res) => {
  const p = db.prepare(`${PRODUCT_FULL} WHERE p.id = ?`).get(Number(req.params.id));
  if (!p) return res.status(404).json({ error: 'Product not found' });
  res.json(p);
});

router.post('/products', (req, res) => {
  const { errors, values } = normaliseProduct(req.body || {});
  if (errors) return res.status(422).json({ error: 'Validation failed', errors });

  const slug = uniqueSlug(slugify(req.body?.slug || values.name));
  const sku = uniqueSku((req.body?.sku || '').trim() || `WE-${slug}`.toUpperCase().slice(0, 24));

  const r = db
    .prepare(
      `INSERT INTO products
        (sku, slug, name, category_id, material, type, is_clip, retail_price, wholesale_price,
         rating, review_count, size, durability, finish, material_detail, description, hanger_style, popularity)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    )
    .run(
      sku, slug, values.name, values.category_id, values.material, values.type, values.is_clip,
      values.retail_price, values.wholesale_price, values.rating, values.review_count, values.size,
      values.durability, values.finish, values.material_detail, values.description, values.hanger_style,
      values.popularity
    );
  const id = Number(r.lastInsertRowid);
  rebuildTiers(id, values.retail_price);
  res.status(201).json(db.prepare(`${PRODUCT_FULL} WHERE p.id = ?`).get(id));
});

router.put('/products/:id', (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });

  const { errors, values } = normaliseProduct(req.body || {}, existing);
  if (errors) return res.status(422).json({ error: 'Validation failed', errors });

  // Slug follows the name unless explicitly provided; keep it unique.
  const desiredSlug = req.body?.slug ? slugify(req.body.slug) : slugify(values.name);
  const slug = uniqueSlug(desiredSlug, id);
  // SKU editable but kept unique.
  const sku = req.body?.sku ? uniqueSku(String(req.body.sku).trim(), id) : existing.sku;

  db.prepare(
    `UPDATE products SET
       sku=?, slug=?, name=?, category_id=?, material=?, type=?, is_clip=?, retail_price=?, wholesale_price=?,
       rating=?, review_count=?, size=?, durability=?, finish=?, material_detail=?, description=?, hanger_style=?, popularity=?
     WHERE id=?`
  ).run(
    sku, slug, values.name, values.category_id, values.material, values.type, values.is_clip,
    values.retail_price, values.wholesale_price, values.rating, values.review_count, values.size,
    values.durability, values.finish, values.material_detail, values.description, values.hanger_style,
    values.popularity, id
  );
  rebuildTiers(id, values.retail_price);
  res.json(db.prepare(`${PRODUCT_FULL} WHERE p.id = ?`).get(id));
});

router.delete('/products/:id', (req, res) => {
  const id = Number(req.params.id);
  const p = db.prepare('SELECT image FROM products WHERE id = ?').get(id);
  if (!p) return res.status(404).json({ error: 'Product not found' });
  if (p.image && p.image.startsWith('/uploads/products/')) {
    try { unlinkSync(join(UPLOAD_DIR, basename(p.image))); } catch { /* ignore */ }
  }
  db.prepare('DELETE FROM products WHERE id = ?').run(id);
  res.json({ ok: true });
});

/* ── product image (single, base64 upload) ───────────────────── */
router.post('/products/:id/image', (req, res) => {
  const id = Number(req.params.id);
  const p = db.prepare('SELECT id, slug, image FROM products WHERE id = ?').get(id);
  if (!p) return res.status(404).json({ error: 'Product not found' });

  const dataUrl = (req.body && req.body.dataUrl) || '';
  const m = /^data:image\/(png|jpe?g|webp|gif);base64,(.+)$/i.exec(dataUrl);
  if (!m) return res.status(422).json({ error: 'Invalid image. Upload a PNG, JPG, WEBP or GIF.' });

  const ext = m[1].toLowerCase() === 'jpeg' ? 'jpg' : m[1].toLowerCase();
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > 6 * 1024 * 1024) return res.status(413).json({ error: 'Image too large (max 6 MB)' });

  // Remove a previously uploaded file (don't touch bundled defaults).
  if (p.image && p.image.startsWith('/uploads/products/')) {
    try { unlinkSync(join(UPLOAD_DIR, basename(p.image))); } catch { /* ignore */ }
  }
  const fname = `${p.slug}-${Date.now()}.${ext}`;
  writeFileSync(join(UPLOAD_DIR, fname), buf);
  const url = `/uploads/products/${fname}`;
  db.prepare('UPDATE products SET image = ? WHERE id = ?').run(url, id);
  res.json({ image: url });
});

router.delete('/products/:id/image', (req, res) => {
  const id = Number(req.params.id);
  const p = db.prepare('SELECT image FROM products WHERE id = ?').get(id);
  if (!p) return res.status(404).json({ error: 'Product not found' });
  if (p.image && p.image.startsWith('/uploads/products/')) {
    try { unlinkSync(join(UPLOAD_DIR, basename(p.image))); } catch { /* ignore */ }
  }
  db.prepare('UPDATE products SET image = NULL WHERE id = ?').run(id);
  res.json({ image: null });
});

export default router;
