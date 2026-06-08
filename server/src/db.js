/**
 * db.js — SQLite connection + schema bootstrap.
 *
 * Uses Node's built-in `node:sqlite` module (stable in Node 22.5+ / Node 24),
 * so there is no native dependency to compile — the app installs and runs
 * reliably on any platform with a recent Node.
 */
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { dirname, join, isAbsolute } from 'node:path';
import { mkdirSync, existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const configured = process.env.DB_PATH;
export const DB_PATH = configured
  ? (isAbsolute(configured) ? configured : join(__dirname, '..', configured))
  : join(DATA_DIR, 'hanger.db');

export const db = new DatabaseSync(DB_PATH);

// Sensible defaults for a small embedded DB.
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

/** Create all tables + indexes if they do not already exist. */
export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      slug        TEXT    UNIQUE NOT NULL,
      name        TEXT    NOT NULL,
      description TEXT,
      icon        TEXT,
      sort_order  INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS products (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      sku             TEXT    UNIQUE NOT NULL,
      slug            TEXT    UNIQUE NOT NULL,
      name            TEXT    NOT NULL,
      category_id     INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      material        TEXT    NOT NULL,
      type            TEXT    NOT NULL,
      is_clip         INTEGER NOT NULL DEFAULT 0,
      retail_price    REAL    NOT NULL,
      wholesale_price REAL    NOT NULL DEFAULT 0,
      rating          REAL    DEFAULT 0,
      review_count    INTEGER DEFAULT 0,
      size            TEXT,
      durability      TEXT,
      finish          TEXT,
      material_detail TEXT,
      description     TEXT,
      hanger_style    TEXT    DEFAULT 'suit',
      image           TEXT,
      popularity      INTEGER DEFAULT 0,
      created_at      TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS product_colors (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      name       TEXT    NOT NULL,
      hex        TEXT    NOT NULL,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS price_tiers (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      label      TEXT    NOT NULL,
      min_qty    INTEGER,
      max_qty    INTEGER,
      price      REAL,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS inquiries (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      email      TEXT    NOT NULL,
      phone      TEXT,
      company    TEXT,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      quantity   INTEGER,
      message    TEXT    NOT NULL,
      status     TEXT    DEFAULT 'new',
      created_at TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      key   TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT    UNIQUE NOT NULL,
      password_hash TEXT    NOT NULL,
      role          TEXT    NOT NULL DEFAULT 'admin',
      created_at    TEXT    DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_material ON products(material);
    CREATE INDEX IF NOT EXISTS idx_products_type     ON products(type);
    CREATE INDEX IF NOT EXISTS idx_colors_product    ON product_colors(product_id);
    CREATE INDEX IF NOT EXISTS idx_tiers_product     ON price_tiers(product_id);
    CREATE INDEX IF NOT EXISTS idx_inquiries_created ON inquiries(created_at);
  `);

  // Lightweight migrations: add columns that may be missing on older DBs.
  ensureColumn('products', 'image', 'image TEXT');
}

/** Add a column to a table if it doesn't already exist (idempotent migration). */
function ensureColumn(table, column, ddl) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
  if (!cols.includes(column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
  }
}

export default db;
