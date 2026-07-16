import { useState } from 'react';
import { X, ExternalLink, Loader2 } from 'lucide-react';
import { createVNPayPayment } from '@/services/vnpayService';
import { toast } from '@/components';
import './PaymentModal.css';

export default function PaymentModal({
  isOpen,
  onClose,
  membership,
  clubName,
  amount,
  currency,
  onSuccess,
}) {
  const [step, setStep] = useState('select'); // 'select' | 'loading' | 'redirect'
  const [paymentMethod, setPaymentMethod] = useState('vnpay'); // 'vnpay' | 'sandbox'

  if (!isOpen || !membership) return null;

  async function handlePayWithVNPay() {
    setStep('loading');
    try {
      const result = await createVNPayPayment({
        membershipId: membership,
        amount,
        clubName,
        description: `Thanh toan phi thanh vien CLB ${clubName}`,
      });

      if (result.success && result.paymentUrl) {
        setStep('redirect');
        // Redirect to VNPay
        window.location.href = result.paymentUrl;
      } else {
        throw new Error('Failed to create payment');
      }
    } catch (err) {
      console.error('VNPay payment error:', err);
      toast(err.message || 'Khong the khoi tao thanh toan VNPay. Vui long thu lai.', { variant: 'error' });
      setStep('select');
    }
  }

  function handleSandboxPay() {
    if (onSuccess) onSuccess();
    handleClose();
  }

  function handleClose() {
    if (step === 'loading') return;
    setStep('select');
    setPaymentMethod('vnpay');
    onClose();
  }

  return (
    <div className="payment-modal">
      <div className="payment-modal__backdrop" onClick={handleClose} />

      <div className="payment-modal__panel">
        <button
          type="button"
          className="payment-modal__close"
          onClick={handleClose}
          disabled={step === 'loading'}
        >
          <X size={18} />
        </button>

        {step === 'select' && (
          <>
            <div className="payment-modal__header">
              <h2 className="payment-modal__title">Thanh toan dong quy</h2>
              <p className="payment-modal__subtitle">{clubName}</p>
            </div>

            <div className="payment-modal__amount">
              <span className="payment-modal__amount-label">So tien can thanh toan</span>
              <span className="payment-modal__amount-value">
                {typeof amount === 'number' ? amount.toLocaleString('vi-VN') : amount} {currency || 'VND'}
              </span>
            </div>

            <div className="payment-modal__method-section">
              <h3 className="payment-modal__method-title">Chon phuong thuc thanh toan</h3>

              <label className={`payment-modal__method-option ${paymentMethod === 'vnpay' ? 'payment-modal__method-option--active' : ''}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="vnpay"
                  checked={paymentMethod === 'vnpay'}
                  onChange={() => setPaymentMethod('vnpay')}
                />
                <div className="payment-modal__method-content">
                  <div className="payment-modal__method-icon">VNPay</div>
                  <div className="payment-modal__method-info">
                    <span className="payment-modal__method-name">VNPay</span>
                    <span className="payment-modal__method-desc">Thanh toan qua VNPay voi ma QR hoac the</span>
                  </div>
                </div>
              </label>

              <label className={`payment-modal__method-option ${paymentMethod === 'sandbox' ? 'payment-modal__method-option--active' : ''}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="sandbox"
                  checked={paymentMethod === 'sandbox'}
                  onChange={() => setPaymentMethod('sandbox')}
                />
                <div className="payment-modal__method-content">
                  <div className="payment-modal__method-icon">Demo</div>
                  <div className="payment-modal__method-info">
                    <span className="payment-modal__method-name">Sandbox (Demo)</span>
                    <span className="payment-modal__method-desc">Ghi nhan thanh toan ngay lap tuc (khong thuc)</span>
                  </div>
                </div>
              </label>
            </div>

            <div className="payment-modal__actions">
              <button type="button" className="payment-modal__btn-secondary" onClick={handleClose}>
                Huy
              </button>
              {paymentMethod === 'vnpay' ? (
                <button
                  type="button"
                  className="payment-modal__btn-primary"
                  onClick={handlePayWithVNPay}
                >
                  <ExternalLink size={16} />
                  Thanh toan voi VNPay
                </button>
              ) : (
                <button
                  type="button"
                  className="payment-modal__btn-primary"
                  onClick={handleSandboxPay}
                >
                  Xac nhan (Sandbox)
                </button>
              )}
            </div>
          </>
        )}

        {(step === 'loading' || step === 'redirect') && (
          <div className="payment-modal__loading">
            <Loader2 size={48} className="payment-modal__loading-icon" />
            <h3>{step === 'loading' ? 'Dang khoi tao thanh toan VNPay...' : 'Dang chuyen huong den VNPay...'}</h3>
            {step === 'redirect' && (
              <p>Neu trang khong tu chuyen, <button type="button" className="payment-modal__retry-link" onClick={handleClose}>click vao day</button> de quay lai.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
