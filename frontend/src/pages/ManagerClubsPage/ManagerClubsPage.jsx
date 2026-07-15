import { useState, useEffect, useMemo } from 'react';
import {
  Search, Building2, Users, X, RefreshCw, UserCog, ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, Button, toast } from '@/components';
import {
  listClubs, changeClubMentor, searchLeaderCandidates, auditClubAction,
} from '@/services/adminClubsService';
import { useAuth } from '@/hooks/useAuth.jsx';
import './ManagerClubsPage.css';

/* Manager's club-management page.
 *
 * Rendered inside DashboardLayout. Unlike AdminClubsPage (which exposes
 * every status/recruit toggle), this page focuses on what a Manager does
 * day-to-day: review every club in the system and (re)assign its mentor.
 *
 * Pure read-only listing + per-row "Assign mentor" modal — no status
 * toggles, no recruitment toggles, no leader swap. Those remain on the
 * Admin Clubs page.
 */
export default function ManagerClubsPage() {
  const { profileId } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [total, setTotal] = useState(0);
  const [assigning, setAssigning] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const { rows: data, count } = await listClubs({
        page,
        pageSize,
        search: search.trim(),
        status: statusFilter,
      });
      setRows(data);
      setTotal(count);
    } catch (err) {
      console.error('Failed to load clubs:', err);
      toast('Không thể tải danh sách CLB', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [page, statusFilter]);
  // Re-fetch when search debounces
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="manager-clubs">
      <div className="manager-clubs__header">
        <div>
          <h1 className="manager-clubs__title">Quản lý CLB</h1>
          <p className="manager-clubs__subtitle">
            Xem toàn bộ CLB trong hệ thống và phân công mentor.
          </p>
        </div>
        <div className="manager-clubs__header-actions">
          <Button variant="secondary" onClick={() => { setPage(1); load(); }}>
            <RefreshCw size={16} /> Tải lại
          </Button>
        </div>
      </div>

      <Card>
        <div className="manager-clubs__toolbar">
          <div className="manager-clubs__search">
            <span className="manager-clubs__search-icon">🔍</span>
            <input
              type="text"
              placeholder="Tìm theo tên / mô tả / email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="manager-clubs__search-input"
            />
          </div>
          <select
            className="manager-clubs__filter"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="manager-clubs__table-wrap">
          <table className="manager-clubs__table">
            <thead>
              <tr>
                <th>CLB</th>
                <th>Danh mục</th>
                <th>Leader</th>
                <th>Mentor</th>
                <th>Members</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="manager-clubs__state">
                    <div className="manager-clubs__spinner" />
                    Đang tải…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="manager-clubs__state">
                    Không có CLB nào khớp bộ lọc.
                  </td>
                </tr>
              ) : (
                rows.map((club) => (
                  <tr key={club.id}>
                    <td>
                      <div className="manager-clubs__club-cell">
                        {club.logo_url ? (
                          <img src={club.logo_url} alt={club.name} className="manager-clubs__logo" />
                        ) : (
                          <div className="manager-clubs__logo-placeholder">
                            {(club.name || 'C').charAt(0)}
                          </div>
                        )}
                        <div className="manager-clubs__club-info">
                          <Link to={`/clubs/${club.slug || club.id}`} className="manager-clubs__club-name">
                            {club.name}
                          </Link>
                          <span className="manager-clubs__club-cat">
                            {club.categories?.name || '—'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="manager-clubs__cell-text">
                        {club.categories?.name || '—'}
                      </span>
                    </td>
                    <td>
                      <span className="manager-clubs__cell-text">
                        {club.leader?.full_name || '—'}
                      </span>
                    </td>
                    <td>
                      {club.mentor ? (
                        <span className="manager-clubs__mentor-chip">
                          <UserCog size={12} />
                          {club.mentor.full_name || club.mentor.email}
                        </span>
                      ) : (
                        <span className="manager-clubs__mentor-empty">
                          Chưa có mentor
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="manager-clubs__cell-text">
                        <Users size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                        {club.member_count ?? '—'}
                      </span>
                    </td>
                    <td>
                      <span className={`manager-clubs__status manager-clubs__status--${club.status}`}>
                        {club.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Button
                        variant="secondary"
                        onClick={() => setAssigning(club)}
                      >
                        <UserCog size={14} /> Gán mentor
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="manager-clubs__pagination">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={14} /> Trước
            </button>
            <span>Trang {page} / {totalPages} · {total} CLB</span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Sau <ChevronRight size={14} />
            </button>
          </div>
        )}
      </Card>

      <AssignMentorModal
        club={assigning}
        onClose={() => setAssigning(null)}
        onAssigned={async (clubId, newMentorId, prevMentorId) => {
          try {
            await changeClubMentor(clubId, newMentorId);
            await auditClubAction({
              actorId: profileId,
              clubId,
              action: 'club_mentor_changed',
              details: {
                previous_mentor_id: prevMentorId,
                new_mentor_id: newMentorId,
              },
            });
            toast('Đã cập nhật mentor', { variant: 'success' });
            setAssigning(null);
            load();
          } catch (err) {
            toast('Không thể cập nhật mentor', { variant: 'error' });
          }
        }}
      />
    </div>
  );
}

/* "Assign mentor" modal — searches profiles to pick a new mentor. */
function AssignMentorModal({ club, onClose, onAssigned }) {
  const [search, setSearch] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState(club?.mentor_id || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!club) return;
    let cancelled = false;
    setSelected(club.mentor_id || '');
    (async () => {
      try {
        const list = await searchLeaderCandidates({ search, limit: 30 });
        if (!cancelled) setCandidates(list || []);
      } catch {
        if (!cancelled) setCandidates([]);
      }
    })();
    return () => { cancelled = true; };
  }, [club, search]);

  if (!club) return null;

  async function handleSubmit() {
    if (!selected) {
      toast('Vui lòng chọn mentor', { variant: 'error' });
      return;
    }
    setSaving(true);
    try {
      await onAssigned(club.id, selected, club.mentor_id);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="manager-clubs__modal-overlay" onClick={onClose}>
      <div className="manager-clubs__modal" onClick={(e) => e.stopPropagation()}>
        <div className="manager-clubs__modal-header">
          <h3>Gán mentor cho CLB</h3>
          <button className="manager-clubs__modal-close" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        <div className="manager-clubs__modal-body">
          <div className="manager-clubs__modal-club-row">
            {club.logo_url ? (
              <img src={club.logo_url} alt={club.name} className="manager-clubs__modal-logo" />
            ) : (
              <div className="manager-clubs__modal-logo-placeholder">
                {(club.name || 'C').charAt(0)}
              </div>
            )}
            <div>
              <div className="manager-clubs__modal-name">{club.name}</div>
              <div className="manager-clubs__modal-meta">
                {club.categories?.name || 'Chưa phân loại'} ·
                Hiện tại: <strong>{club.mentor?.full_name || 'Chưa có mentor'}</strong>
              </div>
            </div>
          </div>

          <label className="manager-clubs__field">
            <span>Tìm mentor (theo tên hoặc email)</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nhập để tìm kiếm…"
            />
          </label>

          <div className="manager-clubs__field">
            <span>Chọn profile để gán</span>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="manager-clubs__select"
            >
              <option value="">-- Chọn mentor --</option>
              {candidates.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name || u.email}
                  {u.roles?.name ? ` (${u.roles.name})` : ''}
                </option>
              ))}
            </select>
            {candidates.length === 0 && (
              <span className="manager-clubs__hint">Không tìm thấy ứng viên phù hợp.</span>
            )}
          </div>
        </div>

        <div className="manager-clubs__modal-footer">
          <Button variant="secondary" type="button" onClick={onClose}>Huỷ</Button>
          <Button type="button" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Đang lưu…' : 'Lưu'}
          </Button>
        </div>
      </div>
    </div>
  );
}
