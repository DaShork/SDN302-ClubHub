import { useEffect, useState } from "react";
import { Wallet, Edit2, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, Button, Input, toast } from "@/components";
import { LeaderDashboardHeader, LeaderEmptyState, Loading } from "@/components";
import { useLeaderScope } from "@/contexts/LeaderScopeContext.jsx";
import { useAuth } from "@/hooks/useAuth.jsx";
import { feeSettingsService } from "@/services/feeSettingsService";
import { supabase } from "@/services/supabase";
import "./FinancePage.css";

/**
 * LeaderFinancePage — finance landing for the leader dashboard.
 *
 * In addition to the per-club navigation cards, the leader can:
 *   - Set the monthly club fee amount (one row per club in club_fee_settings)
 *   - See a quick "thu tháng này" snapshot for the selected club:
 *     paid / unpaid counts and total collected.
 *
 * Members see this same amount on /member/finance.
 */
export default function LeaderFinancePage() {
  const { ledClubs, loading: leaderLoading, isAllScope, selectedClub } = useLeaderScope();
  const { profileId } = useAuth();

  const [feeMap, setFeeMap] = useState({});
  const [editing, setEditing] = useState(null);
  const [stats, setStats] = useState({}); // clubId -> { paidCount, unpaidCount, total }
  const [loading, setLoading] = useState(true);

  async function load() {
    if (ledClubs.length === 0) {
      setFeeMap({});
      setStats({});
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const ids = ledClubs.map((c) => c.id);
      const feeSettings = await feeSettingsService.getMany(ids);
      const map = {};
      feeSettings.forEach((f) => { map[f.club_id] = f; });
      setFeeMap(map);

      // Aggregate stats for the current month for every club
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const perClubStats = await Promise.all(
        ids.map(async (id) => {
          const [membersRes, paymentsRes] = await Promise.all([
            supabase
              .from('memberships')
              .select('id', { count: 'exact', head: true })
              .eq('club_id', id)
              .eq('status', 'active'),
            supabase
              .from('payments')
              .select('id, amount, payment_date, status, membership_id')
              .eq('memberships.club_id', id)
              .eq('status', 'completed')
              .gte('payment_date', monthStart.toISOString())
              .lt('payment_date', monthEnd.toISOString()),
          ]);
          const memberCount = membersRes.count || 0;
          const payments = paymentsRes.data || [];
          const paidMembershipIds = new Set(payments.map((p) => p.membership_id));
          const total = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
          return {
            clubId: id,
            paidCount: paidMembershipIds.size,
            unpaidCount: Math.max(0, memberCount - paidMembershipIds.size),
            total,
          };
        })
      );
      const statsMap = {};
      perClubStats.forEach((s) => { statsMap[s.clubId] = s; });
      setStats(statsMap);
    } catch (err) {
      console.error('LeaderFinancePage load failed:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (leaderLoading) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaderLoading, ledClubs.length]);

  async function handleSaveFee(clubId, amount, currency = 'VND') {
    try {
      await feeSettingsService.upsert({
        clubId,
        monthlyAmount: Number(amount),
        currency,
        actorId: profileId,
      });
      toast('Đã cập nhật mệnh giá quỹ.', { variant: 'success' });
      setEditing(null);
      load();
    } catch (err) {
      console.error(err);
      toast('Không thể lưu mệnh giá.', { variant: 'error' });
    }
  }

  if (leaderLoading || loading) {
    return <Loading fullScreen />;
  }

  if (!leaderLoading && ledClubs.length === 0) {
    return (
      <>
        <LeaderDashboardHeader
          ledClubs={ledClubs}
          eyebrow="Finance"
          title="Finance Overview"
          subtitle="Track club fees and payment activity across the clubs you lead."
        />
        <LeaderEmptyState />
      </>
    );
  }

  const eyebrow = isAllScope
    ? `Finance across ${ledClubs.length} club${ledClubs.length === 1 ? "" : "s"}`
    : selectedClub
      ? `Finance of ${selectedClub.name}`
      : "Finance";

  return (
    <>
      <LeaderDashboardHeader
        ledClubs={ledClubs}
        eyebrow={eyebrow}
        title="Finance Overview"
        subtitle="Set the monthly club fee and track who has paid this month."
      />

      <div className="finance-page__leader-grid">
        {ledClubs.map((club) => {
          const fee = feeMap[club.id];
          const stat = stats[club.id] || { paidCount: 0, unpaidCount: 0, total: 0 };
          return (
            <Card key={club.id} className="finance-page__leader-card">
              <div className="finance-page__leader-card-head">
                <Wallet size={20} />
                <h3>{club.name}</h3>
              </div>

              <div className="finance-page__fee-block">
                <div className="finance-page__fee-row">
                  <span className="finance-page__fee-label">Mệnh giá quỹ/tháng</span>
                  {fee ? (
                    <span className="finance-page__fee-value">
                      {Number(fee.monthly_amount).toLocaleString('vi-VN')} {fee.currency}
                    </span>
                  ) : (
                    <span className="finance-page__fee-value finance-page__fee-value--missing">
                      Chưa thiết lập
                    </span>
                  )}
                </div>
                <Button
                  variant="secondary"
                  onClick={() => setEditing({
                    clubId: club.id,
                    clubName: club.name,
                    amount: fee?.monthly_amount ?? 0,
                    currency: fee?.currency ?? 'VND',
                  })}
                >
                  <Edit2 size={14} /> {fee ? 'Sửa mệnh giá' : 'Thiết lập mệnh giá'}
                </Button>
              </div>

              <div className="finance-page__fee-stats">
                <div className="finance-page__fee-stat finance-page__fee-stat--paid">
                  <CheckCircle2 size={14} />
                  <span>{stat.paidCount} đã đóng</span>
                </div>
                <div className="finance-page__fee-stat finance-page__fee-stat--unpaid">
                  <AlertCircle size={14} />
                  <span>{stat.unpaidCount} chưa đóng</span>
                </div>
                <div className="finance-page__fee-stat finance-page__fee-stat--total">
                  <span className="finance-page__fee-stat-amount">
                    {Number(stat.total).toLocaleString('vi-VN')} VND
                  </span>
                  <small>đã thu tháng này</small>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {editing && (
        <FeeEditModal
          editing={editing}
          onClose={() => setEditing(null)}
          onSave={(amount, currency) => handleSaveFee(editing.clubId, amount, currency)}
        />
      )}
    </>
  );
}

function FeeEditModal({ editing, onClose, onSave }) {
  const [amount, setAmount] = useState(String(editing.amount || ''));
  const [currency, setCurrency] = useState(editing.currency || 'VND');

  return (
    <div className="finance-page__modal-overlay" onClick={onClose}>
      <div className="finance-page__modal" onClick={(e) => e.stopPropagation()}>
        <div className="finance-page__modal-header">
          <h3>Thiết lập mệnh giá quỹ</h3>
          <p>{editing.clubName}</p>
        </div>
        <div className="finance-page__modal-body">
          <label className="finance-page__field">
            <span>Mệnh giá / tháng</span>
            <Input
              type="number"
              min="0"
              step="1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="VD: 50000"
            />
          </label>
          <label className="finance-page__field">
            <span>Đơn vị tiền tệ</span>
            <select
              className="finance-page__select"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="VND">VND</option>
              <option value="USD">USD</option>
            </select>
          </label>
          <p className="finance-page__modal-hint">
            Đặt <strong>0</strong> nếu CLB không thu quỹ. Thành viên sẽ thấy mệnh giá này ở trang Finance của họ.
          </p>
        </div>
        <div className="finance-page__modal-footer">
          <Button variant="secondary" onClick={onClose}>Huỷ</Button>
          <Button
            onClick={() => {
              const n = Number(amount);
              if (Number.isNaN(n) || n < 0) {
                toast('Vui lòng nhập số hợp lệ.', { variant: 'error' });
                return;
              }
              onSave(n, currency);
            }}
          >
            Lưu mệnh giá
          </Button>
        </div>
      </div>
    </div>
  );
}