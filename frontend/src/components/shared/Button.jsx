import { forwardRef } from 'react';

const BASE =
  'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2 focus-visible:ring-offset-primary-900 disabled:opacity-50 disabled:cursor-not-allowed select-none';

const VARIANTS = {
  primary: `${BASE} text-white shadow-md hover:shadow-lg hover:opacity-90 active:opacity-80`,
  secondary: `${BASE} border bg-transparent hover:bg-primary-800 active:opacity-80`,
  danger: `${BASE} text-white hover:opacity-90 active:opacity-80`,
  ghost: `${BASE} text-secondary-100 hover:bg-primary-600 active:opacity-80`,
};

const SIZES = {
  sm: 'h-8 px-3 text-xs rounded-[8px]',
  md: 'h-10 px-5 text-sm rounded-[10px]',
  lg: 'h-12 px-7 text-base rounded-[12px]',
};

export const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    children,
    className = '',
    as: Tag = 'button',
    ...props
  },
  ref
) {
  const gradientStyle =
    variant === 'primary'
      ? { background: 'linear-gradient(90deg, #0E4B43 0%, #22C55E 100%)' }
      : variant === 'danger'
      ? { backgroundColor: '#EF4444' }
      : variant === 'secondary'
      ? { borderColor: '#22C55E', color: '#22C55E' }
      : {};

  return (
    <Tag
      ref={ref}
      disabled={disabled || loading}
      className={`${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      style={gradientStyle}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </Tag>
  );
});
