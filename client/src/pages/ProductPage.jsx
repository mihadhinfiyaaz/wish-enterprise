import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MessageCircle, Phone, PackageCheck, Zap, FileText } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import ProductImage from '../components/ProductImage';
import Stars from '../components/Stars';
import Spinner from '../components/Spinner';
import ProductCard from '../components/ProductCard';
import api from '../lib/api';
import { useSite } from '../context/SiteContext';
import { formatPrice, whatsappLink, telLink } from '../lib/format';

// Studio product image — one clean photo per product (admin-managed or default).
function Gallery({ product }) {
  return (
    <div className="group card relative aspect-square overflow-hidden">
      <ProductImage product={product} />
    </div>
  );
}

function TierTable({ tiers }) {
  return (
    <div className="mt-7">
      <h3 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-fg">
        Tiered Wholesale Pricing
      </h3>
      <p className="mt-1 text-xs text-muted">(Price varies based on quantity)</p>
      <div className="mt-3.5 overflow-hidden rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-3 text-[11px] uppercase tracking-wider text-muted">
              <th className="px-4 py-3 text-left font-semibold">Quantity (QTY)</th>
              <th className="px-4 py-3 text-right font-semibold">Price per PC</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((t, i) => (
              <tr key={i} className="border-t border-line transition-colors hover:bg-surface-2">
                <td className="px-4 py-3 text-muted">{t.label}</td>
                <td className="px-4 py-3 text-right font-semibold text-fg">
                  {t.price == null ? 'Contact Us' : formatPrice(t.price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SpecRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-3.5 last:border-0">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm font-medium text-fg">{value}</dd>
    </div>
  );
}

function Specifications({ product }) {
  return (
    <div className="card p-7">
      <h3 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-fg">
        Specifications
      </h3>
      <dl className="mt-4">
        <SpecRow label="Material" value={product.material_detail} />
        <SpecRow label="Size" value={product.size} />
        <SpecRow label="Durability" value={product.durability} />
        <SpecRow label="Finish" value={product.finish} />
        {product.colors?.length > 0 && (
          <div className="flex items-center justify-between gap-4 py-3.5">
            <dt className="text-sm text-muted">Color Options</dt>
            <dd className="flex items-center gap-2">
              {product.colors.map((c) => (
                <span
                  key={c.name}
                  title={c.name}
                  className="h-5 w-5 rounded-full border border-line ring-1 ring-inset ring-black/5"
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}

function OrderCTA({ product }) {
  const site = useSite();
  const waMessage = `Hi ${site.company_name}, I'd like to order/enquire about the ${product.name} (SKU ${product.sku}). Please share wholesale pricing.`;

  return (
    <div className="card p-7">
      <h3 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-fg">Direct Order</h3>
      <div className="mt-4 flex flex-col gap-3">
        <a
          href={whatsappLink(site.whatsapp_number, waMessage)}
          target="_blank"
          rel="noreferrer"
          className="btn-whatsapp w-full"
        >
          <MessageCircle size={18} /> Contact via WhatsApp to Order
        </a>
        <a href={telLink(site.phone_primary)} className="btn-outline w-full">
          <Phone size={17} /> Call to Order
        </a>
        <Link to={`/contact?product=${product.slug}`} className="btn-ghost w-full">
          <FileText size={16} /> Request a Written Quote
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 py-3 text-xs text-muted">
          <PackageCheck size={16} className="text-accent" /> Bulk Orders Welcome
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 py-3 text-xs text-muted">
          <Zap size={16} className="text-accent" /> Fast Response Guaranteed
        </div>
      </div>
    </div>
  );
}

function RelatedProducts({ slug }) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    api.getRelated(slug, 4).then(setItems).catch(() => setItems([]));
  }, [slug]);

  if (!items.length) return null;
  return (
    <section className="mt-20">
      <div className="flex flex-col items-center text-center">
        <p className="eyebrow mb-3">More to explore</p>
        <h2 className="section-title">You May Also Like</h2>
      </div>
      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

export default function ProductPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setProduct(null);
    api
      .getProduct(slug)
      .then((p) => active && setProduct(p))
      .catch((err) => active && setError(err.status === 404 ? 'notfound' : err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="container-page py-24">
        <Spinner label="Loading product…" />
      </div>
    );
  }

  if (error === 'notfound') {
    return (
      <div className="container-page py-28 text-center">
        <h1 className="font-display text-3xl font-bold text-fg">Product not found</h1>
        <p className="mt-2 text-muted">The hanger you’re looking for doesn’t exist.</p>
        <Link to="/hangers" className="btn-outline mt-7">
          Back to All Hangers
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-page py-28 text-center text-red-500">Couldn’t load product: {error}</div>
    );
  }

  const tierPrices = (product.tiers || []).map((t) => t.price).filter((p) => p != null);
  const bulkPrice = tierPrices.length ? Math.min(...tierPrices) : null;

  return (
    <div className="container-page py-10">
      <Breadcrumb
        items={[
          { label: 'Home', to: '/' },
          { label: 'All Hangers', to: '/hangers' },
          { label: product.name },
        ]}
      />

      <div className="mt-7 grid gap-12 lg:grid-cols-2">
        <Gallery product={product} />

        <div>
          <p className="eyebrow">{product.category_name}</p>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-fg">{product.name}</h1>
          <p className="mt-2 text-sm text-muted">SKU: {product.sku}</p>

          <div className="mt-4">
            <Stars rating={product.rating} reviewCount={product.review_count} />
          </div>

          <div className="mt-7 flex flex-wrap items-end gap-x-10 gap-y-4 rounded-2xl border border-line bg-surface-2 p-5">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-faint">Retail Price</p>
              <p className="mt-1 font-display text-3xl font-bold text-fg">
                {formatPrice(product.retail_price)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-faint">Wholesale Price</p>
              <p className="mt-1 font-display text-3xl font-bold text-accent">
                {formatPrice(product.wholesale_price)}
              </p>
              {bulkPrice != null && (
                <p className="mt-0.5 text-xs text-muted">from {formatPrice(bulkPrice)} in bulk</p>
              )}
            </div>
          </div>

          <p className="mt-6 text-sm leading-relaxed text-muted">{product.description}</p>

          <TierTable tiers={product.tiers || []} />
        </div>
      </div>

      <div className="mt-14 grid gap-6 lg:grid-cols-2">
        <Specifications product={product} />
        <OrderCTA product={product} />
      </div>

      <RelatedProducts slug={slug} />
    </div>
  );
}
