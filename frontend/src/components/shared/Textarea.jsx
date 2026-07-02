import { forwardRef } from 'react';

export const Textarea = forwardRef(function Textarea(
  { label, error, hint, className = '', wrapperClassName = '', id, rows = 4, ...props },
  ref
) {
  const inputId = id || `textarea-${Math.random().toString(36).slice(2)}`;
  return (
    <div className={`flex flex-col gap-1.5 ${wrapperClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium"
          style={{ color: 'rgba(244,241,234,0.7)' }}
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        className={`input-base !h-auto py-3 resize-none ${error ? '!border-danger' : ''} ${className}`}
        {...props}
      />
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
