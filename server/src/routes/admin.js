/**
 * admin.js — protected admin API for managing the catalogue.
 *
 * Security:
 *  - Credentials live in the `admin_users` table with a **bcrypt** password hash.
 *  - Login is **rate-limited** per IP (5 tries / 15 min).
 *  - Successful login issues an in-memory bearer **token** (12h TTL) carrying a
 *    **role**; `requireAdmin` validates it and `requireRole('admin')` gates writes.
 *  - All input is validated/normalised before it touches the DB.
 *
 * Set ADMIN_PASSWORD in the environment (seeded into the hash on first run).
 */
import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { writeFileSync, mkdirSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';

const router = Router();
const __dirname = dirname(fileURLToPath(import.meta.url));
export const UPLOAD_DIR = join(__dirname, '..', '..', 'uploads', 'products');
mkdirSync(UPLOAD_DIR, { recursive: true });

const SESSION_TTL = 1000 * 60 * 60 * 12; // 12 hours
const sessions = new Map(); // token -> { exp, role, username }

const tokenFrom = (req) => {
  const auth = req.headers.authorization || '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : req.headers['x-admin-token'] || '';
};
const getSession = (t) => {
  const s = sessions.get(t);
  if (!s) return null;
  if (Date.now() > s.exp) {
    sessions.delete(t);
    return null;
  }
  return s;
};

/* ── login rate limiter (in-memory, per IP) ───────────────────── */
const LOGIN_MAX = 5;
const LOGIN_WINDOW = 1000 * 60 * 15;
const attempts = new Map(); // ip -> { count, resetAt }
function loginRateLimit(req, res, next) {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  let rec = attempts.get(ip);
  if (!rec || now > rec.resetAt) {
    rec = { count: 0, resetAt: now + LOGIN_WINDOW };
    attempts.set(ip, rec);
  }
  if (rec.count >= LOGIN_MAX) {
    const retry = Math.ceil((rec.resetAt - now) / 1000);
    res.set('Retry-After', String(retry));
    return res.status(429).json({ error: `Too many attempts. Try again in ${Math.ceil(retry / 60)} minute(s).` });
  }
  rec.count += 1;
  req._rateRec = rec;
  next();
}

/* ── auth ─────────────────────────────────────────────────────── */
router.post('/login', loginRateLimit, async (req, res) => {
  const username = String(req.body?.username || 'admin').trim();
  const password = String(req.body?.password || '');
  const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);

  // Always run a compare to avoid trivial user-enumeration timing.
  const hash = user?.password_hash || '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidin';
  const ok = await bcrypt.compare(password, hash);
  if (!user || !ok) return res.status(401).json({ error: 'Incorrect password' });

  if (req._rateRec) req._rateRec.count = 0; // reset on success
  const token = randomUUID();
  sessions.set(token, { exp: Date.now() + SESSION_TTL, role: user.role, username: user.username });
  res.json({ token, role: user.role, username: user.username, expiresIn: SESSION_TTL });
});

function requireAdmin(req, res, next) {
  const s = getSession(tokenFrom(req));
  if (!s) return res.status(401).json({ error: 'Unauthorized' });
  req.adminRole = s.role;
  req.adminUser = s.username;
  next();
}
const requireRole = (role) => (req, res, next) =>
  req.adminRole === role ? next() : res.status(403).json({ error: 'Forbidden' });

router.get('/session', requireAdmin, (req, res) => res.json({ ok: true, role: req.adminRole, username: req.adminUser }));
router.post('/logout', requireAdmin, (req, res) => {
  sessions.delete(tokenFrom(req));
  res.json({ ok: true });
});

// Everything below requires a valid admin token.
router.use(requireAdmin);
const writeGuard = requireRole('admin');

/* ── helpers ──────────────────────────────────────────────────── */
const slugify = (s) =>
  String(s || '').toLowerCase().replace(/[()]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

function uniqueSlug(base, excludeId = null) {
  base = base || 'product';
  let slug = base, i = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const row = db.prepare('SELECT id FROM products WHERE slug = ?').get(slug);
    if (!row || row.id === excludeId) return slug;
    slug = `${base}-${++i}`;
  }
}
function uniqueSku(base, excludeId = null) {
  base = base || 'SKU';
  let sku = base, i = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const row = db.prepare('SELECT id FROM products WHERE sku = ?').get(sku);
    if (!row || row.id === excludeId) return sku;
    sku = `${base}-${++i}`;
  }
}

const STYLE_BY_TYPE = { Suit: 'suit', Shirt: 'shirt', Trouser: 'trouser', Clip: 'clip' };
const round = (n) => Math.round(n);

const PRODUCT_FULL = `
  SELECT p.*, c.slug AS category_slug, c.name AS category_name
  FROM products p JOIN categories c ON c.id = p.category_id
`;

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
  if (wholesale == null || Number.isNaN(wholesale)) wholesale = round(retail * 0.65);
  const isClip = type === 'Clip' || b.is_clip === 1 || b.is_clip === true ? 1 : 0;

  return {
    values: {
      name,
      category_id: categoryId,
      material,
      type,
      is_clip: isClip,
      retail_price: round(retail),
      wholesale_price: round(wholesale),
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

/* ── dashboard ────────────────────────────────────────────────── */
router.get('/stats', (_req, res) => {
  const products = db.prepare('SELECT COUNT(*) AS n FROM products').get().n;
  const categories = db.prepare('SELECT COUNT(*) AS n FROM categories').get().n;
  const inqTotal = db.prepare('SELECT COUNT(*) AS n FROM inquiries').get().n;
  const inqNew = db.prepare("SELECT COUNT(*) AS n FROM inquiries WHERE status = 'new'").get().n;
  const recent = db
    .prepare(`SELECT i.*, p.name AS product_name FROM inquiries i
              LEFT JOIN products p ON p.id = i.product_id
              ORDER BY i.created_at DESC, i.id DESC LIMIT 5`)
    .all();
  res.json({ products, categories, inquiries: { total: inqTotal, new: inqNew }, recent });
});

/* ── inquiries inbox ──────────────────────────────────────────── */
router.get('/inquiries', (_req, res) => {
  const rows = db
    .prepare(`SELECT i.*, p.name AS product_name FROM inquiries i
              LEFT JOIN products p ON p.id = i.product_id
              ORDER BY i.created_at DESC, i.id DESC`)
    .all();
  res.json(rows);
});
router.patch('/inquiries/:id', writeGuard, (req, res) => {
  const id = Number(req.params.id);
  const status = String(req.body?.status || '');
  if (!['new', 'read', 'archived'].includes(status)) return res.status(422).json({ error: 'Invalid status' });
  const r = db.prepare('UPDATE inquiries SET status = ? WHERE id = ?').run(status, id);
  if (!r.changes) return res.status(404).json({ error: 'Inquiry not found' });
  res.json(db.prepare('SELECT * FROM inquiries WHERE id = ?').get(id));
});
router.delete('/inquiries/:id', writeGuard, (req, res) => {
  const r = db.prepare('DELETE FROM inquiries WHERE id = ?').run(Number(req.params.id));
  if (!r.changes) return res.status(404).json({ error: 'Inquiry not found' });
  res.json({ ok: true });
});

/* ── categories ───────────────────────────────────────────────── */
router.post('/categories', writeGuard, (req, res) => {
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
router.put('/categories/:id', writeGuard, (req, res) => {
  const id = Number(req.params.id);
  const cat = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  if (!cat) return res.status(404).json({ error: 'Category not found' });
  const b = req.body || {};
  const slug = b.slug ? slugify(b.slug) : cat.slug;
  if (db.prepare('SELECT id FROM categories WHERE slug = ? AND id <> ?').get(slug, id)) {
    return res.status(409).json({ error: 'A category with that slug already exists' });
  }
  db.prepare('UPDATE categories SET name=?, slug=?, description=?, icon=?, sort_order=? WHERE id=?').run(
    b.name ?? cat.name, slug, b.description ?? cat.description, b.icon ?? cat.icon, b.sort_order ?? cat.sort_order, id
  );
  res.json(db.prepare('SELECT * FROM categories WHERE id = ?').get(id));
});
router.delete('/categories/:id', writeGuard, (req, res) => {
  const id = Number(req.params.id);
  if (!db.prepare('SELECT id FROM categories WHERE id = ?').get(id)) return res.status(404).json({ error: 'Category not found' });
  const n = db.prepare('SELECT COUNT(*) AS n FROM products WHERE category_id = ?').get(id).n;
  if (n > 0) return res.status(409).json({ error: `This category has ${n} product(s). Move or delete them first.` });
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
router.post('/products', writeGuard, (req, res) => {
  const { errors, values } = normaliseProduct(req.body || {});
  if (errors) return res.status(422).json({ error: 'Validation failed', errors });
  const slug = uniqueSlug(slugify(req.body?.slug || values.name));
  const sku = uniqueSku((req.body?.sku || '').trim() || `WE-${slug}`.toUpperCase().slice(0, 24));
  const r = db.prepare(
    `INSERT INTO products
      (sku, slug, name, category_id, material, type, is_clip, retail_price, wholesale_price,
       size, durability, finish, material_detail, description, hanger_style, popularity)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).run(
    sku, slug, values.name, values.category_id, values.material, values.type, values.is_clip,
    values.retail_price, values.wholesale_price, values.size, values.durability, values.finish,
    values.material_detail, values.description, values.hanger_style, values.popularity
  );
  res.status(201).json(db.prepare(`${PRODUCT_FULL} WHERE p.id = ?`).get(Number(r.lastInsertRowid)));
});
router.put('/products/:id', writeGuard, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });
  const { errors, values } = normaliseProduct(req.body || {}, existing);
  if (errors) return res.status(422).json({ error: 'Validation failed', errors });
  const slug = uniqueSlug(req.body?.slug ? slugify(req.body.slug) : slugify(values.name), id);
  const sku = req.body?.sku ? uniqueSku(String(req.body.sku).trim(), id) : existing.sku;
  db.prepare(
    `UPDATE products SET
       sku=?, slug=?, name=?, category_id=?, material=?, type=?, is_clip=?, retail_price=?, wholesale_price=?,
       size=?, durability=?, finish=?, material_detail=?, description=?, hanger_style=?, popularity=?
     WHERE id=?`
  ).run(
    sku, slug, values.name, values.category_id, values.material, values.type, values.is_clip,
    values.retail_price, values.wholesale_price, values.size, values.durability, values.finish,
    values.material_detail, values.description, values.hanger_style, values.popularity, id
  );
  res.json(db.prepare(`${PRODUCT_FULL} WHERE p.id = ?`).get(id));
});
router.delete('/products/:id', writeGuard, (req, res) => {
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
router.post('/products/:id/image', writeGuard, (req, res) => {
  const id = Number(req.params.id);
  const p = db.prepare('SELECT id, slug, image FROM products WHERE id = ?').get(id);
  if (!p) return res.status(404).json({ error: 'Product not found' });
  const dataUrl = (req.body && req.body.dataUrl) || '';
  const m = /^data:image\/(png|jpe?g|webp|gif);base64,(.+)$/i.exec(dataUrl);
  if (!m) return res.status(422).json({ error: 'Invalid image. Upload a PNG, JPG, WEBP or GIF.' });
  const ext = m[1].toLowerCase() === 'jpeg' ? 'jpg' : m[1].toLowerCase();
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > 6 * 1024 * 1024) return res.status(413).json({ error: 'Image too large (max 6 MB)' });
  if (p.image && p.image.startsWith('/uploads/products/')) {
    try { unlinkSync(join(UPLOAD_DIR, basename(p.image))); } catch { /* ignore */ }
  }
  const fname = `${p.slug}-${Date.now()}.${ext}`;
  writeFileSync(join(UPLOAD_DIR, fname), buf);
  const url = `/uploads/products/${fname}`;
  db.prepare('UPDATE products SET image = ? WHERE id = ?').run(url, id);
  res.json({ image: url });
});
router.delete('/products/:id/image', writeGuard, (req, res) => {
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
