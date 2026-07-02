import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

function SearchIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  )
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  className,
  ...props
}) {
  return (
    <div className={cn('relative', className)}>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-300">
        <SearchIcon className="h-5 w-5" />
      </div>
      <input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full pl-10 pr-4 py-3 bg-primary-800 border border-white/10 rounded-lg text-secondary-100 placeholder-secondary-300 focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green transition-colors"
        {...props}
      />
    </div>
  )
}
