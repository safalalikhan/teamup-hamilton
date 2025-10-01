import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import Layout from '../components/Layout';
import { Link, useNavigate } from 'react-router-dom';

export default function SignIn() {
  const navigate = useNavigate();
  const { login } = useAuth();
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
      await login(formData.email, formData.password);
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
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card shadow-sm">
              <div className="card-body p-4 p-md-5">
                <h2 className="h3 fw-semibold mb-4 text-center">Sign in</h2>

                <form onSubmit={handleSubmit}>
                  {error && (
                    <div className="alert alert-danger" role="alert">
                      {error}
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="form-control"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      name="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      className="form-control"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`btn btn-primary w-100 ${loading ? 'disabled' : ''}`}
                  >
                    {loading ? 'Signing in…' : 'Sign in'}
                  </button>

                  <p className="small text-muted text-center mt-3 mb-0">
                    Don’t have an account?{' '}
                    <Link to="/signup">Create one</Link>
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
