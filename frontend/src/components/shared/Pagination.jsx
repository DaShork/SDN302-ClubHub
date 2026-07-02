import { Button } from './Button';

export function Pagination({
  page = 1,
  totalPages = 1,
  onPageChange,
  siblingCount = 1,
  className = '',
}) {
  if (totalPages <= 1) return null;

  const range = (start, end) =>
    Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const getPages = () => {
    const total = totalPages;
    const curr = page;
    const left = Math.max(2, curr - siblingCount);
    const right = Math.min(total - 1, curr + siblingCount);
    const pages = [];

    if (left > 2) pages.push(1, '...');
    else pages.push(1);

    for (let i = left; i <= right; i++) pages.push(i);

    if (right < total - 1) pages.push('...', total);
    else if (total > 1) pages.push(total);

    return pages;
  };

  return (
    <nav
      className={`flex items-center gap-1 flex-wrap justify-center ${className}`}
      aria-label="Pagination"
    >
      <Button
        variant="ghost"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange?.(page - 1)}
        aria-label="Previous page"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </Button>

      {getPages().map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-sm" style={{ color: 'rgba(244,241,234,0.3)' }}>
            ...
          </span>
        ) : (
          <Button
            key={p}
            variant={p === page ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => onPageChange?.(p)}
            aria-label={`Page ${p}`}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </Button>
        )
      )}

      <Button
        variant="ghost"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange?.(page + 1)}
        aria-label="Next page"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </Button>
    </nav>
  );
}
