import React, { useEffect } from 'react';

export default function Toast({ toast, onClear, duration = 2500 }) {
  useEffect(() => {
    if (!toast?.message) return;
    const t = setTimeout(() => onClear?.(), duration);
    return () => clearTimeout(t);
  }, [toast?.message, duration, onClear]);

  if (!toast?.message) return null;

  const ok = toast.type === 'success';
  const styles = ok
    ? 'bg-green-50 text-green-800 border-green-200'
    : 'bg-red-50 text-red-800 border-red-200';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-4 right-4 z-50 max-w-sm rounded-xl border px-4 py-3 shadow-soft ${styles}`}
    >
      <p className="text-sm">{toast.message}</p>
    </div>
  );
}