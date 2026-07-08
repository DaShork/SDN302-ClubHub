import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components';
import './PieChartCard.css';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="pie-tooltip">
      <p className="pie-tooltip__label">{p.name}</p>
      <p className="pie-tooltip__value">{p.value.toLocaleString()}</p>
    </div>
  );
};

const COLORS = ['#22C55E', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#EF4444', '#06B6D4', '#84CC16'];

export function PieChartCard({ title, data = [], dataKey = 'members', nameKey = 'club', height = 300 }) {
  return (
    <Card className="pie-chart-card">
      {title && <h3 className="pie-chart-card__title">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey={dataKey}
            nameKey={nameKey}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}