import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Tags, LayoutGrid, Headphones, ArrowRight, ArrowUpRight, Check,
} from 'lucide-react';

// White-background hangers lineup — blends into the studio niche like the other slides.
// ?v busts the browser cache after re-editing the file.
const RANGE_IMAGE = '/hangers-range.png?v=2';
import ProductImage from '../components/ProductImage';
import ProductCard from '../components/ProductCard';
import api from '../lib/api';
import { useSite } from '../context/SiteContext';
import { getCategoryImage } from '../lib/productImages';

const BENEFITS = [
  { icon: ShieldCheck, title: 'Premium Quality', text: 'Built to last.' },
  { icon: Tags, title: 'Wholesale Pricing', text: 'Best value for bulk.' },
  { icon: LayoutGrid, title: 'Wide Selection', text: 'Styles for every use.' },
  { icon: Headphones, title: 'Dedicated Support', text: 'We’re here to help.' },
];

const CATEGORY_FALLBACK = [
  { slug: 'wood', name: 'Wood Hangers', icon: 'suit' },
  { slug: 'metal', name: 'Metal Hangers', icon: 'trouser' },
  { slug: 'plastic', name: 'Plastic Hangers', icon: 'shirt' },
  { slug: 'clip', name: 'Clip Hangers', icon: 'clip' },
];

function Hero() {
  const site = useSite();
  const slides = useMemo(
    () => [
      { title: site.hero_title, subtitle: site.hero_subtitle, material: 'Wood', type: 'Suit' },
      { title: 'Built for bulk. Priced for business.', subtitle: 'Honest wholesale prices on every product in our range.', material: 'Metal', type: 'Suit' },
      { title: 'Wood, metal, plastic & clip.', subtitle: 'One trusted Colombo supplier for every hanger you need.', customImage: RANGE_IMAGE },
    ],
    [site.hero_title, site.hero_subtitle]
  );

  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(id);
  }, [slides.length]);
  const slide = slides[index];

  return (
    <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-base-alt/60 to-base">
      <div className="container-page grid items-center gap-12 py-16 md:grid-cols-2 md:py-24">
        <div key={index} className="animate-fade-up">
          <p className="eyebrow mb-5">Wholesale &amp; Retail · Colombo</p>
          <h1 className="font-display text-[2.6rem] font-bold leading-[1.04] tracking-tight text-fg sm:text-6xl">
            {slide.title}
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">{slide.subtitle}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link to="/contact" className="btn-solid">Contact to Order</Link>
            <Link to="/hangers" className="btn-outline">
              Browse All Hangers <ArrowRight size={16} />
            </Link>
          </div>
          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-accent" /> Wood · Metal · Plastic · Clip</span>
            <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-accent" /> Bulk &amp; single orders</span>
          </div>
        </div>

        {/* Image */}
        <div className="relative w-full">
          {slide.customImage ? (
            <div
              key={slide.customImage}
              className="group relative aspect-[4/3] w-full animate-fade-in overflow-hidden rounded-[2rem] border border-line shadow-lift"
            >
              <ProductImage
                image={{ src: slide.customImage, alt: 'Wood, metal, plastic and clip hangers' }}
                zoom={false}
                pad="4%"
              />
            </div>
          ) : (
            <div
              key={slide.material + slide.type}
              className="group relative mx-auto aspect-square w-full max-w-md animate-fade-in overflow-hidden rounded-[2rem] border border-line shadow-lift"
            >
              <ProductImage product={{ material: slide.material, type: slide.type, hanger_style: 'suit' }} zoom={false} />
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center gap-2 pb-10">
        {slides.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === index ? 'w-7 bg-accent' : 'w-2.5 bg-line-2 hover:bg-faint'
            }`}
          />
        ))}
      </div>
    </section>
  );
}

function FeaturedCategories() {
  const [categories, setCategories] = useState(CATEGORY_FALLBACK);
  useEffect(() => {
    api.getCategories().then((d) => d?.length && setCategories(d)).catch(() => {});
  }, []);

  return (
    <section className="container-page py-20">
      <div className="flex flex-col items-center text-center">
        <p className="eyebrow mb-3">Collections</p>
        <h2 className="section-title">Featured Categories</h2>
      </div>
      <div className="mt-12 grid grid-cols-2 gap-5 lg:grid-cols-4">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            to={`/hangers?category=${cat.slug}`}
            className="group card flex flex-col items-center gap-4 p-5 text-center shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-line-2 hover:shadow-lift"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-line">
              <ProductImage
                product={{ hanger_style: cat.icon || 'suit' }}
                image={getCategoryImage(cat.slug) ? { src: getCategoryImage(cat.slug), alt: `${cat.name} — product photo` } : undefined}
              />
            </div>
            <div>
              <h3 className="font-display text-sm font-semibold uppercase tracking-[0.1em] text-fg">{cat.name}</h3>
              {cat.product_count != null && (
                <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-muted">
                  {cat.product_count} products
                  <ArrowUpRight size={12} className="opacity-0 transition-opacity group-hover:opacity-100" />
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function BestSellers() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    api.getProducts({ pageSize: 4, sort: 'popular' }).then((r) => setItems(r.items || [])).catch(() => {});
  }, []);
  if (!items.length) return null;

  return (
    <section className="border-y border-line bg-base-alt">
      <div className="container-page py-20">
        <div className="flex flex-col items-end justify-between gap-4 sm:flex-row">
          <div>
            <p className="eyebrow mb-3">Most Popular</p>
            <h2 className="font-display text-2xl font-bold tracking-tight text-fg sm:text-3xl">Best Sellers</h2>
          </div>
          <Link to="/hangers" className="btn-outline">
            View all <ArrowRight size={16} />
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Benefits() {
  return (
    <section className="container-page py-16">
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {BENEFITS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="card flex items-center gap-4 p-5 shadow-card">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-2 text-white shadow-[0_8px_18px_-8px_rgb(var(--c-accent)/0.6)]">
              <Icon size={20} />
            </div>
            <div>
              <h3 className="font-display text-sm font-semibold text-fg">{title}</h3>
              <p className="text-xs text-muted">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CtaBand() {
  return (
    <section className="container-page pb-20">
      <div className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-surface to-base-alt p-10 text-center shadow-lift sm:p-14">
        <div className="media-glow pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full" />
        <h2 className="relative font-display text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          Need hangers in bulk?
        </h2>
        <p className="relative mx-auto mt-3 max-w-xl text-muted">
          Tell us what you need and our Colombo team will reply with pricing and availability — usually within a day.
        </p>
        <Link to="/contact" className="btn-solid relative mt-7">Contact to Order</Link>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedCategories />
      <BestSellers />
      <Benefits />
      <CtaBand />
    </>
  );
}
