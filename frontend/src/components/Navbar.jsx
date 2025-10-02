import React, { useCallback } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, token, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate('/signin');
  };

  const { pathname } = useLocation();

  const makeLinkClass = useCallback((target, exact = false) => () => {
    const active = exact ? pathname === target : pathname.startsWith(target);
    return `nav-link${active ? ' active' : ''}`;
  }, [pathname]);

  return (
    <header className="sticky-top app-navbar">
      <nav className="navbar navbar-expand-md navbar-light">
        <div className="container-xl px-3 px-md-4 px-xl-0">
          <Link to="/" className="navbar-brand">
            <img src="/Logo.png" alt="TeamUp Hamilton" className="app-brand-logo" />
            <span className="app-brand-word">TeamUp Hamilton</span>
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarMain"
            aria-controls="navbarMain"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarMain">
            {token && (
              <ul className="navbar-nav me-auto mb-2 mb-md-0">
                <li className="nav-item"><NavLink to="/dashboard" className={makeLinkClass('/dashboard')}>Dashboard</NavLink></li>
                <li className="nav-item"><NavLink to="/turfs" className={makeLinkClass('/turfs')}>Turfs</NavLink></li>
                <li className="nav-item"><NavLink to="/profile" className={makeLinkClass('/profile')}>Profile</NavLink></li>
              </ul>
            )}

            {token && (
              <div className="d-flex align-items-center gap-3">
                <div className="text-muted small text-truncate" style={{ maxWidth: '12rem' }}>
                  {user?.name || user?.email}
                </div>
                <button onClick={handleSignOut} className="btn btn-outline-secondary btn-sm">Sign out</button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
