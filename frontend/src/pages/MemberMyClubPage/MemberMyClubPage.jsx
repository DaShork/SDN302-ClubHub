import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Users, Calendar, FileText, BookOpen, ChevronRight, Search,
  MapPin, Clock, Download, ExternalLink,
} from 'lucide-react';
import { Card } from '@/components';
import { useMemberScope } from '@/contexts/MemberScopeContext.jsx';
import { supabase } from '@/services/supabase';
import './MemberMyClubPage.css';

/* MemberMyClubPage — read-only overview of one of the member's clubs.
 *
 * URL: /member/clubs[?club=<clubId>]
 *
 * If `?club=` is missing we render the picker (all the member's clubs).
 * If a club is selected we render 4 tabs:
 *   Members      → roster of active members + positions
 *   Events       → upcoming + recent events of the club
 *   Documents    → documents uploaded by the leader
 *   Knowledge    → knowledge articles written by the leader
 *
 * Members cannot create / edit / delete any of these — these are
 * read-only views of what the leader has shared with the club.
 */

const TABS = [
  { id: 'members', label: 'Thành viên', icon: Users },
  { id: 'events', label: 'Sự kiện', icon: Calendar },
  { id: 'documents', label: 'Tài liệu', icon: FileText },
  { id: 'knowledge', label: 'Knowledge', icon: BookOpen },
];

export default function MemberMyClubPage() {
  const { memberClubs, loading: memberLoading, selectedClubId, isAllScope } = useMemberScope();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam && TABS.some(t => t.id === tabParam) ? tabParam : 'members');

  // Keep URL in sync with the active tab.
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (next.get('tab') !== activeTab) {
      next.set('tab', activeTab);
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  if (memberLoading) {
    return <LoadingBlock label="Đang tải…" />;
  }

  if (memberClubs.length === 0) {
    return (
      <div className="member-clubs">
        <Header title="CLB của tôi" subtitle="Bạn chưa tham gia CLB nào." />
      </div>
    );
  }

  // No club picked yet — show picker.
  if (isAllScope) {
    return <ClubPicker clubs={memberClubs} />;
  }

  // Some unknown club id — bounce back to picker.
  const selected = memberClubs.find((m) => m.clubId === selectedClubId);
  if (!selected) {
    return <ClubPicker clubs={memberClubs} />;
  }

  return (
    <div className="member-clubs">
      <div className="member-clubs__club-head">
        {selected.club?.logo_url ? (
          <img src={selected.club.logo_url} alt={selected.club.name} className="member-clubs__club-logo" />
        ) : (
          <div className="member-clubs__club-logo-placeholder">
            {(selected.club?.name || 'C').charAt(0)}
          </div>
        )}
        <div className="member-clubs__club-info">
          <h1 className="member-clubs__club-name">{selected.club?.name}</h1>
          <div className="member-clubs__club-meta">
            <span>{selected.club?.category?.name || 'Chưa phân loại'}</span>
            <span>·</span>
            <span>Vai trò của bạn: <strong>{selected.position}</strong></span>
          </div>
        </div>
        <Link
          to={`/clubs/${selected.club?.slug || selected.clubId}`}
          className="member-clubs__portal-link"
        >
          Xem trang CLB <ExternalLink size={14} />
        </Link>
      </div>

      <div className="member-clubs__tabs">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              className={`member-clubs__tab ${activeTab === t.id ? 'member-clubs__tab--active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'members' && <MembersTab clubId={selected.clubId} />}
      {activeTab === 'events' && <EventsTab clubId={selected.clubId} />}
      {activeTab === 'documents' && <DocumentsTab clubId={selected.clubId} />}
      {activeTab === 'knowledge' && <KnowledgeTab clubId={selected.clubId} />}
    </div>
  );
}

function ClubPicker({ clubs }) {
  return (
    <div className="member-clubs">
      <Header
        title="CLB của tôi"
        subtitle="Chọn một CLB để xem thành viên, sự kiện, tài liệu và bài viết."
      />
      <div className="member-clubs__picker-grid">
        {clubs.map((m) => (
          <Link
            key={m.membershipId}
            to={`/member/clubs?club=${m.clubId}`}
            className="member-clubs__picker-card"
          >
            {m.club?.logo_url ? (
              <img src={m.club.logo_url} alt={m.club.name} className="member-clubs__picker-logo" />
            ) : (
              <div className="member-clubs__picker-logo-placeholder">
                {(m.club?.name || 'C').charAt(0)}
              </div>
            )}
            <div className="member-clubs__picker-info">
              <h3>{m.club?.name}</h3>
              <p>{m.club?.category?.name || 'Chưa phân loại'} · {m.position}</p>
            </div>
            <ChevronRight size={18} />
          </Link>
        ))}
      </div>
    </div>
  );
}

function MembersTab({ clubId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('memberships')
          .select(`
            id, position, joined_at, status,
            profiles ( id, full_name, email, avatar_url, student_code )
          `)
          .eq('club_id', clubId)
          .eq('status', 'active')
          .order('joined_at', { ascending: true });
        if (error) throw error;
        if (!cancelled) setRows(data || []);
      } catch (err) {
        if (!cancelled) console.error('MembersTab failed:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [clubId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const p = r.profiles || {};
      return (
        (p.full_name || '').toLowerCase().includes(q) ||
        (p.email || '').toLowerCase().includes(q) ||
        (p.student_code || '').toLowerCase().includes(q) ||
        (r.position || '').toLowerCase().includes(q)
      );
    });
  }, [rows, search]);

  if (loading) return <LoadingBlock label="Đang tải danh sách thành viên…" />;

  return (
    <Card>
      <div className="member-clubs__toolbar">
        <div className="member-clubs__search">
          <Search size={14} />
          <input
            type="text"
            placeholder="Tìm theo tên, email, MSSV…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="member-clubs__count">{filtered.length} thành viên</span>
      </div>
      <table className="member-clubs__table">
        <thead>
          <tr>
            <th>Thành viên</th>
            <th>Vai trò</th>
            <th>MSSV</th>
            <th>Ngày tham gia</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={4} className="member-clubs__state">Không có thành viên nào.</td>
            </tr>
          ) : filtered.map((r) => (
            <tr key={r.id}>
              <td>
                <div className="member-clubs__member-cell">
                  {r.profiles?.avatar_url ? (
                    <img src={r.profiles.avatar_url} alt="" className="member-clubs__avatar" />
                  ) : (
                    <div className="member-clubs__avatar-placeholder">
                      {(r.profiles?.full_name || 'U').charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="member-clubs__member-name">{r.profiles?.full_name || '—'}</div>
                    <div className="member-clubs__member-email">{r.profiles?.email || ''}</div>
                  </div>
                </div>
              </td>
              <td><span className="member-clubs__role-chip">{r.position}</span></td>
              <td>{r.profiles?.student_code || '—'}</td>
              <td>{r.joined_at ? new Date(r.joined_at).toLocaleDateString('vi-VN') : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function EventsTab({ clubId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('id, title, description, location, banner_url, start_time, end_time, status, max_participants')
          .eq('club_id', clubId)
          .order('start_time', { ascending: false });
        if (error) throw error;
        if (!cancelled) setRows(data || []);
      } catch (err) {
        if (!cancelled) console.error('EventsTab failed:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [clubId]);

  if (loading) return <LoadingBlock label="Đang tải sự kiện…" />;
  if (rows.length === 0) return <EmptyState icon={Calendar} label="CLB chưa có sự kiện nào." />;

  const now = Date.now();
  const upcoming = rows.filter((e) => new Date(e.start_time).getTime() >= now);
  const past = rows.filter((e) => new Date(e.start_time).getTime() < now);

  return (
    <div className="member-clubs__events">
      <Section title="Sắp tới" events={upcoming} />
      <Section title="Đã qua" events={past} />
    </div>
  );
}

function Section({ title, events }) {
  if (events.length === 0) return null;
  return (
    <Card>
      <div className="member-clubs__section-head">
        <h3>{title}</h3>
        <span className="member-clubs__count">{events.length} sự kiện</span>
      </div>
      <div className="member-clubs__event-list">
        {events.map((e) => (
          <Link key={e.id} to={`/events/${e.id}`} className="member-clubs__event-row">
            <div className="member-clubs__event-date">
              <span className="member-clubs__event-day">
                {new Date(e.start_time).toLocaleDateString('vi-VN', { day: '2-digit' })}
              </span>
              <span className="member-clubs__event-month">
                {new Date(e.start_time).toLocaleDateString('vi-VN', { month: 'short' })}
              </span>
            </div>
            <div className="member-clubs__event-info">
              <h4>{e.title}</h4>
              <div className="member-clubs__event-meta">
                {e.location && <span><MapPin size={12} /> {e.location}</span>}
                <span><Clock size={12} /> {new Date(e.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                <span className={`member-clubs__status member-clubs__status--${e.status}`}>{e.status}</span>
              </div>
            </div>
            <ChevronRight size={16} />
          </Link>
        ))}
      </div>
    </Card>
  );
}

function DocumentsTab({ clubId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('id, title, type, file_url, file_size, uploaded_at, profiles (id, full_name)')
          .eq('club_id', clubId)
          .order('uploaded_at', { ascending: false });
        if (error) throw error;
        if (!cancelled) setRows(data || []);
      } catch (err) {
        if (!cancelled) console.error('DocumentsTab failed:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [clubId]);

  if (loading) return <LoadingBlock label="Đang tải tài liệu…" />;
  if (rows.length === 0) return <EmptyState icon={FileText} label="CLB chưa có tài liệu nào." />;

  return (
    <Card>
      <div className="member-clubs__doc-list">
        {rows.map((d) => (
          <div key={d.id} className="member-clubs__doc-row">
            <FileText size={20} className="member-clubs__doc-icon" />
            <div className="member-clubs__doc-info">
              <div className="member-clubs__doc-title">{d.title}</div>
              <div className="member-clubs__doc-meta">
                <span>{d.type?.toUpperCase() || 'FILE'}</span>
                {d.file_size && <span>· {Math.round(d.file_size / 1024)} KB</span>}
                <span>· Tải lên {d.uploaded_at ? new Date(d.uploaded_at).toLocaleDateString('vi-VN') : ''}</span>
                <span>· {d.profiles?.full_name || ''}</span>
              </div>
            </div>
            {d.file_url && (
              <a className="member-clubs__doc-download" href={d.file_url} target="_blank" rel="noreferrer">
                <Download size={14} /> Tải
              </a>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

function KnowledgeTab({ clubId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('knowledge_articles')
          .select('id, title, content, category, attachment_url, created_at, profiles (id, full_name)')
          .eq('club_id', clubId)
          .order('created_at', { ascending: false });
        if (error) throw error;
        if (!cancelled) setRows(data || []);
      } catch (err) {
        if (!cancelled) console.error('KnowledgeTab failed:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [clubId]);

  if (loading) return <LoadingBlock label="Đang tải bài viết…" />;
  if (rows.length === 0) return <EmptyState icon={BookOpen} label="CLB chưa có bài viết knowledge nào." />;

  return (
    <div className="member-clubs__know-list">
      {rows.map((a) => (
        <Card key={a.id}>
          <div className="member-clubs__know-row">
            <div className="member-clubs__know-cat">{a.category || 'general'}</div>
            <h3 className="member-clubs__know-title">{a.title}</h3>
            <p className="member-clubs__know-content">{a.content}</p>
            <div className="member-clubs__know-meta">
              <span>{a.profiles?.full_name || ''}</span>
              <span>· {a.created_at ? new Date(a.created_at).toLocaleDateString('vi-VN') : ''}</span>
              {a.attachment_url && (
                <a href={a.attachment_url} target="_blank" rel="noreferrer">Đính kèm</a>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function Header({ title, subtitle }) {
  return (
    <div className="member-clubs__header">
      <h1 className="member-clubs__h-title">{title}</h1>
      {subtitle && <p className="member-clubs__h-subtitle">{subtitle}</p>}
    </div>
  );
}

function LoadingBlock({ label }) {
  return (
    <div className="member-clubs__loading">
      <div className="member-clubs__spinner" />
      <span>{label}</span>
    </div>
  );
}

function EmptyState({ icon: Icon, label }) {
  return (
    <div className="member-clubs__empty-tab">
      <Icon size={32} />
      <p>{label}</p>
    </div>
  );
}