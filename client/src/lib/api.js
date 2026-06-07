// Thin fetch wrapper around the Wish Enterprise REST API.
const BASE = '/api';
const ADMIN_TOKEN_KEY = 'we_admin_token';

export function getAdminToken() {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}
export function setAdminToken(token) {
  try {
    if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token);
    else localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
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

// Admin request: attaches the bearer token; clears it on 401.
async function adminRequest(path, options = {}) {
  const token = getAdminToken();
  try {
    return await request(`/admin${path}`, {
      ...options,
      headers: { ...(options.headers || {}), Authorization: `Bearer ${token || ''}` },
    });
  } catch (err) {
    if (err.status === 401) setAdminToken(null);
    throw err;
  }
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
  createInquiry: (payload) => request('/inquiries', { method: 'POST', body: JSON.stringify(payload) }),

  admin: {
    login: (password) => request('/admin/login', { method: 'POST', body: JSON.stringify({ password }) }),
    session: () => adminRequest('/session'),
    logout: () => adminRequest('/logout', { method: 'POST' }),

    listProducts: () => adminRequest('/products'),
    getProduct: (id) => adminRequest(`/products/${id}`),
    createProduct: (data) => adminRequest('/products', { method: 'POST', body: JSON.stringify(data) }),
    updateProduct: (id, data) => adminRequest(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteProduct: (id) => adminRequest(`/products/${id}`, { method: 'DELETE' }),
    uploadImage: (id, dataUrl) => adminRequest(`/products/${id}/image`, { method: 'POST', body: JSON.stringify({ dataUrl }) }),
    removeImage: (id) => adminRequest(`/products/${id}/image`, { method: 'DELETE' }),

    createCategory: (data) => adminRequest('/categories', { method: 'POST', body: JSON.stringify(data) }),
    updateCategory: (id, data) => adminRequest(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteCategory: (id) => adminRequest(`/categories/${id}`, { method: 'DELETE' }),
  },
};

export default api;
