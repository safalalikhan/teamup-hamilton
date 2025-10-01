import React from 'react';

export default function Card({ title, subtitle, actions, children, className = '' }) {
  return (
    <section className={`card shadow-sm ${className}`}>
      {(title || actions || subtitle) && (
        <div className="card-header d-flex align-items-center justify-content-between gap-2 bg-white">
          <div>
            {title && <h2 className="h6 fw-semibold mb-0">{title}</h2>}
            {subtitle && <p className="small text-muted mb-0">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className="card-body">
        {children}
      </div>
    </section>
  );
}
