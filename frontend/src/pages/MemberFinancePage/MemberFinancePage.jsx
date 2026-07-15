import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Wallet, History, RefreshCw } from 'lucide-react';
import { Card, Button, toast } from '@/components';
import { useAuth } from '@/hooks/useAuth.jsx';
import { useMemberScope } from '@/contexts/MemberScopeContext.jsx';
import { feeSettingsService } from '@/services/feeSettingsService';
import { financeService } from '@/services/financeService';
import './MemberFinancePage.css';

/* MemberFinancePage — shows the current month fee status for each of the
 * member's clubs plus a payment history.
 *
 * Status is derived: a club is "Đã đóng" when a payments row exists for
 * the user's membership with status='completed' and payment_date in the
 * current calendar month. The expected amount is read from
 * club_fee_settings.monthly_amount (set by the club leader).
 *
 * Members pay through `financeService.recordPayment`, which inserts a
 * completed payment row (this is the same primitive the leader uses
 * when recording offline payments on behalf of a member).
 */
export default function MemberFinancePage() {
  const { profileId } = useAuth();
  const { memberClubs, loading: memberLoading, refresh } = useMemberScope();
  const [rows, setRows] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingMembershipId, setPayingMembershipId] = useState(null);

  async function loadAll() {
    if (memberClubs.length === 0) {
      setRows([]);
      setHistory([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const ids = memberClubs.map((m) => m.clubId);
      const [feeSettings, payments] = await Promise.all([
        feeSettingsService.getMany(ids),
        financeService.getUserPayments(profileId).catch(() => []),
      ]);
      const feeMap = {};
      feeSettings.forEach((f) => { feeMap[f.club_id] = f; });

      // Pre-bucket payments per membership for fast month lookup.
      const paymentsByMembership = {};
      (payments || []).forEach((p) => {
        const mid = p.memberships?.id;
        if (!mid) return;
        paymentsByMembership[mid] = paymentsByMembership[mid] || [];
        paymentsByMembership[mid].push(p);
      });

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const enriched = memberClubs.map((m) => {
        const fee = feeMap[m.clubId];
        const allPayments = paymentsByMembership[m.membershipId] || [];
        const thisMonth = allPayments.find(
          (p) =>
            p.status === 'completed' &&
            new Date(p.payment_date) >= monthStart &&
            new Date(p.payment_date) < monthEnd
        );
        return {
          membershipId: m.membershipId,
          clubId: m.clubId,
          clubName: m.club?.name || '—',
          clubLogo: m.club?.logo_url,
          position: m.position,
          monthlyAmount: fee ? Number(fee.monthly_amount) : 0,
          currency: fee?.currency || 'VND',
          paid: Boolean(thisMonth),
          lastPayment: allPayments[0] || null,
          allPayments: allPayments.slice(0, 5),
        };
      });

      setRows(enriched);
      setHistory((payments || []).slice(0, 10));
    } catch (err) {
      console.error('MemberFinancePage load failed:', err);
      toast('Không thể tải dữ liệu quỹ', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (memberLoading) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberLoading, memberClubs.length, profileId]);

  async function handlePay(row) {
    if (row.monthlyAmount <= 0) {
      toast('CLB này chưa thiết lập mệnh giá quỹ.', { variant: 'error' });
      return;
    }
    try {
      setPayingMembershipId(row.membershipId);
      await financeService.recordPayment(
        row.membershipId,
        row.monthlyAmount,
        'sandbox',
        `Auto-pay tháng ${new Date().toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })}`
      );
      toast(`Đã ghi nhận đóng quỹ cho ${row.clubName}.`, { variant: 'success' });
      loadAll();
      refresh();
    } catch (err) {
      console.error(err);
      toast('Không thể đóng quỹ. Vui lòng thử lại.', { variant: 'error' });
    } finally {
      setPayingMembershipId(null);
    }
  }

  if (memberLoading || loading) {
    return (
      <div className="member-finance">
        <div className="member-finance__loading">
          <div className="member-finance__spinner" />
          <p>Đang tải dữ liệu quỹ…</p>
        </div>
      </div>
    );
  }

  const paidCount = rows.filter((r) => r.paid).length;
  const unpaidCount = rows.length - paidCount;
  const totalOwed = rows
    .filter((r) => !r.paid && r.monthlyAmount > 0)
    .reduce((s, r) => s + r.monthlyAmount, 0);

  return (
    <div className="member-finance">
      <div className="member-finance__header">
        <div>
          <h1 className="member-finance__title">Đóng quỹ</h1>
          <p className="member-finance__subtitle">
            Theo dõi đóng quỹ theo tháng cho các CLB bạn đang tham gia.
          </p>
        </div>
        <Button variant="secondary" onClick={() => { loadAll(); refresh(); }}>
          <RefreshCw size={16} /> Tải lại
        </Button>
      </div>

      {rows.length === 0 ? (
        <Card>
          <div className="member-finance__empty">
            <Wallet size={36} />
            <h3>Bạn chưa tham gia CLB nào có quỹ.</h3>
            <p>Tham gia một CLB đang tuyển thành viên để bắt đầu đóng quỹ.</p>
          </div>
        </Card>
      ) : (
        <>
          <div className="member-finance__summary">
            <Card className="member-finance__summary-card">
              <span className="member-finance__summary-label">Đã đóng tháng này</span>
              <span className="member-finance__summary-value member-finance__summary-value--green">
                {paidCount}
              </span>
            </Card>
            <Card className="member-finance__summary-card">
              <span className="member-finance__summary-label">Chưa đóng</span>
              <span className="member-finance__summary-value member-finance__summary-value--red">
                {unpaidCount}
              </span>
            </Card>
            <Card className="member-finance__summary-card">
              <span className="member-finance__summary-label">Tổng cần đóng</span>
              <span className="member-finance__summary-value">
                {totalOwed.toLocaleString('vi-VN')}
              </span>
            </Card>
          </div>

          <Card>
            <div className="member-finance__list">
              {rows.map((row) => (
                <div key={row.membershipId} className="member-finance__row">
                  <div className="member-finance__row-club">
                    {row.clubLogo ? (
                      <img src={row.clubLogo} alt={row.clubName} className="member-finance__row-logo" />
                    ) : (
                      <div className="member-finance__row-logo-placeholder">
                        {row.clubName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="member-finance__row-name">{row.clubName}</div>
                      <div className="member-finance__row-position">{row.position}</div>
                    </div>
                  </div>
                  <div className="member-finance__row-amount">
                    <span className="member-finance__row-amount-label">Mệnh giá</span>
                    <span className="member-finance__row-amount-value">
                      {row.monthlyAmount > 0
                        ? `${row.monthlyAmount.toLocaleString('vi-VN')} ${row.currency}`
                        : 'Chưa thiết lập'}
                    </span>
                  </div>
                  <div className="member-finance__row-status">
                    {row.paid ? (
                      <span className="member-finance__status member-finance__status--paid">
                        <CheckCircle2 size={14} /> Đã đóng
                      </span>
                    ) : row.monthlyAmount > 0 ? (
                      <span className="member-finance__status member-finance__status--unpaid">
                        <AlertCircle size={14} /> Chưa đóng
                      </span>
                    ) : (
                      <span className="member-finance__status member-finance__status--none">
                        Không yêu cầu
                      </span>
                    )}
                  </div>
                  <div className="member-finance__row-action">
                    {!row.paid && row.monthlyAmount > 0 && (
                      <Button
                        onClick={() => handlePay(row)}
                        disabled={payingMembershipId === row.membershipId}
                      >
                        {payingMembershipId === row.membershipId ? 'Đang xử lý…' : 'Đóng quỹ'}
                      </Button>
                    )}
                    {row.paid && row.lastPayment && (
                      <span className="member-finance__row-last">
                        {new Date(row.lastPayment.payment_date).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="member-finance__history-head">
              <h3>
                <History size={16} /> Lịch sử đóng quỹ
              </h3>
              <span className="member-finance__count">{history.length} giao dịch gần nhất</span>
            </div>
            {history.length === 0 ? (
              <div className="member-finance__state">Chưa có giao dịch nào.</div>
            ) : (
              <table className="member-finance__history-table">
                <thead>
                  <tr>
                    <th>Ngày</th>
                    <th>CLB</th>
                    <th>Số tiền</th>
                    <th>Phương thức</th>
                    <th>Mã GD</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((p) => (
                    <tr key={p.id}>
                      <td>{new Date(p.payment_date).toLocaleDateString('vi-VN')}</td>
                      <td>{p.memberships?.clubs?.name || '—'}</td>
                      <td className="member-finance__history-amount">
                        {Number(p.amount).toLocaleString('vi-VN')} {p.currency || 'VND'}
                      </td>
                      <td>{p.payment_method || 'sandbox'}</td>
                      <td><code>{p.transaction_code || '—'}</code></td>
                      <td>
                        <span className={`member-finance__history-status member-finance__history-status--${p.status}`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}
    </div>
  );
}