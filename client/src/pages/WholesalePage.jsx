import { Link } from 'react-router-dom';
import { Boxes, BadgePercent, Truck, Repeat, ArrowRight } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import { useSite } from '../context/SiteContext';

const TIERS = [
  { range: '50 – 99', note: 'Starter wholesale', save: '35% off retail' },
  { range: '150 – 299', note: 'Growing retailer', save: '42% off retail' },
  { range: '300 – 499', note: 'Established store', save: '48% off retail' },
  { range: '500+', note: 'Distributor / chain', save: '55% off retail' },
];

const PERKS = [
  { icon: BadgePercent, title: 'Tiered Pricing', text: 'The more you order, the lower your price per piece.' },
  { icon: Boxes, title: 'Low MOQs', text: 'Wholesale starts at just 50 units per product.' },
  { icon: Truck, title: 'Fast Dispatch', text: 'Reliable lead times and bulk-ready packaging.' },
  { icon: Repeat, title: 'Repeat Order Discounts', text: 'Loyalty pricing for recurring customers.' },
];

export default function WholesalePage() {
  const site = useSite();
  return (
    <div className="container-page py-10">
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Wholesale' }]} />

      <section className="relative mt-6 overflow-hidden rounded-3xl border border-line bg-surface p-10 shadow-card sm:p-14">
        <div className="media-glow pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full" />
        <p className="eyebrow">Wholesale Program</p>
        <h1 className="mt-4 max-w-2xl font-display text-4xl font-bold leading-[1.1] tracking-tight text-fg sm:text-5xl">
          Bulk hangers, priced for your business.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
          {site.company_name} supplies retailers, boutiques, dry cleaners and distributors with premium
          hangers at volume pricing. Tell us your quantities and we’ll build a quote around them.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/contact" className="btn-solid">
            Request a Quote
          </Link>
          <Link to="/hangers" className="btn-outline">
            Browse Catalogue <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="mt-16">
        <div className="flex flex-col items-center text-center">
          <p className="eyebrow mb-3">Volume pricing</p>
          <h2 className="section-title">How Tiered Pricing Works</h2>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {TIERS.map((t, i) => (
            <div
              key={t.range}
              className="card p-7 text-center transition-all duration-300 hover:-translate-y-1 hover:border-line-2 hover:shadow-lift"
            >
              <div className="text-xs font-semibold uppercase tracking-wider text-accent">Tier {i + 1}</div>
              <div className="mt-3 font-display text-3xl font-bold text-fg">{t.range}</div>
              <div className="mt-1 text-xs text-muted">units</div>
              <div className="mt-5 border-t border-line pt-5 text-sm text-muted">{t.note}</div>
              <div className="mt-2 text-sm font-semibold text-accent">Save {t.save}</div>
            </div>
          ))}
        </div>
        <p className="mt-5 text-center text-xs text-muted">
          Exact per-piece pricing is shown on every product page and confirmed on your order.
        </p>
      </section>

      <section className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {PERKS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="card p-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-surface-2 text-accent">
              <Icon size={20} />
            </div>
            <h3 className="mt-4 font-display text-sm font-semibold text-fg">{title}</h3>
            <p className="mt-1.5 text-sm text-muted">{text}</p>
          </div>
        ))}
      </section>

      <section className="mt-16 flex flex-col items-center gap-4 rounded-3xl border border-line bg-base-alt p-12 text-center">
        <h2 className="font-display text-2xl font-bold text-fg sm:text-3xl">
          Ready to place a wholesale order?
        </h2>
        <p className="max-w-xl text-muted">
          Share your product list and quantities — our team typically responds within one business day.
        </p>
        <Link to="/contact" className="btn-solid mt-2">
          Contact to Order
        </Link>
      </section>
    </div>
  );
}
