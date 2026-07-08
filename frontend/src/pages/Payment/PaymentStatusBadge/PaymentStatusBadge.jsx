import { CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import './PaymentStatusBadge.css';

const META = {
  completed: { label: 'Completed', icon: CheckCircle2, color: '#22C55E' },
  pending: { label: 'Pending', icon: Clock, color: '#F59E0B' },
  failed: { label: 'Failed', icon: XCircle, color: '#EF4444' },
  refunded: { label: 'Refunded', icon: AlertCircle, color: '#6B7280' },
};

export function PaymentStatusBadge({ status = 'pending' }) {
  const meta = META[status] || META.pending;
  const Icon = meta.icon;
  return (
    <span
      className="payment-badge"
      style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
    >
      <Icon size={12} />
      {meta.label}
    </span>
  );
}