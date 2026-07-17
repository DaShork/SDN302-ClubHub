import { useState, useEffect, useCallback } from 'react';
import { GraduationCap, Building2, Briefcase, Mail, Link2, Search, X } from 'lucide-react';
import { Card, Loading } from '@/components';
import { listAlumni, searchAlumni, getGraduationYears } from '@/services/alumniService';
import { AlumniCard } from './AlumniCard/AlumniCard.jsx';
import { AlumniFilters } from './AlumniFilters/AlumniFilters.jsx';
import './AlumniPage.css';

const LIMIT = 12;

export default function AlumniPageContent() {
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState(null);
  const [years, setYears] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedAlumni, setSelectedAlumni] = useState(null);

  const fetchAlumni = useCallback(async () => {
    setLoading(true);
    const offset = (page - 1) * LIMIT;
    const [{ data }, { data: yearList }] = await Promise.all([
      search.trim()
        ? searchAlumni(search, { limit: LIMIT })
        : listAlumni({ limit: LIMIT, offset, graduationYear: yearFilter }),
      years.length === 0 ? getGraduationYears() : { data: years },
    ]);

    if (years.length === 0 && yearList) setYears(yearList);
    setAlumni(data || []);
    setTotalCount(data?.length || 0);
    setLoading(false);
  }, [search, yearFilter, page, years]);

  useEffect(() => {
    const timer = setTimeout(fetchAlumni, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchAlumni, search]);

  const totalPages = Math.ceil(totalCount / LIMIT) || 1;

  return (
    <div className="alumni-page">
      <section className="alumni-page__hero">
        <div className="alumni-page__hero-inner">
          <div className="alumni-page__eyebrow">
            <GraduationCap size={14} />
            Alumni Directory
          </div>
          <h1 className="alumni-page__title">
            Where <span className="alumni-page__title-gradient">ClubHub Alumni</span> Are Now
          </h1>
          <p className="alumni-page__subtitle">
            Discover former club members and their career journeys
          </p>
        </div>
      </section>

      <section className="alumni-page__content">
        <div className="alumni-page__container">
          <AlumniFilters
            searchQuery={search}
            onSearchChange={setSearch}
            year={yearFilter}
            onYearChange={setYearFilter}
            years={years}
          />

          {!loading && (
            <p className="alumni-page__count">
              {totalCount} {totalCount === 1 ? 'result' : 'results'}
            </p>
          )}

          {loading ? (
            <div className="alumni-page__loading">
              <Loading />
            </div>
          ) : alumni.length === 0 ? (
            <EmptyState search={search} />
          ) : (
            <>
              <div className="alumni-page__grid">
                {alumni.map((a) => (
                  <AlumniCard key={a.id} alumni={a} onClick={setSelectedAlumni} />
                ))}
              </div>
              {totalPages > 1 && (
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              )}
            </>
          )}
        </div>
      </section>

      {selectedAlumni && (
        <AlumniDetailModal alumni={selectedAlumni} onClose={() => setSelectedAlumni(null)} />
      )}
    </div>
  );
}

function EmptyState({ search }) {
  return (
    <div className="alumni-page__empty">
      <div className="alumni-page__empty-icon">
        <Search size={32} />
      </div>
      <h3 className="alumni-page__empty-title">No alumni found</h3>
      <p className="alumni-page__empty-desc">
        {search ? `No results for "${search}". Try a different search term.` : 'No alumni have been registered yet.'}
      </p>
    </div>
  );
}

function Pagination({ page, totalPages, onPageChange }) {
  return (
    <div className="alumni-page__pagination">
      <button
        type="button"
        className="alumni-page__page-btn"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
      >
        Previous
      </button>
      <span className="alumni-page__page-info">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        className="alumni-page__page-btn"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
      >
        Next
      </button>
    </div>
  );
}

function AlumniDetailModal({ alumni, onClose }) {
  const profile = alumni.profiles;
  const initials = (profile?.full_name || '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="alumni-modal" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="alumni-modal__panel" onClick={(e) => e.stopPropagation()}>
        <button className="alumni-modal__close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        <div className="alumni-modal__head">
          <div className="alumni-modal__avatar">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name} />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div>
            <h3 className="alumni-modal__name">{profile?.full_name || 'Unknown'}</h3>
            {profile?.student_code && <p className="alumni-modal__student-code">{profile.student_code}</p>}
            {alumni.graduation_year && (
              <p className="alumni-modal__year">Class of {alumni.graduation_year}</p>
            )}
          </div>
        </div>

        <div className="alumni-modal__details">
          {profile?.faculty && (
            <DetailRow icon={<GraduationCap size={16} />} label="Faculty" value={profile.faculty} />
          )}
          {profile?.major && (
            <DetailRow icon={<Building2 size={16} />} label="Major" value={profile.major} />
          )}
          {alumni.company && (
            <DetailRow icon={<Briefcase size={16} />} label="Company" value={alumni.company} />
          )}
          {profile?.email && (
            <DetailRow
              icon={<Mail size={16} />}
              label="Email"
              value={
                <a href={`mailto:${profile.email}`} className="alumni-modal__link">
                  {profile.email}
                </a>
              }
            />
          )}
          {alumni.linkedin_url && (
            <DetailRow
              icon={<Link2 size={16} />}
              label="LinkedIn"
              value={
                <a
                  href={alumni.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="alumni-modal__link"
                >
                  View Profile
                </a>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <div className="alumni-modal__row">
      <span className="alumni-modal__row-icon">{icon}</span>
      <span className="alumni-modal__row-label">{label}</span>
      <span className="alumni-modal__row-value">{value}</span>
    </div>
  );
}