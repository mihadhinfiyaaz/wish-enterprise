import { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api';

const SiteContext = createContext(null);

// Sensible fallbacks so the UI renders even before the API responds.
const FALLBACK = {
  company_name: 'Wish Enterprise',
  tagline: 'Quality Hangers for Wholesale & Retail',
  hero_title: 'Quality Hangers for Wholesale & Retail',
  hero_subtitle: 'Premium materials. Superior durability. Designed for every need.',
  email: 'info@wishenterprise.com',
  phone_primary: '+1 (555) 123-4567',
  phone_secondary: '+1 (555) 123-4568',
  whatsapp_number: '15551234567',
  address_line1: '123 Hanger Street, Industrial Area',
  address_line2: 'City 00000',
  hours_weekday: 'Monday – Friday: 9:00 AM – 6:00 PM',
  hours_saturday: 'Saturday: 9:00 AM – 1:00 PM',
  hours_sunday: 'Sunday: Closed',
  map_query: 'Wish Enterprise',
  map_url: 'https://maps.app.goo.gl/zAhtt37NwMJT5qh26',
  about:
    'Wish Enterprise supplies premium hangers to retailers, boutiques, dry cleaners and distributors.',
};

export function SiteProvider({ children }) {
  const [site, setSite] = useState(FALLBACK);

  useEffect(() => {
    let active = true;
    api
      .getSite()
      .then((data) => {
        if (active && data && Object.keys(data).length) setSite({ ...FALLBACK, ...data });
      })
      .catch(() => {
        /* keep fallbacks */
      });
    return () => {
      active = false;
    };
  }, []);

  return <SiteContext.Provider value={site}>{children}</SiteContext.Provider>;
}

export function useSite() {
  const ctx = useContext(SiteContext);
  return ctx || FALLBACK;
}
