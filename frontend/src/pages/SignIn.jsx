import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import Layout from '../components/Layout';
import { Link, useNavigate } from 'react-router-dom';

export default function SignIn() {
  const navigate = useNavigate();
  const { setToken: setCtxToken, setUser: setCtxUser } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ type: '', message: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!toast.message) return;
    const t = setTimeout(() => setToast({ type: '', message: '' }), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const handleChange = (e) => {
    setError('');
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.email || !formData.password) {
      setError('Please enter email and password.');
      return;
    }
    try {
      setLoading(true);
      const res = await api.post('/api/auth/login', {
        email: formData.email,
        password: formData.password,
      });
      const { token, user } = res.data || {};
      if (!token) throw new Error('No token received');
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setCtxToken(token);
      setCtxUser(user);
      setToast({ type: 'success', message: 'Signed in successfully!' });
      setTimeout(() => navigate('/dashboard'), 800);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Invalid email or password';
      setError(msg);
      setToast({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Toast toast={toast} onClear={() => setToast({ type: '', message: '' })} />
      <div className="max-w-md mx-auto">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-soft p-6">
          <h2 className="text-2xl font-semibold mb-6 text-center">Sign in</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="w-full rounded-lg bg-red-50 text-red-800 border border-red-200 px-3 py-2 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`btn-brand w-full ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

            <p className="text-sm text-subtle text-center">
              Don’t have an account?{' '}
              <Link className="text-brand hover:underline" to="/signup">Create one</Link>
            </p>
          </form>
        </div>
      </div>
    </Layout>
  );
}