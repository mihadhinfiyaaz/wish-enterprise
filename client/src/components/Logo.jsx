import { Link } from 'react-router-dom';
import { useSite } from '../context/SiteContext';

// Brand mark: a small hanger glyph + the company name.
export default function Logo({ className = '' }) {
  const site = useSite();
  return (
    <Link to="/" className={`group flex items-center gap-2.5 ${className}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface-2 transition-colors group-hover:border-accent">
        <svg viewBox="0 0 48 40" className="h-5 w-6 text-accent" aria-hidden="true">
          <g fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M24 14c0-4-5-4.5-5-1 0 2.6 2.2 3.6 4 3.8" />
            <path d="M24 16C18 17.5 9 25 5 28.5c-1.4 1.3-.5 3.2 1.4 3.2h35.2c1.9 0 2.8-1.9 1.4-3.2C39 25 30 17.5 24 16Z" />
          </g>
        </svg>
      </span>
      <span className="font-display text-lg font-bold uppercase tracking-brand text-fg">
        {site.company_name || 'Wish Enterprise'}
      </span>
    </Link>
  );
}
