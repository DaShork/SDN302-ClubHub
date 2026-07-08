export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 px-6 ${className}`}>
      {icon && (
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(34,197,94,0.1)' }}>
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-secondary-100 mb-2">{title}</h3>
      {description && (
        <p className="text-sm max-w-sm mb-6" style={{ color: 'rgba(244,241,234,0.5)' }}>
          {description}
        </p>
      )}
      {action && action}
    </div>
  );
}
