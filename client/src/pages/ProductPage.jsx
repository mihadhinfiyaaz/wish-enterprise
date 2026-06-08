import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MessageCircle, Phone, PackageCheck, Zap, FileText, Check } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import ProductImage from '../components/ProductImage';
import Spinner from '../components/Spinner';
import ProductCard from '../components/ProductCard';
import api from '../lib/api';
import { useSite } from '../context/SiteContext';
import { formatPrice, whatsappLink, telLink } from '../lib/format';

function OrderPanel({ product }) {
  const site = useSite();
  const waMessage = `Hi ${site.company_name}, I'd like to order/enquire about the ${product.name} (SKU ${product.sku}). Please share wholesale pricing.`;

  return (
    <div className="card mt-8 p-6 shadow-card">
      <h3 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-fg">Order &amp; Enquire</h3>
      <div className="mt-4 flex flex-col gap-3">
        <a href={whatsappLink(site.whatsapp_number, waMessage)} target="_blank" rel="noreferrer" className="btn-whatsapp w-full">
          <MessageCircle size={18} /> Order via WhatsApp
        </a>
        <div className="grid grid-cols-2 gap-3">
          <a href={telLink(site.phone_primary)} className="btn-outline">
            <Phone size={16} /> Call
          </a>
          <Link to={`/contact?product=${product.slug}`} className="btn-outline">
            <FileText size={15} /> Quote
          </Link>
        </div>
      </div>
      <ul className="mt-5 grid gap-2 text-xs text-muted">
        <li className="flex items-center gap-2"><Check size={14} className="text-accent" /> Wholesale &amp; retail pricing</li>
        <li className="flex items-center gap-2"><PackageCheck size={14} className="text-accent" /> Bulk orders welcome</li>
        <li className="flex items-center gap-2"><Zap size={14} className="text-accent" /> Fast response from our Colombo team</li>
      </ul>
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
      <div className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4">
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

  return (
    <div className="container-page py-10">
      <Breadcrumb
        items={[
          { label: 'Home', to: '/' },
          { label: 'All Hangers', to: '/hangers' },
          { label: product.name },
        ]}
      />

      <div className="mt-7 grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Image */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="group card relative aspect-square overflow-hidden shadow-card">
            <ProductImage product={product} />
          </div>
        </div>

        {/* Details */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="pill !py-1 text-[10px] uppercase tracking-[0.12em]">{product.material}</span>
            <span className="pill !py-1 text-[10px] uppercase tracking-[0.12em]">{product.type}</span>
          </div>
          <p className="eyebrow mt-4">{product.category_name}</p>
          <h1 className="mt-2 font-display text-4xl font-bold leading-tight tracking-tight text-fg">
            {product.name}
          </h1>
          <p className="mt-2 text-sm text-muted">SKU: {product.sku}</p>

          {/* Price card */}
          <div className="mt-7 grid grid-cols-2 overflow-hidden rounded-2xl border border-line bg-surface-2 shadow-card">
            <div className="border-r border-line p-5">
              <p className="text-[11px] font-medium uppercase tracking-wider text-faint">Retail Price</p>
              <p className="mt-1 font-display text-2xl font-bold text-fg sm:text-3xl">
                {formatPrice(product.retail_price)}
              </p>
            </div>
            <div className="bg-accent/[0.06] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-accent-2 dark:text-accent">
                Wholesale Price
              </p>
              <p className="mt-1 font-display text-2xl font-bold text-fg sm:text-3xl">
                {formatPrice(product.wholesale_price)}
              </p>
            </div>
          </div>

          {product.description && (
            <p className="mt-7 leading-relaxed text-muted">{product.description}</p>
          )}

          <OrderPanel product={product} />
        </div>
      </div>

      <RelatedProducts slug={slug} />
    </div>
  );
}
