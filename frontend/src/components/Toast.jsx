import React, { useEffect } from 'react';

export default function Toast({ toast, onClear, duration = 2500 }) {
  useEffect(() => {
    if (!toast?.message) return;
    const t = setTimeout(() => onClear?.(), duration);
    return () => clearTimeout(t);
  }, [toast?.message, duration, onClear]);

  if (!toast?.message) return null;

  const ok = toast.type === 'success';
  const tone = ok ? 'app-toast__inner--success' : 'app-toast__inner--error';
  const icon = ok ? 'OK' : '!';

  return (
    <div role="status" aria-live="polite" className="app-toast">
      <div className={`app-toast__inner ${tone}`}>
        <span aria-hidden="true" className="app-toast__icon">{icon}</span>
        <p className="mb-0 small">{toast.message}</p>
      </div>
    </div>
  );
}
