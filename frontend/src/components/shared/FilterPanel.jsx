import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export function FilterPanel({
  categories = [],
  selectedCategory,
  onCategoryChange,
  className,
}) {
  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="text-sm font-medium text-secondary-200">Categories</h3>
      <div className="flex flex-wrap gap-2 items-center">
        <button
          type="button"
          onClick={() => onCategoryChange?.(null)}
          className={cn(
            'inline-flex h-5 shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all cursor-pointer',
            selectedCategory === null
              ? 'bg-accent-green text-primary-900 font-semibold'
              : 'bg-primary-800 text-secondary-100 hover:bg-primary-700'
          )}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            type="button"
            key={category.id}
            onClick={() => onCategoryChange?.(category.id)}
            className={cn(
              'inline-flex h-5 shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all cursor-pointer',
              selectedCategory === category.id
                ? 'bg-accent-green text-primary-900 font-semibold'
                : 'bg-primary-800 text-secondary-100 hover:bg-primary-700'
            )}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  )
}
