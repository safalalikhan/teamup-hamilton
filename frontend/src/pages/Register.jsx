import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import LocationPicker from '../components/LocationPicker';
import Toast from '../components/Toast';
import Layout from '../components/Layout';

export default function Register() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
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
    registerUser(payload)
      .then(() => {
        setSuccess('User created successfully!');
        setToast({ type: 'success', message: 'User created successfully!' });
        setTimeout(() => navigate('/dashboard'), 800);
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
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-7 col-lg-6">
            <div className="card shadow-sm">
              <div className="card-body p-4 p-md-5">
                <h2 className="h3 fw-semibold mb-4 text-center">Create your account</h2>

                <form onSubmit={handleSubmit}>
                  {error && (
                    <div className="alert alert-danger" role="alert">{error}</div>
                  )}
                  {success && (
                    <div className="alert alert-success" role="alert">{success}</div>
                  )}

                  <div className="mb-3">
                    <label className="form-label">Full name</label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={handleChange}
                      className="form-control"
                    />
                  </div>

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

                  <div className="row g-3">
                    <div className="col-sm-6">
                      <label className="form-label">Skill level</label>
                      <select
                        name="skillLevel"
                        value={formData.skillLevel}
                        onChange={handleChange}
                        className="form-select"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="proficient">Advanced</option>
                      </select>
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label">Preferred position</label>
                      <select
                        name="preferredPosition"
                        value={formData.preferredPosition}
                        onChange={handleChange}
                        className="form-select"
                      >
                        <option value="noPreference">No preference</option>
                        <option value="goalKeeper">Goalkeeper</option>
                        <option value="defence">Defender</option>
                        <option value="midField">Midfielder</option>
                        <option value="attack">Forward</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="form-label">Location</label>
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
                    className={`btn btn-primary w-100 mt-3 ${loading ? 'disabled' : ''}`}
                  >
                    {loading ? 'Creating…' : 'Create account'}
                  </button>

                  <p className="small text-muted text-center mt-3 mb-0">
                    Already have an account?{' '}
                    <Link to="/signin">Sign in</Link>
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
