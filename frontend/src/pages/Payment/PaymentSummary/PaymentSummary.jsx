import { Card } from '@/components';
import './PaymentSummary.css';

export function PaymentSummary({ membership, amount }) {
  if (!membership) return null;
  return (
    <Card className="payment-summary">
      <h3 className="payment-summary__title">Payment Summary</h3>
      <div className="payment-summary__rows">
        <div className="payment-summary__row">
          <span className="payment-summary__label">Club</span>
          <span className="payment-summary__value">{membership.clubs?.name || '—'}</span>
        </div>
        {membership.club_terms && (
          <div className="payment-summary__row">
            <span className="payment-summary__label">Term</span>
            <span className="payment-summary__value">{membership.club_terms.name}</span>
          </div>
        )}
        <div className="payment-summary__row">
          <span className="payment-summary__label">Position</span>
          <span className="payment-summary__value">{membership.position}</span>
        </div>
        <div className="payment-summary__divider" />
        <div className="payment-summary__row payment-summary__row--total">
          <span className="payment-summary__label">Amount</span>
          <span className="payment-summary__total">
            {amount ? `${parseFloat(amount).toLocaleString()} VND` : '—'}
          </span>
        </div>
      </div>
    </Card>
  );
}