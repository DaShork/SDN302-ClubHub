import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components';
import './StatCard.css';

export function StatCard({ title, value, subtitle, icon, trend }) {
  return (
    <Card className="stat-card">
      <div className="stat-card__inner">
        <div className="stat-card__copy">
          <p className="stat-card__title">{title}</p>
          <p className="stat-card__value">{value}</p>
          {subtitle && <p className="stat-card__subtitle">{subtitle}</p>}
          {trend != null && (
            <p className={`stat-card__trend ${trend >= 0 ? 'stat-card__trend--up' : 'stat-card__trend--down'}`}>
              {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(trend)}% vs last month
            </p>
          )}
        </div>
        {icon && (
          <div className="stat-card__icon">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}