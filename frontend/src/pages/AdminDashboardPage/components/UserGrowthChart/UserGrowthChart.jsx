import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { UserPlus } from 'lucide-react';
import './UserGrowthChart.css';

export default function UserGrowthChart({ data }) {
  const total = data?.reduce((s, d) => s + d.count, 0) ?? 0;

  return (
    <div className="admin-user-growth">
      <div className="admin-user-growth__header">
        <div>
          <h3 className="admin-user-growth__title">
            <UserPlus size={18} /> Tăng trưởng người dùng
          </h3>
          <p className="admin-user-growth__subtitle">Số lượng tài khoản đăng ký mới theo tháng</p>
        </div>
        <div className="admin-user-growth__total">
          <span className="admin-user-growth__total-label">Tổng</span>
          <span className="admin-user-growth__total-value">+{total}</span>
        </div>
      </div>

      <div className="admin-user-growth__chart">
        {total === 0 ? (
          <div className="admin-user-growth__empty">Chưa có dữ liệu</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22C55E" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="label"
                stroke="#64748B"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748B"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: '#0D1824',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  color: '#F4F1EA',
                  fontSize: 12,
                }}
                cursor={{ stroke: '#22C55E', strokeWidth: 1, strokeDasharray: '3 3' }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#22C55E"
                strokeWidth={2}
                fill="url(#growthFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
