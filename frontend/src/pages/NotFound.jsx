import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

export default function NotFound() {
  return (
    <Layout>
      <div className="min-h-[50vh] grid place-items-center text-center">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Page not found</h1>
          <p className="text-subtle mb-6">The page you’re after doesn’t exist.</p>
          <Link to="/" className="btn-brand">Go home</Link>
        </div>
      </div>
    </Layout>
  );
}