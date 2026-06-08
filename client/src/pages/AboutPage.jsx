import { Link } from 'react-router-dom';
import { Boxes, MapPin, Award } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import ProductImage from '../components/ProductImage';
import { getCategoryImage } from '../lib/productImages';
import { useSite } from '../context/SiteContext';

const STATS = [
  { value: '15+', label: 'Years in business' },
  { value: '4', label: 'Hanger materials' },
  { value: '100s', label: 'Products in stock' },
];

const VALUES = [
  { icon: Award, title: 'Quality First', text: 'Every hanger is chosen from durable, premium materials and built to last.' },
  { icon: Boxes, title: 'Wholesale & Retail', text: 'From single packs to bulk orders — priced for businesses and individuals alike.' },
  { icon: MapPin, title: 'Trusted across Sri Lanka', text: 'Retailers, boutiques, dry cleaners and households countrywide rely on us.' },
];

const COLLAGE = [
  { slug: 'wood', label: 'Wood' },
  { slug: 'metal', label: 'Metal' },
  { slug: 'plastic', label: 'Plastic' },
  { slug: 'clip', label: 'Clip' },
];

export default function AboutPage() {
  const site = useSite();
  return (
    <div className="container-page py-10">
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'About' }]} />

      <section className="mt-6 grid items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="eyebrow">About {site.company_name}</p>
          <h1 className="mt-4 font-display text-4xl font-bold leading-[1.1] tracking-tight text-fg sm:text-5xl">
            Premium hangers for retail &amp; wholesale.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted">{site.about}</p>
          <p className="mt-4 leading-relaxed text-muted">
            From solid-wood suit hangers to heavy-duty metal and cost-effective plastic, every product is
            designed to protect garments and priced to move — whether you need a single pack or a pallet.
          </p>
          <Link to="/wholesale" className="btn-outline mt-8">
            Explore Wholesale
          </Link>
        </div>

        {/* Staggered studio collage of the full range */}
        <div className="relative">
          <div className="media-glow pointer-events-none absolute -inset-6 opacity-70" />
          <div className="relative grid grid-cols-2 gap-4 sm:gap-5">
            {COLLAGE.map((c, i) => (
              <div
                key={c.slug}
                className={`group relative aspect-square overflow-hidden rounded-2xl border border-line shadow-lift transition-transform duration-500 hover:-translate-y-1 ${
                  i % 2 === 1 ? 'translate-y-6 sm:translate-y-8' : ''
                }`}
              >
                <ProductImage
                  product={{ hanger_style: c.slug === 'clip' ? 'clip' : 'suit' }}
                  image={getCategoryImage(c.slug) ? { src: getCategoryImage(c.slug), alt: `${c.label} hanger` } : undefined}
                />
                <span className="pill absolute bottom-2.5 left-2.5 !py-0.5 text-[10px] uppercase tracking-wider">
                  {c.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-20 grid grid-cols-3 gap-4 sm:gap-5">
        {STATS.map((s) => (
          <div key={s.label} className="card p-6 text-center shadow-card sm:p-7">
            <div className="font-display text-3xl font-bold text-accent sm:text-4xl">{s.value}</div>
            <div className="mt-2 text-[11px] uppercase tracking-wider text-muted sm:text-xs">{s.label}</div>
          </div>
        ))}
      </section>

      <section className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
        {VALUES.map(({ icon: Icon, title, text }) => (
          <div key={title} className="card p-7 shadow-card">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-2 text-white shadow-[0_8px_18px_-8px_rgb(var(--c-accent)/0.6)]">
              <Icon size={20} />
            </div>
            <h3 className="mt-4 font-display text-sm font-semibold text-fg">{title}</h3>
            <p className="mt-1.5 text-sm text-muted">{text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
