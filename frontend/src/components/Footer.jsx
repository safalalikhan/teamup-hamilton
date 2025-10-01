import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-top bg-white">
      <div className="container py-3 d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3 text-dark">
        <div className="d-flex align-items-center gap-2">
          <span className="d-inline-block rounded-circle" style={{ backgroundColor: 'var(--bs-primary)', width: 8, height: 8 }} />
          <span className="fw-semibold">TeamUp Hamilton</span>
        </div>
        <nav className="d-flex align-items-center gap-3 small">
          <Link to="/" className="link-secondary link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover">Home</Link>
          <Link to="/dashboard" className="link-secondary link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover">Dashboard</Link>
          <Link to="/turfs" className="link-secondary link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover">Turfs</Link>
          <Link to="/profile" className="link-secondary link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover">Profile</Link>
        </nav>
        <div className="text-muted small">© {new Date().getFullYear()} TeamUp Hamilton</div>
      </div>
    </footer>
  );
}
