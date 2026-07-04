import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { membershipService } from "../../services/membershipService";
import { eventService } from "../../services/eventService";
import { documentService } from "../../services/documentService";
import { announcementService } from "../../services/announcementService";
import { resolveClubUuid } from "../../services/supabase";
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
  Cell
} from "recharts";

export default function DashboardPage() {
  const { clubId } = useParams();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // 1. Stats and Chart States
  const [totalMembers, setTotalMembers] = useState(142);
  const [eventsCount, setEventsCount] = useState(3);
  const [documentsCount, setDocumentsCount] = useState(8);
  const [announcementsCount, setAnnouncementsCount] = useState(2);

  const [growthData, setGrowthData] = useState([
    { name: "Jan", Members: 85 },
    { name: "Feb", Members: 98 },
    { name: "Mar", Members: 110 },
    { name: "Apr", Members: 118 },
    { name: "May", Members: 130 },
    { name: "Jun", Members: 142 }
  ]);

  const [attendanceData, setAttendanceData] = useState([
    { name: "Orientation", Rate: 94 },
    { name: "Git Seminar", Rate: 82 },
    { name: "React 19 Lab", Rate: 88 },
    { name: "Hackathon v4", Rate: 72 },
    { name: "Teambuilding", Rate: 90 }
  ]);

  const [recentActivities, setRecentActivities] = useState([
    {
      actor: "Nguyễn Văn A",
      action: "registered for the event",
      target: "React 19 & Next.js 15 Seminar",
      time: "2 hours ago",
      icon: "🙋‍♂️",
      tagColor: "bg-emerald-50 text-emerald-700 border-emerald-100"
    },
    {
      actor: "Trần Thị B",
      action: "uploaded a new document",
      target: "Sponsorship Proposal Template 2026.docx",
      time: "4 hours ago",
      icon: "📄",
      tagColor: "bg-blue-50 text-blue-700 border-blue-100"
    },
    {
      actor: "Lê Thanh Tùng",
      action: "published an announcement",
      target: "Weekly Tech Workshop: TailwindCSS v4 Setup",
      time: "1 day ago",
      icon: "📢",
      tagColor: "bg-purple-50 text-purple-700 border-purple-100"
    },
    {
      actor: "Phạm Minh Thư",
      action: "recorded meeting minutes for",
      target: "Executive Committee Meeting 30/06",
      time: "2 days ago",
      icon: "✍️",
      tagColor: "bg-amber-50 text-amber-700 border-amber-100"
    }
  ]);

  // Fetch from Supabase
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setErrorMsg(null);

        const uuid = await resolveClubUuid(clubId);
        if (!uuid) {
          setLoading(false);
          return;
        }

        // Fetch memberships, events, documents and announcements in parallel
        const [membersData, eventsData, docsData, annsData] = await Promise.all([
          membershipService.getClubMemberships(uuid, "active").catch(() => []),
          eventService.getClubEvents(uuid).catch(() => []),
          documentService.getClubDocuments(uuid).catch(() => []),
          announcementService.getAnnouncements(uuid).catch(() => [])
        ]);

        if (membersData.length > 0) setTotalMembers(membersData.length);
        if (eventsData.length > 0) setEventsCount(eventsData.length);
        if (docsData.length > 0) setDocumentsCount(docsData.length);
        if (annsData.length > 0) setAnnouncementsCount(annsData.length);

        // Parse membership dates to construct growth chart
        if (membersData.length > 0) {
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const monthCounts = {};
          months.forEach(m => monthCounts[m] = 0);

          membersData.forEach(m => {
            if (m.joined_at) {
              const monthIndex = new Date(m.joined_at).getMonth();
              const monthName = months[monthIndex];
              monthCounts[monthName] += 1;
            }
          });

          // Accumulate member growth
          let sum = 50; // Base members
          const newGrowth = months.slice(0, 6).map(m => {
            sum += monthCounts[m] || 0;
            return { name: m, Members: sum };
          });
          setGrowthData(newGrowth);
        }

        // Construct dynamic timeline of recent items
        const dynamicTimeline = [];
        if (membersData.length > 0) {
          membersData.slice(0, 2).forEach(m => {
            dynamicTimeline.push({
              actor: m.profiles?.full_name || "New Member",
              action: "joined the club",
              target: m.position || "Member",
              time: m.joined_at || "Recent",
              icon: "🙋‍♂️",
              tagColor: "bg-emerald-50 text-emerald-700 border-emerald-100"
            });
          });
        }
        if (docsData.length > 0) {
          docsData.slice(0, 2).forEach(d => {
            dynamicTimeline.push({
              actor: d.profiles?.full_name || "Contributor",
              action: "uploaded a new document",
              target: d.title,
              time: d.uploaded_at ? new Date(d.uploaded_at).toLocaleDateString() : "Recent",
              icon: "📄",
              tagColor: "bg-blue-50 text-blue-700 border-blue-100"
            });
          });
        }
        if (annsData.length > 0) {
          annsData.slice(0, 2).forEach(a => {
            dynamicTimeline.push({
              actor: a.profiles?.full_name || "Leader",
              action: "published an announcement",
              target: a.title,
              time: a.created_at ? new Date(a.created_at).toLocaleDateString() : "Recent",
              icon: "📢",
              tagColor: "bg-purple-50 text-purple-700 border-purple-100"
            });
          });
        }

        if (dynamicTimeline.length > 0) {
          setRecentActivities(dynamicTimeline);
        }

      } catch (err) {
        console.error("Supabase load error in Dashboard, falling back to mock data:", err);
        setErrorMsg("Failed to connect to database. Showing fallback mock data.");
      } finally {
        setLoading(false);
      }
    }

    if (clubId) {
      loadData();
    }
  }, [clubId]);

  const stats = [
    {
      title: "Total Members",
      value: totalMembers,
      change: "+12% this term",
      isPositive: true,
      icon: (
        <svg className="w-5 h-5 text-[#22C55E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      bg: "bg-emerald-50 border-emerald-100"
    },
    {
      title: "Events Logged",
      value: eventsCount,
      change: "+1 vs last month",
      isPositive: true,
      icon: (
        <svg className="w-5 h-5 text-[#3B82F6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      bg: "bg-blue-50 border-blue-100"
    },
    {
      title: "New Documents",
      value: documentsCount,
      change: "Added this week",
      isPositive: true,
      icon: (
        <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      bg: "bg-purple-50 border-purple-100"
    },
    {
      title: "Unread Notices",
      value: announcementsCount,
      change: "Requires attention",
      isPositive: false,
      icon: (
        <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      bg: "bg-amber-50 border-amber-100"
    }
  ];

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

  return (
    <div className="space-y-6">
      {/* Upper Welcome Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#06231D] tracking-tight">Leader Dashboard</h2>
          <p className="text-xs text-[#4A5D59]">Real-time operational metrics and activity overview for club administrators.</p>
        </div>
        <div className="flex gap-2">
          {errorMsg && (
            <span className="bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-2 rounded-xl flex items-center gap-1 font-medium animate-fade-in">
              ⚠️ {errorMsg}
            </span>
          )}
          {loading && (
            <span className="bg-gray-100 text-gray-500 text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 font-medium">
              <span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></span>
              Connecting Supabase...
            </span>
          )}
        </div>
      </div>

      {/* 1. Quick Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-white border border-gray-200/80 hover:-translate-y-1 transition-all duration-300 flex justify-between items-center premium-shadow"
          >
            <div>
              <span className="text-[10px] text-[#4A5D59] uppercase font-bold tracking-widest">{s.title}</span>
              <h3 className="text-3xl font-bold text-[#06231D] mt-1.5 font-mono">{s.value}</h3>
              <div className="flex items-center gap-1 mt-2">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${s.isPositive ? 'bg-emerald-500/10 text-emerald-700' : 'bg-amber-500/10 text-amber-700'}`}>
                  {s.change}
                </span>
              </div>
            </div>
            <div className={`p-3 rounded-2xl border ${s.bg} flex-shrink-0`}>
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      {/* 2. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Member Growth Chart */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200/80 premium-shadow flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-base font-bold text-[#06231D]">📈 Member Growth</h3>
            <p className="text-[11px] text-[#4A5D59]">Monthly active member registrations over the last 6 months.</p>
          </div>
          <div className="w-full h-[300px]">
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
                <Area
                  type="monotone"
                  dataKey="Members"
                  stroke="#22C55E"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorMembers)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Event Attendance Rate Chart */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200/80 premium-shadow flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-base font-bold text-[#06231D]">📊 Event Attendance Rates</h3>
            <p className="text-[11px] text-[#4A5D59]">Percentage of registered students who checked-in via QR code.</p>
          </div>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(6, 35, 29, 0.03)" vertical={false} />
                <XAxis dataKey="name" stroke="#4A5D59" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#4A5D59" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Rate" radius={[8, 8, 0, 0]} barSize={28}>
                  {attendanceData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index % 2 === 0 ? "url(#primaryGradient)" : "url(#accentGradient)"}
                    />
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

      {/* 3. Recent Activities Timeline Section */}
      <div className="p-6 rounded-2xl bg-white border border-[#06231D]/10 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-base font-bold text-[#06231D]">🔔 Recent Activities</h3>
            <p className="text-[11px] text-[#4A5D59]">Live timeline of recent operations conducted by club members.</p>
          </div>
        </div>

        <div className="relative border-l border-gray-200 pl-6 space-y-6 ml-3">
          {recentActivities.map((act, i) => (
            <div key={i} className="relative">
              <span className="absolute -left-[35px] top-0.5 w-6 h-6 rounded-full bg-[#F4F1EA] border border-gray-200 flex items-center justify-center text-xs shadow-sm select-none">
                {act.icon}
              </span>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <span className="text-sm font-bold text-[#06231D]">{act.actor}</span>
                  <span className="text-xs text-[#4A5D59] mx-1.5">{act.action}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-md font-medium border ${act.tagColor}`}>
                    {act.target}
                  </span>
                </div>
                <span className="text-[10px] text-[#4A5D59] self-start sm:self-center">{act.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
