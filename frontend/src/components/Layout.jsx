import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout({ children }) {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">
        <div className="container-xl px-3 px-md-4 px-xl-0">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
