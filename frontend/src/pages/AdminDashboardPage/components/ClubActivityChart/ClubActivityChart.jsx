import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { Building2 } from 'lucide-react';
import './ClubActivityChart.css';

const ACCENT = '#22C55E';

export default function ClubActivityChart({ data }) {
  const max = Math.max(1, ...(data?.map((d) => d.memberCount) || [0]));
  const colored = (data || []).map((d, i) => ({
    ...d,
    fillOpacity: 1 - (i * 0.12),
  }));

  return (
    <div className="admin-club-activity">
      <div className="admin-club-activity__header">
        <div>
          <h3 className="admin-club-activity__title">
            <Building2 size={18} /> Top CLB theo thành viên
          </h3>
          <p className="admin-club-activity__subtitle">Các CLB đông thành viên nhất</p>
        </div>
      </div>

      <div className="admin-club-activity__chart">
        {!data?.length ? (
          <div className="admin-club-activity__empty">Chưa có CLB</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={colored}
              layout="vertical"
              margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
              <XAxis
                type="number"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#94A3B8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={120}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                contentStyle={{
                  background: '#0D1824',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  color: '#F4F1EA',
                  fontSize: 12,
                }}
              />
              <Bar dataKey="memberCount" radius={[0, 8, 8, 0]} maxBarSize={28}>
                {colored.map((entry, idx) => (
                  <Cell key={idx} fill={ACCENT} fillOpacity={entry.fillOpacity} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
