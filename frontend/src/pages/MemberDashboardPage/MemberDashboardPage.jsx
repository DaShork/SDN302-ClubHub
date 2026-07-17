import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  RefreshCw, Building2, Users, Calendar, Megaphone,
  BookOpen, Wallet, ChevronRight,
  CalendarDays, Clock, MapPin, CheckCircle2, Compass,
} from 'lucide-react';
import { Card, Button } from '@/components';
import { useMemberScope } from '@/contexts/MemberScopeContext.jsx';
import { useAuth } from '@/hooks/useAuth.jsx';
import { supabase } from '@/services/supabase';
import { financeService } from '@/services/financeService';
import { eventService } from '@/services/eventService';
import './MemberDashboardPage.css';

/* MemberDashboardPage — landing screen for Club Member role.
 *
 * Shows quick stats across the member's clubs (members count, upcoming
 * events, documents, knowledge articles) plus a fee-status snapshot for
 * the current month (how many clubs have been paid, how many are still
 * owed). Links to the sub-pages for the rest.
 */
export default function MemberDashboardPage() {
  const { memberClubs, memberClubIds, loading: memberLoading, refresh } = useMemberScope();
  const { profileId } = useAuth();
  const [stats, setStats] = useState({
    members: 0,
    events: 0,
    documents: 0,
    knowledge: 0,
    workshops: 0,
  });
  const [feeSummary, setFeeSummary] = useState({
    paidCount: 0,
    unpaidCount: 0,
    currency: 'VND',
  });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // ── "Sự kiện sắp tới của tôi" embedded tab ─────────────────────────────
  // Reuses getUserRegistrations so the data structure matches /my-registrations.
  const REG_TABS = [
    { id: 'upcoming', label: 'Sắp diễn ra' },
    { id: 'past',     label: 'Đã qua' },
    { id: 'cancelled',label: 'Đã hủy' },
  ];
  const [activeRegTab, setActiveRegTab] = useState('upcoming');
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loadingRegs, setLoadingRegs] = useState(true);
  const [cancellingRegId, setCancellingRegId] = useState(null);

  async function loadStats() {
    if (memberClubIds.length === 0) {
      setStats({ members: 0, events: 0, documents: 0, knowledge: 0, workshops: 0 });
      setFeeSummary({ paidCount: 0, unpaidCount: 0, currency: 'VND' });
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setErrorMsg(null);
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [membersRes, eventsRes, docsRes, knowRes, workRes, paymentsRes, feeSettingsRes] =
        await Promise.all([
          supabase
            .from('memberships')
            .select('club_id', { count: 'exact', head: true })
            .in('club_id', memberClubIds)
            .eq('status', 'active'),
          supabase
            .from('events')
            .select('id', { count: 'exact', head: true })
            .in('club_id', memberClubIds)
            .gte('start_time', now.toISOString())
            .neq('status', 'cancelled'),
          supabase
            .from('documents')
            .select('id', { count: 'exact', head: true })
            .in('club_id', memberClubIds),
          supabase
            .from('knowledge_articles')
            .select('id', { count: 'exact', head: true })
            .in('club_id', memberClubIds),
          supabase
            .from('workshops')
            .select('id', { count: 'exact', head: true })
            .in('club_id', memberClubIds),
          financeService.getUserPayments(profileId).catch(() => []),
          supabase
            .from('club_fee_settings')
            .select('club_id, monthly_amount, currency')
            .in('club_id', memberClubIds),
        ]);

      setStats({
        members: membersRes.count || 0,
        events: eventsRes.count || 0,
        documents: docsRes.count || 0,
        knowledge: knowRes.count || 0,
        workshops: workRes.count || 0,
      });

      // Paid for current month = a payment row exists for this membership
      // with payment_date >= first-of-this-month.
      const paidMembershipIds = new Set();
      (paymentsRes || [])
        .filter((p) => p.status === 'completed' && new Date(p.payment_date) >= new Date(monthStart))
        .forEach((p) => {
          if (p.memberships?.id) paidMembershipIds.add(p.memberships.id);
        });

      const feeMap = {};
      (feeSettingsRes.data || []).forEach((f) => { feeMap[f.club_id] = f; });

      let paidCount = 0;
      let unpaidCount = 0;
      let firstCurrency = 'VND';
      memberClubs.forEach((m) => {
        const fee = feeMap[m.clubId];
        if (fee) {
          firstCurrency = fee.currency || firstCurrency;
          if (Number(fee.monthly_amount) === 0) return; // 0 = no fee required
        }
        if (paidMembershipIds.has(m.membershipId)) paidCount += 1;
        else unpaidCount += 1;
      });
      setFeeSummary({ paidCount, unpaidCount, currency: firstCurrency });
    } catch (err) {
      console.error('[MemberDashboard] load failed:', err);
      setErrorMsg('Không thể tải dữ liệu dashboard.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (memberLoading) return;
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberLoading, memberClubIds.join(',')]);

  // ── Load my-registrations whenever the user clicks a reg tab ──────────
  async function loadMyRegistrations() {
    if (!profileId) {
      setMyRegistrations([]);
      setLoadingRegs(false);
      return;
    }
    try {
      setLoadingRegs(true);
      const rows = await eventService.getUserRegistrations(profileId).catch(() => []);
      const enriched = rows
        .filter((r) => r.events)
        .map((r) => ({ ...r.events, registration: r }));
      setMyRegistrations(enriched);
    } catch (err) {
      console.error('[MemberDashboard] load regs failed:', err);
    } finally {
      setLoadingRegs(false);
    }
  }
  useEffect(() => {
    if (profileId) loadMyRegistrations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  const handleCancelRegistration = async (event) => {
    if (!window.confirm(`Hủy đăng ký "${event.title}"?`)) return;
    try {
      setCancellingRegId(event.id);
      await eventService.cancelEventRegistration(event.id, profileId);
      await Promise.all([loadMyRegistrations(), loadStats()]);
    } catch (err) {
      console.error('Cancel failed:', err);
      window.alert('Không thể hủy đăng ký. Vui lòng thử lại.');
    } finally {
      setCancellingRegId(null);
    }
  };

  if (memberLoading) {
    return (
      <div className="member-dashboard">
        <div className="member-dashboard__loading">
          <div className="member-dashboard__spinner" />
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (memberClubs.length === 0) {
    return (
      <div className="member-dashboard">
        <div className="member-dashboard__header">
          <div>
            <h1 className="member-dashboard__title">Member Dashboard</h1>
            <p className="member-dashboard__subtitle">
              Theo dõi hoạt động CLB bạn đang tham gia với vai trò thành viên.
            </p>
          </div>
        </div>
        <div className="member-dashboard__empty">
          <Building2 size={36} />
          <h3>Bạn chưa tham gia CLB nào.</h3>
          <p>Khám phá và đăng ký tham gia các CLB đang tuyển thành viên.</p>
          <Link to="/clubs" className="member-dashboard__cta">
            Khám phá CLB <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  const feeSummaryClass = feeSummary.unpaidCount === 0
    ? 'member-dashboard__fee-summary--ok'
    : 'member-dashboard__fee-summary--warn';

  return (
    <div className="member-dashboard">
      <div className="member-dashboard__header">
        <div>
          <h1 className="member-dashboard__title">Member Dashboard</h1>
          <p className="member-dashboard__subtitle">
            Bạn đang tham gia <strong>{memberClubs.length}</strong> CLB.
          </p>
        </div>
        <div className="member-dashboard__header-actions">
          <Button variant="secondary" onClick={() => { loadStats(); refresh(); }}>
            <RefreshCw size={16} /> Tải lại
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="member-dashboard__warn">⚠️ {errorMsg}</div>
      )}

      <div className="member-dashboard__section">
        <h2 className="member-dashboard__section-title">Tổng quan</h2>
        <div className="member-dashboard__stats">
          <StatCard
            icon={Building2}
            label="CLB tham gia"
            value={memberClubs.length}
            color="#22C55E"
            bgColor="#F0FDF4"
          />
          <StatCard
            icon={Users}
            label="Tổng thành viên"
            value={stats.members}
            color="#3B82F6"
            bgColor="#EFF6FF"
          />
          <StatCard
            icon={Calendar}
            label="Sự kiện sắp tới"
            value={stats.events}
            color="#F59E0B"
            bgColor="#FFFBEB"
          />
          <StatCard
            icon={BookOpen}
            label="Knowledge"
            value={stats.knowledge}
            color="#8B5CF6"
            bgColor="#F5F3FF"
          />
        </div>
      </div>

      <div className="member-dashboard__section">
        <h2 className="member-dashboard__section-title">Quỹ tháng này</h2>
        <Card>
          <div className={`member-dashboard__fee-summary ${feeSummaryClass}`}>
            <div className="member-dashboard__fee-row">
              <div className="member-dashboard__fee-stat">
                <span className="member-dashboard__fee-label">Đã đóng</span>
                <span className="member-dashboard__fee-value member-dashboard__fee-value--green">
                  {feeSummary.paidCount}
                </span>
              </div>
              <div className="member-dashboard__fee-divider" />
              <div className="member-dashboard__fee-stat">
                <span className="member-dashboard__fee-label">Chưa đóng</span>
                <span className="member-dashboard__fee-value member-dashboard__fee-value--red">
                  {feeSummary.unpaidCount}
                </span>
              </div>
              <div className="member-dashboard__fee-divider" />
              <div className="member-dashboard__fee-stat">
                <span className="member-dashboard__fee-label">Đơn vị</span>
                <span className="member-dashboard__fee-value">{feeSummary.currency}</span>
              </div>
            </div>
            <Link to="/member/finance" className="member-dashboard__fee-link">
              Xem chi tiết <ChevronRight size={16} />
            </Link>
          </div>
          {loading && (
            <div className="member-dashboard__loading-inline">
              <div className="member-dashboard__spinner member-dashboard__spinner--small" />
              Đang tổng hợp…
            </div>
          )}
        </Card>
      </div>

      <div className="member-dashboard__section">
        <h2 className="member-dashboard__section-title">Truy cập nhanh</h2>
        <div className="member-dashboard__quick-actions">
          <QuickAction to="/member/clubs" icon={Building2} label="CLB của tôi" color="#22C55E" />
          <QuickAction to="/member/finance" icon={Wallet} label="Đóng quỹ" color="#16685D" />
          <QuickAction to="/my-registrations" icon={Calendar} label="Sự kiện đã đăng ký" color="#F59E0B" />
          <QuickAction to="/announcements" icon={Megaphone} label="Thông báo" color="#8B5CF6" />
        </div>
      </div>

      <div className="member-dashboard__section">
        <div className="member-dashboard__section-head">
          <h2 className="member-dashboard__section-title">Sự kiện sắp tới của tôi</h2>
          <Link to="/my-registrations" className="member-dashboard__see-all">
            Xem tất cả <ChevronRight size={14} />
          </Link>
        </div>

        <div className="member-dashboard__reg-tabs" role="tablist">
          {REG_TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeRegTab === tab.id}
              onClick={() => setActiveRegTab(tab.id)}
              className={`member-dashboard__reg-tab ${activeRegTab === tab.id ? 'member-dashboard__reg-tab--active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <MyRegistrationsPanel
          tab={activeRegTab}
          rows={myRegistrations}
          loading={loadingRegs}
          cancellingId={cancellingRegId}
          onCancel={handleCancelRegistration}
        />
      </div>
    </div>
  );
}

const regNow = () => new Date();
function filterRegistrations(rows, tab) {
  const now = regNow();
  return rows.filter(({ registration: r, start_time }) => {
    if (tab === 'cancelled') return r.status === 'cancelled';
    if (r.status === 'cancelled') return false;
    if (tab === 'upcoming') return new Date(start_time) >= now;
    return new Date(start_time) < now;
  });
}

function MyRegistrationsPanel({ tab, rows, loading, cancellingId, onCancel }) {
  if (loading) {
    return (
      <div className="member-dashboard__loading-inline">
        <div className="member-dashboard__spinner member-dashboard__spinner--small" />
        Đang tải sự kiện…
      </div>
    );
  }

  const filtered = filterRegistrations(rows, tab);

  if (filtered.length === 0) {
    const emptyMessages = {
      upcoming: 'Bạn chưa đăng ký sự kiện nào sắp tới.',
      past: 'Chưa có sự kiện đã qua.',
      cancelled: 'Không có đăng ký nào đã hủy.',
    };
    return (
      <Card>
        <div className="member-dashboard__reg-empty">
          <Compass size={32} />
          <p>{emptyMessages[tab]}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="member-dashboard__reg-list">
      {filtered.map((event) => (
        <MyEventRow
          key={event.id}
          event={event}
          cancelling={cancellingId === event.id}
          onCancel={() => onCancel(event)}
        />
      ))}
    </div>
  );
}

function MyEventRow({ event, cancelling, onCancel }) {
  const { title, start_time, location, clubs, registration } = event;
  const checkedIn = registration?.status === 'checked_in';
  const cancelled = registration?.status === 'cancelled';
  const pending = registration?.status === 'pending';

  return (
    <Card className="member-dashboard__reg-row">
      <div className="member-dashboard__reg-row-body">
        <div className="member-dashboard__reg-row-info">
          <Link to={`/events/${event.id}`} className="member-dashboard__reg-row-title">
            {title}
          </Link>
          {clubs?.name && (
            <span className="member-dashboard__reg-row-club">{clubs.name}</span>
          )}
          <div className="member-dashboard__reg-row-meta">
            <span><CalendarDays size={14} /> {new Date(start_time).toLocaleDateString('vi-VN')}</span>
            <span><Clock size={14} /> {new Date(start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
            {location && <span><MapPin size={14} /> {location}</span>}
          </div>
          {pending && <span className="member-dashboard__reg-tag member-dashboard__reg-tag--pending">Đang chờ duyệt</span>}
          {checkedIn && <span className="member-dashboard__reg-tag member-dashboard__reg-tag--ok"><CheckCircle2 size={12} /> Đã check-in</span>}
        </div>
        <div className="member-dashboard__reg-row-actions">
          <Link to={`/events/${event.id}`}>
            <Button size="sm" variant="secondary">Chi tiết</Button>
          </Link>
          {!cancelled && !checkedIn && (
            <Button
              size="sm"
              variant="ghost"
              className="member-dashboard__reg-cancel"
              disabled={cancelling}
              onClick={onCancel}
            >
              {cancelling ? 'Đang hủy…' : 'Hủy'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function StatCard({ icon: Icon, label, value, color, bgColor }) {
  return (
    <Card className="member-dashboard__stat-card">
      <div className="member-dashboard__stat-icon" style={{ background: bgColor }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div className="member-dashboard__stat-info">
        <span className="member-dashboard__stat-value">{value ?? '—'}</span>
        <span className="member-dashboard__stat-label">{label}</span>
      </div>
    </Card>
  );
}

function QuickAction({ to, icon: Icon, label, color }) {
  return (
    <Link to={to} className="member-dashboard__quick-action">
      <Card className="member-dashboard__quick-action-card">
        <Icon size={22} style={{ color }} />
        <span>{label}</span>
        <ChevronRight size={18} />
      </Card>
    </Link>
  );
}