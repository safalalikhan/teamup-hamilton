import React from 'react';

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-3">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-md-between gap-2">
        <div>
          <h1 className="h3 fw-semibold mb-0">{title}</h1>
          {subtitle && <p className="text-muted mt-1 mb-0">{subtitle}</p>}
        </div>
        {actions && <div className="d-flex align-items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
