import { useEffect, useState, useMemo } from "react";
import { membershipService } from "../../services/membershipService";
import { eventService } from "../../services/eventService";
import { documentService } from "../../services/documentService";
import { announcementService } from "../../services/announcementService";
import { LeaderDashboardHeader, LeaderEmptyState, Loading } from "@/components";
import { useLeaderScope } from "@/contexts/LeaderScopeContext.jsx";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import "./DashboardPage.css";

/**
 * LeaderDashboardPage — aggregated dashboard across every club the current
 * user leads.
 *
 * When no club filter is set in the URL (`?club=<uuid>`), KPIs and timelines
 * are computed by summing over all led clubs. When a club is selected the
 * view behaves like the legacy single-club dashboard.
 *
 * No DB schema changes. We rely on existing per-club services and parallel
 * fetches via Promise.all.
 */
export default function LeaderDashboardPage() {
  const {
    ledClubs,
    ledClubIds,
    loading: leaderLoading,
    selectedClubId,
    isAllScope,
  } = useLeaderScope();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const [totalMembers, setTotalMembers] = useState(0);
  const [eventsCount, setEventsCount] = useState(0);
  const [documentsCount, setDocumentsCount] = useState(0);
  const [announcementsCount, setAnnouncementsCount] = useState(0);

  const [growthData, setGrowthData] = useState([
    { name: "Jan", Members: 0 },
    { name: "Feb", Members: 0 },
    { name: "Mar", Members: 0 },
    { name: "Apr", Members: 0 },
    { name: "May", Members: 0 },
    { name: "Jun", Members: 0 },
  ]);

  const [attendanceData] = useState([
    { name: "Orientation", Rate: 0 },
    { name: "Git Seminar", Rate: 0 },
    { name: "React 19 Lab", Rate: 0 },
    { name: "Hackathon v4", Rate: 0 },
    { name: "Teambuilding", Rate: 0 },
  ]);

  const [recentActivities, setRecentActivities] = useState([]);

  /* The set of UUIDs we actually want to query this render. Memoised so
     unrelated re-renders don't cause a re-fetch. */
  const targetIds = useMemo(() => {
    if (isAllScope) return ledClubIds;
    return selectedClubId ? [selectedClubId] : [];
  }, [isAllScope, selectedClubId, ledClubIds]);

  useEffect(() => {
    let cancelled = false;

    async function loadForClub(uuid) {
      const [membersData, eventsData, docsData, annsData] = await Promise.all([
        membershipService.getClubMemberships(uuid, "active").catch(() => []),
        eventService.getClubEvents(uuid).catch(() => []),
        documentService.getClubDocuments(uuid).catch(() => []),
        announcementService.getAnnouncements(uuid).catch(() => []),
      ]);
      return { membersData, eventsData, docsData, annsData };
    }

    async function loadData() {
      if (targetIds.length === 0) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setErrorMsg(null);

        const perClub = await Promise.all(targetIds.map(loadForClub));

        if (cancelled) return;

        // Aggregate counts.
        let mSum = 0;
        let eSum = 0;
        let dSum = 0;
        let aSum = 0;
        const allMembers = [];
        const allDocs = [];
        const allAnns = [];
        perClub.forEach(({ membersData, eventsData, docsData, annsData }) => {
          mSum += (membersData || []).length;
          eSum += (eventsData || []).length;
          dSum += (docsData || []).length;
          aSum += (annsData || []).length;
          allMembers.push(...(membersData || []));
          allDocs.push(...(docsData || []));
          allAnns.push(...(annsData || []));
        });
        setTotalMembers(mSum);
        setEventsCount(eSum);
        setDocumentsCount(dSum);
        setAnnouncementsCount(aSum);

        if (allMembers.length > 0) {
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const monthCounts = {};
          months.forEach((m) => (monthCounts[m] = 0));
          allMembers.forEach((m) => {
            if (m.joined_at) {
              const idx = new Date(m.joined_at).getMonth();
              monthCounts[months[idx]]++;
            }
          });
          let sum = 50;
          const newGrowth = months.slice(0, 6).map((m) => {
            sum += monthCounts[m] || 0;
            return { name: m, Members: sum };
          });
          setGrowthData(newGrowth);
        }

        const dynamicTimeline = [];
        if (allMembers.length > 0) {
          allMembers.slice(0, 2).forEach((m) => {
            dynamicTimeline.push({
              actor: m.profiles?.full_name || "New Member",
              action: "joined the club",
              target: m.position || "Member",
              time: m.joined_at ? new Date(m.joined_at).toLocaleDateString("vi-VN") : "Recent",
              icon: "🙋‍♂️",
              tagColorClass: "timeline__target--green",
            });
          });
        }
        if (allDocs.length > 0) {
          allDocs.slice(0, 2).forEach((d) => {
            dynamicTimeline.push({
              actor: d.profiles?.full_name || "Contributor",
              action: "uploaded a document",
              target: d.title,
              time: d.uploaded_at ? new Date(d.uploaded_at).toLocaleDateString("vi-VN") : "Recent",
              icon: "📄",
              tagColorClass: "timeline__target--blue",
            });
          });
        }
        if (allAnns.length > 0) {
          allAnns.slice(0, 2).forEach((a) => {
            dynamicTimeline.push({
              actor: a.profiles?.full_name || "Leader",
              action: "published an announcement",
              target: a.title,
              time: a.created_at ? new Date(a.created_at).toLocaleDateString("vi-VN") : "Recent",
              icon: "📢",
              tagColorClass: "timeline__target--purple",
            });
          });
        }
        if (dynamicTimeline.length > 0) {
          setRecentActivities(dynamicTimeline);
        }
      } catch (err) {
        console.error("Leader dashboard load error:", err);
        if (!cancelled) setErrorMsg("Failed to connect to database.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [targetIds]);

  if (leaderLoading) {
    return <Loading fullScreen />;
  }

  if (!leaderLoading && ledClubs.length === 0) {
    return (
      <>
        <LeaderDashboardHeader
          ledClubs={ledClubs}
          eyebrow="Leader Dashboard"
          title="Operational Dashboard"
          subtitle="Real-time metrics and activity overview for club administrators."
        />
        <LeaderEmptyState />
      </>
    );
  }

  const stats = [
    {
      title: "Total Members",
      value: totalMembers,
      change: "+12% this term",
      isPositive: true,
      icon: (
        <svg className="stat-card__icon stat-card__icon--green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      bgClass: "stat-card__icon-box--green",
    },
    {
      title: "Events Logged",
      value: eventsCount,
      change: "+1 vs last month",
      isPositive: true,
      icon: (
        <svg className="stat-card__icon stat-card__icon--blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      bgClass: "stat-card__icon-box--blue",
    },
    {
      title: "Documents",
      value: documentsCount,
      change: "Added this week",
      isPositive: true,
      icon: (
        <svg className="stat-card__icon stat-card__icon--purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      bgClass: "stat-card__icon-box--purple",
    },
    {
      title: "Announcements",
      value: announcementsCount,
      change: "Requires attention",
      isPositive: false,
      icon: (
        <svg className="stat-card__icon stat-card__icon--amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      bgClass: "stat-card__icon-box--amber",
    },
  ];

  const eyebrow = isAllScope
    ? `Leading ${ledClubs.length} club${ledClubs.length === 1 ? "" : "s"}`
    : "Leader Dashboard";

  return (
    <div className="dashboard-page">
      <div className="dashboard-page__hero-wrapper" style={{ display: "none" }} />

      <div className="events-page__body dashboard-page__body">
        <div className="events-page__container dashboard-page__container">
          <LeaderDashboardHeader
            ledClubs={ledClubs}
            eyebrow={eyebrow}
            title="Operational Dashboard"
            subtitle="Real-time metrics and activity overview for club administrators."
          />

          <div className="dashboard-page__header">
            <div>
              <h2 className="dashboard-page__title">Club Overview</h2>
              <p className="dashboard-page__subtitle">Live status of members, events, documents and notices.</p>
            </div>
            <div className="dashboard-page__status">
              {errorMsg && (
                <span className="dashboard-page__warn">⚠️ {errorMsg}</span>
              )}
              {loading && (
                <span className="dashboard-page__loading-badge">
                  <span className="dashboard-page__spinner-mini" />
                  Connecting Supabase…
                </span>
              )}
            </div>
          </div>

          <div className="dashboard-page__stats-grid">
            {stats.map((s, idx) => (
              <div key={idx} className="stat-card">
                <div>
                  <span className="stat-card__title">{s.title}</span>
                  <h3 className="stat-card__value">{s.value}</h3>
                  <div className="stat-card__change-row">
                    <span className={`stat-card__change ${s.isPositive ? "stat-card__change--pos" : "stat-card__change--neg"}`}>
                      {s.change}
                    </span>
                  </div>
                </div>
                <div className={`stat-card__icon-box ${s.bgClass}`}>{s.icon}</div>
              </div>
            ))}
          </div>

          <div className="dashboard-page__charts-grid">
            <div className="dashboard-panel">
              <div className="dashboard-panel__head">
                <h3 className="dashboard-panel__title">📈 Member Growth</h3>
                <p className="dashboard-panel__subtitle">Monthly active member registrations over the last 6 months.</p>
              </div>
              <div className="dashboard-panel__chart">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22C55E" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#22C55E" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(6, 35, 29, 0.03)" vertical={false} />
                    <XAxis dataKey="name" stroke="#4A5D59" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#4A5D59" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="Members" stroke="#22C55E" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMembers)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="dashboard-panel">
              <div className="dashboard-panel__head">
                <h3 className="dashboard-panel__title">📊 Event Attendance Rates</h3>
                <p className="dashboard-panel__subtitle">Percentage of registered students who checked-in via QR code.</p>
              </div>
              <div className="dashboard-panel__chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(6, 35, 29, 0.03)" vertical={false} />
                    <XAxis dataKey="name" stroke="#4A5D59" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#4A5D59" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Rate" radius={[8, 8, 0, 0]} barSize={28}>
                      {attendanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "url(#primaryGradient)" : "url(#accentGradient)"} />
                      ))}
                    </Bar>
                    <defs>
                      <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22C55E" />
                        <stop offset="100%" stopColor="#0E4B43" />
                      </linearGradient>
                      <linearGradient id="accentGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#1E3A8A" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="dashboard-panel dashboard-panel--timeline">
            <div className="dashboard-panel__head">
              <h3 className="dashboard-panel__title">🔔 Recent Activities</h3>
              <p className="dashboard-panel__subtitle">Live timeline of recent operations conducted by club members.</p>
            </div>
            <div className="timeline">
              {recentActivities.length === 0 && !loading && (
                <p className="timeline__empty">No recent activities to display.</p>
              )}
              {recentActivities.map((act, i) => (
                <div key={i} className="timeline__item">
                  <span className="timeline__icon">{act.icon}</span>
                  <div className="timeline__row">
                    <div className="timeline__head-row">
                      <span className="timeline__actor">{act.actor}</span>
                      <span className="timeline__action">{act.action}</span>
                      <span className={`timeline__target ${act.tagColorClass || ""}`}>{act.target}</span>
                    </div>
                    <span className="timeline__time">{act.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 px-3 py-2 rounded-xl text-xs shadow-xl text-[#06231D]">
        <p className="font-bold">{label}</p>
        <p className="text-[#22C55E] mt-0.5 font-semibold">
          {payload[0].name}: <span className="font-bold text-[#06231D]">{payload[0].value}</span>
          {payload[0].name === "Rate" ? "%" : ""}
        </p>
      </div>
    );
  }
  return null;
};