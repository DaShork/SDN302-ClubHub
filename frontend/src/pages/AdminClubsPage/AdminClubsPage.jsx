import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, Filter, MoreVertical, Edit2, Eye, Archive, RotateCcw,
  RefreshCw, Download, X, Building2, Users as UsersIcon,
  UserCog, UserCheck, UserX, ChevronLeft, ChevronRight, Megaphone,
  MegaphoneOff, Activity, AlertCircle,
} from 'lucide-react';
import { Card, Button, Input, toast, ConfirmModal } from '@/components';
import {
  listClubs, getClubById, updateClub, changeClubLeader, changeClubMentor,
  bulkUpdateClubStatus, bulkSetRecruitment, archiveClub, activateClub,
  getClubStats, getCategories, searchLeaderCandidates, auditClubAction,
} from '@/services/adminClubsService';
import { supabase } from '@/services/supabase';
import { getAuditLog } from '@/services/adminService';
import './AdminClubsPage.css';

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
];

const STATUS_TRANSITION = {
  active:   { next: 'archived', label: 'Lưu trữ',  icon: Archive,     variant: 'danger' },
  inactive: { next: 'active',   label: 'Kích hoạt', icon: RotateCcw,   variant: 'success' },
  archived: { next: 'active',   label: 'Khôi phục', icon: RotateCcw,   variant: 'success' },
};

function StatTile({ icon: Icon, label, value, color, bgColor }) {
  return (
    <Card className="admin-clubs__stat">
      <div className="admin-clubs__stat-icon" style={{ background: bgColor }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div className="admin-clubs__stat-body">
        <span className="admin-clubs__stat-value">{value ?? '—'}</span>
        <span className="admin-clubs__stat-label">{label}</span>
      </div>
    </Card>
  );
}

function EditClubModal({ open, club, categories, onClose, onSaved }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [leaderSearch, setLeaderSearch] = useState('');
  const [mentorSearch, setMentorSearch] = useState('');
  const [leaderCandidates, setLeaderCandidates] = useState([]);
  const [mentorCandidates, setMentorCandidates] = useState([]);

  useEffect(() => {
    if (open && club) {
      setForm({
        name: club.name || '',
        description: club.description || '',
        category_id: club.category_id || '',
        contact_email: club.contact_email || '',
        facebook_url: club.facebook_url || '',
        founded_year: club.founded_year || '',
        recruitment_status: !!club.recruitment_status,
        status: club.status || 'active',
      });
    }
  }, [open, club]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const [leaders, mentors] = await Promise.all([
          searchLeaderCandidates({ search: leaderSearch, limit: 15 }),
          searchLeaderCandidates({ search: mentorSearch, limit: 15 }),
        ]);
        if (!cancelled) {
          setLeaderCandidates(leaders);
          setMentorCandidates(mentors);
        }
      } catch {/* ignore */}
    })();
    return () => { cancelled = true; };
  }, [open, leaderSearch, mentorSearch]);

  if (!open || !form) return null;

  async function handleSave() {
    if (!form.name.trim()) {
      toast('Vui lòng nhập tên CLB', { variant: 'error' });
      return;
    }
    setSaving(true);
    try {
      await updateClub(club.id, {
        name: form.name,
        description: form.description,
        category_id: form.category_id || null,
        contact_email: form.contact_email || null,
        facebook_url: form.facebook_url || null,
        founded_year: form.founded_year ? Number(form.founded_year) : null,
        recruitment_status: form.recruitment_status,
        status: form.status,
      });
      const { data: { user: current } } = await supabase.auth.getUser();
      await auditClubAction({
        actorId: current?.id,
        clubId: club.id,
        action: 'admin_edited_club',
        details: { fields_changed: Object.keys(form) },
      });
      toast('Đã cập nhật CLB');
      onSaved?.();
      onClose();
    } catch (err) {
      toast('Lỗi: ' + (err.message || 'unknown'), { variant: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleChangeLeader(newLeaderId) {
    if (!newLeaderId || newLeaderId === club.leader_id) return;
    try {
      await changeClubLeader(club.id, newLeaderId);
      const { data: { user: current } } = await supabase.auth.getUser();
      await auditClubAction({
        actorId: current?.id,
        clubId: club.id,
        action: 'admin_changed_leader',
        details: { from: club.leader_id, to: newLeaderId },
      });
      toast('Đã đổi Leader CLB');
      onSaved?.();
      onClose();
    } catch (err) {
      toast('Lỗi đổi leader: ' + (err.message || ''), { variant: 'error' });
    }
  }

  async function handleChangeMentor(newMentorId) {
    const mentorValue = newMentorId || null;
    if (mentorValue === club.mentor_id) return;
    try {
      await changeClubMentor(club.id, mentorValue);
      const { data: { user: current } } = await supabase.auth.getUser();
      await auditClubAction({
        actorId: current?.id,
        clubId: club.id,
        action: 'admin_changed_mentor',
        details: { from: club.mentor_id, to: mentorValue },
      });
      toast(mentorValue ? 'Đã gán Mentor' : 'Đã gỡ Mentor');
      onSaved?.();
      onClose();
    } catch (err) {
      toast('Lỗi đổi mentor: ' + (err.message || ''), { variant: 'error' });
    }
  }

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary-900/80 backdrop-blur-sm" onClick={onClose} />
      <div className="admin-clubs__modal">
        <div className="admin-clubs__modal-header">
          <h3 className="admin-clubs__modal-title">Chỉnh sửa CLB</h3>
          <button className="admin-clubs__modal-close" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        <div className="admin-clubs__modal-body">
          <div className="admin-clubs__modal-club-row">
            {club.logo_url ? (
              <img src={club.logo_url} alt={club.name} className="admin-clubs__modal-logo" />
            ) : (
              <div className="admin-clubs__modal-logo-placeholder">
                {(club.name || 'C').charAt(0)}
              </div>
            )}
            <div className="admin-clubs__modal-info">
              <div className="admin-clubs__modal-name">{club.name}</div>
              <div className="admin-clubs__modal-meta">
                <span>{club.categories?.name || '—'}</span>
                <span>·</span>
                <span>ID: {String(club.id).slice(0, 8)}…</span>
              </div>
            </div>
          </div>

          <div className="admin-clubs__section-title">Thông tin cơ bản</div>
          <div className="admin-clubs__form-grid">
            <label className="admin-clubs__field admin-clubs__field--full">
              <span>Tên CLB *</span>
              <Input value={form.name} onChange={(e) => update('name', e.target.value)} />
            </label>
            <label className="admin-clubs__field admin-clubs__field--full">
              <span>Mô tả</span>
              <textarea
                className="admin-clubs__textarea"
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                rows={3}
                placeholder="Mô tả ngắn về CLB…"
              />
            </label>
            <label className="admin-clubs__field">
              <span>Danh mục</span>
              <select
                className="admin-clubs__select"
                value={form.category_id}
                onChange={(e) => update('category_id', e.target.value)}
              >
                <option value="">— Chưa phân loại —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
            <label className="admin-clubs__field">
              <span>Năm thành lập</span>
              <Input
                type="number"
                value={form.founded_year}
                onChange={(e) => update('founded_year', e.target.value)}
                placeholder="2024"
              />
            </label>
            <label className="admin-clubs__field">
              <span>Email liên hệ</span>
              <Input
                type="email"
                value={form.contact_email}
                onChange={(e) => update('contact_email', e.target.value)}
              />
            </label>
            <label className="admin-clubs__field">
              <span>Facebook URL</span>
              <Input
                value={form.facebook_url}
                onChange={(e) => update('facebook_url', e.target.value)}
              />
            </label>
            <label className="admin-clubs__field">
              <span>Trạng thái</span>
              <select
                className="admin-clubs__select"
                value={form.status}
                onChange={(e) => update('status', e.target.value)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <label className="admin-clubs__field admin-clubs__field--toggle">
              <input
                type="checkbox"
                checked={form.recruitment_status}
                onChange={(e) => update('recruitment_status', e.target.checked)}
              />
              <span>Đang mở tuyển thành viên</span>
            </label>
          </div>

          <div className="admin-clubs__section-title">Leader & Mentor</div>
          <div className="admin-clubs__form-grid">
            <label className="admin-clubs__field admin-clubs__field--full">
              <span>Leader hiện tại</span>
              <input
                className="admin-clubs__input-readonly"
                value={club.leader?.full_name || club.leader?.email || '—'}
                readOnly
              />
            </label>
            <label className="admin-clubs__field admin-clubs__field--full">
              <span>Đổi Leader (tìm theo tên/email)</span>
              <input
                className="admin-clubs__select"
                placeholder="Tìm kiếm…"
                value={leaderSearch}
                onChange={(e) => setLeaderSearch(e.target.value)}
              />
              <select
                className="admin-clubs__select"
                value=""
                onChange={(e) => handleChangeLeader(e.target.value)}
              >
                <option value="">-- Chọn user để gán làm Leader --</option>
                {leaderCandidates
                  .filter((u) => u.id !== club.leader_id)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name || u.email} {u.role_name ? `(${u.role_name})` : ''}
                    </option>
                  ))}
              </select>
            </label>
            <label className="admin-clubs__field admin-clubs__field--full">
              <span>Mentor hiện tại</span>
              <input
                className="admin-clubs__input-readonly"
                value={club.mentor?.full_name || club.mentor?.email || '— Chưa có —'}
                readOnly
              />
            </label>
            <label className="admin-clubs__field admin-clubs__field--full">
              <span>Đổi Mentor</span>
              <input
                className="admin-clubs__select"
                placeholder="Tìm kiếm…"
                value={mentorSearch}
                onChange={(e) => setMentorSearch(e.target.value)}
              />
              <select
                className="admin-clubs__select"
                value=""
                onChange={(e) => handleChangeMentor(e.target.value)}
              >
                <option value="">-- Chọn user để gán làm Mentor --</option>
                {mentorCandidates
                  .filter((u) => u.id !== club.mentor_id)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name || u.email} {u.role_name ? `(${u.role_name})` : ''}
                    </option>
                  ))}
              </select>
            </label>
          </div>
        </div>

        <div className="admin-clubs__modal-footer">
          <Button variant="ghost" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ClubDetailDrawer({ club, categories, onClose, onEdit }) {
  if (!club) return null;
  return (
    <div className="admin-clubs__drawer-backdrop" onClick={onClose}>
      <aside className="admin-clubs__drawer" onClick={(e) => e.stopPropagation()}>
        <div className="admin-clubs__drawer-header">
          <h3>Chi tiết CLB</h3>
          <button onClick={onClose} aria-label="Đóng"><X size={18} /></button>
        </div>
        <div className="admin-clubs__drawer-body">
          <div className="admin-clubs__drawer-hero">
            {club.banner_url ? (
              <img src={club.banner_url} alt="" className="admin-clubs__drawer-banner" />
            ) : (
              <div className="admin-clubs__drawer-banner-placeholder">
                <Building2 size={32} />
              </div>
            )}
            <div className="admin-clubs__drawer-club-row">
              {club.logo_url ? (
                <img src={club.logo_url} alt="" className="admin-clubs__modal-logo" />
              ) : (
                <div className="admin-clubs__modal-logo-placeholder">
                  {(club.name || 'C').charAt(0)}
                </div>
              )}
              <div className="admin-clubs__modal-info">
                <div className="admin-clubs__modal-name">{club.name}</div>
                <div className="admin-clubs__modal-meta">
                  <span>{club.categories?.name || '—'}</span>
                  {club.founded_year && <><span>·</span><span>{club.founded_year}</span></>}
                </div>
              </div>
            </div>
          </div>

          <div className="admin-clubs__drawer-stats">
            <div>
              <strong>{club.member_count ?? 0}</strong>
              <span>Thành viên</span>
            </div>
            <div>
              <strong>{club.recruitment_status ? 'Mở' : 'Đóng'}</strong>
              <span>Tuyển</span>
            </div>
            <div>
              <strong>{club.status}</strong>
              <span>Trạng thái</span>
            </div>
          </div>

          {club.description && (
            <div className="admin-clubs__drawer-section">
              <h4>Mô tả</h4>
              <p>{club.description}</p>
            </div>
          )}

          <div className="admin-clubs__drawer-section">
            <h4>Leader & Mentor</h4>
            <div className="admin-clubs__people-row">
              <div>
                <strong>Leader:</strong>{' '}
                {club.leader?.full_name || club.leader?.email || '—'}
              </div>
              <div>
                <strong>Mentor:</strong>{' '}
                {club.mentor?.full_name || club.mentor?.email || '— Chưa có —'}
              </div>
            </div>
          </div>

          {(club.contact_email || club.facebook_url) && (
            <div className="admin-clubs__drawer-section">
              <h4>Liên hệ</h4>
              <div className="admin-clubs__people-row">
                {club.contact_email && <div><strong>Email:</strong> {club.contact_email}</div>}
                {club.facebook_url && (
                  <div>
                    <strong>Facebook:</strong>{' '}
                    <a href={club.facebook_url} target="_blank" rel="noopener noreferrer">
                      {club.facebook_url}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="admin-clubs__drawer-footer">
          <Button variant="ghost" onClick={onClose}>Đóng</Button>
          <Button onClick={onEdit}><Edit2 size={14} /> Chỉnh sửa</Button>
        </div>
      </aside>
    </div>
  );
}

function ActionMenu({ club, onEdit, onArchive, onActivate, onClose }) {
  return (
    <div className="admin-clubs__action-menu" onMouseLeave={onClose}>
      <button onClick={() => { onEdit(club); onClose(); }}>
        <Edit2 size={14} /> Chỉnh sửa
      </button>
      {club.status === 'archived' ? (
        <button onClick={() => { onActivate(club); onClose(); }} className="admin-clubs__menu-success">
          <RotateCcw size={14} /> Khôi phục
        </button>
      ) : (
        <button onClick={() => { onArchive(club); onClose(); }} className="admin-clubs__menu-danger">
          <Archive size={14} /> Lưu trữ
        </button>
      )}
    </div>
  );
}

export default function AdminClubsPage() {
  const [clubs, setClubs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRecruit, setFilterRecruit] = useState('');
  const [page, setPage] = useState(1);

  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({});
  const [auditEntries, setAuditEntries] = useState([]);

  const [editingClub, setEditingClub] = useState(null);
  const [drawerClub, setDrawerClub] = useState(null);
  const [actionMenu, setActionMenu] = useState(null);
  const [pendingArchive, setPendingArchive] = useState(null);
  const [pendingBulk, setPendingBulk] = useState(null);

  const [selected, setSelected] = useState(new Set());

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ rows, count }, cats, clubStats, audit] = await Promise.all([
        listClubs({
          page, pageSize: PAGE_SIZE,
          search, categoryId: filterCategoryId,
          status: filterStatus, recruitmentStatus: filterRecruit,
        }),
        getCategories(),
        getClubStats(),
        getAuditLog({ limit: 12 }),
      ]);
      setClubs(rows);
      setTotalCount(count);
      setCategories(cats);
      setStats(clubStats);
      setAuditEntries(audit);
    } catch (err) {
      console.error('loadClubs failed', err);
      toast('Không thể tải danh sách CLB: ' + (err.message || ''), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, search, filterCategoryId, filterStatus, filterRecruit]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { setSelected(new Set()); }, [page, search, filterCategoryId, filterStatus, filterRecruit]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const allOnPageSelected = useMemo(
    () => clubs.length > 0 && clubs.every((c) => selected.has(c.id)),
    [clubs, selected]
  );

  function toggleAll() {
    if (allOnPageSelected) {
      const next = new Set(selected);
      clubs.forEach((c) => next.delete(c.id));
      setSelected(next);
    } else {
      const next = new Set(selected);
      clubs.forEach((c) => next.add(c.id));
      setSelected(next);
    }
  }

  function toggleOne(id) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  }

  async function handleSaved() {
    await loadData();
    if (drawerClub) {
      const fresh = await getClubById(drawerClub.id);
      if (fresh) setDrawerClub(fresh);
    }
  }

  async function confirmArchive() {
    if (!pendingArchive) return;
    try {
      await archiveClub(pendingArchive.id);
      const { data: { user: current } } = await supabase.auth.getUser();
      await auditClubAction({
        actorId: current?.id,
        clubId: pendingArchive.id,
        action: 'admin_archived_club',
        details: { name: pendingArchive.name },
      });
      toast(`Đã lưu trữ CLB: ${pendingArchive.name}`);
      setPendingArchive(null);
      loadData();
    } catch (err) {
      toast('Lỗi: ' + (err.message || ''), { variant: 'error' });
    }
  }

  async function handleActivate(club) {
    try {
      await activateClub(club.id);
      const { data: { user: current } } = await supabase.auth.getUser();
      await auditClubAction({
        actorId: current?.id,
        clubId: club.id,
        action: 'admin_activated_club',
        details: { name: club.name },
      });
      toast(`Đã khôi phục: ${club.name}`);
      loadData();
    } catch (err) {
      toast('Lỗi: ' + (err.message || ''), { variant: 'error' });
    }
  }

  async function confirmBulk() {
    if (!pendingBulk || selected.size === 0) return;
    try {
      const ids = [...selected];
      let count = 0;
      if (pendingBulk.type === 'status') {
        count = await bulkUpdateClubStatus(ids, pendingBulk.value);
        if (pendingBulk.value === 'archived') {
          await bulkSetRecruitment(ids, false);
        }
      } else if (pendingBulk.type === 'recruit') {
        count = await bulkSetRecruitment(ids, pendingBulk.value === 'open');
      }
      const { data: { user: current } } = await supabase.auth.getUser();
      await auditClubAction({
        actorId: current?.id,
        action: `admin_bulk_${pendingBulk.type}`,
        details: { count, ...pendingBulk },
      });
      toast(`Đã áp dụng cho ${count} CLB`);
      setPendingBulk(null);
      setSelected(new Set());
      loadData();
    } catch (err) {
      toast('Lỗi bulk: ' + (err.message || ''), { variant: 'error' });
    }
  }

  function exportCsv() {
    if (!clubs.length) return;
    const headers = ['id', 'name', 'category', 'leader_email', 'mentor_email', 'member_count', 'recruitment_status', 'status', 'created_at'];
    const csv = [
      headers.join(','),
      ...clubs.map((c) => [
        c.id, c.name,
        c.categories?.name,
        c.leader?.email, c.mentor?.email,
        c.member_count, c.recruitment_status, c.status, c.created_at,
      ].map((v) => `"${(v ?? '').toString().replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clubhub-clubs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="admin-clubs">
      <div className="admin-clubs__container">
        <div className="admin-clubs__header">
          <div>
            <h1 className="admin-clubs__title">Quản lý CLB</h1>
            <p className="admin-clubs__subtitle">
              Quản lý toàn bộ câu lạc bộ trong hệ thống — {totalCount} CLB
            </p>
          </div>
          <div className="admin-clubs__header-actions">
            <Button variant="ghost" onClick={loadData}>
              <RefreshCw size={16} /> Refresh
            </Button>
            <Button variant="ghost" onClick={exportCsv} disabled={!clubs.length}>
              <Download size={16} /> Xuất CSV
            </Button>
          </div>
        </div>

        <div className="admin-clubs__stats-grid">
          <StatTile icon={Building2} label="Tổng CLB" value={stats.total} color="#3B82F6" bgColor="rgba(59,130,246,0.12)" />
          <StatTile icon={UserCheck} label="Active" value={stats.active} color="#22C55E" bgColor="rgba(34,197,94,0.12)" />
          <StatTile icon={UserX} label="Inactive" value={stats.inactive} color="#F59E0B" bgColor="rgba(245,158,11,0.12)" />
          <StatTile icon={Archive} label="Archived" value={stats.archived} color="#6B7280" bgColor="rgba(107,114,128,0.12)" />
          <StatTile icon={Megaphone} label="Đang tuyển" value={stats.recruiting} color="#8B5CF6" bgColor="rgba(139,92,246,0.12)" />
        </div>

        <Card className="admin-clubs__filters">
          <div className="admin-clubs__search">
            <Search size={18} className="admin-clubs__search-icon" />
            <input
              type="text"
              placeholder="Tìm theo tên CLB, mô tả, email liên hệ..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              onKeyDown={(e) => e.key === 'Enter' && loadData()}
              className="admin-clubs__search-input"
            />
          </div>

          <div className="admin-clubs__filter-group">
            <select
              value={filterCategoryId}
              onChange={(e) => { setFilterCategoryId(e.target.value); setPage(1); }}
              className="admin-clubs__select"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              className="admin-clubs__select"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <select
              value={filterRecruit}
              onChange={(e) => { setFilterRecruit(e.target.value); setPage(1); }}
              className="admin-clubs__select"
            >
              <option value="">Tất cả tuyển</option>
              <option value="open">Đang tuyển</option>
              <option value="closed">Đã đóng tuyển</option>
            </select>

            <Button variant="ghost" onClick={loadData}>
              <Filter size={14} /> Lọc
            </Button>
          </div>
        </Card>

        {selected.size > 0 && (
          <div className="admin-clubs__bulk-bar">
            <span><strong>{selected.size}</strong> CLB đã chọn</span>
            <div className="admin-clubs__bulk-actions">
              <Button variant="ghost" onClick={() => setPendingBulk({ type: 'status', value: 'active' })}>
                <UserCheck size={14} /> Active
              </Button>
              <Button variant="ghost" onClick={() => setPendingBulk({ type: 'status', value: 'inactive' })}>
                <UserX size={14} /> Inactive
              </Button>
              <Button variant="ghost" onClick={() => setPendingBulk({ type: 'status', value: 'archived' })}>
                <Archive size={14} /> Archive
              </Button>
              <Button variant="ghost" onClick={() => setPendingBulk({ type: 'recruit', value: 'open' })}>
                <Megaphone size={14} /> Mở tuyển
              </Button>
              <Button variant="ghost" onClick={() => setPendingBulk({ type: 'recruit', value: 'closed' })}>
                <MegaphoneOff size={14} /> Đóng tuyển
              </Button>
              <Button variant="ghost" onClick={() => setSelected(new Set())}>
                <X size={14} /> Bỏ chọn
              </Button>
            </div>
          </div>
        )}

        <Card className="admin-clubs__table-card">
          {loading ? (
            <div className="admin-clubs__loading">Đang tải...</div>
          ) : clubs.length === 0 ? (
            <div className="admin-clubs__empty">Không tìm thấy CLB nào</div>
          ) : (
            <>
              <table className="admin-clubs__table">
                <thead>
                  <tr>
                    <th className="admin-clubs__checkbox-col">
                      <input
                        type="checkbox"
                        checked={allOnPageSelected}
                        onChange={toggleAll}
                        aria-label="Chọn tất cả"
                      />
                    </th>
                    <th>CLB</th>
                    <th>Danh mục</th>
                    <th>Leader / Mentor</th>
                    <th>Thành viên</th>
                    <th>Trạng thái</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {clubs.map((club) => (
                    <tr
                      key={club.id}
                      className={`${selected.has(club.id) ? 'admin-clubs__row--selected' : ''} ${club.status === 'archived' ? 'admin-clubs__row--archived' : ''}`}
                    >
                      <td className="admin-clubs__checkbox-col">
                        <input
                          type="checkbox"
                          checked={selected.has(club.id)}
                          onChange={() => toggleOne(club.id)}
                          aria-label={`Chọn ${club.name}`}
                        />
                      </td>
                      <td>
                        <button
                          className="admin-clubs__club-cell"
                          onClick={() => setDrawerClub(club)}
                        >
                          {club.logo_url ? (
                            <img src={club.logo_url} alt={club.name} className="admin-clubs__logo" />
                          ) : (
                            <div className="admin-clubs__logo-placeholder">
                              {(club.name || 'C').charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="admin-clubs__club-name">{club.name}</p>
                            <p className="admin-clubs__club-email">{club.contact_email || '—'}</p>
                          </div>
                        </button>
                      </td>
                      <td>
                        <span className="admin-clubs__category-badge">
                          {club.categories?.name || '—'}
                        </span>
                      </td>
                      <td>
                        <div className="admin-clubs__people">
                          <div className="admin-clubs__person">
                            <UserCog size={12} />
                            <span>{club.leader?.full_name || club.leader?.email || '—'}</span>
                          </div>
                          <div className="admin-clubs__person admin-clubs__person--muted">
                            <UsersIcon size={12} />
                            <span>{club.mentor?.full_name || club.mentor?.email || 'Chưa có'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="admin-clubs__member-count">
                          <UsersIcon size={12} /> {club.member_count ?? 0}
                        </span>
                        {club.recruitment_status && (
                          <span className="admin-clubs__recruit-badge">
                            <Megaphone size={10} /> Tuyển
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`admin-clubs__status admin-clubs__status--${club.status}`}>
                          {club.status}
                        </span>
                      </td>
                      <td>
                        <div className="admin-clubs__actions">
                          <button
                            className="admin-clubs__action-btn"
                            onClick={() => setActionMenu(actionMenu === club.id ? null : club.id)}
                            aria-label="Hành động"
                          >
                            <MoreVertical size={18} />
                          </button>
                          {actionMenu === club.id && (
                            <ActionMenu
                              club={club}
                              onEdit={(c) => setEditingClub(c)}
                              onArchive={(c) => setPendingArchive(c)}
                              onActivate={handleActivate}
                              onClose={() => setActionMenu(null)}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="admin-clubs__pagination">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="admin-clubs__page-btn"
                  >
                    <ChevronLeft size={14} /> Trước
                  </button>
                  <span className="admin-clubs__page-info">
                    Trang {page} / {totalPages} ({totalCount} CLB)
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="admin-clubs__page-btn"
                  >
                    Sau <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </>
          )}
        </Card>

        {auditEntries.length > 0 && (
          <Card className="admin-clubs__audit">
            <div className="admin-clubs__audit-header">
              <h3 className="admin-clubs__audit-title">
                <Activity size={18} /> Nhật ký hoạt động (CLB)
              </h3>
              <span className="admin-clubs__audit-hint">
                <AlertCircle size={12} /> {auditEntries.length} hoạt động gần nhất
              </span>
            </div>
            <ul className="admin-clubs__audit-list">
              {auditEntries.map((entry) => (
                <li key={entry.id} className="admin-clubs__audit-item">
                  <span className={`admin-clubs__audit-action admin-clubs__audit-action--${entry.action}`}>
                    {entry.action}
                  </span>
                  <span className="admin-clubs__audit-target">
                    {entry.target_table}
                    {entry.target_id ? `/${String(entry.target_id).slice(0, 8)}…` : ''}
                  </span>
                  <span className="admin-clubs__audit-time">
                    {new Date(entry.created_at).toLocaleString('vi-VN')}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      {editingClub && (
        <EditClubModal
          open={!!editingClub}
          club={editingClub}
          categories={categories}
          onClose={() => setEditingClub(null)}
          onSaved={handleSaved}
        />
      )}

      <ClubDetailDrawer
        club={drawerClub}
        categories={categories}
        onClose={() => setDrawerClub(null)}
        onEdit={() => {
          setEditingClub(drawerClub);
          setDrawerClub(null);
        }}
      />

      <ConfirmModal
        open={!!pendingArchive}
        title="Lưu trữ CLB?"
        description={pendingArchive ? `CLB "${pendingArchive.name}" sẽ bị ẩn khỏi danh sách công khai và đóng tuyển. Có thể khôi phục sau.` : ''}
        confirmLabel="Lưu trữ"
        variant="danger"
        onCancel={() => setPendingArchive(null)}
        onConfirm={confirmArchive}
      />

      <ConfirmModal
        open={!!pendingBulk}
        title="Xác nhận hành động hàng loạt"
        description={
          pendingBulk
            ? pendingBulk.type === 'status'
              ? `Đổi trạng thái ${selected.size} CLB → "${pendingBulk.value}"`
              : `${pendingBulk.value === 'open' ? 'Mở' : 'Đóng'} tuyển cho ${selected.size} CLB`
            : ''
        }
        confirmLabel="Áp dụng"
        variant={pendingBulk?.value === 'archived' ? 'danger' : 'primary'}
        onCancel={() => setPendingBulk(null)}
        onConfirm={confirmBulk}
      />
    </div>
  );
}