import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import LocationPicker from '../components/LocationPicker';
import Toast from '../components/Toast';
import Layout from '../components/Layout';

export default function Register() {
  const navigate = useNavigate();
  const { setToken: setCtxToken, setUser: setCtxUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    skillLevel: 'beginner',
    preferredPosition: 'noPreference',
    locationAddress: '',
    lat: '',
    lng: '',
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ type: '', message: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!toast.message) return;
    const t = setTimeout(() => setToast({ type: '', message: '' }), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const handleChange = (e) => {
    setError('');
    setSuccess('');
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill out name, email, and password.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      skillLevel: formData.skillLevel,
      preferredPosition: formData.preferredPosition,
      location: formData.locationAddress ? {
        address: formData.locationAddress,
        lat: formData.lat ? Number(formData.lat) : undefined,
        lng: formData.lng ? Number(formData.lng) : undefined,
      } : undefined,
    };

    setLoading(true);
    api
      .post('/api/auth/register', payload)
      .then(async () => {
        try {
          const loginRes = await api.post('/api/auth/login', {
            email: formData.email,
            password: formData.password,
          });
          const { token, user } = loginRes.data || {};
          if (token) {
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            setCtxToken(token);
            setCtxUser(user);
          }
          setSuccess('User created successfully!');
          setToast({ type: 'success', message: 'User created successfully!' });
          setTimeout(() => navigate('/dashboard'), 800);
        } catch (e) {
          setToast({ type: 'success', message: 'User created. Please sign in.' });
          setTimeout(() => navigate('/signin'), 800);
        }
      })
      .catch((err) => {
        const msg = err?.response?.data?.message || err?.response?.data?.error || 'Registration failed';
        setError(msg);
        setToast({ type: 'error', message: msg });
      })
      .finally(() => setLoading(false));
  };

  return (
    <Layout>
      <Toast toast={toast} onClear={() => setToast({ type: '', message: '' })} />
      <div className="max-w-md mx-auto">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-soft p-6">
          <h2 className="text-2xl font-semibold mb-6 text-center">Create your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="w-full rounded-lg bg-red-50 text-red-800 border border-red-200 px-3 py-2 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="w-full rounded-lg bg-green-50 text-green-800 border border-green-200 px-3 py-2 text-sm">
                {success}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Full name</label>
              <input
                type="text"
                name="name"
                placeholder="Your name"
                value={formData.name}
                onChange={handleChange}
                className="input"
              />
            </div>

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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Skill level</label>
                <select
                  name="skillLevel"
                  value={formData.skillLevel}
                  onChange={handleChange}
                  className="select"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="proficient">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Preferred position</label>
                <select
                  name="preferredPosition"
                  value={formData.preferredPosition}
                  onChange={handleChange}
                  className="select"
                >
                  <option value="noPreference">No preference</option>
                  <option value="goalKeeper">Goalkeeper</option>
                  <option value="defence">Defender</option>
                  <option value="midField">Midfielder</option>
                  <option value="attack">Forward</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <LocationPicker
                value={{
                  address: formData.locationAddress,
                  lat: formData.lat ? Number(formData.lat) : undefined,
                  lng: formData.lng ? Number(formData.lng) : undefined
                }}
                onChange={(loc) =>
                  setFormData((f) => ({
                    ...f,
                    locationAddress: loc.address || '',
                    lat: loc.lat || '',
                    lng: loc.lng || ''
                  }))
                }
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`btn-brand w-full ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Creating…' : 'Create account'}
            </button>

            <p className="text-sm text-subtle text-center">
              Already have an account?{' '}
              <Link className="text-brand hover:underline" to="/signin">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </Layout>
  );
}