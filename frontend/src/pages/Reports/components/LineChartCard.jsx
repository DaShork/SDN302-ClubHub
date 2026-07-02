import { Card } from '../../../components/shared/Card';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border px-3 py-2 text-sm" style={{ backgroundColor: '#0D1824', borderColor: 'rgba(255,255,255,0.08)' }}>
      <p className="font-medium text-secondary-100 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#3B82F6' }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
};

export function LineChartCard({ title, data = [], dataKeys = [], height = 300 }) {
  const colors = ['#22C55E', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444'];
  return (
    <Card className="p-5 !hover:translate-y-0">
      {title && <h3 className="text-sm font-semibold text-secondary-100 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
          <Tooltip content={<CustomTooltip />} />
          {dataKeys.length > 1 && <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(244,241,234,0.5)' }} />}
          {dataKeys.map((dk, i) => (
            <Line
              key={dk.key}
              type="monotone"
              dataKey={dk.key}
              name={dk.name || dk.key}
              stroke={dk.color || colors[i % colors.length]}
              strokeWidth={2}
              dot={{ r: 3, fill: dk.color || colors[i % colors.length] }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
