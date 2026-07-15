/* ============================================================================
 * MOCK DATA — temporary fallback for development.
 *
 * Why this exists:
 *   The Supabase backend has been timing out / losing connectivity. To keep
 *   the UI usable while new features are built, the services fall back to
 *   these static records whenever a network call fails (timeout, 5xx, or
 *   offline). Search for "DELETE_MOCK_FALLBACK" to find every call-site
 *   that references this file. When the backend is back up, delete
 *   mockData.js + the fallback wrappers and these records will simply
 *   stop being returned.
 *
 *   This file is the SINGLE source of fallback data. Each helper returns
 *   a defensive copy so callers can `.map`/`.filter` without mutating it.
 * ==========================================================================*/

/* ---------- Clubs (mirror of FPTU ClubHub seed data) -------------------- */

const FCODE_CLUB = {
  id: "4ed3ce56-df18-4ff5-b43c-394ff16a86ed",
  category_id: "2a1e52e5-9430-4cb6-a941-2bb02a94ea3d",
  name: "F-Code",
  description:
    "F-Code is the official programming club at FPT University, HCMC campus. " +
    "We focus on competitive programming, software engineering, and building " +
    "real-world products. Members participate in ICPC, code reviews, and " +
    "open-source contributions.",
  logo_url:
    "https://thdlyzafslwymzvnutfv.supabase.co/storage/v1/object/public/club-logos/LogoCLB/F-Code.png",
  banner_url: "",
  contact_email: "fcode.fptuhcm@gmail.com",
  facebook_url: "https://www.facebook.com/fcodeclub",
  recruitment_status: false,
  founded_year: null,
  status: "active",
  created_at: "2026-07-09T07:06:14.088332+00:00",
  updated_at: "2026-07-09T11:00:22.092483+00:00",
  leader_id: "059dcac0-8a6a-404c-8cc4-fb98eaa811de",
  mentor_id: null,
  slug: "fcode",
  short_description: "Programming & Competitive Coding Club",
  member_count: 1,
  categories: {
    id: "2a1e52e5-9430-4cb6-a941-2bb02a94ea3d",
    name: "Academic",
    description: "Clubs focused on academic subjects and study groups.",
  },
  club_terms: [],
};

const RELATED_CLUBS = [
  {
    id: "a1a1a1a1-1111-4111-8111-aaaaaaaaaaaa",
    name: "AI Society",
    slug: "ai-society",
    description: "Exploring the world of Artificial Intelligence together.",
    short_description: "AI research & applications",
    logo_url: "",
    banner_url: "",
    recruitment_status: true,
    founded_year: 2022,
    status: "active",
    member_count: 42,
    leader_id: null,
    mentor_id: null,
    category_id: "2a1e52e5-9430-4cb6-a941-2bb02a94ea3d",
    categories: { id: "2a1e52e5-9430-4cb6-a941-2bb02a94ea3d", name: "Academic" },
    leader_name: null,
    leader_avatar_url: null,
  },
  {
    id: "b2b2b2b2-2222-4222-8222-bbbbbbbbbbbb",
    name: "Data Science Club",
    slug: "data-science",
    description: "From pandas to production ML pipelines.",
    short_description: "Data Science & ML",
    logo_url: "",
    banner_url: "",
    recruitment_status: true,
    founded_year: 2021,
    status: "active",
    member_count: 35,
    leader_id: null,
    mentor_id: null,
    category_id: "2a1e52e5-9430-4cb6-a941-2bb02a94ea3d",
    categories: { id: "2a1e52e5-9430-4cb6-a941-2bb02a94ea3d", name: "Academic" },
    leader_name: null,
    leader_avatar_url: null,
  },
  {
    id: "c3c3c3c3-3333-4333-8333-cccccccccccc",
    name: "Cybersecurity Club",
    slug: "cybersec",
    description: "Capture the flag, red team, blue team — we do it all.",
    short_description: "InfoSec & CTF",
    logo_url: "",
    banner_url: "",
    recruitment_status: false,
    founded_year: 2020,
    status: "active",
    member_count: 28,
    leader_id: null,
    mentor_id: null,
    category_id: "2a1e52e5-9430-4cb6-a941-2bb02a94ea3d",
    categories: { id: "2a1e52e5-9430-4cb6-a941-2bb02a94ea3d", name: "Academic" },
    leader_name: null,
    leader_avatar_url: null,
  },
  {
    id: "d4d4d4d4-4444-4444-8444-dddddddddddd",
    name: "Web Dev Club",
    slug: "webdev",
    description: "Modern web: React, Next.js, Tailwind, and beyond.",
    short_description: "Web Development",
    logo_url: "",
    banner_url: "",
    recruitment_status: true,
    founded_year: 2023,
    status: "active",
    member_count: 51,
    leader_id: null,
    mentor_id: null,
    category_id: "2a1e52e5-9430-4cb6-a941-2bb02a94ea3d",
    categories: { id: "2a1e52e5-9430-4cb6-a941-2bb02a94ea3d", name: "Academic" },
    leader_name: null,
    leader_avatar_url: null,
  },
];

const ALL_CLUBS = [
  FCODE_CLUB,
  ...RELATED_CLUBS,
  {
    id: "e5e5e5e5-5555-4555-8555-eeeeeeeeeeee",
    name: "Music Club",
    slug: "music",
    description: "Band, choir, and music production.",
    short_description: "Music & Performance",
    logo_url: "",
    banner_url: "",
    recruitment_status: true,
    founded_year: 2019,
    status: "active",
    member_count: 60,
    leader_id: null,
    mentor_id: null,
    category_id: "aaaa-music",
    categories: { id: "aaaa-music", name: "Arts" },
    leader_name: null,
    leader_avatar_url: null,
  },
  {
    id: "f6f6f6f6-6666-4666-8666-ffffffffffff",
    name: "Dance Crew",
    slug: "dance",
    description: "Hip-hop, contemporary, K-pop cover dances.",
    short_description: "Dance & Choreography",
    logo_url: "",
    banner_url: "",
    recruitment_status: false,
    founded_year: 2018,
    status: "active",
    member_count: 45,
    leader_id: null,
    mentor_id: null,
    category_id: "aaaa-music",
    categories: { id: "aaaa-music", name: "Arts" },
    leader_name: null,
    leader_avatar_url: null,
  },
];

/* ---------- Sub-resources ----------------------------------------------- */

const FCODE_EVENTS = [
  {
    id: "ev-1",
    club_id: FCODE_CLUB.id,
    title: "ICPC Training Week 4",
    description: "Intensive DP & graph algorithms practice session.",
    start_date: "2026-07-20T08:00:00+00:00",
    end_date: "2026-07-20T17:00:00+00:00",
    location: "FPTU HCMC - Lab 5",
    status: "upcoming",
    cover_url: "",
    max_participants: 40,
  },
  {
    id: "ev-2",
    club_id: FCODE_CLUB.id,
    title: "Code Review Night",
    description: "Bring your project, get feedback from seniors.",
    start_date: "2026-07-25T18:00:00+00:00",
    end_date: "2026-07-25T21:00:00+00:00",
    location: "FPTU HCMC - Room 301",
    status: "upcoming",
    cover_url: "",
    max_participants: 25,
  },
];

const FCODE_GALLERY = [
  {
    id: "g-1",
    club_id: FCODE_CLUB.id,
    image_url: "",
    caption: "ICPC Regional 2025",
    uploaded_at: "2025-12-01T00:00:00+00:00",
  },
  {
    id: "g-2",
    club_id: FCODE_CLUB.id,
    image_url: "",
    caption: "F-Code Open Day 2025",
    uploaded_at: "2025-10-15T00:00:00+00:00",
  },
];

const FCODE_ANNOUNCEMENTS = [
  {
    id: "a-1",
    club_id: FCODE_CLUB.id,
    title: "Recruitment Open Now",
    content: "We are recruiting new members for the Fall 2026 term. Apply by July 30.",
    audience: "public",
    created_at: "2026-07-01T00:00:00+00:00",
  },
];

const FCODE_MEMBERS = [
  {
    id: "m-1",
    position: "Leader",
    profiles: {
      id: FCODE_CLUB.leader_id,
      full_name: "Nguyen Van A",
      avatar_url: "",
      email: "leader@fcode.example.com",
    },
  },
  {
    id: "m-2",
    position: "Vice Leader",
    profiles: {
      id: "11111111-1111-4111-8111-111111111111",
      full_name: "Tran Thi B",
      avatar_url: "",
      email: "vice@fcode.example.com",
    },
  },
];

const FCODE_LEADER_INFO = {
  leader_id: FCODE_CLUB.leader_id,
  mentor_id: null,
  l_profile: {
    id: FCODE_CLUB.leader_id,
    full_name: "Nguyen Van A",
    student_code: "SE12345",
    avatar_url: "",
    email: "leader@fcode.example.com",
  },
  m_profile: null,
};

/* ---------- Public helpers ---------------------------------------------- */

const clone = (v) => JSON.parse(JSON.stringify(v));

export const mockData = {
  getClubById(idOrSlug) {
    const lc = String(idOrSlug || "").toLowerCase();
    const match =
      ALL_CLUBS.find((c) => c.id === idOrSlug) ||
      ALL_CLUBS.find((c) => c.slug.toLowerCase() === lc) ||
      (lc === "fcode" ? FCODE_CLUB : null);
    return match ? clone(match) : null;
  },

  getAllClubs({ categoryId, search, limit = 20, offset = 0 } = {}) {
    let rows = ALL_CLUBS.filter((c) => c.status === "active");
    if (categoryId) rows = rows.filter((c) => c.category_id === categoryId);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((c) => c.name.toLowerCase().includes(q));
    }
    return clone(rows.slice(offset, offset + limit));
  },

  getFeatured(limit = 8) {
    return clone(
      ALL_CLUBS.filter((c) => c.recruitment_status).slice(0, limit)
    );
  },

  getRelated({ categoryId, excludeClubId, limit = 4 } = {}) {
    if (!categoryId) return [];
    const rows = ALL_CLUBS.filter(
      (c) => c.category_id === categoryId && c.id !== excludeClubId
    ).slice(0, limit);
    return clone(rows);
  },

  getCategories() {
    return clone([
      {
        id: "2a1e52e5-9430-4cb6-a941-2bb02a94ea3d",
        name: "Academic",
        description: "Clubs focused on academic subjects and study groups.",
      },
      { id: "aaaa-music", name: "Arts", description: "Arts & performance clubs." },
    ]);
  },

  getMembers(clubId) {
    if (clubId === FCODE_CLUB.id) return clone(FCODE_MEMBERS);
    return [];
  },

  getLeaderInfo(clubId) {
    if (clubId === FCODE_CLUB.id) return clone(FCODE_LEADER_INFO);
    return null;
  },

  getEventsByClub(clubId) {
    if (clubId === FCODE_CLUB.id || clubId === "fcode")
      return clone(FCODE_EVENTS);
    return [];
  },

  getGalleryByClub(clubId) {
    if (clubId === FCODE_CLUB.id || clubId === "fcode")
      return clone(FCODE_GALLERY);
    return [];
  },

  getAnnouncements(clubId) {
    if (clubId === FCODE_CLUB.id) return clone(FCODE_ANNOUNCEMENTS);
    return [];
  },

  getMembership(/* profileId, clubId */) {
    return null;
  },
};

export default mockData;