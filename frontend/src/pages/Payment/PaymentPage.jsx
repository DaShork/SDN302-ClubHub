import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getMembershipByProfile,
  listPaymentsByProfile,
  createSandboxPayment,
  simulateSandboxPayment,
} from '../../services/paymentService';
import { PaymentSummary } from './components/PaymentSummary';
import { PaymentMethod } from './components/PaymentMethod';
import { PaymentStatusBadge } from './components/PaymentStatusBadge';
import { SectionHeader } from '../../components/shared/SectionHeader';
import { Button } from '../../components/shared/Button';
import { Card } from '../../components/shared/Card';
import { Input } from '../../components/shared/Input';
import { Select } from '../../components/shared/Select';
import { EmptyState } from '../../components/shared/EmptyState';
import { Loader } from '../../components/shared/Loader';
import { toast } from '../../components/shared/ToastProvider';

const STEPS = ['membership', 'payment', 'confirmation'];

export default function PaymentPage() {
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
      if (!profile?.id) { setLoading(false); return; }
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
      toast('Please enter a valid amount', { type: 'error' });
      return;
    }
    setProcessing(true);
    setStep(2);

    if (paymentMethod === 'sandbox') {
      const { data, error } = await createSandboxPayment({
        membershipId: selectedMembership.id,
        amount: parseFloat(amount),
        paymentMethod: 'sandbox',
        note,
      });

      if (error) {
        toast('Payment failed: ' + error.message, { type: 'error' });
        setStep(1);
        setProcessing(false);
        return;
      }

      const result = await simulateSandboxPayment(data.id, { delayMs: 1500 });

      if (result.error || !result.data) {
        toast('Sandbox processing failed', { type: 'error' });
        setStep(1);
      } else {
        setCompletedPayment(result.data);
        toast('Payment completed successfully!', { type: 'success' });
        setRecentPayments((prev) => [result.data, ...prev]);
      }
    } else {
      const { data, error } = await createSandboxPayment({
        membershipId: selectedMembership.id,
        amount: parseFloat(amount),
        paymentMethod,
        note,
      });
      if (error) {
        toast('Failed to record payment', { type: 'error' });
        setStep(1);
      } else {
        setCompletedPayment(data);
        toast('Payment recorded successfully!', { type: 'success' });
        setRecentPayments((prev) => [data, ...prev]);
      }
    }
    setProcessing(false);
  };

  const handleReset = () => {
    setStep(0);
    setCompletedPayment(null);
    setAmount('');
    setNote('');
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  const formatCurrency = (v) =>
    v ? `${parseFloat(v).toLocaleString()} VND` : '—';

  if (loading) {
    return (
      <div className="w-full max-w-[1280px] mx-auto px-6 py-8 flex justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1280px] mx-auto px-6 py-8">
      <SectionHeader title="Club Fund" subtitle="Pay membership fees and view payment history" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left: Payment flow */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            {/* Step indicator */}
            {step < 2 && (
              <div className="flex items-center gap-2 mb-6">
                {STEPS.map((s, i) => (
                  <div key={s} className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
                      style={i <= step
                        ? { background: 'linear-gradient(90deg, #0E4B43, #22C55E)', color: '#fff' }
                        : { backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(244,241,234,0.3)' }
                      }
                    >
                      {i + 1}
                    </div>
                    <span className="text-xs font-medium hidden sm:block" style={{ color: i <= step ? '#F4F1EA' : 'rgba(244,241,234,0.3)' }}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </span>
                    {i < STEPS.length - 1 && (
                      <div className="w-6 h-px mx-1" style={{ backgroundColor: i < step ? '#22C55E' : 'rgba(255,255,255,0.1)' }} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Step 0: Select membership */}
            {step === 0 && (
              <div>
                <h3 className="text-lg font-semibold text-secondary-100 mb-4">Select Membership</h3>
                {memberships.length === 0 ? (
                  <EmptyState
                    title="No active memberships"
                    description="You need to join a club first before making a payment."
                  />
                ) : (
                  <div className="space-y-3">
                    {memberships.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => handleSelectMembership(m)}
                        className="w-full text-left p-4 rounded-xl border transition-all hover:border-accent-green"
                        style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-semibold text-secondary-100">{m.clubs?.name || 'Club'}</h4>
                            <p className="text-xs mt-1" style={{ color: 'rgba(244,241,234,0.4)' }}>
                              {m.position} · Joined {formatDate(m.joined_at)}
                            </p>
                          </div>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(244,241,234,0.3)" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6"/>
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 1: Payment details */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-secondary-100">Payment Details</h3>
                  <Button variant="ghost" size="sm" onClick={() => setStep(0)}>Change Club</Button>
                </div>
                <PaymentSummary membership={selectedMembership} amount={amount} />
                <div className="flex flex-col gap-4">
                  <Input
                    label="Amount (VND)"
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="e.g. 100000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <PaymentMethod value={paymentMethod} onChange={setPaymentMethod} />
                  <div>
                    <label className="text-sm font-medium block mb-1.5" style={{ color: 'rgba(244,241,234,0.7)' }}>Note (optional)</label>
                    <textarea
                      className="input-base !h-auto py-3 resize-none"
                      rows={2}
                      placeholder="Any additional notes..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="secondary" onClick={() => setStep(0)}>Back</Button>
                  <Button className="flex-1" onClick={handlePayment} disabled={!amount}>
                    Proceed to Payment
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Processing / Confirmation */}
            {step === 2 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                {processing ? (
                  <>
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: 'linear-gradient(90deg, #0E4B43, #22C55E)' }}>
                      <Loader size="lg" />
                    </div>
                    <h3 className="text-xl font-semibold text-secondary-100 mb-2">Processing Payment...</h3>
                    <p className="text-sm" style={{ color: 'rgba(244,241,234,0.5)' }}>
                      Sandbox payment is being processed. Please wait...
                    </p>
                  </>
                ) : completedPayment ? (
                  <>
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: 'rgba(34,197,94,0.1)' }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-secondary-100 mb-2">Payment Successful!</h3>
                    <p className="text-sm mb-4" style={{ color: 'rgba(244,241,234,0.5)' }}>
                      Transaction Code: <span className="font-mono text-accent-green">{completedPayment.transaction_code}</span>
                    </p>
                    <div className="space-y-2 mb-6 w-full max-w-xs">
                      <div className="flex justify-between text-sm">
                        <span style={{ color: 'rgba(244,241,234,0.5)' }}>Amount</span>
                        <span className="text-secondary-100 font-medium">{formatCurrency(completedPayment.amount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: 'rgba(244,241,234,0.5)' }}>Status</span>
                        <PaymentStatusBadge status={completedPayment.status} />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: 'rgba(244,241,234,0.5)' }}>Date</span>
                        <span className="text-secondary-100">{formatDate(completedPayment.payment_date)}</span>
                      </div>
                    </div>
                    <Button variant="secondary" onClick={handleReset}>Make Another Payment</Button>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-semibold text-secondary-100 mb-2">Payment Recorded</h3>
                    <p className="text-sm mb-6" style={{ color: 'rgba(244,241,234,0.5)' }}>
                      Your payment has been recorded and is awaiting confirmation.
                    </p>
                    <Button variant="secondary" onClick={handleReset}>Make Another Payment</Button>
                  </>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Right: Payment history */}
        <div>
          <h3 className="text-base font-semibold text-secondary-100 mb-4">Recent Payments</h3>
          {recentPayments.length === 0 ? (
            <Card className="p-6">
              <EmptyState
                title="No payments yet"
                description="Your payment history will appear here."
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {recentPayments.map((p) => (
                <Card key={p.id} className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-secondary-100 truncate">
                        {p.memberships?.clubs?.name || 'Club Payment'}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(244,241,234,0.4)' }}>
                        {formatDate(p.payment_date)}
                      </p>
                    </div>
                    <PaymentStatusBadge status={p.status} />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-semibold text-accent-green">{formatCurrency(p.amount)}</span>
                    {p.transaction_code && (
                      <span className="text-xs font-mono" style={{ color: 'rgba(244,241,234,0.3)' }}>
                        {p.transaction_code}
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
