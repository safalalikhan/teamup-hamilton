import axios from 'axios';

const lsBase = typeof window !== 'undefined' ? localStorage.getItem('apiBase') : null;
const envBase = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.trim() : '';
const baseURL = (lsBase || envBase || '').trim();

const api = axios.create({
  baseURL,
  withCredentials: false, // using Bearer tokens, not cookies
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

function getToken() {
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401 || status === 403) {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch {}
      if (typeof window !== 'undefined') window.location.href = '/signin';
    }
    return Promise.reject(err);
  }
);

export default api;
