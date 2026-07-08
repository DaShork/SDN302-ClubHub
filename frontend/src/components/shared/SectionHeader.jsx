export function SectionHeader({ title, subtitle, actions, className = '' }) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 ${className}`}>
      <div>
        <h2 className="text-2xl font-bold text-secondary-100">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm" style={{ color: 'rgba(244,241,234,0.5)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
}
