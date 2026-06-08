/**
 * index.js — Wish Enterprise API server.
 *
 * - Mounts the REST API under /api
 * - Serves the built React client (client/dist) when it exists, with SPA
 *   fallback, so `npm run build && npm start` runs the whole app on one port.
 */
import express from 'express';
import cors from 'cors';
import https from 'node:https';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

import { seed } from './seed.js';
import categoriesRouter from './routes/categories.js';
import productsRouter from './routes/products.js';
import inquiriesRouter from './routes/inquiries.js';
import siteRouter from './routes/site.js';
import adminRouter from './routes/admin.js';

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
app.set('trust proxy', 1); // correct req.ip behind a TLS-terminating proxy (for rate limiting)
app.use(cors());
app.use(express.json({ limit: '8mb' })); // base64 image uploads from the admin panel

// Tiny request logger (kept dependency-free).
app.use((req, _res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`${new Date().toISOString()}  ${req.method} ${req.originalUrl}`);
  }
  next();
});

// Admin-uploaded product images (served in dev via the Vite /uploads proxy).
app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

// ── API ──────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
app.use('/api/categories', categoriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/inquiries', inquiriesRouter);
app.use('/api/site', siteRouter);
app.use('/api/admin', adminRouter);

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

// ── Listen (HTTP by default; HTTPS when HTTPS=true) ──────────────
const useHttps = ['true', '1'].includes(String(process.env.HTTPS).toLowerCase());
if (useHttps) {
  let key = process.env.SSL_KEY_FILE && existsSync(process.env.SSL_KEY_FILE) ? readFileSync(process.env.SSL_KEY_FILE) : null;
  let cert = process.env.SSL_CERT_FILE && existsSync(process.env.SSL_CERT_FILE) ? readFileSync(process.env.SSL_CERT_FILE) : null;
  if (!key || !cert) {
    const { default: selfsigned } = await import('selfsigned');
    const pems = selfsigned.generate([{ name: 'commonName', value: 'localhost' }], { days: 365, keySize: 2048 });
    key = pems.private;
    cert = pems.cert;
    console.log('⚠ HTTPS: using a generated self-signed certificate (development only).');
  }
  https.createServer({ key, cert }, app).listen(PORT, () => {
    console.log(`\n  Wish Enterprise API  →  https://localhost:${PORT}\n`);
  });
} else {
  app.listen(PORT, () => {
    console.log(`\n  Wish Enterprise API  →  http://localhost:${PORT}\n`);
  });
}
