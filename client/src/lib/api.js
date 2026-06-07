// Thin fetch wrapper around the Wish Enterprise REST API.
const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const error = new Error((data && data.error) || `Request failed (${res.status})`);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

function toQuery(params = {}) {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) continue;
    sp.set(key, Array.isArray(value) ? value.join(',') : value);
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

export const api = {
  getSite: () => request('/site'),
  getCategories: () => request('/categories'),
  getProducts: (params) => request(`/products${toQuery(params)}`),
  getProduct: (slug) => request(`/products/${encodeURIComponent(slug)}`),
  getRelated: (slug, limit = 4) => request(`/products/${encodeURIComponent(slug)}/related?limit=${limit}`),
  createInquiry: (payload) =>
    request('/inquiries', { method: 'POST', body: JSON.stringify(payload) }),
};

export default api;
