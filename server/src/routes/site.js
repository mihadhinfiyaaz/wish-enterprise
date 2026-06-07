import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

// GET /api/site — key/value site settings as a single object.
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM site_settings').all();
  const settings = {};
  for (const { key, value } of rows) settings[key] = value;
  res.json(settings);
});

export default router;
