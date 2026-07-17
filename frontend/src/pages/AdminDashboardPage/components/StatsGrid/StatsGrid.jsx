import { TrendingUp, TrendingDown } from 'lucide-react';
import './StatsGrid.css';

export default function StatsGrid({ items }) {
  return (
    <div className="admin-stats-grid">
      {items.map((item, idx) => {
        const Icon = item.icon;
        const trendUp = item.trend && item.trend > 0;
        return (
          <div key={idx} className="admin-stats-grid__card">
            <div className="admin-stats-grid__icon" style={{ background: item.bgColor, color: item.color }}>
              <Icon size={22} />
            </div>
            <div className="admin-stats-grid__body">
              <span className="admin-stats-grid__label">{item.label}</span>
              <span className="admin-stats-grid__value">{item.value ?? '—'}</span>
              {item.sublabel && (
                <span className="admin-stats-grid__sublabel">{item.sublabel}</span>
              )}
              {item.trend !== undefined && item.trend !== null && (
                <span className={`admin-stats-grid__trend admin-stats-grid__trend--${trendUp ? 'up' : 'down'}`}>
                  {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {Math.abs(item.trend)}%
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
