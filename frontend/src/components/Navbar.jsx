import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, token, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate('/signin');
  };

  const linkClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`;

  return (
    <header className="sticky-top bg-white border-bottom">
      <nav className="navbar navbar-expand-md navbar-light bg-body-tertiary">
        <div className="container">
          <Link to="/" className="navbar-brand d-flex align-items-center gap-2">
            <span className="d-inline-block rounded-circle" style={{ backgroundColor: 'var(--bs-primary)', width: 8, height: 8 }} />
            TeamUp Hamilton
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
            <ul className="navbar-nav me-auto mb-2 mb-md-0">
              <li className="nav-item"><NavLink to="/" end className={linkClass}>Home</NavLink></li>
              <li className="nav-item"><NavLink to="/turfs" className={linkClass}>Turfs</NavLink></li>
              {token && <li className="nav-item"><NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink></li>}
              {token && <li className="nav-item"><NavLink to="/profile" className={linkClass}>Profile</NavLink></li>}
            </ul>

            <div className="d-flex align-items-center gap-2">
              {token ? (
                <>
                  <span className="text-muted small text-truncate" style={{ maxWidth: '12rem' }}>
                    {user?.name || user?.email}
                  </span>
                  <button onClick={handleSignOut} className="btn btn-primary btn-sm">Sign out</button>
                </>
              ) : (
                <>
                  <Link to="/signin" className="btn btn-outline-primary btn-sm">Sign in</Link>
                  <Link to="/signup" className="btn btn-primary btn-sm">Join now</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
