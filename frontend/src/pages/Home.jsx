import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { token } = useAuth();

  return (
    <Layout>
      <section className="min-h-[60vh] grid place-items-center text-center">
        <div className="flex flex-col items-center gap-6">
          <img src="/vite.svg" alt="App logo" className="h-14 w-14" />
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">TeamUp Hamilton</h1>
          <p className="text-lg text-subtle max-w-2xl">
            Find your perfect teammates. Plan balanced weekend football matches with smart logistics.
          </p>

          {!token ? (
            <div className="mt-2 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signin" className="btn-brand px-6 py-3">Sign in</Link>
              <Link to="/signup" className="btn-outline-brand px-6 py-3">Create account</Link>
            </div>
          ) : (
            <div className="mt-2">
              <Link to="/dashboard" className="btn-brand px-6 py-3">Go to dashboard</Link>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}