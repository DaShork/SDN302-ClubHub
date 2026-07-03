import { cn } from '@/lib/utils'

export function Loading({ className, size = 'default', fullScreen = false }) {
  const sizes = {
    sm: 'h-4 w-4',
    default: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-primary-900/80 backdrop-blur-sm z-50">
        <div className="flex flex-col items-center gap-4">
          <div className={cn(
            'animate-spin rounded-full border-2 border-accent-green border-t-transparent',
            sizes[size]
          )} />
          <p className="text-secondary-200 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center justify-center p-8', className)}>
      <div className={cn(
        'animate-spin rounded-full border-2 border-accent-green border-t-transparent',
        sizes[size]
      )} />
    </div>
  )
}

export function Skeleton({ className }) {
  return (
    <div className={cn(
      'animate-pulse rounded-lg bg-primary-700/50',
      className
    )} />
  )
}
