import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Pencil, Trash2, X, Upload, LogOut, ExternalLink, Loader2, Lock, ImageOff, Package, Tags,
} from 'lucide-react';
import api, { getAdminToken, setAdminToken } from '../lib/api';
import ProductImage from '../components/ProductImage';
import ThemeToggle from '../components/ThemeToggle';
import { formatPrice } from '../lib/format';

const MATERIALS = ['Wood', 'Metal', 'Plastic'];
const TYPES = ['Suit', 'Shirt', 'Trouser', 'Clip'];
const STYLES = ['suit', 'shirt', 'trouser', 'clip'];

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

/* ════════════════════════════════════════════════════════════════
   Root — auth gate
   ════════════════════════════════════════════════════════════════ */
export default function AdminPage() {
  const [status, setStatus] = useState('checking'); // checking | out | in

  useEffect(() => {
    document.title = 'Admin · Wish Enterprise';
    if (!getAdminToken()) return setStatus('out');
    api.admin
      .session()
      .then(() => setStatus('in'))
      .catch(() => setStatus('out'));
  }, []);

  if (status === 'checking') {
    return (
      <div className="grid min-h-screen place-items-center bg-base text-muted">
        <Loader2 className="animate-spin" />
      </div>
    );
  }
  return status === 'in' ? (
    <Dashboard onLogout={() => setStatus('out')} />
  ) : (
    <Login onSuccess={() => setStatus('in')} />
  );
}

/* ════════════════════════════════════════════════════════════════
   Login
   ════════════════════════════════════════════════════════════════ */
function Login({ onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { token } = await api.admin.login(password);
      setAdminToken(token);
      onSuccess();
    } catch (err) {
      setError(err.status === 401 ? 'Incorrect password' : err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-base px-4">
      <form onSubmit={submit} className="card w-full max-w-sm p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-surface-2 text-accent">
            <Lock size={20} />
          </span>
          <h1 className="font-display text-xl font-bold text-fg">Wish Enterprise Admin</h1>
          <p className="mt-1 text-sm text-muted">Sign in to manage the catalogue.</p>
        </div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted">Password</label>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
          placeholder="••••••••"
        />
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        <button type="submit" disabled={busy} className="btn-solid mt-5 w-full">
          {busy ? <Loader2 size={16} className="animate-spin" /> : 'Sign In'}
        </button>
        <Link to="/" className="mt-4 block text-center text-xs text-muted hover:text-accent">
          ← Back to site
        </Link>
      </form>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Dashboard
   ════════════════════════════════════════════════════════════════ */
function Dashboard({ onLogout }) {
  const [tab, setTab] = useState('products');

  async function logout() {
    try { await api.admin.logout(); } catch { /* ignore */ }
    setAdminToken(null);
    onLogout();
  }

  return (
    <div className="min-h-screen bg-base">
      <header className="sticky top-0 z-30 border-b border-line bg-base/90 backdrop-blur-xl">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-display text-base font-bold uppercase tracking-brand text-fg">
              Wish Enterprise
            </span>
            <span className="pill !py-0.5 text-[10px] uppercase tracking-wider">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" target="_blank" className="btn-ghost !px-3 !py-2 text-xs">
              View site <ExternalLink size={14} />
            </Link>
            <ThemeToggle />
            <button onClick={logout} className="btn-outline !px-3 !py-2 text-xs">
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
        <div className="container-page flex gap-1 pb-0">
          {[
            ['products', 'Products', Package],
            ['categories', 'Categories', Tags],
          ].map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                tab === id ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg'
              }`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      </header>

      <main className="container-page py-8">
        {tab === 'products' ? <ProductsManager /> : <CategoriesManager />}
      </main>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Products
   ════════════════════════════════════════════════════════════════ */
function ProductsManager() {
  const [products, setProducts] = useState(null);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null); // product object or {} for new
  const [error, setError] = useState('');

  const load = () => {
    Promise.all([api.admin.listProducts(), api.getCategories()])
      .then(([p, c]) => {
        setProducts(p);
        setCategories(c);
      })
      .catch((e) => setError(e.message));
  };
  useEffect(load, []);

  async function remove(p) {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await api.admin.deleteProduct(p.id);
      load();
    } catch (e) {
      alert(e.message);
    }
  }

  if (error) return <p className="text-red-500">{error}</p>;
  if (!products) return <Loader2 className="mx-auto my-20 animate-spin text-muted" />;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-fg">Products</h2>
          <p className="text-sm text-muted">{products.length} total</p>
        </div>
        <button onClick={() => setEditing({})} className="btn-solid">
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-[11px] uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Product</th>
                <th className="px-4 py-3 text-left font-semibold">Category</th>
                <th className="px-4 py-3 text-left font-semibold">Type</th>
                <th className="px-4 py-3 text-right font-semibold">Retail</th>
                <th className="px-4 py-3 text-right font-semibold">Wholesale</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-line">
                        <ProductImage product={p} zoom={false} />
                      </div>
                      <div>
                        <div className="font-medium text-fg">{p.name}</div>
                        <div className="text-xs text-faint">{p.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{p.category_name}</td>
                  <td className="px-4 py-3 text-muted">{p.material} / {p.type}</td>
                  <td className="px-4 py-3 text-right text-fg">{formatPrice(p.retail_price)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-fg">{formatPrice(p.wholesale_price)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => setEditing(p)} className="rounded-md border border-line p-2 text-muted transition-colors hover:border-accent hover:text-accent" aria-label="Edit">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => remove(p)} className="rounded-md border border-line p-2 text-muted transition-colors hover:border-red-500 hover:text-red-500" aria-label="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <ProductEditor
          product={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function ProductEditor({ product, categories, onClose, onSaved }) {
  const isNew = !product.id;
  const [form, setForm] = useState(() => ({
    name: product.name || '',
    category_id: product.category_id || categories[0]?.id || '',
    material: product.material || 'Wood',
    type: product.type || 'Suit',
    retail_price: product.retail_price ?? '',
    wholesale_price: product.wholesale_price ?? '',
    sku: product.sku || '',
    rating: product.rating ?? 4.5,
    review_count: product.review_count ?? 0,
    size: product.size || '',
    durability: product.durability || '',
    finish: product.finish || '',
    material_detail: product.material_detail || '',
    description: product.description || '',
    hanger_style: product.hanger_style || 'suit',
    popularity: product.popularity ?? 0,
  }));
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(product.image || null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function pickImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(await fileToDataUrl(file));
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setServerError('');
    try {
      const payload = { ...form, category_id: Number(form.category_id) };
      const saved = isNew
        ? await api.admin.createProduct(payload)
        : await api.admin.updateProduct(product.id, payload);
      if (imageFile) {
        const dataUrl = await fileToDataUrl(imageFile);
        await api.admin.uploadImage(saved.id, dataUrl);
      }
      onSaved();
    } catch (err) {
      if (err.status === 422 && err.data?.errors) setErrors(err.data.errors);
      else setServerError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function clearImage() {
    if (isNew) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }
    try {
      await api.admin.removeImage(product.id);
      setImagePreview(null);
      setImageFile(null);
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
      <form onSubmit={save} className="card my-8 w-full max-w-3xl p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-fg">{isNew ? 'Add Product' : 'Edit Product'}</h3>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-fg">
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-[200px_1fr]">
          {/* Image */}
          <div>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted">Image</span>
            <div className="relative aspect-square overflow-hidden rounded-xl border border-line">
              <ProductImage
                product={{ ...product, ...form }}
                image={imagePreview ? { src: imagePreview, alt: form.name } : undefined}
                zoom={false}
              />
            </div>
            <label className="btn-outline mt-3 w-full cursor-pointer text-xs">
              <Upload size={14} /> Upload
              <input type="file" accept="image/*" onChange={pickImage} className="hidden" />
            </label>
            {imagePreview && (
              <button type="button" onClick={clearImage} className="btn-ghost mt-2 w-full text-xs text-red-500">
                <ImageOff size={14} /> Remove image
              </button>
            )}
            <p className="mt-2 text-[11px] leading-snug text-faint">
              One image per product. Leave empty to use the default studio photo.
            </p>
          </div>

          {/* Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" error={errors.name} className="sm:col-span-2">
              <input className="input" value={form.name} onChange={set('name')} placeholder="Product name" />
            </Field>
            <Field label="Category" error={errors.category_id}>
              <select className="input" value={form.category_id} onChange={set('category_id')}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="SKU">
              <input className="input" value={form.sku} onChange={set('sku')} placeholder="auto if blank" />
            </Field>
            <Field label="Material" error={errors.material}>
              <select className="input" value={form.material} onChange={set('material')}>
                {MATERIALS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Type" error={errors.type}>
              <select className="input" value={form.type} onChange={set('type')}>
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Retail Price ($)" error={errors.retail_price}>
              <input className="input" type="number" step="0.01" min="0" value={form.retail_price} onChange={set('retail_price')} />
            </Field>
            <Field label="Wholesale Price ($)">
              <input className="input" type="number" step="0.01" min="0" value={form.wholesale_price} onChange={set('wholesale_price')} placeholder="auto if blank" />
            </Field>
            <Field label="Hanger Style">
              <select className="input" value={form.hanger_style} onChange={set('hanger_style')}>
                {STYLES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Popularity (sort)">
              <input className="input" type="number" value={form.popularity} onChange={set('popularity')} />
            </Field>
            <Field label="Rating (0–5)">
              <input className="input" type="number" step="0.1" min="0" max="5" value={form.rating} onChange={set('rating')} />
            </Field>
            <Field label="Reviews">
              <input className="input" type="number" min="0" value={form.review_count} onChange={set('review_count')} />
            </Field>
            <Field label="Size">
              <input className="input" value={form.size} onChange={set('size')} />
            </Field>
            <Field label="Durability">
              <input className="input" value={form.durability} onChange={set('durability')} />
            </Field>
            <Field label="Finish">
              <input className="input" value={form.finish} onChange={set('finish')} />
            </Field>
            <Field label="Material detail">
              <input className="input" value={form.material_detail} onChange={set('material_detail')} />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <textarea className="input min-h-[90px] resize-y" value={form.description} onChange={set('description')} />
            </Field>
          </div>
        </div>

        {serverError && <p className="mt-4 text-sm text-red-500">{serverError}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={busy} className="btn-solid">
            {busy ? <Loader2 size={16} className="animate-spin" /> : isNew ? 'Create Product' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Categories
   ════════════════════════════════════════════════════════════════ */
function CategoriesManager() {
  const [categories, setCategories] = useState(null);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const load = () => api.getCategories().then(setCategories).catch((e) => setError(e.message));
  useEffect(load, []);

  async function remove(c) {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    try {
      await api.admin.deleteCategory(c.id);
      load();
    } catch (e) {
      alert(e.message);
    }
  }

  if (error) return <p className="text-red-500">{error}</p>;
  if (!categories) return <Loader2 className="mx-auto my-20 animate-spin text-muted" />;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-fg">Categories</h2>
          <p className="text-sm text-muted">{categories.length} total</p>
        </div>
        <button onClick={() => setEditing({})} className="btn-solid">
          <Plus size={16} /> Add Category
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <div key={c.id} className="card flex flex-col p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-sm font-semibold text-fg">{c.name}</h3>
                <p className="text-xs text-faint">/{c.slug}</p>
              </div>
              <span className="pill !py-0.5 text-[10px]">{c.product_count} items</span>
            </div>
            <p className="mt-2 line-clamp-2 flex-1 text-xs text-muted">{c.description}</p>
            <div className="mt-4 flex justify-end gap-1.5">
              <button onClick={() => setEditing(c)} className="rounded-md border border-line p-2 text-muted transition-colors hover:border-accent hover:text-accent">
                <Pencil size={14} />
              </button>
              <button onClick={() => remove(c)} className="rounded-md border border-line p-2 text-muted transition-colors hover:border-red-500 hover:text-red-500">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <CategoryEditor
          category={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function CategoryEditor({ category, onClose, onSaved }) {
  const isNew = !category.id;
  const [form, setForm] = useState({
    name: category.name || '',
    slug: category.slug || '',
    description: category.description || '',
    icon: category.icon || 'suit',
    sort_order: category.sort_order ?? 0,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (isNew) await api.admin.createCategory(form);
      else await api.admin.updateCategory(category.id, form);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
      <form onSubmit={save} className="card my-8 w-full max-w-md p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-fg">{isNew ? 'Add Category' : 'Edit Category'}</h3>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-fg">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4">
          <Field label="Name">
            <input className="input" value={form.name} onChange={set('name')} placeholder="e.g. Velvet Hangers" />
          </Field>
          <Field label="Slug">
            <input className="input" value={form.slug} onChange={set('slug')} placeholder="auto from name if blank" />
          </Field>
          <Field label="Icon style">
            <select className="input" value={form.icon} onChange={set('icon')}>
              {STYLES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Sort order">
            <input className="input" type="number" value={form.sort_order} onChange={set('sort_order')} />
          </Field>
          <Field label="Description">
            <textarea className="input min-h-[80px] resize-y" value={form.description} onChange={set('description')} />
          </Field>
        </div>
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={busy} className="btn-solid">
            {busy ? <Loader2 size={16} className="animate-spin" /> : isNew ? 'Create' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ── shared field wrapper ─────────────────────────────────────── */
function Field({ label, error, className = '', children }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
    </label>
  );
}
