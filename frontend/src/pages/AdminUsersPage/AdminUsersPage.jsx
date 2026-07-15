import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, Filter, MoreVertical, UserCheck, UserX, Mail, Edit2, Trash2,
  RefreshCw, Download, X, Users, UserCheck as ActiveIcon,
  UserX as BannedIcon, ShieldOff, ChevronLeft, ChevronRight, Eye,
  Activity, AlertCircle,
} from 'lucide-react';
import { Card, Button, Input, toast, ConfirmModal } from '@/components';
import {
  listUsers, getUserById, updateUser, softDeleteUser, bulkUpdateUserStatus,
  listRoles, getUserStats, getAuditLog, writeAuditLog,
} from '@/services/adminService';
import { ROLES, ROLE_META } from '@/auth/rolePermissions.js';
import { supabase } from '@/services/supabase';
import './AdminUsersPage.css';

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'banned', label: 'Banned' },
  { value: 'deleted', label: 'Deleted' },
];

const STATUS_TRANSITION = {
  active:   { next: 'banned',   label: 'Khóa tài khoản', icon: UserX,        variant: 'danger' },
  inactive: { next: 'active',    label: 'Kích hoạt',      icon: UserCheck,    variant: 'success' },
  banned:   { next: 'active',    label: 'Mở khóa',        icon: UserCheck,    variant: 'success' },
  deleted:  { next: 'inactive',  label: 'Khôi phục',      icon: UserCheck,    variant: 'success' },
};

function StatTile({ icon: Icon, label, value, color, bgColor }) {
  return (
    <Card className="admin-users__stat">
      <div className="admin-users__stat-icon" style={{ background: bgColor }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div className="admin-users__stat-body">
        <span className="admin-users__stat-value">{value ?? '—'}</span>
        <span className="admin-users__stat-label">{label}</span>
      </div>
    </Card>
  );
}

function EditUserModal({ open, user, roles, onClose, onSaved }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && user) {
      setForm({
        full_name: user.full_name || '',
        student_code: user.student_code || '',
        email: user.email || '',
        phone: user.phone || '',
        faculty: user.faculty || '',
        major: user.major || '',
        status: user.status || 'active',
        role_id: user.role_id || '',
      });
    }
  }, [open, user]);

  if (!open || !form) return null;

  async function handleSave() {
    if (!form.full_name.trim()) {
      toast('Vui lòng nhập họ tên', { variant: 'error' });
      return;
    }
    setSaving(true);
    try {
      await updateUser(user.id, form);
      const { data: { user: current } } = await supabase.auth.getUser();
      await writeAuditLog({
        action: 'admin_edited_user',
        targetId: user.id,
        targetTable: 'profiles',
        actorId: current?.id,
        details: { fields_changed: Object.keys(form) },
      });
      toast('Cập nhật người dùng thành công');
      onSaved?.();
      onClose();
    } catch (err) {
      toast('Lỗi khi cập nhật: ' + (err.message || 'unknown'), { variant: 'error' });
    } finally {
      setSaving(false);
    }
  }

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary-900/80 backdrop-blur-sm" onClick={onClose} />
      <div className="admin-users__modal relative z-10">
        <div className="admin-users__modal-header">
          <h3 className="admin-users__modal-title">Chỉnh sửa người dùng</h3>
          <button className="admin-users__modal-close" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        <div className="admin-users__modal-body">
          <div className="admin-users__modal-avatar-row">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name} className="admin-users__modal-avatar" />
            ) : (
              <div className="admin-users__modal-avatar-placeholder">
                {(user.full_name || 'U').charAt(0)}
              </div>
            )}
            <div>
              <div className="admin-users__modal-name">{user.full_name || '—'}</div>
              <div className="admin-users__modal-email">{user.email}</div>
              <div className="admin-users__modal-id">ID: {user.id}</div>
            </div>
          </div>

          <div className="admin-users__form-grid">
            <label className="admin-users__field">
              <span>Họ tên *</span>
              <Input value={form.full_name} onChange={(e) => update('full_name', e.target.value)} />
            </label>
            <label className="admin-users__field">
              <span>Email</span>
              <Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
            </label>
            <label className="admin-users__field">
              <span>Mã sinh viên</span>
              <Input value={form.student_code} onChange={(e) => update('student_code', e.target.value)} />
            </label>
            <label className="admin-users__field">
              <span>Số điện thoại</span>
              <Input value={form.phone} onChange={(e) => update('phone', e.target.value)} />
            </label>
            <label className="admin-users__field">
              <span>Khoa</span>
              <Input value={form.faculty} onChange={(e) => update('faculty', e.target.value)} />
            </label>
            <label className="admin-users__field">
              <span>Chuyên ngành</span>
              <Input value={form.major} onChange={(e) => update('major', e.target.value)} />
            </label>
            <label className="admin-users__field">
              <span>Vai trò</span>
              <select
                className="admin-users__select admin-users__select--block"
                value={form.role_id}
                onChange={(e) => update('role_id', e.target.value)}
              >
                <option value="">— Không có —</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {ROLE_META[r.name]?.label || r.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-users__field">
              <span>Trạng thái</span>
              <select
                className="admin-users__select admin-users__select--block"
                value={form.status}
                onChange={(e) => update('status', e.target.value)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="banned">Banned</option>
                <option value="deleted">Deleted</option>
              </select>
            </label>
          </div>
        </div>

        <div className="admin-users__modal-footer">
          <Button variant="ghost" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function UserDetailDrawer({ user, roles, onClose, onEdit }) {
  if (!user) return null;
  const roleMeta = ROLE_META[user.role_name] || { label: user.role_name || '—', color: '#6B7280' };
  return (
    <div className="admin-users__drawer-backdrop" onClick={onClose}>
      <aside className="admin-users__drawer" onClick={(e) => e.stopPropagation()}>
        <div className="admin-users__drawer-header">
          <h3>Chi tiết người dùng</h3>
          <button onClick={onClose} aria-label="Đóng"><X size={18} /></button>
        </div>
        <div className="admin-users__drawer-body">
          <div className="admin-users__drawer-avatar-row">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="admin-users__modal-avatar" />
            ) : (
              <div className="admin-users__modal-avatar-placeholder">
                {(user.full_name || 'U').charAt(0)}
              </div>
            )}
            <div>
              <div className="admin-users__modal-name">{user.full_name || '—'}</div>
              <div className="admin-users__modal-email">{user.email}</div>
            </div>
          </div>

          <div className="admin-users__drawer-grid">
            <div><strong>Mã SV:</strong> {user.student_code || '—'}</div>
            <div><strong>SĐT:</strong> {user.phone || '—'}</div>
            <div><strong>Khoa:</strong> {user.faculty || '—'}</div>
            <div><strong>Ngành:</strong> {user.major || '—'}</div>
            <div>
              <strong>Vai trò:</strong>{' '}
              <span className="admin-users__role-badge" style={{ background: `${roleMeta.color}20`, color: roleMeta.color }}>
                {roleMeta.label}
              </span>
            </div>
            <div>
              <strong>Trạng thái:</strong>{' '}
              <span className={`admin-users__status admin-users__status--${user.status}`}>{user.status}</span>
            </div>
            <div><strong>Ngày tạo:</strong> {user.created_at ? new Date(user.created_at).toLocaleString('vi-VN') : '—'}</div>
            <div><strong>Cập nhật:</strong> {user.updated_at ? new Date(user.updated_at).toLocaleString('vi-VN') : '—'}</div>
          </div>
        </div>
        <div className="admin-users__drawer-footer">
          <Button variant="ghost" onClick={onClose}>Đóng</Button>
          <Button onClick={onEdit}><Edit2 size={14} /> Chỉnh sửa</Button>
        </div>
      </aside>
    </div>
  );
}

function ActionMenu({ user, onEdit, onDelete, onChangeStatus, onViewDetail, onClose }) {
  const transition = STATUS_TRANSITION[user.status] || STATUS_TRANSITION.active;
  const Icon = transition.icon;
  return (
    <div className="admin-users__action-menu" onMouseLeave={onClose}>
      <button onClick={() => { onViewDetail(user); onClose(); }}>
        <Eye size={14} /> Xem chi tiết
      </button>
      <button onClick={() => { onEdit(user); onClose(); }}>
        <Edit2 size={14} /> Chỉnh sửa
      </button>
      <button
        onClick={() => { onChangeStatus(user, transition.next); onClose(); }}
        className={transition.variant === 'danger' ? 'admin-users__menu-danger' : ''}
      >
        <Icon size={14} /> {transition.label}
      </button>
      {user.status !== 'deleted' && (
        <button
          onClick={() => { onDelete(user); onClose(); }}
          className="admin-users__menu-danger"
        >
          <Trash2 size={14} /> Xóa (soft)
        </button>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [filterRoleId, setFilterRoleId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);

  const [roles, setRoles] = useState([]);
  const [stats, setStats] = useState({});
  const [auditEntries, setAuditEntries] = useState([]);

  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [drawerUser, setDrawerUser] = useState(null);
  const [actionMenu, setActionMenu] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [pendingStatus, setPendingStatus] = useState(null);

  const [selected, setSelected] = useState(new Set());
  const [bulkConfirm, setBulkConfirm] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ rows, count }, roleList, userStats, audit] = await Promise.all([
        listUsers({ page, pageSize: PAGE_SIZE, search, roleId: filterRoleId, status: filterStatus }),
        listRoles(),
        getUserStats(),
        getAuditLog({ limit: 15 }),
      ]);
      setUsers(rows);
      setTotalCount(count);
      setRoles(roleList);
      setStats(userStats);
      setAuditEntries(audit);
    } catch (err) {
      console.error('loadUsers failed', err);
      toast('Không thể tải danh sách người dùng: ' + (err.message || ''), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, search, filterRoleId, filterStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setSelected(new Set());
  }, [page, search, filterRoleId, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const allOnPageSelected = useMemo(
    () => users.length > 0 && users.every((u) => selected.has(u.id)),
    [users, selected]
  );

  function toggleAll() {
    if (allOnPageSelected) {
      const next = new Set(selected);
      users.forEach((u) => next.delete(u.id));
      setSelected(next);
    } else {
      const next = new Set(selected);
      users.forEach((u) => next.add(u.id));
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
    if (drawerUser) {
      const fresh = await getUserById(drawerUser.id);
      if (fresh) setDrawerUser(fresh);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await softDeleteUser(pendingDelete.id);
      const { data: { user: current } } = await supabase.auth.getUser();
      await writeAuditLog({
        action: 'admin_soft_deleted_user',
        targetId: pendingDelete.id,
        targetTable: 'profiles',
        actorId: current?.id,
        details: { email: pendingDelete.email },
      });
      toast(`Đã xóa người dùng: ${pendingDelete.email}`, { variant: 'success' });
      setPendingDelete(null);
      loadData();
    } catch (err) {
      toast('Lỗi khi xóa: ' + (err.message || ''), { variant: 'error' });
    }
  }

  async function confirmStatusChange() {
    if (!pendingStatus) return;
    try {
      await updateUser(pendingStatus.user.id, { status: pendingStatus.newStatus });
      const { data: { user: current } } = await supabase.auth.getUser();
      await writeAuditLog({
        action: 'admin_status_changed',
        targetId: pendingStatus.user.id,
        targetTable: 'profiles',
        actorId: current?.id,
        details: { from: pendingStatus.user.status, to: pendingStatus.newStatus },
      });
      toast('Đã cập nhật trạng thái');
      setPendingStatus(null);
      loadData();
    } catch (err) {
      toast('Lỗi: ' + (err.message || ''), { variant: 'error' });
    }
  }

  async function confirmBulk() {
    if (!bulkConfirm || selected.size === 0) return;
    try {
      await bulkUpdateUserStatus([...selected], bulkConfirm.status);
      const { data: { user: current } } = await supabase.auth.getUser();
      await writeAuditLog({
        action: 'admin_bulk_status',
        targetTable: 'profiles',
        actorId: current?.id,
        details: { count: selected.size, status: bulkConfirm.status },
      });
      toast(`Đã cập nhật ${selected.size} người dùng → ${bulkConfirm.status}`);
      setBulkConfirm(null);
      setSelected(new Set());
      loadData();
    } catch (err) {
      toast('Lỗi bulk: ' + (err.message || ''), { variant: 'error' });
    }
  }

  function exportCsv() {
    if (!users.length) return;
    const headers = ['id', 'email', 'full_name', 'student_code', 'phone', 'faculty', 'major', 'role', 'status', 'created_at'];
    const csv = [
      headers.join(','),
      ...users.map((u) =>
        [
          u.id,
          u.email,
          u.full_name,
          u.student_code,
          u.phone,
          u.faculty,
          u.major,
          u.role_name,
          u.status,
          u.created_at,
        ].map((v) => `"${(v ?? '').toString().replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clubhub-users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const allRolesForFilter = roles.length
    ? roles
    : Object.values(ROLES).map((name) => ({ id: name, name }));

  return (
    <div className="admin-users">
      <div className="admin-users__container">
        <div className="admin-users__header">
          <div>
            <h1 className="admin-users__title">Quản lý Users</h1>
            <p className="admin-users__subtitle">
              Quản lý tài khoản và phân quyền người dùng — {totalCount} users
            </p>
          </div>
          <div className="admin-users__header-actions">
            <Button variant="ghost" onClick={loadData}>
              <RefreshCw size={16} /> Refresh
            </Button>
            <Button variant="ghost" onClick={exportCsv} disabled={!users.length}>
              <Download size={16} /> Xuất CSV
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="admin-users__stats-grid">
          <StatTile icon={Users} label="Tổng users" value={stats.total} color="#3B82F6" bgColor="#EFF6FF" />
          <StatTile icon={ActiveIcon} label="Active" value={stats.active} color="#22C55E" bgColor="#F0FDF4" />
          <StatTile icon={ShieldOff} label="Inactive" value={stats.inactive} color="#F59E0B" bgColor="#FFFBEB" />
          <StatTile icon={BannedIcon} label="Banned" value={stats.banned} color="#EF4444" bgColor="#FEF2F2" />
          <StatTile icon={Trash2} label="Deleted" value={stats.deleted} color="#6B7280" bgColor="#F3F4F6" />
          <StatTile icon={Activity} label="Có role" value={stats.withRole} color="#8B5CF6" bgColor="#F5F3FF" />
        </div>

        {/* Filters */}
        <Card className="admin-users__filters">
          <div className="admin-users__search">
            <Search size={18} className="admin-users__search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email, mã sinh viên..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              onKeyDown={(e) => e.key === 'Enter' && loadData()}
              className="admin-users__search-input"
            />
          </div>

          <div className="admin-users__filter-group">
            <select
              value={filterRoleId}
              onChange={(e) => { setFilterRoleId(e.target.value); setPage(1); }}
              className="admin-users__select"
            >
              <option value="">Tất cả vai trò</option>
              {allRolesForFilter.map((r) => (
                <option key={r.id} value={r.id}>
                  {ROLE_META[r.name]?.label || r.name}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              className="admin-users__select"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <Button variant="ghost" onClick={loadData}>
              <Filter size={14} /> Lọc
            </Button>
          </div>
        </Card>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div className="admin-users__bulk-bar">
            <span>
              <strong>{selected.size}</strong> người dùng đã chọn
            </span>
            <div className="admin-users__bulk-actions">
              <Button variant="ghost" onClick={() => setBulkConfirm({ status: 'active' })}>
                <ActiveIcon size={14} /> Active
              </Button>
              <Button variant="ghost" onClick={() => setBulkConfirm({ status: 'inactive' })}>
                <ShieldOff size={14} /> Inactive
              </Button>
              <Button variant="ghost" onClick={() => setBulkConfirm({ status: 'banned' })}>
                <BannedIcon size={14} /> Ban
              </Button>
              <Button variant="ghost" onClick={() => setSelected(new Set())}>
                <X size={14} /> Bỏ chọn
              </Button>
            </div>
          </div>
        )}

        {/* Table */}
        <Card className="admin-users__table-card">
          {loading ? (
            <div className="admin-users__loading">Đang tải...</div>
          ) : users.length === 0 ? (
            <div className="admin-users__empty">Không tìm thấy người dùng nào</div>
          ) : (
            <>
              <table className="admin-users__table">
                <thead>
                  <tr>
                    <th className="admin-users__checkbox-col">
                      <input
                        type="checkbox"
                        checked={allOnPageSelected}
                        onChange={toggleAll}
                        aria-label="Chọn tất cả"
                      />
                    </th>
                    <th>Người dùng</th>
                    <th>Vai trò</th>
                    <th>Trạng thái</th>
                    <th>Ngày tạo</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const roleMeta = ROLE_META[user.role_name] || { label: user.role_name || '—', color: '#6B7280' };
                    return (
                      <tr key={user.id} className={selected.has(user.id) ? 'admin-users__row--selected' : ''}>
                        <td className="admin-users__checkbox-col">
                          <input
                            type="checkbox"
                            checked={selected.has(user.id)}
                            onChange={() => toggleOne(user.id)}
                            aria-label={`Chọn ${user.full_name || user.email}`}
                          />
                        </td>
                        <td>
                          <button
                            className="admin-users__user-cell"
                            onClick={() => setDrawerUser(user)}
                          >
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt={user.full_name} className="admin-users__avatar" />
                            ) : (
                              <div className="admin-users__avatar-placeholder">
                                {(user.full_name || 'U').charAt(0)}
                              </div>
                            )}
                            <div>
                              <p className="admin-users__user-name">{user.full_name || '—'}</p>
                              <p className="admin-users__user-email">{user.email}</p>
                            </div>
                          </button>
                        </td>
                        <td>
                          <span
                            className="admin-users__role-badge"
                            style={{ background: `${roleMeta.color}20`, color: roleMeta.color }}
                          >
                            {roleMeta.label}
                          </span>
                        </td>
                        <td>
                          <span className={`admin-users__status admin-users__status--${user.status}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="admin-users__date">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : '—'}
                        </td>
                        <td>
                          <div className="admin-users__actions">
                            <button
                              className="admin-users__action-btn"
                              onClick={() => setActionMenu(actionMenu === user.id ? null : user.id)}
                              aria-label="Hành động"
                            >
                              <MoreVertical size={18} />
                            </button>
                            {actionMenu === user.id && (
                              <ActionMenu
                                user={user}
                                onEdit={(u) => setEditingUser(u)}
                                onDelete={(u) => setPendingDelete(u)}
                                onChangeStatus={(u, s) => setPendingStatus({ user: u, newStatus: s })}
                                onViewDetail={(u) => setDrawerUser(u)}
                                onClose={() => setActionMenu(null)}
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="admin-users__pagination">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="admin-users__page-btn"
                  >
                    <ChevronLeft size={14} /> Trước
                  </button>
                  <span className="admin-users__page-info">
                    Trang {page} / {totalPages} ({totalCount} users)
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="admin-users__page-btn"
                  >
                    Sau <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </>
          )}
        </Card>

        {/* Recent audit log */}
        {auditEntries.length > 0 && (
          <Card className="admin-users__audit">
            <div className="admin-users__audit-header">
              <h3 className="admin-users__audit-title">
                <Activity size={18} /> Nhật ký hoạt động
              </h3>
              <span className="admin-users__audit-hint">
                <AlertCircle size={12} /> Mới nhất {auditEntries.length} hoạt động
              </span>
            </div>
            <ul className="admin-users__audit-list">
              {auditEntries.map((entry) => (
                <li key={entry.id} className="admin-users__audit-item">
                  <span className={`admin-users__audit-action admin-users__audit-action--${entry.action}`}>
                    {entry.action}
                  </span>
                  <span className="admin-users__audit-target">
                    {entry.target_table}{entry.target_id ? `/${String(entry.target_id).slice(0, 8)}…` : ''}
                  </span>
                  <span className="admin-users__audit-time">
                    {new Date(entry.created_at).toLocaleString('vi-VN')}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      {editingUser && (
        <EditUserModal
          open={!!editingUser}
          user={editingUser}
          roles={roles}
          onClose={() => setEditingUser(null)}
          onSaved={handleSaved}
        />
      )}

      <UserDetailDrawer
        user={drawerUser}
        roles={roles}
        onClose={() => setDrawerUser(null)}
        onEdit={() => {
          setEditingUser(drawerUser);
          setDrawerUser(null);
        }}
      />

      <ConfirmModal
        open={!!pendingDelete}
        title="Xóa người dùng?"
        description={
          pendingDelete
            ? `Hành động này sẽ soft-delete "${pendingDelete.email}". Họ vẫn có thể được khôi phục bằng cách đổi trạng thái sang 'inactive'.`
            : ''
        }
        confirmLabel="Xóa"
        variant="danger"
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />

      <ConfirmModal
        open={!!pendingStatus}
        title="Đổi trạng thái?"
        description={
          pendingStatus
            ? `Đổi "${pendingStatus.user.email}" từ "${pendingStatus.user.status}" → "${pendingStatus.newStatus}"`
            : ''
        }
        confirmLabel="Đổi"
        variant={pendingStatus?.newStatus === 'banned' ? 'danger' : 'primary'}
        onCancel={() => setPendingStatus(null)}
        onConfirm={confirmStatusChange}
      />

      <ConfirmModal
        open={!!bulkConfirm}
        title="Xác nhận hành động hàng loạt"
        description={
          bulkConfirm
            ? `Áp dụng trạng thái "${bulkConfirm.status}" cho ${selected.size} người dùng đã chọn.`
            : ''
        }
        confirmLabel="Áp dụng"
        variant={bulkConfirm?.status === 'banned' ? 'danger' : 'primary'}
        onCancel={() => setBulkConfirm(null)}
        onConfirm={confirmBulk}
      />
    </div>
  );
}