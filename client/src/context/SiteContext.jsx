import { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api';

const SiteContext = createContext(null);

// Sensible fallbacks so the UI renders even before the API responds.
const FALLBACK = {
  company_name: 'Wish Enterprise',
  tagline: 'Quality Hangers for Wholesale & Retail',
  hero_title: 'Quality Hangers for Wholesale & Retail',
  hero_subtitle: 'Premium materials. Superior durability. Designed for every need.',
  email: 'minfiyaaz@yahoo.com',
  phone_primary: '+94 77 751 8286',
  phone_secondary: '+94 11 244 9134',
  whatsapp_number: '94777518286',
  address_line1: '223, 10 2nd Cross Street',
  address_line2: 'Colombo 11',
  hours_weekday: 'Monday – Friday: 9:00 AM – 6:00 PM',
  hours_saturday: 'Saturday: 9:00 AM – 1:00 PM',
  hours_sunday: 'Sunday: Closed',
  map_query: '223 2nd Cross Street Colombo 11',
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
