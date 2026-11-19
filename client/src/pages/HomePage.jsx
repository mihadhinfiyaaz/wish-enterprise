import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Check, ChevronDown, MessageCircle, Phone } from 'lucide-react';
import HangerWall from '../components/HangerWall';
import ProductImage from '../components/ProductImage';
import ProductCard from '../components/ProductCard';
import api from '../lib/api';
import { useSite } from '../context/SiteContext';
import { getCategoryImage } from '../lib/productImages';
import { whatsappLink, telLink } from '../lib/format';

// User-provided lifestyle photo (clothes neatly hung on hangers).
const STORY_IMAGE = '/hero-clothes.jpg';

const CATEGORY_FALLBACK = [
  { slug: 'wood', name: 'Wood Hangers', icon: 'suit' },
  { slug: 'metal', name: 'Metal Hangers', icon: 'trouser' },
  { slug: 'plastic', name: 'Plastic Hangers', icon: 'shirt' },
  { slug: 'clip', name: 'Clip Hangers', icon: 'clip' },
];

const STEPS = [
  { title: 'Send your list', text: 'Tell us which hangers you need and roughly how many.' },
  { title: 'Get your quote', text: 'We reply with wholesale pricing and availability, usually within a day.' },
  { title: 'Collect or deliver', text: 'Pick up from our Colombo 11 shop or arrange delivery.' },
];

function SectionHeading({ eyebrow, title, align = 'center' }) {
  return (
    <div className={align === 'center' ? 'flex flex-col items-center text-center' : ''}>
      <p className="eyebrow mb-3">{eyebrow}</p>
      <h2 className="font-display text-3xl font-bold tracking-tight text-fg sm:text-4xl">{title}</h2>
    </div>
  );
}

function Hero() {
  const site = useSite();
  const [first, ...rest] = (site.company_name || 'Wish Enterprise').split(' ');

  return (
    <section className="relative isolate flex min-h-[calc(100svh-65px)] items-center overflow-hidden border-b border-line bg-base">
      <HangerWall />
      <div aria-hidden="true" className="hero-scrim pointer-events-none absolute inset-0" />

      <div className="container-page relative z-10 flex flex-col items-center py-24 text-center animate-fade-up">
        {/* Soft glow sized to the text block, so every line stays crisp over the wall at any width */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-[2%] inset-y-[6%] -z-10 rounded-[50%] bg-base/90 blur-3xl sm:inset-x-[18%] lg:inset-x-[24%]"
        />
        <p className="eyebrow mb-6">Wholesale &amp; Retail · Colombo</p>
        <h1 className="font-display text-[3.5rem] font-bold leading-[0.95] tracking-tight text-fg sm:text-7xl lg:text-[6.5rem]">
          {first} {rest.length > 0 && <span className="text-accent">{rest.join(' ')}</span>}
        </h1>
        <p className="mt-7 font-display text-xl font-medium text-fg sm:text-2xl">{site.hero_title}</p>
        <p className="mt-3 max-w-md text-base leading-relaxed text-muted">{site.hero_subtitle}</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link to="/contact" className="btn-solid">Contact to Order</Link>
          <Link to="/hangers" className="btn-outline bg-base/70 backdrop-blur">
            Browse All Hangers <ArrowRight size={16} />
          </Link>
        </div>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-accent" /> Wood · Metal · Plastic · Clip</span>
          <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-accent" /> Wholesale pricing</span>
          <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-accent" /> Bulk &amp; single orders</span>
        </div>
      </div>

      <a
        href="#materials"
        aria-label="Scroll to hanger materials"
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-faint transition-colors hover:text-fg"
      >
        <ChevronDown size={22} />
      </a>
    </section>
  );
}

function Materials() {
  const [categories, setCategories] = useState(CATEGORY_FALLBACK);
  useEffect(() => {
    api.getCategories().then((d) => d?.length && setCategories(d)).catch(() => {});
  }, []);

  return (
    <section id="materials" className="container-page scroll-mt-20 py-24">
      <SectionHeading eyebrow="Collections" title="Shop by material" />
      <div className="mt-14 grid grid-cols-2 gap-5 lg:grid-cols-4">
        {categories.map((cat) => {
          const src = getCategoryImage(cat.slug);
          return (
            <Link
              key={cat.slug}
              to={`/hangers?category=${cat.slug}`}
              className="group card overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-line-2 hover:shadow-lift"
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden border-b border-line">
                <ProductImage
                  product={{ hanger_style: cat.icon || 'suit' }}
                  image={src ? { src, alt: `${cat.name} — product photo` } : undefined}
                  pad="14%"
                />
              </div>
              <div className="flex items-center justify-between gap-3 p-5">
                <div>
                  <h3 className="font-display text-base font-semibold text-fg">{cat.name}</h3>
                  {cat.product_count != null && (
                    <p className="mt-1 text-xs text-muted">{cat.product_count} products</p>
                  )}
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-muted transition-colors group-hover:border-accent group-hover:text-accent">
                  <ArrowUpRight size={16} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function Story() {
  const stats = [
    { value: '15+', label: 'Years in business' },
    { value: '4', label: 'Hanger materials' },
    { value: 'Any size', label: 'Bulk or single orders' },
  ];

  return (
    <section className="border-t border-line">
      <div className="container-page grid items-center gap-12 py-24 md:grid-cols-2 lg:gap-20">
        <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-[2rem] border border-line shadow-lift">
          <img
            src={STORY_IMAGE}
            alt="Clothes neatly hung on hangers"
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
            draggable="false"
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(125%_115%_at_50%_42%,transparent_55%,rgba(45,33,24,0.18))]" />
        </div>

        <div>
          <SectionHeading eyebrow="Our story" title="Hangers that help clothes look their best." align="left" />
          <p className="mt-6 max-w-lg leading-relaxed text-muted">
            From boutiques and dry cleaners to homes across Sri Lanka, Wish Enterprise supplies wood, metal,
            plastic and clip hangers from our shop in Colombo 11, at honest prices whether you need ten or ten
            thousand.
          </p>
          <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-line pt-8">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col-reverse">
                <dt className="mt-1 text-xs text-muted">{s.label}</dt>
                <dd className="font-display text-2xl font-bold tracking-tight text-fg sm:text-3xl">{s.value}</dd>
              </div>
            ))}
          </dl>
          <Link to="/about" className="btn-outline mt-10">
            About us <ArrowRight size={16} />
          </Link>
        </div>
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
      <div className="container-page py-24">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading eyebrow="Most popular" title="Best sellers" align="left" />
          <Link to="/hangers" className="btn-outline">
            View all <ArrowRight size={16} />
          </Link>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

function WholesaleSteps() {
  return (
    <section className="container-page py-24">
      <SectionHeading eyebrow="Wholesale" title="Ordering in bulk is simple" />
      <ol className="mt-14 grid gap-5 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <li key={step.title} className="card p-7">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-2 font-display text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgb(var(--c-accent)/0.6)]">
              {i + 1}
            </span>
            <h3 className="mt-5 font-display text-lg font-semibold text-fg">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
          </li>
        ))}
      </ol>
      <div className="mt-10 text-center">
        <Link to="/wholesale" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
          How wholesale works <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}

function CtaBand() {
  const site = useSite();
  return (
    <section className="container-page pb-24">
      <div className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-surface to-base-alt p-10 text-center shadow-lift sm:p-16">
        <div className="media-glow pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full" />
        <h2 className="relative font-display text-3xl font-bold tracking-tight text-fg sm:text-4xl">Need hangers in bulk?</h2>
        <p className="relative mx-auto mt-4 max-w-xl text-muted">
          Tell us what you need and our Colombo team will reply with pricing and availability, usually within a day.
        </p>
        <div className="relative mt-9 flex flex-wrap justify-center gap-3">
          <Link to="/contact" className="btn-solid">Contact to Order</Link>
          <a
            href={whatsappLink(site.whatsapp_number, 'Hello Wish Enterprise, I would like to enquire about hangers.')}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp"
          >
            <MessageCircle size={16} /> WhatsApp
          </a>
          <a href={telLink(site.phone_secondary)} className="btn-outline">
            <Phone size={16} /> Call
          </a>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <Materials />
      <Story />
      <BestSellers />
      <WholesaleSteps />
      <CtaBand />
    </>
  );
}
