import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';

export default function ProtectedRoute() {
  const { token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-surface">
        {Spinner ? (
          <Spinner />
        ) : (
          <div className="flex items-center gap-3 text-subtle">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
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