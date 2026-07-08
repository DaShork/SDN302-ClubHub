import { useState, useEffect } from 'react';
import { Shield, Users, CheckCircle2, XCircle, Info } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout.jsx';
import { Card, Button, toast } from '@/components';
import { supabase } from '@/services/supabase.js';
import { ROLES, ROLE_META, GRANTS } from '@/auth/rolePermissions.js';
import './AdminRolesPage.css';

export default function AdminRolesPage() {
  return (
    <MainLayout>
      <AdminRolesPageContent />
    </MainLayout>
  );
}

function AdminRolesPageContent() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoles();
  }, []);

  async function loadRoles() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setRoles(data || []);
    } catch (err) {
      console.error('Failed to load roles:', err);
      toast('Không thể tải danh sách vai trò', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-roles">
        <div className="admin-roles__container">
          <div className="admin-roles__loading">Đang tải...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-roles">
      <div className="admin-roles__container">
        <div className="admin-roles__header">
          <div>
            <h1 className="admin-roles__title">Quản lý Roles</h1>
            <p className="admin-roles__subtitle">
              Xem và quản lý các vai trò trong hệ thống
            </p>
          </div>
        </div>

        <div className="admin-roles__info">
          <Info size={18} />
          <p>
            Các vai trò được định nghĩa sẵn. Việc chỉnh sửa quyền cần thực hiện trong code.
            Liên hệ developer để thay đổi permissions.
          </p>
        </div>

        <div className="admin-roles__grid">
          {roles.map((role) => {
            const meta = ROLE_META[role.name] || { label: role.name, color: '#6B7280', shortLabel: '—' };
            const grants = GRANTS[role.name] || [];

            return (
              <Card key={role.id} className="admin-roles__card">
                <div className="admin-roles__card-header">
                  <div
                    className="admin-roles__card-icon"
                    style={{ background: `${meta.color}20` }}
                  >
                    <Shield size={24} style={{ color: meta.color }} />
                  </div>
                  <div>
                    <h3 className="admin-roles__card-title">{meta.label}</h3>
                    <span
                      className="admin-roles__card-badge"
                      style={{ background: `${meta.color}20`, color: meta.color }}
                    >
                      {grants.length} permissions
                    </span>
                  </div>
                </div>

                <p className="admin-roles__card-desc">{role.description || 'Không có mô tả'}</p>

                <div className="admin-roles__permissions">
                  <h4 className="admin-roles__permissions-title">Quyền hạn</h4>
                  <div className="admin-roles__permissions-list">
                    {grants.length === 0 ? (
                      <span className="admin-roles__no-perms">Không có quyền đặc biệt</span>
                    ) : (
                      grants.slice(0, 8).map((perm) => (
                        <span key={perm} className="admin-roles__permission">
                          <CheckCircle2 size={12} />
                          {perm}
                        </span>
                      ))
                    )}
                    {grants.length > 8 && (
                      <span className="admin-roles__more-perms">
                        +{grants.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
