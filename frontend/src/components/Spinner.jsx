import React from 'react';

export default function Spinner({ label = 'Loading…' }) {
  return (
    <div className="app-spinner" role="status" aria-live="polite">
      <span className="app-spinner__icon" aria-hidden="true"></span>
      <span className="small">{label}</span>
    </div>
  );
}
