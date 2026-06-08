import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

const SORTS = {
  popular: 'p.popularity DESC, p.id ASC',
  'price-asc': 'p.retail_price ASC, p.id ASC',
  'price-desc': 'p.retail_price DESC, p.id ASC',
  newest: 'p.created_at DESC, p.id DESC',
  rating: 'p.rating DESC, p.review_count DESC',
  name: 'p.name ASC',
};

/** Parse a comma-separated query param into a clean array. */
function csv(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function attachProductRelations(product) {
  if (!product) return product;
  product.colors = db
    .prepare('SELECT name, hex FROM product_colors WHERE product_id = ? ORDER BY sort_order')
    .all(product.id);
  return product;
}

const PRODUCT_SELECT = `
  SELECT p.id, p.sku, p.slug, p.name, p.material, p.type, p.is_clip,
         p.retail_price, p.wholesale_price, p.rating, p.review_count, p.size, p.durability,
         p.finish, p.material_detail, p.description, p.hanger_style, p.image,
         p.popularity, p.created_at,
         c.slug AS category_slug, c.name AS category_name
  FROM products p
  JOIN categories c ON c.id = p.category_id
`;

// GET /api/products  — filtered, sorted, paginated list + facet counts.
router.get('/', (req, res) => {
  const materials = csv(req.query.material);     // Wood, Metal, Plastic
  const types = csv(req.query.type);             // Suit, Shirt, Trouser, Clip
  const setting = req.query.setting;             // 'clip' | 'non-clip'
  const category = req.query.category;           // category slug
  const q = (req.query.q || '').trim();

  const sort = SORTS[req.query.sort] || SORTS.popular;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const pageSize = Math.min(60, Math.max(1, parseInt(req.query.pageSize, 10) || 9));
  const offset = (page - 1) * pageSize;

  // "Base" filter (category + search) is used for facet counts so each facet
  // shows how many products are available across the other dimensions.
  const baseClauses = [];
  const baseParams = [];
  if (category) {
    baseClauses.push('c.slug = ?');
    baseParams.push(category);
  }
  if (q) {
    baseClauses.push('(p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)');
    baseParams.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }

  // Full filter (base + material + type + setting) drives the actual results.
  const clauses = [...baseClauses];
  const params = [...baseParams];
  if (materials.length) {
    clauses.push(`p.material IN (${materials.map(() => '?').join(',')})`);
    params.push(...materials);
  }
  if (types.length) {
    clauses.push(`p.type IN (${types.map(() => '?').join(',')})`);
    params.push(...types);
  }
  if (setting === 'clip') clauses.push('p.is_clip = 1');
  if (setting === 'non-clip') clauses.push('p.is_clip = 0');

  const baseWhere = baseClauses.length ? `WHERE ${baseClauses.join(' AND ')}` : '';
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const total = db
    .prepare(`SELECT COUNT(*) AS n FROM products p JOIN categories c ON c.id = p.category_id ${where}`)
    .get(...params).n;

  const items = db
    .prepare(`${PRODUCT_SELECT} ${where} ORDER BY ${sort} LIMIT ? OFFSET ?`)
    .all(...params, pageSize, offset);

  // Facets (counts within the base filter, ignoring the facet's own selection).
  const facetMaterials = db
    .prepare(`SELECT p.material AS value, COUNT(*) AS count
              FROM products p JOIN categories c ON c.id = p.category_id
              ${baseWhere} GROUP BY p.material ORDER BY p.material`)
    .all(...baseParams);
  const facetTypes = db
    .prepare(`SELECT p.type AS value, COUNT(*) AS count
              FROM products p JOIN categories c ON c.id = p.category_id
              ${baseWhere} GROUP BY p.type ORDER BY p.type`)
    .all(...baseParams);
  const facetSettings = db
    .prepare(`SELECT p.is_clip AS is_clip, COUNT(*) AS count
              FROM products p JOIN categories c ON c.id = p.category_id
              ${baseWhere} GROUP BY p.is_clip`)
    .all(...baseParams);

  const settings = [
    { value: 'non-clip', label: 'Non-Clip', count: 0 },
    { value: 'clip', label: 'With Clips', count: 0 },
  ];
  for (const row of facetSettings) {
    if (row.is_clip === 1) settings[1].count = row.count;
    else settings[0].count = row.count;
  }

  res.json({
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    facets: {
      materials: facetMaterials,
      types: facetTypes,
      settings,
    },
  });
});

// GET /api/products/:slug — full product detail (colours + price tiers).
router.get('/:slug', (req, res) => {
  const product = db.prepare(`${PRODUCT_SELECT} WHERE p.slug = ?`).get(req.params.slug);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(attachProductRelations(product));
});

// GET /api/products/:slug/related — same-category suggestions.
router.get('/:slug/related', (req, res) => {
  const product = db.prepare('SELECT id, category_id FROM products WHERE slug = ?').get(req.params.slug);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  const limit = Math.min(8, Math.max(1, parseInt(req.query.limit, 10) || 4));
  const items = db
    .prepare(`${PRODUCT_SELECT}
              WHERE p.category_id = ? AND p.id != ?
              ORDER BY p.popularity DESC LIMIT ?`)
    .all(product.category_id, product.id, limit);
  res.json(items);
});

export default router;
