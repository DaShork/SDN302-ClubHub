import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock } from 'lucide-react';
import { Card, Button } from '@/components';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth.jsx';
import './PaymentReturnPage.css';

export default function PaymentReturnPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { profileId } = useAuth();
  const [status, setStatus] = useState('checking'); // 'checking' | 'completed' | 'pending' | 'forbidden'
  const [payment, setPayment] = useState(null);

  // Resolve current user via RLS-scoped lookup of own payment by txn_ref.
  // RLS enforces ownership (migration 002) so users can't see other
  // people's payment rows even if they guess the transfer_content.
  useEffect(() => {
    const txnRef = searchParams.get('txn_ref');
    if (!profileId) {
      setStatus('pending');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        let query = supabase
          .from('payments')
          .select('id, status, amount, transfer_content, payment_date, memberships!inner(profile_id)')
          .order('created_at', { ascending: false })
          .eq('memberships.profile_id', profileId)
          .limit(1);
        if (txnRef) query = query.eq('transfer_content', txnRef);
        const { data, error } = await query.maybeSingle();
        if (cancelled) return;
        if (error) {
          setStatus('pending');
          return;
        }
        if (!data) {
          setStatus('forbidden');
          return;
        }
        setPayment(data);
        setStatus(data.status === 'completed' ? 'completed' : 'pending');
      } catch {
        if (!cancelled) setStatus('pending');
      }
    })();
    return () => { cancelled = true; };
  }, [searchParams, profileId]);

  if (status === 'checking') {
    return (
      <div className="payment-return">
        <Card className="payment-return__card">
          <div className="payment-return__loading">
            <div className="payment-return__spinner" />
            <p>Đang kiểm tra trạng thái thanh toán...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="payment-return">
      <Card className="payment-return__card">
        <div className={`payment-return__result payment-return__result--${status}`}>
          <div className="payment-return__icon">
            {status === 'completed' ? (
              <CheckCircle2 size={64} />
            ) : (
              <Clock size={64} />
            )}
          </div>

          <h1 className="payment-return__title">
            {status === 'completed'
              ? 'Thanh toán thành công!'
              : status === 'forbidden'
                ? 'Không tìm thấy giao dịch'
                : 'Đang chờ xác nhận'}
          </h1>

          <p className="payment-return__message">
            {status === 'completed'
              ? 'Khoản thanh toán của bạn đã được ghi nhận. Cảm ơn bạn đã đóng quỹ!'
              : status === 'forbidden'
                ? 'Không tìm thấy giao dịch nào thuộc tài khoản của bạn với mã này.'
                : 'Chúng tôi đang chờ ngân hàng xác nhận giao dịch của bạn. Thường mất vài giây đến vài phút. Bạn có thể đóng trang này và quay lại sau.'}
          </p>

          {payment && status !== 'forbidden' && (
            <div className="payment-return__details">
              <div className="payment-return__detail-row">
                <span>Mã giao dịch:</span>
                <code>{payment.transfer_content}</code>
              </div>
              <div className="payment-return__detail-row">
                <span>Số tiền:</span>
                <strong>{Number(payment.amount).toLocaleString('vi-VN')} VND</strong>
              </div>
              <div className="payment-return__detail-row">
                <span>Trạng thái:</span>
                <strong>{payment.status === 'completed' ? 'Đã xác nhận' : 'Đang chờ'}</strong>
              </div>
            </div>
          )}

          <div className="payment-return__actions">
            <Button onClick={() => navigate('/member/finance')}>
              Quay về trang quỹ
            </Button>
            <Button variant="secondary" onClick={() => navigate('/member')}>
              Trang chủ
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
