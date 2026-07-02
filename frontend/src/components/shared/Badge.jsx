const VARIANT_STYLES = {
  // Status
  active: { bg: 'rgba(34,197,94,0.15)', color: '#22C55E' },
  inactive: { bg: 'rgba(255,255,255,0.08)', color: 'rgba(244,241,234,0.5)' },
  recruiting: { bg: 'rgba(59,130,246,0.15)', color: '#3B82F6' },
  archived: { bg: 'rgba(255,255,255,0.08)', color: 'rgba(244,241,234,0.4)' },

  // Event status
  upcoming: { bg: 'rgba(34,197,94,0.15)', color: '#22C55E' },
  ongoing: { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B' },
  finished: { bg: 'rgba(255,255,255,0.08)', color: 'rgba(244,241,234,0.5)' },
  cancelled: { bg: 'rgba(239,68,68,0.15)', color: '#EF4444' },

  // Payment status
  pending: { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B' },
  completed: { bg: 'rgba(34,197,94,0.15)', color: '#22C55E' },
  failed: { bg: 'rgba(239,68,68,0.15)', color: '#EF4444' },
  refunded: { bg: 'rgba(59,130,246,0.15)', color: '#3B82F6' },

  // Membership status
  left: { bg: 'rgba(255,255,255,0.08)', color: 'rgba(244,241,234,0.5)' },

  // Roles
  Student: { bg: 'rgba(59,130,246,0.15)', color: '#3B82F6' },
  'Club Member': { bg: 'rgba(34,197,94,0.15)', color: '#22C55E' },
  'Club Leader': { bg: 'rgba(139,92,246,0.15)', color: '#8B5CF6' },
  Mentor: { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B' },
  Manager: { bg: 'rgba(236,72,153,0.15)', color: '#EC4899' },
  Administrator: { bg: 'rgba(239,68,68,0.15)', color: '#EF4444' },

  // General info / unread
  unread: { bg: 'rgba(34,197,94,0.15)', color: '#22C55E' },
  read: { bg: 'rgba(255,255,255,0.08)', color: 'rgba(244,241,234,0.5)' },
  info: { bg: 'rgba(59,130,246,0.15)', color: '#3B82F6' },
  default: { bg: 'rgba(255,255,255,0.08)', color: 'rgba(244,241,234,0.6)' },
};

export function Badge({ children, variant = 'default', className = '' }) {
  const style = VARIANT_STYLES[variant] || VARIANT_STYLES.default;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={{ backgroundColor: style.bg, color: style.color }}
    >
      {children}
    </span>
  );
}
