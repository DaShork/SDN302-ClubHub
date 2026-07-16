import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, History, CreditCard, ArrowRight, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import { Card, Button, toast } from '@/components';
import { useAuth } from '@/hooks/useAuth.jsx';
import { financeService } from '@/services/financeService.js';
import { feeSettingsService } from '@/services/feeSettingsService.js';
import { ROLES } from '@/auth/rolePermissions.js';
import PaymentModal from '@/components/PaymentModal/PaymentModal.jsx';
import './FinancePage.css';

const STATUS_META = {
  completed: { label: 'Hoàn thành', icon: CheckCircle2, color: '#22C55E' },
  pending: { label: 'Đang chờ', icon: Clock, color: '#F59E0B' },
  failed: { label: 'Thất bại', icon: XCircle, color: '#EF4444' },
  refunded: { label: 'Đã hoàn tiền', icon: AlertCircle, color: '#6B7280' },
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount || 0);
}

export default function FinancePageContent() {
  const { profile, role } = useAuth();
  const [memberships, setMemberships] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [paymentModal, setPaymentModal] = useState(null);

  const isLeader = role === ROLES.CLUB_LEADER;
  const isMember = role === ROLES.CLUB_MEMBER;

  useEffect(() => {
    if (!profile?.id) return;
    loadData();
  }, [profile?.id]);

  async function loadData() {
    setLoading(true);
    try {
      const [feesData, paymentsData] = await Promise.all([
        financeService.getUserClubFees(profile.id),
        financeService.getUserPayments(profile.id),
      ]);
      const clubIds = (feesData || []).map(m => m.clubs?.id).filter(Boolean);
      const [feesSettings] = await Promise.all([
        clubIds.length ? feeSettingsService.getMany(clubIds) : Promise.resolve([]),
      ]);
      // Merge fee data into memberships for display
      const feeMap = {};
      (feesSettings || []).forEach(f => { feeMap[f.club_id] = f; });
      const enriched = (feesData || []).map(m => ({
        ...m,
        fee: feeMap[m.clubs?.id] || null,
      }));
      setMemberships(enriched);
      setPayments(paymentsData || []);
    } catch (err) {
      console.error('Failed to load finance data:', err);
      toast('Không thể tải dữ liệu tài chính', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }

  const totalPaid = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const totalPending = payments
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  if (loading) {
    return (
      <div className="finance-page">
        <div className="finance-page__container">
          <div className="finance-page__loading">
            <div className="finance-page__spinner" />
            <p>Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="finance-page">
      <div className="finance-page__container">
        <div className="finance-page__header">
          <div>
            <h1 className="finance-page__title">Tài Chính CLB</h1>
            <p className="finance-page__subtitle">
              Quản lý phí và lịch sử thanh toán của bạn
            </p>
          </div>
        </div>

        {memberships.length === 0 ? (
          <Card className="finance-page__empty">
            <div className="finance-page__empty-content">
              <Wallet size={48} className="finance-page__empty-icon" />
              <h3>Chưa tham gia CLB nào</h3>
              <p>Tham gia một CLB để xem thông tin tài chính</p>
              <Link to="/clubs">
                <Button>Khám phá CLB</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <>
            <div className="finance-page__stats">
              <Card className="finance-page__stat-card">
                <div className="finance-page__stat-icon" style={{ background: '#F0FDF4' }}>
                  <CheckCircle2 size={24} style={{ color: '#22C55E' }} />
                </div>
                <div className="finance-page__stat-info">
                  <span className="finance-page__stat-label">Đã thanh toán</span>
                  <span className="finance-page__stat-value" style={{ color: '#22C55E' }}>
                    {formatCurrency(totalPaid)}
                  </span>
                </div>
              </Card>

              <Card className="finance-page__stat-card">
                <div className="finance-page__stat-icon" style={{ background: '#FFFBEB' }}>
                  <Clock size={24} style={{ color: '#F59E0B' }} />
                </div>
                <div className="finance-page__stat-info">
                  <span className="finance-page__stat-label">Đang chờ</span>
                  <span className="finance-page__stat-value" style={{ color: '#F59E0B' }}>
                    {formatCurrency(totalPending)}
                  </span>
                </div>
              </Card>

              <Card className="finance-page__stat-card">
                <div className="finance-page__stat-icon" style={{ background: '#F3F4F6' }}>
                  <CreditCard size={24} style={{ color: '#6B7280' }} />
                </div>
                <div className="finance-page__stat-info">
                  <span className="finance-page__stat-label">Số dịch vụ</span>
                  <span className="finance-page__stat-value" style={{ color: '#06231D' }}>
                    {memberships.length}
                  </span>
                </div>
              </Card>
            </div>

            <div className="finance-page__tabs">
              <button
                className={`finance-page__tab ${activeTab === 'overview' ? 'finance-page__tab--active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <Wallet size={18} />
                Phí CLB
              </button>
              <button
                className={`finance-page__tab ${activeTab === 'history' ? 'finance-page__tab--active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                <History size={18} />
                Lịch sử
              </button>
            </div>

            {activeTab === 'overview' && (
              <div className="finance-page__clubs">
                {memberships.map((m) => (
                  <Card key={m.id} className="finance-page__club-card">
                    <div className="finance-page__club-header">
                      {m.clubs?.logo_url ? (
                        <img
                          src={m.clubs.logo_url}
                          alt={m.clubs.name}
                          className="finance-page__club-logo"
                        />
                      ) : (
                        <div className="finance-page__club-logo-placeholder">
                          {m.clubs?.name?.charAt(0) || 'C'}
                        </div>
                      )}
                      <div className="finance-page__club-info">
                        <h3 className="finance-page__club-name">{m.clubs?.name}</h3>
                        <span className="finance-page__club-position">{m.position}</span>
                      </div>
                    </div>

                    <div className="finance-page__club-payment">
                      <div className="finance-page__club-payment-row">
                        <span>Trạng thái</span>
                        <span className="finance-page__club-status finance-page__club-status--active">
                          Active
                        </span>
                      </div>
                      <div className="finance-page__club-payment-row">
                        <span>Phương thức</span>
                        <span>Sandbox</span>
                      </div>
                    </div>

                    {isMember && (
                      <div className="finance-page__club-actions">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setPaymentModal({
                            membershipId: m.id,
                            clubName: m.clubs?.name,
                            amount: m.fee?.monthly_amount || 0,
                            currency: m.fee?.currency || 'VND',
                          })}
                        >
                          Thanh toán
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}

            {activeTab === 'history' && (
              <Card className="finance-page__history">
                <h2 className="finance-page__section-title">
                  <History size={20} />
                  Lịch sử thanh toán
                </h2>

                {payments.length === 0 ? (
                  <div className="finance-page__history-empty">
                    <p>Chưa có giao dịch nào</p>
                  </div>
                ) : (
                  <div className="finance-page__history-list">
                    {payments.map((payment) => {
                      const meta = STATUS_META[payment.status] || STATUS_META.pending;
                      const Icon = meta.icon;
                      return (
                        <div key={payment.id} className="finance-page__history-item">
                          <div
                            className="finance-page__history-icon"
                            style={{ background: `${meta.color}20` }}
                          >
                            <Icon size={18} style={{ color: meta.color }} />
                          </div>
                          <div className="finance-page__history-info">
                            <span className="finance-page__history-club">
                              {payment.memberships?.clubs?.name}
                            </span>
                            <span className="finance-page__history-date">
                              {formatDate(payment.payment_date)}
                            </span>
                          </div>
                          <div className="finance-page__history-right">
                            <span className="finance-page__history-amount">
                              {formatCurrency(payment.amount)}
                            </span>
                            <span
                              className="finance-page__history-status"
                              style={{ color: meta.color }}
                            >
                              {meta.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            )}
          </>
        )}
      </div>

      <PaymentModal
        isOpen={!!paymentModal}
        onClose={() => setPaymentModal(null)}
        membership={paymentModal?.membershipId}
        clubName={paymentModal?.clubName}
        amount={paymentModal?.amount}
        currency={paymentModal?.currency}
        onSuccess={() => {
          setPaymentModal(null);
          loadData();
        }}
      />
    </div>
  );
}
