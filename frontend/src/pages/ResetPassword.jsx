import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Toast from '../components/Toast';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ type: '', message: '' });
  const [error, setError] = useState('');
  const [devToken, setDevToken] = useState('');

  useEffect(() => {
    if (!toast.message) return undefined;
    const timeout = setTimeout(() => setToast({ type: '', message: '' }), 2500);
    return () => clearTimeout(timeout);
  }, [toast]);

  const handleRequest = async (e) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Please enter the email you registered with.');
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.post('/api/auth/request-password-reset', { email });
      setToast({ type: 'success', message: data?.message || 'Check your email for reset instructions.' });
      if (data?.resetToken) {
        setDevToken(data.resetToken);
        setToken(data.resetToken);
      }
      setStep('reset');
    } catch (err) {
      const message = err?.response?.data?.message || err?.response?.data?.error || 'Unable to start reset process';
      setError(message);
      setToast({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Reset token is required.');
      return;
    }
    if (!password || !confirmPassword) {
      setError('Please enter and confirm your new password.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.post('/api/auth/reset-password', { token, password });
      setToast({ type: 'success', message: data?.message || 'Password reset successfully.' });
      if (data?.token && data?.user) {
        setAuth({ token: data.token, user: data.user });
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
          } catch (storageError) {
            console.warn('Unable to persist auth after password reset', storageError);
          }
        }
        setTimeout(() => navigate('/dashboard'), 800);
      } else {
        setTimeout(() => navigate('/signin'), 800);
      }
    } catch (err) {
      const message = err?.response?.data?.message || err?.response?.data?.error || 'Failed to reset password';
      setError(message);
      setToast({ type: 'error', message });
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
                <h2 className="h3 fw-semibold mb-3 text-center">Reset password</h2>
                <p className="small text-muted text-center mb-4">
                  {step === 'request'
                    ? 'Enter your email and we will send you a reset token.'
                    : 'Enter the reset token along with a new password.'}
                </p>

                {error ? (
                  <div className="alert alert-danger" role="alert">{error}</div>
                ) : null}

                {step === 'request' ? (
                  <form onSubmit={handleRequest}>
                    <div className="mb-3">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className={`btn btn-primary w-100 ${loading ? 'disabled' : ''}`}
                    >
                      {loading ? 'Sending…' : 'Send reset link'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleReset}>
                    <div className="mb-3">
                      <label className="form-label">Reset token</label>
                      <input
                        className="form-control"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">New password</label>
                      <input
                        type="password"
                        className="form-control"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Confirm password</label>
                      <input
                        type="password"
                        className="form-control"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className={`btn btn-primary w-100 ${loading ? 'disabled' : ''}`}
                    >
                      {loading ? 'Updating…' : 'Reset password'}
                    </button>
                  </form>
                )}

                {devToken ? (
                  <div className="alert alert-info mt-3" role="alert">
                    Use this development token to finish the reset: <code>{devToken}</code>
                  </div>
                ) : null}

                <p className="small text-muted text-center mt-4 mb-0">
                  Remembered your password? <Link to="/signin">Back to sign in</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
