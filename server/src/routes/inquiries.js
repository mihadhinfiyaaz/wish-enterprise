import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/inquiries — capture a "Contact to Order" / wholesale enquiry.
router.post('/', (req, res) => {
  const body = req.body || {};
  const errors = {};

  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();
  const phone = String(body.phone || '').trim();
  const company = String(body.company || '').trim();
  const message = String(body.message || '').trim();
  const productId = body.productId != null && body.productId !== '' ? Number(body.productId) : null;
  const quantity = body.quantity != null && body.quantity !== '' ? Number(body.quantity) : null;

  if (!name) errors.name = 'Name is required';
  if (!email) errors.email = 'Email is required';
  else if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address';
  if (!message) errors.message = 'Message is required';
  if (productId != null && Number.isNaN(productId)) errors.productId = 'Invalid product';
  if (quantity != null && (Number.isNaN(quantity) || quantity < 0)) errors.quantity = 'Invalid quantity';

  // If a product is referenced, make sure it exists.
  let validProductId = null;
  if (productId != null && !errors.productId) {
    const exists = db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
    if (!exists) errors.productId = 'Product not found';
    else validProductId = productId;
  }

  if (Object.keys(errors).length) {
    return res.status(422).json({ error: 'Validation failed', errors });
  }

  const result = db
    .prepare(`INSERT INTO inquiries (name, email, phone, company, product_id, quantity, message)
              VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(name, email, phone || null, company || null, validProductId, quantity, message);

  const created = db
    .prepare('SELECT * FROM inquiries WHERE id = ?')
    .get(Number(result.lastInsertRowid));

  res.status(201).json({ ok: true, inquiry: created });
});

// GET /api/inquiries — lightweight admin listing (most recent first).
router.get('/', (req, res) => {
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
  const rows = db
    .prepare(`SELECT i.*, p.name AS product_name
              FROM inquiries i
              LEFT JOIN products p ON p.id = i.product_id
              ORDER BY i.created_at DESC, i.id DESC
              LIMIT ?`)
    .all(limit);
  res.json(rows);
});

export default router;
