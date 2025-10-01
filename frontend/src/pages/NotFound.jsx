import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

export default function NotFound() {
  return (
    <Layout>
      <div className="d-flex align-items-center justify-content-center text-center" style={{ minHeight: '50vh' }}>
        <div>
          <h1 className="h2 fw-semibold mb-2">Page not found</h1>
          <p className="text-muted mb-4">The page you’re after doesn’t exist.</p>
          <Link to="/" className="btn btn-primary">Go home</Link>
        </div>
      </div>
    </Layout>
  );
}
