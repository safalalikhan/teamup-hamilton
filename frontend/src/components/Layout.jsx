import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout({ children }) {
  return (
    <div className="min-vh-100 d-flex flex-column bg-white text-dark">
      <Navbar />
      <main className="flex-grow-1">
        <div className="container py-4">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
