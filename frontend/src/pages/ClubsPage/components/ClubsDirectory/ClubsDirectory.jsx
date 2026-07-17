import { useState, useEffect, useMemo } from 'react';
import { ChevronRight, Search, X, ArrowUpDown, RefreshCw } from 'lucide-react';
import { Section, SectionEyebrow, SectionHeader } from '@/components';
import ClubCard, { normaliseClub } from '../ClubCard/ClubCard.jsx';
import { clubService } from '@/services/clubService';
import { useSearchParams } from 'react-router-dom';

/* Sort options. Keep this list small — adding too many options is a UX trap. */
const SORT_OPTIONS = [
  { id: 'name-asc', label: 'Name (A → Z)' },
  { id: 'name-desc', label: 'Name (Z → A)' },
  { id: 'members-desc', label: 'Most members' },
  { id: 'members-asc', label: 'Fewest members' },
  { id: 'newest', label: 'Newest first' },
];

function compareClubs(a, b, sortId) {
  switch (sortId) {
    case 'name-asc':
      return (a.name || '').localeCompare(b.name || '');
    case 'name-desc':
      return (b.name || '').localeCompare(a.name || '');
    case 'members-desc':
      return (b.memberCount || 0) - (a.memberCount || 0);
    case 'members-asc':
      return (a.memberCount || 0) - (b.memberCount || 0);
    case 'newest':
      // club.created_at may be missing in normalised form; fall back to name.
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    default:
      return 0;
  }
}

/**
 * ClubsDirectory
 *
 * variant="page"     → /clubs      (full directory with search, sort, filter)
 * variant="homepage" → /           (Featured Clubs only — uses clubService.getFeatured)
 *
 * Search and category filter are pushed DOWN to the server when possible
 * (variant="page"). variant="homepage" always queries via getFeatured()
 * because the homepage doesn't expose filter controls.
 *
 * The category list is loaded from clubService.getCategories() so the
 * filter pills reflect what's actually in the database. Categories with
 * `count` are pre-sorted to put empty buckets last.
 */
export default function ClubsDirectory({ variant = 'page' }) {
  const isHome = variant === 'homepage';
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState(searchParams.get('category') || 'All');
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [sort, setSort] = useState('name-asc');
  const [featuredClubs, setFeaturedClubs] = useState([]);
  const [pageClubs, setPageClubs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  /* Load categories from Supabase (unless we're on the homepage, where
     the filter pills are hidden and we can skip the round-trip). */
  useEffect(() => {
    if (isHome) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await clubService.getCategories();
        if (!cancelled) {
          setCategories([
            { name: 'All', count: null },
            ...(Array.isArray(list) ? list : []).map((c) => ({
              name: c.name,
              count: typeof c.count === 'number' ? c.count : null,
              id: c.id,
            })),
          ]);
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('[ClubsDirectory] getCategories failed:', err);
          // Keep a minimal fallback so the filter UI still works while
          // Supabase is unreachable — the actual data still comes from
          // clubService.getAll() below.
          setCategories([{ name: 'All', count: null }]);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [isHome, reloadKey]);

  /* Resolve the `filter` (category NAME from the UI pills) to a categoryId
     the server expects. Without this lookup we cannot push the filter
     down to Postgres. */
  const filterCategoryId = useMemo(() => {
    if (!filter || filter === 'All') return undefined;
    const found = categories.find((c) => c.name === filter);
    return found?.id;
  }, [filter, categories]);

  /* Main list query. Whenever search/filter/reload change, refetch from
     Supabase. For the homepage variant we use getFeatured() instead. */
  useEffect(() => {
    let cancelled = false;
    /* eslint-disable react-hooks/set-state-in-effect --
     * The `loading` state must reset synchronously here so the skeleton
     * shows on every filter/search keystroke. Without this, the previous
     * results stay on screen until the new fetch resolves, which feels
     * laggy. The lint rule is a React 19 recommendation, not a runtime
     * correctness issue — and our `cancelled` guard prevents double-set
     * on unmounted components. */
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const data = isHome
          ? await clubService.getFeatured(8)
          : await clubService.getAll({
              limit: 100,
              search: search.trim() || undefined,
              categoryId: filterCategoryId,
            });
        if (!cancelled) {
          const list = Array.isArray(data) ? data.map(normaliseClub) : [];
          if (isHome) setFeaturedClubs(list);
          else setPageClubs(list);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load clubs:', err);
          setError(err);
          if (isHome) setFeaturedClubs([]);
          else setPageClubs([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isHome, search, filterCategoryId, reloadKey]);

  /* Keep the URL in sync so /clubs?category=Technology&q=foo is shareable */
  useEffect(() => {
    if (isHome) return;
    const next = new URLSearchParams();
    if (filter && filter !== 'All') next.set('category', filter);
    if (search.trim()) next.set('q', search.trim());
    setSearchParams(next, { replace: true });
    // `setSearchParams` is a stable ref returned by react-router; omitting
    // it from the deps list avoids spurious re-runs without changing semantics.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, search, isHome]);

  const clubs = isHome ? featuredClubs : pageClubs;

  /* Client-side sort only — search & category already hit the server. */
  const visibleClubs = useMemo(() => {
    return [...clubs].sort((a, b) => compareClubs(a, b, sort));
  }, [clubs, sort]);

  const handleRetry = () => setReloadKey((k) => k + 1);

  return (
    <Section tone="cream" className="clubs-directory">
      <SectionHeader
        eyebrow={
          <SectionEyebrow tone="green">
            {isHome ? 'Featured Clubs' : 'Club Directory'}
          </SectionEyebrow>
        }
        title={isHome ? 'Trending at FPTU' : 'Find Your Club'}
        description={
          isHome
            ? 'A curated selection of clubs actively recruiting new members this semester.'
            : 'Browse 42+ student clubs across diverse categories. From tech to arts, there\'s a community for everyone.'
        }
        ctaLabel={isHome ? 'View all clubs →' : 'View All Clubs'}
        ctaHref="/clubs"
      />

      {!isHome && (
        <div className="clubs-directory__toolbar">
          <div className="clubs-directory__search">
            <Search size={16} className="clubs-directory__search-icon" />
            <input
              type="search"
              className="clubs-directory__search-input"
              placeholder="Search clubs by name or description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search clubs"
            />
            {search && (
              <button
                type="button"
                className="clubs-directory__search-clear"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="clubs-directory__sort">
            <ArrowUpDown size={14} className="clubs-directory__sort-icon" />
            <select
              className="clubs-directory__sort-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Sort clubs"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {!isHome && (
        <div
          className="clubs-directory__filters"
          role="tablist"
          aria-label="Club category filter"
        >
          {categories.map((c) => {
            const active = filter === c.name;
            return (
              <button
                key={c.name}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(c.name)}
                className="clubs-directory__pill"
                style={
                  active
                    ? {
                        background: 'linear-gradient(90deg,#0E4B43,#22C55E)',
                        color: '#ffffff',
                      }
                    : {
                        background: '#ffffff',
                        color: '#16685D',
                        border: '1px solid rgba(6, 35, 29, 0.12)',
                      }
                }
              >
                {c.name}
                {typeof c.count === 'number' && (
                  <span style={{ marginLeft: 6, opacity: 0.7, fontSize: 12 }}>
                    ({c.count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {!isHome && !loading && !error && clubs.length > 0 && (
        <div className="clubs-directory__count" aria-live="polite">
          Showing <strong>{visibleClubs.length}</strong> of {clubs.length} club
          {clubs.length === 1 ? '' : 's'}
          {filter !== 'All' && (
            <>
              {' '}in <strong>{filter}</strong>
            </>
          )}
          {search && (
            <>
              {' '}matching "<strong>{search}</strong>"
            </>
          )}
        </div>
      )}

      {loading ? (
        <div className="clubs-directory__skeleton">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="clubs-directory__skeleton-card" />
          ))}
        </div>
      ) : error && !isHome ? (
        <div
          className="clubs-directory__empty"
          style={{ color: '#B91C1C', borderColor: 'rgba(185, 28, 28, 0.2)' }}
        >
          <p className="clubs-directory__empty-title" style={{ color: '#7F1D1D' }}>
            Couldn't load clubs from the server
          </p>
          <p className="clubs-directory__empty-desc">
            {error?.message || 'Check your network or Supabase connection.'}
          </p>
          <button
            type="button"
            className="clubs-directory__empty-cta"
            onClick={handleRetry}
          >
            <RefreshCw size={14} /> Try again
          </button>
        </div>
      ) : visibleClubs.length === 0 ? (
        <div
          className="clubs-directory__empty"
          style={{ color: '#16685D', borderColor: 'rgba(6, 35, 29, 0.08)' }}
        >
          <p className="clubs-directory__empty-title" style={{ color: '#06231D' }}>
            {search
              ? `No clubs match "${search}"`
              : filter !== 'All'
                ? `No clubs in ${filter} yet`
                : 'No clubs available yet'}
          </p>
          <p className="clubs-directory__empty-desc">
            {search
              ? 'Try a different keyword, or clear the search to see all clubs.'
              : 'Try another filter or check back soon.'}
          </p>
          {(search || filter !== 'All') && (
            <button
              type="button"
              className="clubs-directory__empty-cta"
              onClick={() => {
                setSearch('');
                setFilter('All');
              }}
            >
              Clear filters <ChevronRight size={14} />
            </button>
          )}
        </div>
      ) : (
        <div
          className={
            isHome
              ? 'clubs-directory__grid clubs-directory__grid--home'
              : 'clubs-directory__grid'
          }
        >
          {visibleClubs.map((club) => (
            <ClubCard key={club.id} club={club} />
          ))}
        </div>
      )}

      <style>{`
        .clubs-directory__toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 16px;
          align-items: center;
        }
        .clubs-directory__search {
          position: relative;
          flex: 1 1 280px;
          min-width: 220px;
        }
        .clubs-directory__search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #16685D;
          pointer-events: none;
        }
        .clubs-directory__search-input {
          width: 100%;
          height: 44px;
          padding: 0 40px 0 40px;
          border-radius: 12px;
          border: 1px solid rgba(6, 35, 29, 0.12);
          background: #ffffff;
          font-size: 14px;
          color: #06231D;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .clubs-directory__search-input:focus {
          border-color: #22C55E;
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15);
        }
        .clubs-directory__search-clear {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          width: 28px;
          height: 28px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: #16685D;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .clubs-directory__search-clear:hover {
          background: #E8F5F0;
        }
        .clubs-directory__sort {
          position: relative;
          display: flex;
          align-items: center;
        }
        .clubs-directory__sort-icon {
          position: absolute;
          left: 12px;
          color: #16685D;
          pointer-events: none;
        }
        .clubs-directory__sort-select {
          height: 44px;
          padding: 0 32px 0 34px;
          border-radius: 12px;
          border: 1px solid rgba(6, 35, 29, 0.12);
          background: #ffffff;
          font-size: 14px;
          color: #06231D;
          font-weight: 500;
          cursor: pointer;
          outline: none;
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path fill='%2316685D' d='M6 8L0 0h12z'/></svg>");
          background-repeat: no-repeat;
          background-position: right 12px center;
          background-size: 10px 6px;
        }
        .clubs-directory__sort-select:focus {
          border-color: #22C55E;
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15);
        }
        .clubs-directory__filters {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 16px;
        }
        .clubs-directory__pill {
          padding: 8px 16px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .clubs-directory__pill:hover {
          opacity: 0.9;
        }
        .clubs-directory__count {
          font-size: 13px;
          color: #16685D;
          margin-bottom: 20px;
        }
        .clubs-directory__count strong {
          color: #06231D;
        }
        .clubs-directory__grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
        }
        .clubs-directory__grid--home {
          grid-template-columns: 1fr;
        }
        @media (min-width: 640px) {
          .clubs-directory__grid { grid-template-columns: repeat(2, 1fr); }
          .clubs-directory__grid--home { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1024px) {
          .clubs-directory__grid { grid-template-columns: repeat(3, 1fr); }
          .clubs-directory__grid--home { grid-template-columns: repeat(4, 1fr); }
        }
        .clubs-directory__skeleton {
          display: contents;
        }
        .clubs-directory__skeleton-card {
          height: 240px;
          border-radius: 16px;
          background: linear-gradient(90deg, #f0ede8 25%, #e8e3dc 50%, #f0ede8 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .clubs-directory__empty {
          text-align: center;
          padding: 64px 24px;
          border: 1px dashed;
          border-radius: 16px;
          background: #ffffff;
        }
        .clubs-directory__empty-title {
          font-size: 18px;
          font-weight: 700;
          margin: 0;
        }
        .clubs-directory__empty-desc {
          margin: 8px 0 16px;
          font-size: 14px;
        }
        .clubs-directory__empty-cta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 20px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 14px;
          color: #ffffff;
          background: linear-gradient(90deg, #0E4B43, #22C55E);
          border: none;
          cursor: pointer;
        }
      `}</style>
    </Section>
  );
}
