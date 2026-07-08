import { forwardRef } from 'react';

export const Select = forwardRef(function Select(
  { label, error, hint, options = [], placeholder, className = '', wrapperClassName = '', id, ...props },
  ref
) {
  const selectId = id || `select-${Math.random().toString(36).slice(2)}`;
  return (
    <div className={`flex flex-col gap-1.5 ${wrapperClassName}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-sm font-medium"
          style={{ color: 'rgba(244,241,234,0.7)' }}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={`input-base appearance-none pr-10 cursor-pointer ${error ? '!border-danger' : ''} ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) =>
            typeof opt === 'object' ? (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ) : (
              <option key={opt} value={opt}>
                {opt}
              </option>
            )
          )}
        </select>
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(244,241,234,0.5)"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      {error && (
        <p className="text-xs" style={{ color: '#EF4444' }}>
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs" style={{ color: 'rgba(244,241,234,0.4)' }}>
          {hint}
        </p>
      )}
    </div>
  );
});
