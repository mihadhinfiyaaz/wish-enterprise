/**
 * index.js — Wish Enterprise API server.
 *
 * - Mounts the REST API under /api
 * - Serves the built React client (client/dist) when it exists, with SPA
 *   fallback, so `npm run build && npm start` runs the whole app on one port.
 */
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';

import { seed } from './seed.js';
import categoriesRouter from './routes/categories.js';
import productsRouter from './routes/products.js';
import inquiriesRouter from './routes/inquiries.js';
import siteRouter from './routes/site.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4000;

// Ensure the DB has data on boot (no-op if already seeded).
const result = seed();
console.log(
  result.seeded
    ? `✓ Seeded database with ${result.products} products`
    : `• Database ready (${result.products} products)`
);

const app = express();
app.disable('x-powered-by');
app.use(cors());
app.use(express.json());

// Tiny request logger (kept dependency-free).
app.use((req, _res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`${new Date().toISOString()}  ${req.method} ${req.originalUrl}`);
  }
  next();
});

// ── API ──────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
app.use('/api/categories', categoriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/inquiries', inquiriesRouter);
app.use('/api/site', siteRouter);

// Unknown API route → JSON 404 (so the SPA fallback never swallows it).
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

// ── Static client (production build) ─────────────────────────────
const clientDist = join(__dirname, '..', '..', 'client', 'dist');
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => res.sendFile(join(clientDist, 'index.html')));
  console.log('✓ Serving built client from client/dist');
} else {
  app.get('/', (_req, res) =>
    res
      .type('text/plain')
      .send('Wish Enterprise API is running. Start the client with `npm run dev` or build it with `npm run build`.')
  );
}

// ── Central error handler ────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`\n  Wish Enterprise API  →  http://localhost:${PORT}\n`);
});
