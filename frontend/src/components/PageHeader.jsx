import React from 'react';

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="app-page-header">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-md-between gap-3">
        <div>
          <h1 className="app-page-header__title mb-1">{title}</h1>
          {subtitle && <p className="app-page-header__subtitle mb-0">{subtitle}</p>}
        </div>
        {actions && <div className="d-flex align-items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
