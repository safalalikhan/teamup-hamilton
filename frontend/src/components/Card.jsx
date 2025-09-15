import React from 'react';

export default function Card({ title, subtitle, actions, children, className = '' }) {
  return (
    <section className={`bg-white border border-gray-200 rounded-2xl shadow-soft ${className}`}>
      {(title || actions || subtitle) && (
        <div className="px-4 sm:px-5 py-3 border-b border-gray-200 flex items-center justify-between gap-3">
          <div>
            {title && <h2 className="text-base sm:text-lg font-semibold">{title}</h2>}
            {subtitle && <p className="text-xs sm:text-sm text-subtle">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className="p-4 sm:p-5">
        {children}
      </div>
    </section>
  );
}