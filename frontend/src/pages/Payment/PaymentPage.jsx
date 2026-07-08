import { useState, useEffect } from 'react';
import {
  Wallet, CreditCard, Banknote, Building2, Check, Loader as LoaderIcon, ArrowLeft,
} from 'lucide-react';
import { Card, Button, Loading, toast } from '@/components';
import { useAuth } from '@/hooks/useAuth.jsx';
import {
  getMembershipByProfile, listPaymentsByProfile,
  createSandboxPayment, simulateSandboxPayment,
} from '@/services/paymentService';
import { PaymentSummary } from './PaymentSummary/PaymentSummary.jsx';
import { PaymentMethod } from './PaymentMethod/PaymentMethod.jsx';
import { PaymentStatusBadge } from './PaymentStatusBadge/PaymentStatusBadge.jsx';
import './PaymentPage.css';

const STEPS = ['membership', 'payment', 'confirmation'];

export default function PaymentPageContent() {
  const { profile } = useAuth();
  const [step, setStep] = useState(0);
  const [memberships, setMemberships] = useState([]);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('sandbox');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [completedPayment, setCompletedPayment] = useState(null);
  const [recentPayments, setRecentPayments] = useState([]);

  useEffect(() => {
    const load = async () => {
      if (!profile?.id) {
        setLoading(false);
        return;
      }
      const [{ data: mems }, { data: pays }] = await Promise.all([
        getMembershipByProfile(profile.id),
        listPaymentsByProfile(profile.id),
      ]);
      setMemberships(mems || []);
      setRecentPayments(pays || []);
      if (mems && mems.length > 0) {
        setSelectedMembership(mems[0]);
      }
      setLoading(false);
    };
    load();
  }, [profile?.id]);

  const handleSelectMembership = (membership) => {
    setSelectedMembership(membership);
    setStep(1);
  };

  const handlePayment = async () => {
    if (!selectedMembership || !amount || isNaN(parseFloat(amount))) {
      toast('Please enter a valid amount', { variant: 'error' });
      return;
    }
    setProcessing(true);
    setStep(2);

    const payload = {
      membershipId: selectedMembership.id,
      amount: parseFloat(amount),
      paymentMethod,
      note,
    };

    try {
      const { data, error } = await createSandboxPayment(payload);
      if (error) {
        toast('Payment failed: ' + error.message, { variant: 'error' });
        setStep(1);
        return;
      }

      if (paymentMethod === 'sandbox') {
        const result = await simulateSandboxPayment(data.id, { delayMs: 1500 });
        if (result.error || !result.data) {
          toast('Sandbox processing failed', { variant: 'error' });
          setStep(1);
        } else {
          setCompletedPayment(result.data);
          toast('Payment completed successfully!', { variant: 'success' });
          setRecentPayments((prev) => [result.data, ...prev]);
        }
      } else {
        setCompletedPayment(data);
        toast('Payment recorded successfully!', { variant: 'success' });
        setRecentPayments((prev) => [data, ...prev]);
      }
    } catch (err) {
      console.error('Payment failed:', err);
      toast('Không thể xử lý thanh toán', { variant: 'error' });
      setStep(1);
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setStep(0);
    setCompletedPayment(null);
    setAmount('');
    setNote('');
  };

  if (loading) {
    return (
      <div className="payment-page">
        <div className="payment-page__loading">
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <header className="payment-page__head">
        <h1 className="payment-page__title">Club Fund</h1>
        <p className="payment-page__subtitle">
          Pay membership fees and view payment history
        </p>
      </header>

      <div className="payment-page__layout">
        <div className="payment-page__main">
          <Card className="payment-page__card">
            {step < 2 && (
              <StepIndicator steps={STEPS} current={step} />
            )}

            {step === 0 && (
              <SelectMembershipStep
                memberships={memberships}
                onSelect={handleSelectMembership}
              />
            )}

            {step === 1 && (
              <PaymentDetailsStep
                selectedMembership={selectedMembership}
                amount={amount}
                setAmount={setAmount}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                note={note}
                setNote={setNote}
                onBack={() => setStep(0)}
                onConfirm={handlePayment}
              />
            )}

            {step === 2 && (
              <ConfirmationStep
                processing={processing}
                completedPayment={completedPayment}
                onReset={handleReset}
              />
            )}
          </Card>
        </div>

        <aside className="payment-page__history">
          <h3 className="payment-page__history-title">Recent Payments</h3>
          {recentPayments.length === 0 ? (
            <Card className="payment-page__history-empty">
              <Wallet size={32} color="rgba(244,241,234,0.3)" />
              <p>No payments yet</p>
              <span>Your payment history will appear here.</span>
            </Card>
          ) : (
            <div className="payment-page__history-list">
              {recentPayments.map((p) => (
                <Card key={p.id} className="payment-page__history-item">
                  <div className="payment-page__history-meta">
                    <div>
                      <p className="payment-page__history-club">
                        {p.memberships?.clubs?.name || 'Club Payment'}
                      </p>
                      <p className="payment-page__history-date">
                        {p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </p>
                    </div>
                    <PaymentStatusBadge status={p.status} />
                  </div>
                  <div className="payment-page__history-bottom">
                    <span className="payment-page__history-amount">
                      {parseFloat(p.amount || 0).toLocaleString()} VND
                    </span>
                    {p.transaction_code && (
                      <span className="payment-page__history-code">
                        {p.transaction_code}
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function StepIndicator({ steps, current }) {
  return (
    <div className="payment-page__steps">
      {steps.map((s, i) => (
        <div key={s} className="payment-page__step">
          <div
            className={`payment-page__step-num ${i <= current ? 'payment-page__step-num--active' : ''}`}
          >
            {i + 1}
          </div>
          <span
            className={`payment-page__step-label ${i <= current ? 'payment-page__step-label--active' : ''}`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </span>
          {i < steps.length - 1 && (
            <div className={`payment-page__step-line ${i < current ? 'payment-page__step-line--done' : ''}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function SelectMembershipStep({ memberships, onSelect }) {
  return (
    <div className="payment-page__select">
      <h3 className="payment-page__section-title">Select Membership</h3>
      {memberships.length === 0 ? (
        <div className="payment-page__empty">
          <Wallet size={32} color="rgba(244,241,234,0.3)" />
          <p className="payment-page__empty-title">No active memberships</p>
          <p className="payment-page__empty-desc">
            You need to join a club first before making a payment.
          </p>
        </div>
      ) : (
        <div className="payment-page__membership-list">
          {memberships.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelect(m)}
              className="payment-page__membership-btn"
            >
              <div className="payment-page__membership-info">
                <h4 className="payment-page__membership-name">{m.clubs?.name || 'Club'}</h4>
                <p className="payment-page__membership-meta">
                  {m.position} · Joined {m.joined_at ? new Date(m.joined_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                </p>
              </div>
              <ArrowLeft size={16} className="payment-page__membership-arrow" style={{ transform: 'rotate(180deg)' }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PaymentDetailsStep({
  selectedMembership, amount, setAmount, paymentMethod, setPaymentMethod,
  note, setNote, onBack, onConfirm,
}) {
  return (
    <div className="payment-page__details">
      <div className="payment-page__details-head">
        <h3 className="payment-page__section-title">Payment Details</h3>
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={14} /> Change club
        </Button>
      </div>

      <PaymentSummary membership={selectedMembership} amount={amount} />

      <div className="payment-page__form">
        <label className="payment-page__field">
          <span className="payment-page__field-label">Amount (VND)</span>
          <input
            type="number"
            min="0"
            step="1000"
            placeholder="e.g. 100000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="payment-page__input"
          />
        </label>

        <PaymentMethod value={paymentMethod} onChange={setPaymentMethod} />

        <label className="payment-page__field">
          <span className="payment-page__field-label">Note (optional)</span>
          <textarea
            className="payment-page__textarea"
            rows={2}
            placeholder="Any additional notes..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
      </div>

      <div className="payment-page__actions">
        <Button variant="secondary" onClick={onBack}>Back</Button>
        <Button onClick={onConfirm} disabled={!amount} className="payment-page__submit">
          Proceed to Payment
        </Button>
      </div>
    </div>
  );
}

function ConfirmationStep({ processing, completedPayment, onReset }) {
  return (
    <div className="payment-page__confirm">
      {processing ? (
        <>
          <div className="payment-page__confirm-spinner">
            <LoaderIcon size={28} color="#fff" />
          </div>
          <h3 className="payment-page__confirm-title">Processing Payment...</h3>
          <p className="payment-page__confirm-desc">
            Sandbox payment is being processed. Please wait...
          </p>
        </>
      ) : completedPayment ? (
        <>
          <div className="payment-page__confirm-check">
            <Check size={36} color="#22C55E" />
          </div>
          <h3 className="payment-page__confirm-title">Payment Successful!</h3>
          {completedPayment.transaction_code && (
            <p className="payment-page__confirm-code">
              Transaction Code: <span>{completedPayment.transaction_code}</span>
            </p>
          )}
          <div className="payment-page__confirm-summary">
            <div className="payment-page__confirm-row">
              <span>Amount</span>
              <span className="payment-page__confirm-value">
                {parseFloat(completedPayment.amount || 0).toLocaleString()} VND
              </span>
            </div>
            <div className="payment-page__confirm-row">
              <span>Status</span>
              <PaymentStatusBadge status={completedPayment.status} />
            </div>
            <div className="payment-page__confirm-row">
              <span>Date</span>
              <span className="payment-page__confirm-value">
                {completedPayment.payment_date
                  ? new Date(completedPayment.payment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : '—'}
              </span>
            </div>
          </div>
          <Button variant="secondary" onClick={onReset}>Make Another Payment</Button>
        </>
      ) : (
        <>
          <h3 className="payment-page__confirm-title">Payment Recorded</h3>
          <p className="payment-page__confirm-desc">
            Your payment has been recorded and is awaiting confirmation.
          </p>
          <Button variant="secondary" onClick={onReset}>Make Another Payment</Button>
        </>
      )}
    </div>
  );
}