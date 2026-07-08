const SIZE_MAP = {
  xs: { container: 'w-6 h-6', text: 'text-[10px]' },
  sm: { container: 'w-8 h-8', text: 'text-xs' },
  md: { container: 'w-10 h-10', text: 'text-sm' },
  lg: { container: 'w-14 h-14', text: 'text-lg' },
  xl: { container: 'w-20 h-20', text: 'text-2xl' },
};

export function Avatar({ name, src, size = 'md', className = '' }) {
  const { container, text } = SIZE_MAP[size] || SIZE_MAP.md;
  const initials = name
    ? name
        .split(' ')
        .slice(0, 2)
        .map((n) => n.charAt(0).toUpperCase())
        .join('')
    : '?';

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={`${container} rounded-full object-cover border-2 ${className}`}
        style={{ borderColor: 'rgba(255,255,255,0.1)' }}
      />
    );
  }

  return (
    <div
      className={`${container} rounded-full flex items-center justify-center font-semibold text-white shrink-0 ${text} ${className}`}
      style={{ background: 'linear-gradient(135deg, #0E4B43, #22C55E)' }}
    >
      {initials}
    </div>
  );
}
