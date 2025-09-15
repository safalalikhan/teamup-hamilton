import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-ink">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-brand" />
          <span className="font-semibold">TeamUp Hamilton</span>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/" className="hover:text-brand-dark">Home</Link>
          <Link to="/dashboard" className="hover:text-brand-dark">Dashboard</Link>
          <Link to="/turfs" className="hover:text-brand-dark">Turfs</Link>
          <Link to="/profile" className="hover:text-brand-dark">Profile</Link>
        </nav>
        <div className="text-xs text-subtle">© {new Date().getFullYear()} TeamUp Hamilton</div>
      </div>
    </footer>
  );
}