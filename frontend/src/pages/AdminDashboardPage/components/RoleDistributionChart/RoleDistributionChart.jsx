import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import { Shield } from 'lucide-react';
import { ROLE_META } from '@/auth/rolePermissions.js';
import './RoleDistributionChart.css';

const FALLBACK_COLOR = '#6B7280';

export default function RoleDistributionChart({ data }) {
  const total = data?.reduce((s, d) => s + d.count, 0) ?? 0;
  const rows = (data || []).map((d) => {
    const meta = ROLE_META[d.name] || { label: d.name, color: FALLBACK_COLOR };
    return { ...d, label: meta.label, color: meta.color };
  });

  return (
    <div className="admin-role-dist">
      <div className="admin-role-dist__header">
        <div>
          <h3 className="admin-role-dist__title">
            <Shield size={18} /> Phân bổ vai trò
          </h3>
          <p className="admin-role-dist__subtitle">Số lượng user theo từng role</p>
        </div>
        <div className="admin-role-dist__total">
          <span className="admin-role-dist__total-label">Tổng</span>
          <span className="admin-role-dist__total-value">{total}</span>
        </div>
      </div>

      <div className="admin-role-dist__chart">
        {total === 0 ? (
          <div className="admin-role-dist__empty">Chưa có dữ liệu</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={rows}
                dataKey="count"
                nameKey="label"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                stroke="#0D1824"
                strokeWidth={2}
              >
                {rows.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#0D1824',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  color: '#F4F1EA',
                  fontSize: 12,
                }}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                wrapperStyle={{ fontSize: 11, color: '#94A3B8' }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
