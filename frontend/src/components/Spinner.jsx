import React from 'react';

export default function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center gap-3 text-subtle">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      <span className="text-sm">{label}</span>
    </div>
  );
}