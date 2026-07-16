import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock } from 'lucide-react';
import { Card, Button } from '@/components';
import { supabase } from '@/services/supabase';
import './PaymentReturnPage.css';

export default function PaymentReturnPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking'); // 'checking' | 'completed' | 'pending'
  const [payment, setPayment] = useState(null);

  // With manual bank transfer there's no VNPay-style redirect back.
  // We just check the latest pending payment for this user and report
  // whether it's been confirmed yet. The modal already does this with
  // realtime polling — this page is here in case the user lands here
  // by some other path.
  useEffect(() => {
    const txnRef = searchParams.get('txn_ref');
    let cancelled = false;
    (async () => {
      try {
        let query = supabase
          .from('payments')
          .select('id, status, amount, transfer_content, payment_date')
          .order('created_at', { ascending: false })
          .limit(1);
        if (txnRef) query = query.eq('transfer_content', txnRef);
        const { data } = await query.maybeSingle();
        if (cancelled) return;
        setPayment(data);
        if (data?.status === 'completed') setStatus('completed');
        else setStatus('pending');
      } catch {
        if (!cancelled) setStatus('pending');
      }
    })();
    return () => { cancelled = true; };
  }, [searchParams]);

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
            {status === 'completed' ? 'Thanh toán thành công!' : 'Đang chờ xác nhận'}
          </h1>

          <p className="payment-return__message">
            {status === 'completed'
              ? 'Khoản thanh toán của bạn đã được ghi nhận. Cảm ơn bạn đã đóng quỹ!'
              : 'Chúng tôi đang chờ ngân hàng xác nhận giao dịch của bạn. Thường mất vài giây đến vài phút. Bạn có thể đóng trang này và quay lại sau.'}
          </p>

          {payment && (
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
