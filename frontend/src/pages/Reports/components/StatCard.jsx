import { Card } from '../../../components/shared/Card';

export function StatCard({ title, value, subtitle, icon, trend }) {
  return (
    <Card className="p-5 !hover:translate-y-0">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium mb-1" style={{ color: 'rgba(244,241,234,0.5)' }}>{title}</p>
          <p className="text-3xl font-bold text-secondary-100">{value}</p>
          {subtitle && (
            <p className="text-xs mt-1" style={{ color: 'rgba(244,241,234,0.4)' }}>{subtitle}</p>
          )}
          {trend != null && (
            <p className={`text-xs mt-2 font-medium flex items-center gap-1 ${
              trend >= 0 ? 'text-accent-green' : 'text-danger'
            }`}>
              {trend >= 0 ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              )}
              {Math.abs(trend)}% vs last month
            </p>
          )}
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E' }}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
