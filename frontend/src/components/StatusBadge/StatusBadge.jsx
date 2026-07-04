import { cn } from '@/lib/utils'

const STATUS_STYLES = {
  Recruiting: { background: '#E8F5F0', color: '#16685D', border: '1px solid rgba(22, 104, 93, 0.20)' },
  Active: { background: '#EFF6FF', color: '#3B82F6', border: '1px solid rgba(59, 130, 246, 0.20)' },
  Upcoming: { background: '#FFFBEB', color: '#D97706', border: '1px solid rgba(217, 119, 6, 0.20)' },
  Inactive: { background: '#F4F1EA', color: '#8A8270', border: '1px solid rgba(6, 35, 29, 0.10)' },
  Urgent: { background: '#FEF2F2', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.20)' },
}

const VARIANT_STYLES = {
  default: 'border-transparent bg-primary text-primary-foreground',
  secondary: 'border-transparent bg-secondary text-secondary-foreground',
  destructive: 'border-transparent bg-destructive text-destructive-foreground',
  outline: 'text-foreground border-border',
  ghost: 'border-transparent bg-transparent hover:bg-muted',
  link: 'text-primary underline-offset-4 hover:underline border-transparent bg-transparent',
  success: 'border-transparent bg-accent-green/15 text-accent-green',
  warning: 'border-transparent bg-warning/15 text-warning-dark',
  info: 'border-transparent bg-accent-blue/15 text-accent-blue',
  danger: 'border-transparent bg-destructive/15 text-destructive',
}

export default function StatusBadge({ status, variant, className, children, ...props }) {
  if (status) {
    const style = STATUS_STYLES[status] ?? STATUS_STYLES.Inactive
    return (
      <span
        className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', className)}
        style={style}
      >
        {children ?? status}
      </span>
    )
  }
  return (
    <div
      data-slot="badge"
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        VARIANT_STYLES[variant] ?? VARIANT_STYLES.default,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}