import { Card } from '../../../components/shared/Card';

export function PaymentSummary({ membership, amount }) {
  if (!membership) return null;
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold mb-4" style={{ color: 'rgba(244,241,234,0.6)' }}>
        Payment Summary
      </h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: 'rgba(244,241,234,0.5)' }}>Club</span>
          <span className="text-sm font-medium text-secondary-100">{membership.clubs?.name || '—'}</span>
        </div>
        {membership.club_terms && (
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'rgba(244,241,234,0.5)' }}>Term</span>
            <span className="text-sm font-medium text-secondary-100">{membership.club_terms.name}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: 'rgba(244,241,234,0.5)' }}>Position</span>
          <span className="text-sm font-medium text-secondary-100">{membership.position}</span>
        </div>
        <div className="border-t pt-3 flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <span className="text-sm font-medium" style={{ color: 'rgba(244,241,234,0.7)' }}>Amount</span>
          <span className="text-xl font-bold text-accent-green">
            {amount ? `${parseFloat(amount).toLocaleString()} VND` : '—'}
          </span>
        </div>
      </div>
    </Card>
  );
}
