import { useState, useEffect, useCallback } from 'react';
import { listAlumni, searchAlumni, getGraduationYears, getAlumniCount } from '../../services/alumniService';
import { AlumniCard } from './components/AlumniCard';
import { AlumniFilters } from './components/AlumniFilters';
import { SectionHeader } from '../../components/shared/SectionHeader';
import { Modal } from '../../components/shared/Modal';
import { Avatar } from '../../components/shared/Avatar';
import { EmptyState } from '../../components/shared/EmptyState';
import { Loader } from '../../components/shared/Loader';
import { Pagination } from '../../components/shared/Pagination';

export default function AlumniPage() {
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState(null);
  const [years, setYears] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedAlumni, setSelectedAlumni] = useState(null);
  const LIMIT = 12;

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
  }, [search, yearFilter, page]);

  useEffect(() => {
    const timer = setTimeout(fetchAlumni, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchAlumni]);

  const totalPages = Math.ceil(totalCount / LIMIT) || 1;

  return (
    <div className="w-full max-w-[1280px] mx-auto px-6 py-8">
      <SectionHeader
        title="Alumni Directory"
        subtitle={`Discover former club members and their career journeys`}
      />

      {/* Filters */}
      <div className="mb-6">
        <AlumniFilters
          searchQuery={search}
          onSearchChange={setSearch}
          year={yearFilter}
          onYearChange={setYearFilter}
          years={years}
        />
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-sm mb-4" style={{ color: 'rgba(244,241,234,0.4)' }}>
          {totalCount} {totalCount === 1 ? 'result' : 'results'}
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader size="lg" />
        </div>
      ) : alumni.length === 0 ? (
        <EmptyState
          icon={
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
            </svg>
          }
          title="No alumni found"
          description={search ? `No results for "${search}". Try a different search term.` : 'No alumni have been registered yet.'}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            {alumni.map((a) => (
              <AlumniCard key={a.id} alumni={a} onClick={setSelectedAlumni} />
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </>
      )}

      {/* Detail modal */}
      <Modal
        open={!!selectedAlumni}
        onClose={() => setSelectedAlumni(null)}
        title="Alumni Profile"
        size="md"
      >
        {selectedAlumni && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <Avatar name={selectedAlumni.profiles?.full_name} src={selectedAlumni.profiles?.avatar_url} size="xl" />
              <div>
                <h3 className="text-xl font-bold text-secondary-100">{selectedAlumni.profiles?.full_name || 'Unknown'}</h3>
                <p className="text-sm" style={{ color: 'rgba(244,241,234,0.5)' }}>{selectedAlumni.profiles?.student_code || ''}</p>
                {selectedAlumni.graduation_year && (
                  <p className="text-sm mt-1" style={{ color: 'rgba(244,241,234,0.4)' }}>
                    Class of {selectedAlumni.graduation_year}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {selectedAlumni.profiles?.faculty && (
                <div className="flex gap-3">
                  <span className="text-sm font-medium shrink-0" style={{ color: 'rgba(244,241,234,0.4)' }}>Faculty:</span>
                  <span className="text-sm text-secondary-100">{selectedAlumni.profiles.faculty}</span>
                </div>
              )}
              {selectedAlumni.profiles?.major && (
                <div className="flex gap-3">
                  <span className="text-sm font-medium shrink-0" style={{ color: 'rgba(244,241,234,0.4)' }}>Major:</span>
                  <span className="text-sm text-secondary-100">{selectedAlumni.profiles.major}</span>
                </div>
              )}
              {selectedAlumni.company && (
                <div className="flex gap-3">
                  <span className="text-sm font-medium shrink-0" style={{ color: 'rgba(244,241,234,0.4)' }}>Company:</span>
                  <span className="text-sm text-secondary-100">{selectedAlumni.company}</span>
                </div>
              )}
              {selectedAlumni.profiles?.email && (
                <div className="flex gap-3">
                  <span className="text-sm font-medium shrink-0" style={{ color: 'rgba(244,241,234,0.4)' }}>Email:</span>
                  <a href={`mailto:${selectedAlumni.profiles.email}`} className="text-sm text-accent-blue hover:underline">{selectedAlumni.profiles.email}</a>
                </div>
              )}
              {selectedAlumni.linkedin_url && (
                <div className="flex gap-3">
                  <span className="text-sm font-medium shrink-0" style={{ color: 'rgba(244,241,234,0.4)' }}>LinkedIn:</span>
                  <a href={selectedAlumni.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sm text-accent-blue hover:underline">View Profile</a>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
