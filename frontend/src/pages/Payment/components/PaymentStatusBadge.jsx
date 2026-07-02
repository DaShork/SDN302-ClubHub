import { Badge } from '../../../components/shared/Badge';

export function PaymentStatusBadge({ status = 'pending' }) {
  return <Badge variant={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
}
