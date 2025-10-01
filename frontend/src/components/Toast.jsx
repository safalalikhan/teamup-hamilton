import React, { useEffect } from 'react';

export default function Toast({ toast, onClear, duration = 2500 }) {
  useEffect(() => {
    if (!toast?.message) return;
    const t = setTimeout(() => onClear?.(), duration);
    return () => clearTimeout(t);
  }, [toast?.message, duration, onClear]);

  if (!toast?.message) return null;

  const ok = toast.type === 'success';
  const klass = ok ? 'alert alert-success' : 'alert alert-danger';

  return (
    <div role="status" aria-live="polite" className="position-fixed top-0 end-0 m-3" style={{ zIndex: 1050, maxWidth: '24rem' }}>
      <div className={klass}>
        <p className="mb-0 small">{toast.message}</p>
      </div>
    </div>
  );
}
