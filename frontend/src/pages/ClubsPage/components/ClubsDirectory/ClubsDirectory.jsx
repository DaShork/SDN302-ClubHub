import { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { Section, SectionEyebrow, SectionHeader } from '@/components';
import ClubCard, { normaliseClub } from '../ClubCard/ClubCard.jsx';
import { clubService } from '@/services/clubService';
import { CLUBS as PAGE_CLUBS, CATEGORIES } from '../../mockData.js';

export default function ClubsDirectory({ variant = 'page' }) {
  const isHome = variant === 'homepage';
  const [filter, setFilter] = useState('All');
  const [featuredClubs, setFeaturedClubs] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);

  useEffect(() => {
    if (!isHome) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await clubService.getFeatured(8);
        if (!cancelled) setFeaturedClubs(Array.isArray(data) ? data.map(normaliseClub) : []);
      } catch {
        if (!cancelled) setFeaturedClubs([]);
      } finally {
        if (!cancelled) setFeaturedLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isHome]);

  const clubs = isHome ? featuredClubs : PAGE_CLUBS;
  const filtered =
    isHome || filter === 'All'
      ? clubs
      : clubs.filter((c) => (c.category || c.categories?.name) === filter);

  const displayCategory = (c) => c.category || c.categories?.name;

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
        <div
          className="clubs-directory__filters"
          role="tablist"
          aria-label="Club category filter"
        >
          {CATEGORIES.map((c) => {
            const active = filter === c;
            return (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(c)}
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
                {c}
              </button>
            );
          })}
        </div>
      )}

      {featuredLoading && isHome ? (
        <div className="clubs-directory__skeleton">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="clubs-directory__skeleton-card" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="clubs-directory__empty"
          style={{ color: '#16685D', borderColor: 'rgba(6, 35, 29, 0.08)' }}
        >
          <p className="clubs-directory__empty-title" style={{ color: '#06231D' }}>
            No clubs in this category yet
          </p>
          <p className="clubs-directory__empty-desc">
            Try another filter or check back soon.
          </p>
          <button
            type="button"
            className="clubs-directory__empty-cta"
            onClick={() => setFilter('All')}
          >
            Show all clubs <ChevronRight size={14} />
          </button>
        </div>
      ) : (
        <div
          className={
            isHome
              ? 'clubs-directory__grid clubs-directory__grid--home'
              : 'clubs-directory__grid'
          }
        >
          {filtered.map((club) => (
            <ClubCard key={club.id} club={club} />
          ))}
        </div>
      )}

      <style>{`
        .clubs-directory__filters {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 40px;
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
          gap: 4px;
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
