import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Tags, LayoutGrid, Headphones, ArrowRight, ArrowUpRight } from 'lucide-react';
import ProductImage from '../components/ProductImage';
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
      { title: site.hero_title, subtitle: site.hero_subtitle, variant: 'suit', material: 'Wood' },
      { title: 'Built for Bulk. Priced for Business.', subtitle: 'Tiered wholesale pricing on every product in our range.', variant: 'trouser', material: 'Metal' },
      { title: 'Wood, Metal, Plastic & Clip.', subtitle: 'One trusted supplier for every hanger you need.', variant: 'clip', material: 'Plastic' },
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
    <section className="relative overflow-hidden border-b border-line">
      <div className="container-page grid items-center gap-10 py-20 md:grid-cols-2 md:py-28">
        <div key={index} className="animate-fade-up">
          <p className="eyebrow mb-5">Wholesale &amp; Retail · Est. Quality</p>
          <h1 className="font-display text-[2.6rem] font-bold leading-[1.05] tracking-tight text-fg sm:text-6xl">
            {slide.title}
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">{slide.subtitle}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link to="/contact" className="btn-solid">
              Contact to Order
            </Link>
            <Link to="/hangers" className="btn-outline">
              Browse All Hangers <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="group relative aspect-square w-full max-w-md overflow-hidden rounded-[2rem] border border-line shadow-card">
            <ProductImage
              product={{ hanger_style: slide.variant, material: 'Wood', name: 'Wish Enterprise studio hanger' }}
              zoom={false}
            />
          </div>
        </div>
      </div>

      {/* Carousel dots */}
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
    api
      .getCategories()
      .then((data) => data?.length && setCategories(data))
      .catch(() => {});
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
            className="group card flex flex-col items-center gap-4 p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-line-2 hover:shadow-lift"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-line">
              <ProductImage
                product={{ hanger_style: cat.icon || 'suit' }}
                image={
                  getCategoryImage(cat.slug)
                    ? { src: getCategoryImage(cat.slug), alt: `${cat.name} — product photo` }
                    : undefined
                }
              />
            </div>
            <div>
              <h3 className="font-display text-sm font-semibold uppercase tracking-[0.1em] text-fg">
                {cat.name}
              </h3>
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

function Benefits() {
  return (
    <section className="border-y border-line bg-base-alt">
      <div className="container-page grid grid-cols-2 gap-x-8 gap-y-10 py-14 lg:grid-cols-4">
        {BENEFITS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-line bg-surface text-accent shadow-card">
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

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedCategories />
      <Benefits />
    </>
  );
}
