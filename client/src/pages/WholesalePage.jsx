import { Link } from 'react-router-dom';
import { Boxes, BadgePercent, Truck, Repeat, ArrowRight, MessageSquare, FileText, PackageCheck } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import { useSite } from '../context/SiteContext';

const STEPS = [
  { icon: MessageSquare, title: 'Send your list', text: 'Tell us the products and quantities you need — by WhatsApp, phone or the contact form.' },
  { icon: FileText, title: 'Get a quote', text: 'We reply with clear wholesale pricing and availability, usually within one business day.' },
  { icon: PackageCheck, title: 'Collect or deliver', text: 'Pick up from our Colombo store or arrange delivery — bulk-ready and on time.' },
];

const PERKS = [
  { icon: BadgePercent, title: 'Wholesale Pricing', text: 'Better-than-retail prices on every product for bulk buyers.' },
  { icon: Boxes, title: 'Flexible Quantities', text: 'Order in the quantities that suit your business — no rigid minimums.' },
  { icon: Truck, title: 'Fast Dispatch', text: 'Reliable lead times and bulk-ready packaging.' },
  { icon: Repeat, title: 'Easy Reordering', text: 'Simple repeat orders and friendly pricing for regular customers.' },
];

export default function WholesalePage() {
  const site = useSite();
  return (
    <div className="container-page py-10">
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Wholesale' }]} />

      <section className="relative mt-6 overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-surface to-base-alt p-10 shadow-lift sm:p-14">
        <div className="media-glow pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full" />
        <p className="eyebrow">Wholesale Program</p>
        <h1 className="relative mt-4 max-w-2xl font-display text-4xl font-bold leading-[1.1] tracking-tight text-fg sm:text-5xl">
          Bulk hangers, priced for your business.
        </h1>
        <p className="relative mt-5 max-w-2xl text-lg leading-relaxed text-muted">
          {site.company_name} supplies retailers, boutiques, dry cleaners and resellers across Sri Lanka with
          premium hangers at wholesale prices. Tell us your quantities and we’ll send a quote.
        </p>
        <div className="relative mt-8 flex flex-wrap gap-3">
          <Link to="/contact" className="btn-solid">Request a Quote</Link>
          <Link to="/hangers" className="btn-outline">
            Browse Catalogue <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="mt-16">
        <div className="flex flex-col items-center text-center">
          <p className="eyebrow mb-3">Simple process</p>
          <h2 className="section-title">How It Works</h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="card relative p-7 shadow-card">
              <span className="absolute right-5 top-5 font-display text-4xl font-bold text-line-2">{i + 1}</span>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-2 text-white shadow-[0_8px_18px_-8px_rgb(var(--c-accent)/0.6)]">
                <s.icon size={20} />
              </div>
              <h3 className="mt-4 font-display text-base font-semibold text-fg">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {PERKS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="card p-7 shadow-card">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-surface-2 text-accent">
              <Icon size={20} />
            </div>
            <h3 className="mt-4 font-display text-sm font-semibold text-fg">{title}</h3>
            <p className="mt-1.5 text-sm text-muted">{text}</p>
          </div>
        ))}
      </section>

      <section className="mt-16 flex flex-col items-center gap-4 rounded-3xl border border-line bg-base-alt p-12 text-center shadow-card">
        <h2 className="font-display text-2xl font-bold text-fg sm:text-3xl">Ready to place a wholesale order?</h2>
        <p className="max-w-xl text-muted">
          Share your product list and quantities — our team typically responds within one business day.
        </p>
        <Link to="/contact" className="btn-solid mt-2">Contact to Order</Link>
      </section>
    </div>
  );
}
