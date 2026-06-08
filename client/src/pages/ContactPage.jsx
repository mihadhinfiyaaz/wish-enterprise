import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Phone, MessageCircle, Mail, MapPin, CheckCircle2 } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import api from '../lib/api';
import { useSite } from '../context/SiteContext';
import { whatsappLink, telLink, mapsLink } from '../lib/format';

const EMPTY = { name: '', email: '', phone: '', company: '', productId: '', quantity: '', message: '' };

export default function ContactPage() {
  const site = useSite();
  const [params] = useSearchParams();
  const [form, setForm] = useState(EMPTY);
  const [products, setProducts] = useState([]);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [serverError, setServerError] = useState('');

  // Load products for the dropdown, and preselect from ?product=slug if present.
  useEffect(() => {
    api
      .getProducts({ pageSize: 60, sort: 'name' })
      .then((res) => {
        setProducts(res.items || []);
        const slug = params.get('product');
        if (slug) {
          const match = res.items.find((p) => p.slug === slug);
          if (match) {
            setForm((f) => ({
              ...f,
              productId: String(match.id),
              message: `I'd like to enquire about the ${match.name} (SKU ${match.sku}). Please share wholesale pricing and lead times.`,
            }));
          }
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('submitting');
    setErrors({});
    setServerError('');
    try {
      await api.createInquiry({
        ...form,
        productId: form.productId || null,
        quantity: form.quantity || null,
      });
      setStatus('success');
      setForm(EMPTY);
    } catch (err) {
      if (err.status === 422 && err.data?.errors) {
        setErrors(err.data.errors);
        setStatus('idle');
      } else {
        setServerError(err.message || 'Something went wrong. Please try again.');
        setStatus('error');
      }
    }
  }

  return (
    <div className="container-page py-10">
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Contact' }]} />

      <div className="mt-5">
        <p className="eyebrow mb-2">Get in touch</p>
        <h1 className="font-display text-4xl font-bold tracking-tight text-fg sm:text-5xl">
          Contact to Order
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
          Send us your requirements and our wholesale team will reply with pricing, MOQs and lead times.
          Prefer to talk? Reach us on WhatsApp or by phone.
        </p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Form */}
        <div className="card p-7 sm:p-9">
          {status === 'success' ? (
            <div className="flex flex-col items-center py-12 text-center">
              <CheckCircle2 size={52} className="text-whatsapp" />
              <h2 className="mt-5 font-display text-2xl font-bold text-fg">Enquiry received!</h2>
              <p className="mt-2 max-w-md text-muted">
                Thanks for reaching out. Our team will get back to you shortly at the email or phone you
                provided.
              </p>
              <button onClick={() => setStatus('idle')} className="btn-outline mt-7">
                Send another enquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Name" required error={errors.name}>
                  <input className="input" value={form.name} onChange={set('name')} placeholder="Your name" />
                </Field>
                <Field label="Email" required error={errors.email}>
                  <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="you@company.com" />
                </Field>
                <Field label="Phone" error={errors.phone}>
                  <input className="input" value={form.phone} onChange={set('phone')} placeholder="+1 (555) 000-0000" />
                </Field>
                <Field label="Company" error={errors.company}>
                  <input className="input" value={form.company} onChange={set('company')} placeholder="Company / store name" />
                </Field>
                <Field label="Product of interest" error={errors.productId}>
                  <select className="input" value={form.productId} onChange={set('productId')}>
                    <option value="">— Any / not sure —</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Estimated quantity" error={errors.quantity}>
                  <input className="input" type="number" min="0" value={form.quantity} onChange={set('quantity')} placeholder="e.g. 500" />
                </Field>
              </div>
              <Field label="Message" required error={errors.message}>
                <textarea
                  className="input min-h-[130px] resize-y"
                  value={form.message}
                  onChange={set('message')}
                  placeholder="Tell us what you need…"
                />
              </Field>

              {status === 'error' && (
                <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-500">
                  {serverError}
                </p>
              )}

              <button type="submit" disabled={status === 'submitting'} className="btn-solid w-full sm:w-auto">
                {status === 'submitting' ? 'Sending…' : 'Send Enquiry'}
              </button>
            </form>
          )}
        </div>

        {/* Contact details */}
        <aside className="space-y-5">
          <div className="card p-7">
            <h3 className="eyebrow mb-4">Talk to Us</h3>
            <a
              href={whatsappLink(site.whatsapp_number, `Hi ${site.company_name}, I have a wholesale enquiry.`)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 py-2.5 text-sm text-fg transition-colors hover:text-whatsapp"
            >
              <MessageCircle size={16} className="text-muted" /> {site.phone_primary} (WhatsApp)
            </a>
            <a href={telLink(site.phone_secondary)} className="flex items-center gap-3 py-2.5 text-sm text-fg transition-colors hover:text-accent">
              <Phone size={16} className="text-muted" /> {site.phone_secondary}
            </a>
            <a href={`mailto:${site.email}`} className="flex items-center gap-3 py-2.5 text-sm text-fg transition-colors hover:text-accent">
              <Mail size={16} className="text-muted" /> {site.email}
            </a>
            <a
              href={site.map_url || mapsLink(site.map_query)}
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-3 py-2.5 text-sm text-fg transition-colors hover:text-accent"
            >
              <MapPin size={16} className="mt-0.5 text-muted" />
              <span>
                {site.address_line1}
                <br />
                {site.address_line2}
              </span>
            </a>
          </div>

          <div className="card p-7">
            <h3 className="eyebrow mb-4">Operating Hours</h3>
            <ul className="space-y-2.5 text-sm text-muted">
              <li>{site.hours_weekday}</li>
              <li>{site.hours_saturday}</li>
              <li>{site.hours_sunday}</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, required, error, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted">
        {label} {required && <span className="text-accent">*</span>}
      </span>
      {children}
      {error && <span className="mt-1.5 block text-xs text-red-500">{error}</span>}
    </label>
  );
}
