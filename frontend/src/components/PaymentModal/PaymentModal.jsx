import { useEffect, useState } from 'react';
import {
  X, Copy, Check, Loader2, Building2, Upload,
} from 'lucide-react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth.jsx';
import { toast } from '@/components';
import { createManualBankPayment } from '@/services/manualPaymentService';
import './PaymentModal.css';

const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;  // 5 min

export default function PaymentModal({
  isOpen,
  onClose,
  membership,
  clubName,
  amount,
  currency,
  onSuccess,
}) {
  const { profileId } = useAuth();
  const [paymentInfo, setPaymentInfo] = useState(null); // { bank_account, txn_ref, qr_url, payment }
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pollError, setPollError] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  // Create a pending payment when the modal opens. Reset state on close
  // so the next open starts fresh.
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (!membership || !amount) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await createManualBankPayment({
          membership_id: membership,
          amount,
          note: `Thanh toán phí thành viên CLB ${clubName}`,
        });
        if (!cancelled) setPaymentInfo(data);
      } catch (err) {
        if (!cancelled) {
          toast(err.message || 'Không thể khởi tạo thanh toán', { variant: 'error' });
          onClose();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen, membership, amount, clubName, onClose]);

  // Poll the payments table once the user has been shown the QR.
  // Casso/Sepay webhook updates the row; we just wait for it to flip.
  // SECURITY: scope to the caller's profile_id via memberships join so that
  // even if RLS were misconfigured, a guessed paymentId wouldn't leak.
  useEffect(() => {
    if (!isOpen || !paymentInfo?.payment?.id || !profileId) return;

    const paymentId = paymentInfo.payment.id;
    const deadline = Date.now() + POLL_TIMEOUT_MS;
    let timerId = null;

    async function tick() {
      if (Date.now() > deadline) {
        setPollError('Quá thời gian chờ. Vui lòng liên hệ CLB để xác nhận.');
        return;
      }
      const { data, error } = await supabase
        .from('payments')
        .select('id, status, payment_date, memberships!inner(profile_id)')
        .eq('id', paymentId)
        .eq('memberships.profile_id', profileId)
        .maybeSingle();
      if (error) {
        setPollError(error.message);
        return;
      }
      if (!data) {
        setPollError('Không tìm thấy giao dịch thuộc tài khoản của bạn.');
        return;
      }
      if (data?.status === 'completed') {
        toast('Thanh toán đã được xác nhận!', { variant: 'success' });
        if (onSuccess) onSuccess(data);
        onClose();
        return;
      }
      timerId = setTimeout(tick, POLL_INTERVAL_MS);
    }

    timerId = setTimeout(tick, POLL_INTERVAL_MS);
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [isOpen, paymentInfo, profileId, onSuccess, onClose]);

  async function handleManualConfirm() {
    if (!paymentInfo?.payment?.id) return;
    setConfirming(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payment-check`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ payment_id: paymentInfo.payment.id }),
        },
      );
      const body = await r.json().catch(() => ({}));

      // payment-check returns 200 even when "pending" — status is in body.status
      if (!r.ok || body.error) {
        throw new Error(body.error || `HTTP ${r.status}`);
      }

      // Any 2xx + status=completed means success
      if (body.status === 'completed') {
        toast('Thanh toán đã được xác nhận!', { variant: 'success' });
        if (onSuccess) onSuccess(body.payment ?? paymentInfo.payment);
        onClose();
        return;
      }

      // status=pending — show message to user
      toast(body.message || 'Chưa tìm thấy giao dịch. Vui lòng thử lại sau vài giây.', {
        variant: 'warning',
      });
    } catch (err) {
      toast(err.message, { variant: 'error' });
    } finally {
      setConfirming(false);
    }
  }

  function copy(value, field) {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  }

  function handleClose() {
    if (loading || confirming) return;
    setPaymentInfo(null);
    setConfirming(false);
    setPollError(null);
    onClose();
  }

  if (!isOpen || !membership) return null;

  const formattedAmount = typeof amount === 'number'
    ? amount.toLocaleString('vi-VN')
    : amount;

  return (
    <div className="payment-modal">
      <div className="payment-modal__backdrop" onClick={handleClose} />

      <div className="payment-modal__panel">
        <button
          type="button"
          className="payment-modal__close"
          onClick={handleClose}
          disabled={loading || confirming}
          aria-label="Đóng"
        >
          <X size={18} />
        </button>

        <div className="payment-modal__header">
          <Building2 size={28} />
          <h2 className="payment-modal__title">Chuyển khoản ngân hàng</h2>
          <p className="payment-modal__subtitle">{clubName}</p>
        </div>

        {loading && (
          <div className="payment-modal__loading">
            <Loader2 size={36} className="spin" />
            <span>Đang tạo thông tin thanh toán...</span>
          </div>
        )}

        {paymentInfo && (
          <>
            <div className="payment-modal__qr">
              <img
                src={paymentInfo.qr_url}
                alt="QR code chuyển khoản"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <small>Quét mã bằng app ngân hàng</small>
            </div>

            <dl className="payment-modal__details">
              <div>
                <dt>Ngân hàng</dt>
                <dd>{paymentInfo.bank_account.bank_name}</dd>
              </div>
              <div>
                <dt>Số tài khoản</dt>
                <dd className="mono">
                  {paymentInfo.bank_account.account_number}
                  <button
                    type="button"
                    className="payment-modal__copy"
                    onClick={() => copy(paymentInfo.bank_account.account_number, 'stk')}
                    aria-label="Sao chép số tài khoản"
                  >
                    {copiedField === 'stk' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </dd>
              </div>
              <div>
                <dt>Chủ tài khoản</dt>
                <dd>{paymentInfo.bank_account.account_name}</dd>
              </div>
              <div>
                <dt>Số tiền</dt>
                <dd className="amount">{formattedAmount} {currency || 'VND'}</dd>
              </div>
              <div className="payment-modal__content-row">
                <dt>Nội dung CK <span className="required">*</span></dt>
                <dd className="mono highlight">
                  {paymentInfo.txn_ref}
                  <button
                    type="button"
                    className="payment-modal__copy"
                    onClick={() => copy(paymentInfo.txn_ref, 'content')}
                    aria-label="Sao chép nội dung"
                  >
                    {copiedField === 'content' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </dd>
              </div>
            </dl>

            <div className="payment-modal__notice">
              ⚠️ Ghi <strong>đúng nội dung CK</strong> để hệ thống tự xác nhận.
              Hệ thống sẽ tự động cập nhật trong vài giây sau khi CK thành công.
            </div>

            {pollError && (
              <div className="payment-modal__error">
                {pollError}
              </div>
            )}

            <div className="payment-modal__actions">
              <button
                type="button"
                className="payment-modal__btn-secondary"
                onClick={handleClose}
                disabled={confirming}
              >
                Đóng
              </button>
              <button
                type="button"
                className="payment-modal__btn-primary"
                onClick={handleManualConfirm}
                disabled={confirming}
              >
                {confirming ? (
                  <><Loader2 size={14} className="spin" /> Đang xác nhận...</>
                ) : (
                  <><Upload size={14} /> Tôi đã chuyển khoản</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}