import { Link } from 'react-router-dom';
import { Factory, Globe2, Award } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import ProductImage from '../components/ProductImage';
import { useSite } from '../context/SiteContext';

const STATS = [
  { value: '20+', label: 'Years in business' },
  { value: '4', label: 'Hanger materials' },
  { value: '500+', label: 'Wholesale clients' },
  { value: '1M+', label: 'Hangers shipped / yr' },
];

const VALUES = [
  { icon: Award, title: 'Quality First', text: 'Every hanger is made from premium materials and built to last.' },
  { icon: Factory, title: 'Made for Volume', text: 'Manufacturing and logistics tuned for reliable bulk supply.' },
  { icon: Globe2, title: 'Trusted Worldwide', text: 'Retailers, boutiques and distributors across the globe rely on us.' },
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
            designed to protect garments and priced to move in bulk.
          </p>
          <Link to="/wholesale" className="btn-outline mt-8">
            Explore Wholesale
          </Link>
        </div>
        <div className="flex justify-center">
          <div className="group relative aspect-square w-full max-w-sm overflow-hidden rounded-[2rem] border border-line shadow-card">
            <ProductImage
              product={{ hanger_style: 'suit', material: 'Wood', name: 'Wish Enterprise wood hanger' }}
              zoom={false}
            />
          </div>
        </div>
      </section>

      <section className="mt-16 grid grid-cols-2 gap-5 lg:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="card p-7 text-center">
            <div className="font-display text-4xl font-bold text-accent">{s.value}</div>
            <div className="mt-2 text-xs uppercase tracking-wider text-muted">{s.label}</div>
          </div>
        ))}
      </section>

      <section className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
        {VALUES.map(({ icon: Icon, title, text }) => (
          <div key={title} className="card p-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-surface-2 text-accent">
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
