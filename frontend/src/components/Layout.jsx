import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import Toast from './Toast';

export default function Layout({ children }) {
  const [toast, setToast] = useState({ type: '', message: '' });
  useEffect(() => {
    const onToast = (e) => {
      const { type, message } = e.detail || {};
      if (!message) return;
      setToast({ type: type || 'error', message });
    };
    window.addEventListener('app:toast', onToast);
    return () => window.removeEventListener('app:toast', onToast);
  }, []);

  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">
        <div className="container-xl px-3 px-md-4 px-xl-0">
          {children}
        </div>
      </main>
      <Footer />
      <Toast toast={toast} onClear={() => setToast({ type: '', message: '' })} />
    </div>
  );
}
