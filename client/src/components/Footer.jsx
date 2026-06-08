import { Link } from 'react-router-dom';
import { Phone, MessageCircle, Mail, MapPin } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { whatsappLink, telLink, mapsLink } from '../lib/format';

function ColTitle({ children }) {
  return (
    <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-faint">{children}</h4>
  );
}

export default function Footer() {
  const site = useSite();

  return (
    <footer className="mt-24 border-t border-line bg-base-alt">
      <div className="container-page grid grid-cols-2 gap-x-8 gap-y-10 py-16 md:grid-cols-3 lg:grid-cols-5">
        {/* Company info */}
        <div className="col-span-2 md:col-span-1">
          <ColTitle>Company Info</ColTitle>
          <p className="font-display text-sm font-bold uppercase tracking-brand text-fg">
            {site.company_name}
          </p>
          <p className="mt-4 text-sm text-muted">{site.address_line1}</p>
          <p className="text-sm text-muted">{site.address_line2}</p>
          <a
            href={`mailto:${site.email}`}
            className="mt-3 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-accent"
          >
            <Mail size={14} /> {site.email}
          </a>
        </div>

        {/* Quick links */}
        <div>
          <ColTitle>Quick Links</ColTitle>
          <ul className="space-y-2.5 text-sm text-muted">
            {[
              ['Home', '/'],
              ['All Hangers', '/hangers'],
              ['Wholesale', '/wholesale'],
              ['About', '/about'],
              ['Contact', '/contact'],
            ].map(([label, to]) => (
              <li key={to}>
                <Link to={to} className="transition-colors hover:text-accent">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Map */}
        <div>
          <ColTitle>Map</ColTitle>
          <a
            href={site.map_url || mapsLink(site.map_query)}
            target="_blank"
            rel="noreferrer"
            className="group relative block aspect-[4/3] overflow-hidden rounded-xl border border-line bg-surface-2"
            aria-label="Open location in Google Maps"
          >
            <svg viewBox="0 0 200 150" className="h-full w-full text-line" preserveAspectRatio="none">
              <rect width="200" height="150" fill="rgb(var(--c-surface-2))" />
              {[30, 60, 90, 120, 150, 180].map((x) => (
                <line key={`v${x}`} x1={x} y1="0" x2={x} y2="150" stroke="currentColor" strokeWidth="1" />
              ))}
              {[25, 50, 75, 100, 125].map((y) => (
                <line key={`h${y}`} x1="0" y1={y} x2="200" y2={y} stroke="currentColor" strokeWidth="1" />
              ))}
              <path d="M0 95 L80 70 L130 100 L200 80" stroke="rgb(var(--c-line-2))" strokeWidth="6" fill="none" />
            </svg>
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full text-accent transition-transform duration-300 group-hover:-translate-y-[120%]">
              <MapPin size={26} className="fill-surface" />
            </span>
          </a>
        </div>

        {/* Operating hours */}
        <div>
          <ColTitle>Operating Hours</ColTitle>
          <ul className="space-y-2 text-sm text-muted">
            <li>{site.hours_weekday}</li>
            <li>{site.hours_saturday}</li>
            <li>{site.hours_sunday}</li>
          </ul>
        </div>

        {/* Contact us */}
        <div className="col-span-2 md:col-span-1">
          <ColTitle>Contact Us</ColTitle>
          <ul className="space-y-3 text-sm text-muted">
            <li>
              <a
                href={whatsappLink(site.whatsapp_number, `Hi ${site.company_name}, I have a wholesale enquiry.`)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 transition-colors hover:text-whatsapp"
              >
                <MessageCircle size={14} /> {site.phone_primary} (WhatsApp)
              </a>
            </li>
            <li>
              <a href={telLink(site.phone_secondary)} className="inline-flex items-center gap-2 transition-colors hover:text-accent">
                <Phone size={14} /> {site.phone_secondary}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-6 text-xs text-faint sm:flex-row">
          <p>© {new Date().getFullYear()} {site.company_name} — All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Wholesale &amp; Retail Hangers</span>
            <Link to="/admin" className="transition-colors hover:text-accent">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
