import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

// GET /api/categories — all categories with live product counts.
router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT c.id, c.slug, c.name, c.description, c.icon, c.sort_order,
           COUNT(p.id) AS product_count
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id
    GROUP BY c.id
    ORDER BY c.sort_order, c.name
  `).all();
  res.json(rows);
});

export default router;
