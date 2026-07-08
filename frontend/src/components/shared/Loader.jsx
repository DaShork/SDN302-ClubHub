const SIZE_MAP = {
  sm: 20,
  md: 32,
  lg: 48,
  xl: 64,
};

export function Loader({ size = 'md', className = '' }) {
  const px = SIZE_MAP[size] || SIZE_MAP.md;
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      role="status"
      aria-label="Loading"
    >
      <svg
        width={px}
        height={px}
        viewBox="0 0 24 24"
        fill="none"
        className="animate-spin"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="#22C55E"
          strokeWidth="3"
        />
        <path
          className="opacity-75"
          fill="#22C55E"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
    </div>
  );
}
