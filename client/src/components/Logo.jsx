import { Link } from 'react-router-dom';
import { useSite } from '../context/SiteContext';

/**
 * Logo — a premium emblem (gradient badge + studio hanger glyph with depth)
 * paired with a two-tone wordmark. Theme-aware via the accent token.
 */
export default function Logo({ className = '' }) {
  const site = useSite();
  const name = (site.company_name || 'Wish Enterprise').toString();
  const [first, ...rest] = name.split(' ');

  return (
    <Link to="/" className={`group flex items-center gap-3 ${className}`} aria-label={name}>
      <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-2 shadow-[0_8px_20px_-8px_rgb(var(--c-accent)/0.7)] ring-1 ring-inset ring-white/25 transition-transform duration-300 group-hover:-translate-y-0.5">
        {/* soft top highlight for depth */}
        <span className="pointer-events-none absolute inset-x-1 top-1 h-1/3 rounded-t-lg bg-white/20 blur-[2px]" />
        <svg viewBox="0 0 48 44" className="relative h-6 w-6 text-white" aria-hidden="true">
          <g fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            {/* hook */}
            <path d="M24 15c0-4.5-5.4-5-5.4-1 0 2.6 2.2 3.6 4 3.8" />
            {/* shoulders + bar */}
            <path d="M24 17.5C17.5 19 8 27 4 30.6c-1.6 1.4-.6 3.6 1.6 3.6h36.8c2.2 0 3.2-2.2 1.6-3.6C40 27 30.5 19 24 17.5Z" />
            <path d="M9 33.5 24 26l15 7.5" opacity="0.45" />
          </g>
        </svg>
      </span>
      <span className="font-display text-[17px] font-bold uppercase leading-none tracking-[0.12em] text-fg">
        {first}
        {rest.length > 0 && <span className="ml-1.5 font-medium text-muted">{rest.join(' ')}</span>}
      </span>
    </Link>
  );
}
