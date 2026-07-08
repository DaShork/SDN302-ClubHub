import { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, UserCheck, UserX, Mail, Edit2, Trash2 } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout.jsx';
import { Card, Button, toast, ConfirmModal } from '@/components';
import { supabase } from '@/services/supabase.js';
import { ROLES, ROLE_META } from '@/auth/rolePermissions.js';
import './AdminUsersPage.css';

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  return (
    <MainLayout>
      <AdminUsersPageContent />
    </MainLayout>
  );
}

function AdminUsersPageContent() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionMenu, setActionMenu] = useState(null);

  useEffect(() => {
    loadUsers();
  }, [page, filterRole, filterStatus]);

  async function loadUsers() {
    setLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select(`
          id, full_name, student_code, email, avatar_url, faculty, major, status, created_at,
          roles (id, name)
        `, { count: 'exact' })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
        .order('created_at', { ascending: false });

      if (filterRole) {
        query = query.eq('role_id', filterRole);
      }
      if (filterStatus) {
        query = query.eq('status', filterStatus);
      }
      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,student_code.ilike.%${search}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      const flattened = (data || []).map((u) => ({
        ...u,
        role_name: u.roles?.name ?? null,
      }));

      setUsers(flattened);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Failed to load users:', err);
      toast('Không thể tải danh sách người dùng', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateRole(userId, newRoleId) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role_id: newRoleId, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;
      toast('Cập nhật vai trò thành công');
      setActionMenu(null);
      loadUsers();
    } catch (err) {
      toast('Lỗi khi cập nhật vai trò', { variant: 'error' });
    }
  }

  async function handleUpdateStatus(userId, newStatus) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;
      toast('Cập nhật trạng thái thành công');
      setActionMenu(null);
      loadUsers();
    } catch (err) {
      toast('Lỗi khi cập nhật trạng thái', { variant: 'error' });
    }
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="admin-users">
      <div className="admin-users__container">
        <div className="admin-users__header">
          <div>
            <h1 className="admin-users__title">Quản lý Users</h1>
            <p className="admin-users__subtitle">
              Quản lý tài khoản và phân quyền người dùng ({totalCount} users)
            </p>
          </div>
        </div>

        <Card className="admin-users__filters">
          <div className="admin-users__search">
            <Search size={18} className="admin-users__search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email, mã sinh viên..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              onKeyDown={(e) => e.key === 'Enter' && (setPage(1), loadUsers())}
              className="admin-users__search-input"
            />
          </div>

          <div className="admin-users__filter-group">
            <select
              value={filterRole}
              onChange={(e) => {
                setFilterRole(e.target.value);
                setPage(1);
              }}
              className="admin-users__select"
            >
              <option value="">Tất cả vai trò</option>
              {Object.values(ROLES).map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
              className="admin-users__select"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="banned">Banned</option>
            </select>

            <Button variant="secondary" onClick={loadUsers}>
              <Filter size={16} />
              Lọc
            </Button>
          </div>
        </Card>

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
                    <th>Người dùng</th>
                    <th>Vai trò</th>
                    <th>Trạng thái</th>
                    <th>Ngày tạo</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const roleMeta = ROLE_META[user.role_name] || { label: '—', color: '#6B7280' };
                    return (
                      <tr key={user.id}>
                        <td>
                          <div className="admin-users__user-cell">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt={user.full_name} className="admin-users__avatar" />
                            ) : (
                              <div className="admin-users__avatar-placeholder">
                                {user.full_name?.charAt(0) || 'U'}
                              </div>
                            )}
                            <div>
                              <p className="admin-users__user-name">{user.full_name || '—'}</p>
                              <p className="admin-users__user-email">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            className="admin-users__role-badge"
                            style={{
                              background: `${roleMeta.color}20`,
                              color: roleMeta.color,
                            }}
                          >
                            {roleMeta.label}
                          </span>
                        </td>
                        <td>
                          <span className={`admin-users__status admin-users__status--${user.status}`}>
                            {user.status === 'active' ? 'Active' : user.status === 'inactive' ? 'Inactive' : 'Banned'}
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
                            >
                              <MoreVertical size={18} />
                            </button>
                            {actionMenu === user.id && (
                              <div className="admin-users__action-menu">
                                <button onClick={() => { setSelectedUser(user); setActionMenu(null); }}>
                                  <Edit2 size={14} /> Chỉnh sửa
                                </button>
                                {user.role_name !== ROLES.ADMINISTRATOR && (
                                  <button onClick={() => handleUpdateRole(user.id, 'admin-role-id-placeholder')}>
                                    <UserCheck size={14} /> Đổi vai trò
                                  </button>
                                )}
                                {user.status === 'active' ? (
                                  <button onClick={() => handleUpdateStatus(user.id, 'banned')}>
                                    <UserX size={14} /> Khóa tài khoản
                                  </button>
                                ) : (
                                  <button onClick={() => handleUpdateStatus(user.id, 'active')}>
                                    <UserCheck size={14} /> Mở khóa
                                  </button>
                                )}
                              </div>
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
                    Trước
                  </button>
                  <span className="admin-users__page-info">
                    Trang {page} / {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="admin-users__page-btn"
                  >
                    Sau
                  </button>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
