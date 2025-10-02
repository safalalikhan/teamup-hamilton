import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Footer() {
  const { token } = useAuth();

  return (
    <footer className="app-footer mt-auto">
      <div className="container-xl px-3 px-md-4 px-xl-0 app-footer__inner">
        <div className="app-footer__brand">
          <img src="/Logo.png" alt="TeamUp Hamilton" className="app-brand-logo" />
          <span>TeamUp Hamilton</span>
        </div>

        {token && (
          <nav className="app-footer__nav">
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/turfs">Turfs</Link>
            <Link to="/profile">Profile</Link>
          </nav>
        )}

        <div className="text-muted small">© {new Date().getFullYear()} TeamUp Hamilton. All rights reserved.</div>
      </div>
    </footer>
  );
}
