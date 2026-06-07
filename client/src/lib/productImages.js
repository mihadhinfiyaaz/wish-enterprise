/**
 * productImages.js — local studio-photo asset pipeline.
 *
 * RULES (strict): only images that physically exist in `src/assets/products/`
 * are used. Nothing is fetched, generated, or pulled from stock. Every file is
 * auto-discovered at build time via import.meta.glob.
 *
 * The provided "WE product images" folder is a single white-seamless studio
 * shoot (centred, soft top light). It was clustered by visual content — material
 * (wood / metal / plastic), shape (suit / shirt / trouser / clip) and finish —
 * into consistent SETS. Each set ships as `{set}-{n}.jpg` where `-1` is the
 * primary front view and `-2..-4` are alternate angles of the SAME product, so
 * a product's gallery and every card in a category share one photoshoot look.
 *
 * Products are matched to a set by an explicit manifest (below); anything not
 * listed falls back to a material+shape heuristic. So the catalogue stays
 * visually uniform even as products change.
 */

// Auto-discover every photo actually present in the folder (as URLs).
const discovered = import.meta.glob('../assets/products/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
  query: '?url',
  import: 'default',
});

// Cluster files into  setKey -> [url ordered by angle index]
const sets = {};
for (const [path, url] of Object.entries(discovered)) {
  const file = path.split('/').pop().replace(/\.(jpe?g|png|webp|avif)$/i, '');
  const m = file.match(/^(.*?)-(\d+)$/);
  const key = m ? m[1] : file; // "metal-suit-1" → "metal-suit"; "wood-clip" → "wood-clip"
  const idx = m ? parseInt(m[2], 10) : 1;
  (sets[key] ||= []).push({ idx, url });
}
for (const key of Object.keys(sets)) {
  sets[key] = sets[key].sort((a, b) => a.idx - b.idx).map((x) => x.url);
}

// Manifest: product slug → image set. One consistent set per visual product so
// each category reads like a single shoot. Sets are reused within a category
// where the source folder has no distinct studio single (e.g. clip variants).
const PRODUCT_SET = {
  // Wood
  'wood-suit-hanger': 'wood-suit',
  'wood-shirt-hanger': 'wood-shirt',
  'wood-trouser-hanger': 'wood-trouser',
  'wood-coat-hanger': 'wood-dark',
  'cedar-wood-hanger': 'wood-walnut',
  'bamboo-wood-hanger': 'wood-felt',
  // Metal
  'metal-suit-hanger': 'metal-suit',
  'metal-trouser-hanger': 'metal-wire',
  'metal-shirt-hanger': 'metal-wire',
  'metal-wire-hanger': 'metal-wire',
  'chrome-coat-hanger': 'metal-suit',
  'metal-cascading-hanger': 'metal-suit',
  // Plastic
  'plastic-suit-hanger': 'plastic-black',
  'plastic-shirt-hanger': 'plastic-clear',
  'plastic-trouser-hanger': 'plastic-grey',
  'plastic-kids-hanger': 'plastic-pink',
  'plastic-slim-hanger': 'plastic-transparent',
  // Clip (defining feature = the clips → use the clean clip studio shots)
  'clip-hanger-wood': 'wood-clip',
  'clip-hanger-plastic': 'wood-trouser',
  'clip-hanger-plastic-slim': 'wood-trouser',
  'clip-hanger-metal': 'wood-trouser',
  'skirt-clip-hanger': 'wood-clip',
  'multi-bar-clip-hanger': 'wood-trouser',
  'velvet-clip-hanger': 'wood-clip',
};

// Heuristic fallback (material + shape) for any unmapped product.
function fallbackSet({ material, type, is_clip } = {}) {
  if (is_clip || type === 'Clip') return type === 'Trouser' ? 'wood-trouser' : 'wood-clip';
  if (material === 'Metal') return type === 'Suit' ? 'metal-suit' : 'metal-wire';
  if (material === 'Plastic') {
    if (type === 'Shirt') return 'plastic-clear';
    if (type === 'Trouser') return 'plastic-grey';
    return 'plastic-black';
  }
  if (type === 'Shirt') return 'wood-shirt';
  if (type === 'Trouser') return 'wood-trouser';
  if (type === 'Clip') return 'wood-clip';
  return 'wood-suit';
}

function resolveSet(product) {
  const key = (product?.slug && PRODUCT_SET[product.slug]) || fallbackSet(product || {});
  return sets[key]?.length ? key : 'wood-suit';
}

const ANGLE = ['front', 'angled', 'side', 'detail'];

/** Ordered list of studio photos for a product: [{ src, alt }]. */
export function getProductImages(product) {
  const urls = sets[resolveSet(product)] || [];
  const name = product?.name || 'Hanger';
  return urls.map((src, i) => ({
    src,
    alt: `${name} — ${ANGLE[i] || `view ${i + 1}`} view, studio product photo`,
  }));
}

/** The single best (primary front) photo for a product, or null. */
export function getProductImage(product) {
  return getProductImages(product)[0] || null;
}

export function hasLocalPhoto(product) {
  return getProductImages(product).length > 0;
}

// Representative photo for a category tile.
const CATEGORY_SET = { wood: 'wood-suit', metal: 'metal-suit', plastic: 'plastic-black', clip: 'wood-clip' };
export function getCategoryImage(slug) {
  const key = CATEGORY_SET[slug] || 'wood-suit';
  return (sets[key] || [])[0] || null;
}
