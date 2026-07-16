import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { Card, Button } from '@/components';
import { processVNPayReturn } from '@/services/vnpayService';
import './PaymentReturnPage.css';

export default function PaymentReturnPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);

  useEffect(() => {
    const returnResult = processVNPayReturn(searchParams);
    setResult(returnResult);
  }, [searchParams]);

  if (!result) {
    return (
      <div className="payment-return">
        <Card className="payment-return__card">
          <div className="payment-return__loading">
            <div className="payment-return__spinner" />
            <p>Đang xử lý kết quả thanh toán...</p>
          </div>
        </Card>
      </div>
    );
  }

  const { success, message, txnRef, amount, errorCode } = result;

  return (
    <div className="payment-return">
      <Card className="payment-return__card">
        <div className={`payment-return__result payment-return__result--${success ? 'success' : 'failed'}`}>
          <div className="payment-return__icon">
            {success ? (
              <CheckCircle2 size={64} />
            ) : errorCode === '02' || errorCode === '11' ? (
              <Clock size={64} />
            ) : (
              <XCircle size={64} />
            )}
          </div>

          <h1 className="payment-return__title">
            {success ? 'Thanh toán thành công!' : 'Thanh toán không thành công'}
          </h1>

          <p className="payment-return__message">{message}</p>

          {txnRef && (
            <div className="payment-return__details">
              <div className="payment-return__detail-row">
                <span>Mã giao dịch:</span>
                <code>{txnRef}</code>
              </div>
              {amount && (
                <div className="payment-return__detail-row">
                  <span>Số tiền:</span>
                  <strong>{amount} VND</strong>
                </div>
              )}
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
