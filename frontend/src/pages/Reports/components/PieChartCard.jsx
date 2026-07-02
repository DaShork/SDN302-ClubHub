import { Card } from '../../../components/shared/Card';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-lg border px-3 py-2 text-sm" style={{ backgroundColor: '#0D1824', borderColor: 'rgba(255,255,255,0.08)' }}>
      <p className="text-secondary-100">{p.name}</p>
      <p className="text-accent-green font-semibold">{p.value.toLocaleString()}</p>
    </div>
  );
};

const COLORS = ['#22C55E', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#EF4444', '#06B6D4', '#84CC16'];

export function PieChartCard({ title, data = [], dataKey = 'members', nameKey = 'club', height = 300 }) {
  return (
    <Card className="p-5 !hover:translate-y-0">
      {title && <h3 className="text-sm font-semibold text-secondary-100 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey={dataKey}
            nameKey={nameKey}
            cx="50%"
            cy="50%"
            outerRadius={80}
            innerRadius={40}
            paddingAngle={3}
            datalabel={false}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 11, color: 'rgba(244,241,234,0.5)' }}
            formatter={(value) => <span style={{ color: 'rgba(244,241,234,0.6)' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
