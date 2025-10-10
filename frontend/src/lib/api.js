import axios from 'axios';

// Resolve API base URL using a simple rule:
// 1) developer override in localStorage (key: apiBase)
// 2) Vite env (VITE_API_URL)
// 3) sensible dev default when on localhost
const storedApiBase = typeof window !== 'undefined' ? localStorage.getItem('apiBase') : null;
const envApiBase = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL).trim() : '';
const isLocalHost = typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
const resolvedBase = (storedApiBase || envApiBase || (isLocalHost ? 'http://localhost:5001' : '')).trim();

const api = axios.create({
  baseURL: resolvedBase,
  withCredentials: false, // we use Bearer tokens, not cookies
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

function getToken() {
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
}

// Attach Authorization header only when a token exists.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  else delete config.headers.Authorization;
  return config;
});

// Show human-friendly toasts and react to common auth/server errors.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const message = err?.response?.data?.message || err?.message || 'Request failed';
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'error', message } }));
    }
    // Expired/invalid token → clear and redirect to sign in
    if (status === 401 || status === 403) {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch {}
      if (typeof window !== 'undefined') window.location.href = '/signin';
    }
    // Rate limiting hint
    if (status === 429 && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('app:toast', { detail: { type: 'error', message: 'Too many requests. Please try again shortly.' } })
      );
    }
    return Promise.reject(err);
  }
);

export default api;
