import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';

export default function ProtectedRoute() {
  const { token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-white">
        {Spinner ? (
          <Spinner />
        ) : (
          <div className="d-flex align-items-center gap-2 text-muted">
            <div className="spinner-border text-primary" role="status" style={{ width: '1.25rem', height: '1.25rem' }} />
            <span>Loading…</span>
          </div>
        )}
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
