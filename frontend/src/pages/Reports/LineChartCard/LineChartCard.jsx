import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components';
import './LineChartCard.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="line-tooltip">
      <p className="line-tooltip__label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="line-tooltip__value" style={{ color: p.color || '#3B82F6' }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
};

export function LineChartCard({ title, data = [], dataKeys = [], height = 300 }) {
  const colors = ['#22C55E', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444'];
  return (
    <Card className="line-chart-card">
      {title && <h3 className="line-chart-card__title">{title}</h3>}
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
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.06)' }} />
          {dataKeys.map((dk, i) => (
            <Line
              key={dk.key}
              type="monotone"
              dataKey={dk.key}
              name={dk.name}
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