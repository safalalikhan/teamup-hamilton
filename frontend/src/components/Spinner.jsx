import React from 'react';

export default function Spinner({ label = 'Loading…' }) {
  return (
    <div className="d-flex align-items-center gap-2 text-muted">
      <div className="spinner-border text-primary" role="status" style={{ width: '1.25rem', height: '1.25rem' }}>
        <span className="visually-hidden">Loading...</span>
      </div>
      <span className="small">{label}</span>
    </div>
  );
}
