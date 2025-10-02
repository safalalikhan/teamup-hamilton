import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

const defaultAuth = {
  token: null,
  setToken: () => {},
  user: null,
  setUser: () => {},
  signOut: () => {},
  login: async () => {},
  register: async () => {},
  loading: false,
  isAdmin: false,
};

function getStoredAuth() {
  try {
    const token = localStorage.getItem('token');
    const userRaw = localStorage.getItem('user');
    return {
      token: token || null,
      user: userRaw ? JSON.parse(userRaw) : null,
    };
  } catch {
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }) {
  const [{ token, user }, setAuth] = useState(getStoredAuth());
  const [loading, setLoading] = useState(true);
  const IDLE_MAX_MS = 30 * 60 * 1000; // 30 minutes
  const [lastActive, setLastActive] = useState(Date.now());
  useEffect(() => {
    const bump = () => setLastActive(Date.now());
    const evts = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll', 'visibilitychange'];
    evts.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const t = setInterval(() => {
      if (!token) return;
      if (Date.now() - lastActive > IDLE_MAX_MS) {
        // force sign-out on idle timeout
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        } catch {}
        setAuth({ token: null, user: null });
      }
    }, 30000);
    return () => {
      evts.forEach((e) => window.removeEventListener(e, bump));
      clearInterval(t);
    };
  }, [token, lastActive]);

  // Bootstrap from /me if a token exists
  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      try {
        if (!token) {
          setLoading(false);
          return;
        }
        const { data } = await api.get('/api/auth/me');
        if (!cancelled) {
          setAuth((prev) => {
            const next = { ...prev, user: data };
            try {
              localStorage.setItem('user', JSON.stringify(data));
            } catch {}
            return next;
          });
        }
      } catch {
        if (!cancelled) {
          setAuth({ token: null, user: null });
          try {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          } catch {}
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    bootstrap();
    return () => { cancelled = true; };
  }, []); // run once

  const login = async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    setAuth({ token: data.token, user: data.user });
    try {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch {}
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post('/api/auth/register', payload);
    setAuth({ token: data.token, user: data.user });
    try {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch {}
    return data.user;
  };

  const signOut = () => {
    setAuth({ token: null, user: null });
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch {}
  };

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAdmin: Boolean(user?.role === 'admin'),
      setAuth,
      login,
      register,
      signOut,
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  return ctx || defaultAuth;
}
