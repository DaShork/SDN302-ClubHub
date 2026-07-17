import { useEffect, useState } from 'react';
import {
  RefreshCw, Activity, User, Building2, Megaphone, Calendar, FileText, Wallet,
  ChevronLeft, ChevronRight, Filter,
} from 'lucide-react';
import { Card, Button } from '@/components';
import { supabase } from '@/services/supabase';
import './ActivityLogView.css';

/* Shared activity-log view used by both Manager and Mentor dashboards.
 *
 * Props:
 *   - title / subtitle       : page header
 *   - filterClubIds: string[] | null
 *       null  → show all entries (Manager total log)
 *       array → only show entries whose target belongs to one of these
 *               club ids (Mentor scope)
 *   - allowedTables: string[] | null
 *       null  → no restriction (Manager sees everything)
 *       array → only show entries with target_table in this list. Mentor
 *               uses this to ignore profile_* entries.
 *   - limit / showActionsFilter: UI knobs
 *
 * Single shared CSS (ActivityLogView.css) + BEM-style class prefix
 * `al-*` to avoid colliding with other dashboards.
 */
export default function ActivityLogView({
  title,
  subtitle,
  filterClubIds = null,
  allowedTables = null,
  limit = 100,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actorMap, setActorMap] = useState({});
  const [clubMap, setClubMap] = useState({});
  const [actionFilter, setActionFilter] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 20;

  async function load() {
    setLoading(true);
    try {
      let query = supabase
        .from('audit_log')
        .select('id, action, target_id, target_table, actor_id, details, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (allowedTables) {
        query = query.in('target_table', allowedTables);
      }
      if (filterClubIds && filterClubIds.length > 0) {
        // Restrict to entries where target_table is clubs and target_id is in
        // our scope (membership/events/etc. target_ids aren't club_ids
        // directly, so for Mentor scope we additionally exclude those).
        query = query
          .eq('target_table', 'clubs')
          .in('target_id', filterClubIds);
      }

      const { data, error } = await query;
      if (error) throw error;
      const list = data || [];
      setItems(list);

      // Lazy-load actor + club metadata for the visible rows
      const actorIds = [...new Set(list.map((r) => r.actor_id).filter(Boolean))];
      const clubIds = [...new Set(
        list.filter((r) => r.target_table === 'clubs').map((r) => r.target_id)
      )];

      if (actorIds.length) {
        const { data: actors } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .in('id', actorIds);
        const m = {};
        (actors || []).forEach((a) => { m[a.id] = a; });
        setActorMap(m);
      }
      if (clubIds.length) {
        const { data: clubs } = await supabase
          .from('clubs')
          .select('id, name, logo_url')
          .in('id', clubIds);
        const m = {};
        (clubs || []).forEach((c) => { m[c.id] = c; });
        setClubMap(m);
      }
    } catch (err) {
      console.error('Failed to load activity log:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [filterClubIds?.join(','), allowedTables?.join(',')]);

  const actionOptions = useMemoOptions(items);
  const filtered = actionFilter === 'all'
    ? items
    : items.filter((r) => r.action === actionFilter);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const start = (page - 1) * perPage;
  const visible = filtered.slice(start, start + perPage);

  return (
    <div className="al">
      <div className="al__header">
        <div>
          <h1 className="al__title">{title}</h1>
          {subtitle && <p className="al__subtitle">{subtitle}</p>}
        </div>
        <div className="al__header-actions">
          <Button variant="secondary" onClick={() => { setPage(1); load(); }}>
            <RefreshCw size={16} /> Tải lại
          </Button>
        </div>
      </div>

      <Card>
        <div className="al__toolbar">
          <div className="al__filter">
            <Filter size={14} />
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            >
              <option value="all">Tất cả hành động</option>
              {actionOptions.map((a) => (
                <option key={a} value={a}>{labelForAction(a)}</option>
              ))}
            </select>
          </div>
          <span className="al__count">
            {loading ? 'Đang tải…' : `${filtered.length} mục`}
          </span>
        </div>

        <div className="al__list">
          {loading ? (
            <div className="al__state">
              <div className="al__spinner" />
              Đang tải nhật ký…
            </div>
          ) : visible.length === 0 ? (
            <div className="al__state">Chưa có hoạt động nào được ghi nhận.</div>
          ) : (
            visible.map((entry) => (
              <ActivityRow
                key={entry.id}
                entry={entry}
                actor={actorMap[entry.actor_id]}
                club={clubMap[entry.target_id] || (entry.target_table === 'clubs' ? null : null)}
              />
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="al__pagination">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={14} /> Trước
            </button>
            <span>Trang {page} / {totalPages}</span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Sau <ChevronRight size={14} />
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}

function ActivityRow({ entry, actor, club }) {
  const meta = ACTION_META[entry.action] || DEFAULT_ACTION_META;
  const Icon = meta.icon;
  const actorName = actor?.full_name || actor?.email || 'System';

  return (
    <article className="al__row">
      <div className={`al__row-icon al__row-icon--${meta.tone}`}>
        <Icon size={16} />
      </div>
      <div className="al__row-body">
        <div className="al__row-title">
          <strong>{actorName}</strong>
          <span> {meta.verb} </span>
          <span className="al__row-target">{describeTarget(entry, club)}</span>
        </div>
        <div className="al__row-meta">
          <span className="al__row-time">{formatTime(entry.created_at)}</span>
          <span className="al__row-tag">{entry.target_table}</span>
          <span className="al__row-action">{entry.action}</span>
        </div>
      </div>
    </article>
  );
}

/* ---------- Static helpers ---------- */

const ICON_USER = User;
const ICON_BUILDING = Building2;
const ICON_ANNOUNCEMENT = Megaphone;
const ICON_CALENDAR = Calendar;
const ICON_FILE = FileText;
const ICON_WALLET = Wallet;
const ICON_ACTIVITY = Activity;

/* Verbs ("đã tạo", "đã xoá", ...) + tone for the icon chip. */
const ACTION_META = {
  club_created:            { verb: 'đã tạo CLB',                  icon: ICON_BUILDING,    tone: 'green' },
  club_updated:            { verb: 'đã cập nhật CLB',             icon: ICON_BUILDING,    tone: 'green' },
  club_status_changed:     { verb: 'đã đổi trạng thái CLB',       icon: ICON_BUILDING,    tone: 'amber' },
  club_leader_changed:     { verb: 'đã đổi Leader CLB',           icon: ICON_USER,        tone: 'amber' },
  club_mentor_changed:     { verb: 'đã đổi Mentor CLB',           icon: ICON_USER,        tone: 'amber' },
  club_recruitment_changed:{ verb: 'đã đổi trạng thái tuyển',      icon: ICON_BUILDING,    tone: 'amber' },
  club_deleted:            { verb: 'đã xoá CLB',                  icon: ICON_BUILDING,    tone: 'red' },
  member_joined:           { verb: 'đã có thành viên mới',        icon: ICON_USER,        tone: 'green' },
  member_removed:          { verb: 'đã xoá thành viên',           icon: ICON_USER,        tone: 'red' },
  member_status_changed:   { verb: 'đã đổi trạng thái thành viên', icon: ICON_USER,        tone: 'amber' },
  membership_updated:      { verb: 'đã cập nhật membership',      icon: ICON_USER,        tone: 'gray' },
  event_created:           { verb: 'đã tạo sự kiện',              icon: ICON_CALENDAR,    tone: 'green' },
  event_updated:           { verb: 'đã cập nhật sự kiện',         icon: ICON_CALENDAR,    tone: 'gray' },
  event_status_changed:    { verb: 'đã đổi trạng thái sự kiện',   icon: ICON_CALENDAR,    tone: 'amber' },
  event_deleted:           { verb: 'đã xoá sự kiện',              icon: ICON_CALENDAR,    tone: 'red' },
  announcement_created:    { verb: 'đã đăng thông báo',           icon: ICON_ANNOUNCEMENT,tone: 'green' },
  announcement_updated:    { verb: 'đã chỉnh sửa thông báo',      icon: ICON_ANNOUNCEMENT,tone: 'gray' },
  announcement_deleted:    { verb: 'đã xoá thông báo',            icon: ICON_ANNOUNCEMENT,tone: 'red' },
  profile_created:         { verb: 'đã tạo profile',             icon: ICON_USER,        tone: 'gray' },
  profile_updated:         { verb: 'đã cập nhật profile',         icon: ICON_USER,        tone: 'gray' },
  profile_status_changed:  { verb: 'đã đổi trạng thái profile',   icon: ICON_USER,        tone: 'amber' },
  profile_role_changed:    { verb: 'đã đổi role profile',         icon: ICON_USER,        tone: 'amber' },
  profile_deleted:         { verb: 'đã xoá profile',              icon: ICON_USER,        tone: 'red' },
};
const DEFAULT_ACTION_META = { verb: 'đã thực hiện hành động', icon: ICON_ACTIVITY, tone: 'gray' };

function labelForAction(action) {
  const m = ACTION_META[action];
  if (m) return m.verb.replace(/^đã /, '').replace(/^/, '');
  return action;
}

function describeTarget(entry, club) {
  const t = entry.target_table;
  if (t === 'clubs' && club) return <strong>{club.name}</strong>;
  if (t === 'clubs' && entry.target_id) return <code>{entry.target_id.slice(0, 8)}…</code>;
  if (entry.target_id) return <code>{entry.target_id.slice(0, 8)}…</code>;
  return <em>(toàn hệ thống)</em>;
}

function formatTime(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

/* Trivial helper to avoid importing useMemo just for one constant list. */
function useMemoOptions(items) {
  const set = new Set();
  items.forEach((i) => set.add(i.action));
  return Array.from(set).sort();
}
