import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const linkClass = ({ isActive }) =>
  `block px-3 py-2 rounded-lg text-sm font-medium transition
   ${isActive ? 'bg-green-50 text-green-800' : 'text-ink hover:bg-gray-100'}`;

export default function Navbar() {
  const { user, token, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignOut = () => {
    signOut();
    navigate('/signin');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-ink">
            <span className="inline-block h-2 w-2 rounded-full bg-brand" />
            TeamUp Hamilton
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            <NavLink to="/" className={linkClass} end>Home</NavLink>
            <NavLink to="/turfs" className={linkClass}>Turfs</NavLink>
            {token && <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>}
            {token && <NavLink to="/profile" className={linkClass}>Profile</NavLink>}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {token ? (
              <>
                <span className="text-sm text-subtle truncate max-w-[12rem]">
                  {user?.name || user?.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center rounded-lg bg-brand px-3 py-2 text-white hover:bg-brand-dark transition"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/signin" className="text-sm px-3 py-2 rounded-lg hover:bg-gray-100">Sign in</Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center rounded-lg bg-brand px-3 py-2 text-white hover:bg-brand-dark transition"
                >
                  Join now
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden inline-flex items-center justify-center rounded-lg p-2 hover:bg-gray-100"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <span className="sr-only">Toggle navigation</span>
            <span className="text-2xl leading-none">☰</span>
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 flex flex-col gap-2">
            <NavLink to="/" className={linkClass} end onClick={() => setOpen(false)}>Home</NavLink>
            <NavLink to="/turfs" className={linkClass} onClick={() => setOpen(false)}>Turfs</NavLink>
            {token && <NavLink to="/dashboard" className={linkClass} onClick={() => setOpen(false)}>Dashboard</NavLink>}
            {token && <NavLink to="/profile" className={linkClass} onClick={() => setOpen(false)}>Profile</NavLink>}
            <div className="pt-2 border-t border-gray-200">
              {token ? (
                <button
                  onClick={() => { setOpen(false); handleSignOut(); }}
                  className="w-full inline-flex items-center justify-center rounded-lg bg-brand px-3 py-2 text-white hover:bg-brand-dark transition"
                >
                  Sign out
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/signin" onClick={() => setOpen(false)} className="text-sm px-3 py-2 rounded-lg hover:bg-gray-100">Sign in</Link>
                  <Link
                    to="/signup"
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center justify-center rounded-lg bg-brand px-3 py-2 text-white hover:bg-brand-dark transition"
                  >
                    Join now
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}