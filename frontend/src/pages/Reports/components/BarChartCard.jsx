import { Card } from '../../../components/shared/Card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border px-3 py-2 text-sm" style={{ backgroundColor: '#0D1824', borderColor: 'rgba(255,255,255,0.08)' }}>
      <p className="font-medium text-secondary-100 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#22C55E' }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
};

export function BarChartCard({ title, data = [], dataKey, name, color = '#22C55E', height = 300 }) {
  return (
    <Card className="p-5 !hover:translate-y-0">
      {title && <h3 className="text-sm font-semibold text-secondary-100 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="month"
            tick={{ fill: 'rgba(244,241,234,0.4)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'rgba(244,241,234,0.4)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey={dataKey} name={name} fill={color} radius={[6, 6, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
