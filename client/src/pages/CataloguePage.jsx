import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import ProductCard from '../components/ProductCard';
import Spinner from '../components/Spinner';
import api from '../lib/api';

const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'newest', label: 'Newest' },
  { value: 'name', label: 'Name (A–Z)' },
];

function FilterGroup({ title, options, selected, onToggle, valueKey = 'value', labelKey = 'label' }) {
  if (!options?.length) return null;
  return (
    <div className="border-t border-line py-5 first:border-t-0 first:pt-0">
      <h3 className="eyebrow mb-3.5">{title}</h3>
      <ul className="space-y-2.5">
        {options.map((opt) => {
          const value = opt[valueKey];
          const checked = selected.includes(value);
          return (
            <li key={value}>
              <label className="group flex cursor-pointer items-center gap-3 text-sm text-muted transition-colors hover:text-fg">
                <span
                  className={`flex h-[18px] w-[18px] items-center justify-center rounded-md border transition-all ${
                    checked ? 'border-accent bg-accent text-on-solid' : 'border-line-2 bg-surface-2 group-hover:border-accent'
                  }`}
                >
                  {checked && (
                    <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M2.5 6.5 5 9l4.5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <input type="checkbox" checked={checked} onChange={() => onToggle(value)} className="sr-only" />
                <span className="flex-1">{opt[labelKey]}</span>
                <span className="text-xs text-faint">{opt.count}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Sidebar({ facets, params, update, clearAll, hasFilters }) {
  const materials = (params.get('material') || '').split(',').filter(Boolean);
  const types = (params.get('type') || '').split(',').filter(Boolean);
  const setting = params.get('setting');

  const toggleCsv = (key, value) => {
    const current = (params.get(key) || '').split(',').filter(Boolean);
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    update({ [key]: next.join(','), page: 1 });
  };

  const toggleSetting = (value) => {
    update({ setting: setting === value ? '' : value, page: 1 });
  };

  return (
    <aside className="card h-fit p-6 lg:sticky lg:top-24">
      <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.14em] text-fg">
        <SlidersHorizontal size={16} className="text-accent" /> Filtering Section
      </h2>

      <div className="mt-5">
        <FilterGroup
          title="Material"
          options={facets.materials.map((m) => ({ ...m, label: m.value }))}
          selected={materials}
          onToggle={(v) => toggleCsv('material', v)}
        />
        <FilterGroup
          title="Type"
          options={facets.types.map((t) => ({ ...t, label: t.value }))}
          selected={types}
          onToggle={(v) => toggleCsv('type', v)}
        />
        <FilterGroup
          title="Settings"
          options={facets.settings}
          selected={setting ? [setting] : []}
          onToggle={toggleSetting}
        />
      </div>

      <button
        type="button"
        onClick={clearAll}
        disabled={!hasFilters}
        className="btn-outline mt-6 w-full text-xs disabled:opacity-40"
      >
        Clear Filters
      </button>
    </aside>
  );
}

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <div className="mt-12 flex items-center justify-center gap-2">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-30 disabled:hover:border-line disabled:hover:text-muted"
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`h-10 w-10 rounded-full border text-sm font-semibold transition-all ${
            p === page
              ? 'border-accent bg-accent text-on-solid'
              : 'border-line text-muted hover:border-accent hover:text-accent'
          }`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-30 disabled:hover:border-line disabled:hover:text-muted"
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

export default function CataloguePage() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const page = parseInt(params.get('page'), 10) || 1;
  const sort = params.get('sort') || 'popular';
  const category = params.get('category') || '';
  const q = params.get('q') || '';

  // Merge changes into the existing query string.
  const update = (changes) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value === '' || value == null) next.delete(key);
      else next.set(key, value);
    }
    setParams(next, { replace: false });
  };

  const clearAll = () => {
    const next = new URLSearchParams();
    if (q) next.set('q', q);
    if (sort !== 'popular') next.set('sort', sort);
    setParams(next);
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api
      .getProducts({
        material: params.get('material'),
        type: params.get('type'),
        setting: params.get('setting'),
        category,
        q,
        sort,
        page,
        pageSize: 9,
      })
      .then((res) => active && setData(res))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.toString()]);

  const facets = data?.facets || { materials: [], types: [], settings: [] };
  const hasFilters =
    !!params.get('material') || !!params.get('type') || !!params.get('setting') || !!category;

  return (
    <div className="container-page py-10">
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'All Hangers' }]} />

      <div className="mt-5 flex flex-col gap-4 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-2">Catalogue</p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-fg sm:text-4xl">
            All Hangers
          </h1>
          {data && (
            <p className="mt-2 text-sm text-muted">
              {data.total} product{data.total === 1 ? '' : 's'}
              {category && ` in “${category}”`}
              {q && ` matching “${q}”`}
            </p>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-muted">
          Sort by:
          <select
            value={sort}
            onChange={(e) => update({ sort: e.target.value, page: 1 })}
            className="input w-auto py-2.5 pr-8"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
        <Sidebar
          facets={facets}
          params={params}
          update={update}
          clearAll={clearAll}
          hasFilters={hasFilters}
        />

        <div>
          {loading && <Spinner label="Loading hangers…" />}
          {error && !loading && (
            <div className="card p-10 text-center text-sm text-red-500">
              Couldn’t load products: {error}
            </div>
          )}
          {!loading && !error && data && (
            <>
              {data.items.length === 0 ? (
                <div className="card p-16 text-center">
                  <p className="font-display text-lg text-fg">No hangers match your filters.</p>
                  <p className="mt-1 text-sm text-muted">Try removing a filter to see more.</p>
                  <button onClick={clearAll} className="btn-outline mt-6 text-xs">
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {data.items.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              )}
              <Pagination
                page={data.page}
                totalPages={data.totalPages}
                onChange={(p) => update({ page: p })}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
