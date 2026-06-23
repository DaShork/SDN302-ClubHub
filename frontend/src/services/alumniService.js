import { supabase } from "./supabase";

// Helper to check if Supabase is properly configured
const isSupabaseConfigured = () => {
  return (
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_URL !== "" &&
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    import.meta.env.VITE_SUPABASE_ANON_KEY !== ""
  );
};

// Rich Mock Data for LocalStorage Fallback
const DEFAULT_ALUMNI = [
  {
    id: "al-1",
    name: "Nguyen Van Anh",
    graduation_year: 2022,
    major: "Software Engineering",
    former_club: "JS Club (Javascript Club)",
    club_role: "Club Leader (President)",
    current_role: "Senior Software Engineer",
    current_company: "FPT Software",
    linkedin_url: "https://linkedin.com/in/anhnv-fpt",
    email: "anhnv.alumni@fpt.edu.vn",
    bio: "Passionate about building scalable JavaScript web applications. Happy to mentor JS Club members in React, Node.js, and career path definition in SE.",
    status: "Approved",
    avatar_gradient: "from-blue-500 to-indigo-600"
  },
  {
    id: "al-2",
    name: "Tran Thi Bich",
    graduation_year: 2021,
    major: "Business Administration",
    former_club: "F-Music Club (FMC)",
    club_role: "Vice President",
    current_role: "Product Owner",
    current_company: "VinGroup",
    linkedin_url: "https://linkedin.com/in/bichtt-vingroup",
    email: "bichtt.alumni@fpt.edu.vn",
    bio: "Transitioned from business analysis to product ownership. Active in FMC during 2018-2021. Reach out if you want to learn about Product Management!",
    status: "Approved",
    avatar_gradient: "from-purple-500 to-pink-600"
  },
  {
    id: "al-3",
    name: "Le Hoang Cuong",
    graduation_year: 2023,
    major: "Information Assurance",
    former_club: "FPTU AI Club",
    club_role: "Tech Lead",
    current_role: "Cybersecurity Specialist",
    current_company: "Viettel Cyber Security",
    linkedin_url: "https://linkedin.com/in/cuonglh-viettel",
    email: "cuonglh.alumni@fpt.edu.vn",
    bio: "Focused on penetration testing and threat intelligence. Former AI Club Technical Head. Can help with security certifications advice (CEH, OSCP).",
    status: "Approved",
    avatar_gradient: "from-emerald-500 to-teal-600"
  },
  {
    id: "al-4",
    name: "Pham Minh Dung",
    graduation_year: 2020,
    major: "Graphic Design",
    former_club: "FPTU Media Club",
    club_role: "Media Design Lead",
    current_role: "Senior UI/UX Designer",
    current_company: "VNG Corporation",
    linkedin_url: "https://linkedin.com/in/dungpm-vng",
    email: "dungpm.alumni@fpt.edu.vn",
    bio: "Designer at heart. Spent 4 years organizing banners and videos for university clubs. Let's discuss Figma, design systems, and portfolio building.",
    status: "Approved",
    avatar_gradient: "from-amber-500 to-orange-600"
  },
  {
    id: "al-5",
    name: "Hoang Xuan Giang",
    graduation_year: 2024,
    major: "Software Engineering",
    former_club: "JS Club (Javascript Club)",
    club_role: "Core Member",
    current_role: "Frontend Developer",
    current_company: "NashTech Vietnam",
    linkedin_url: "https://linkedin.com/in/gianghx-nashtech",
    email: "gianghx.alumni@fpt.edu.vn",
    bio: "Just graduated recently. Experienced in React and Next.js. Active organizer of web development webinars.",
    status: "Pending",
    avatar_gradient: "from-red-500 to-rose-600"
  },
  {
    id: "al-6",
    name: "Vu Ngoc Huong",
    graduation_year: 2024,
    major: "International Business",
    former_club: "FPTU English Club (EC)",
    club_role: "Club Leader (President)",
    current_role: "Marketing Associate",
    current_company: "Unilever Vietnam",
    linkedin_url: "https://linkedin.com/in/huongvn-unilever",
    email: "huongvn.alumni@fpt.edu.vn",
    bio: "Love communications, marketing, and cross-cultural business management. Led English Club to host 10+ campus events.",
    status: "Pending",
    avatar_gradient: "from-sky-500 to-blue-600"
  }
];

// LocalStorage helpers
const getLocalAlumni = () => {
  const data = localStorage.getItem("clubhub_alumni");
  if (!data) {
    localStorage.setItem("clubhub_alumni", JSON.stringify(DEFAULT_ALUMNI));
    return DEFAULT_ALUMNI;
  }
  return JSON.parse(data);
};

const saveLocalAlumni = (alumni) => {
  localStorage.setItem("clubhub_alumni", JSON.stringify(alumni));
};

export const alumniService = {
  // Get approved alumni profiles
  async getAlumni() {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("alumni_profiles")
          .select("*")
          .eq("status", "Approved")
          .order("graduation_year", { ascending: false });
        if (!error) return data;
        console.warn("Supabase error fetching alumni, falling back to local storage:", error);
      } catch (e) {
        console.warn("Supabase exception, falling back to local storage:", e);
      }
    }
    return getLocalAlumni().filter((al) => al.status === "Approved");
  },

  // Get pending alumni profiles (for IC-PDP / admin)
  async getPendingAlumni() {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("alumni_profiles")
          .select("*")
          .eq("status", "Pending")
          .order("graduation_year", { ascending: false });
        if (!error) return data;
        console.warn("Supabase error fetching pending alumni, falling back to local storage:", error);
      } catch (e) {
        console.warn("Supabase exception, falling back to local storage:", e);
      }
    }
    return getLocalAlumni().filter((al) => al.status === "Pending");
  },

  // Submit a new alumni profile (claims/creates profile)
  async submitAlumniProfile(profileData) {
    const newProfile = {
      id: profileData.id || `al-${Date.now()}`,
      name: profileData.name,
      graduation_year: parseInt(profileData.graduation_year),
      major: profileData.major,
      former_club: profileData.former_club,
      club_role: profileData.club_role || "Member",
      current_role: profileData.current_role || "Working",
      current_company: profileData.current_company || "Self-Employed",
      linkedin_url: profileData.linkedin_url || "",
      email: profileData.email,
      bio: profileData.bio || "",
      status: "Pending", // Awaiting approval
      avatar_gradient: profileData.avatar_gradient || "from-slate-500 to-slate-700"
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("alumni_profiles")
          .insert([newProfile])
          .select()
          .single();
        if (!error) return data;
        console.warn("Supabase error submitting alumni profile, falling back to local storage:", error);
      } catch (e) {
        console.warn("Supabase exception, falling back to local storage:", e);
      }
    }

    const alumni = getLocalAlumni();
    alumni.push(newProfile);
    saveLocalAlumni(alumni);
    return newProfile;
  },

  // Approve a pending profile (IC-PDP only)
  async approveAlumniProfile(profileId) {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("alumni_profiles")
          .update({ status: "Approved" })
          .eq("id", profileId)
          .select()
          .single();
        if (!error) return data;
        console.warn("Supabase error approving alumni, falling back to local storage:", error);
      } catch (e) {
        console.warn("Supabase exception, falling back to local storage:", e);
      }
    }

    const alumni = getLocalAlumni();
    const index = alumni.findIndex((al) => al.id === profileId);
    if (index !== -1) {
      alumni[index].status = "Approved";
      saveLocalAlumni(alumni);
      return alumni[index];
    }
    throw new Error("Profile not found");
  },

  // Reject a pending profile (IC-PDP only)
  async rejectAlumniProfile(profileId) {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("alumni_profiles")
          .update({ status: "Rejected" })
          .eq("id", profileId)
          .select()
          .single();
        if (!error) return data;
        console.warn("Supabase error rejecting alumni, falling back to local storage:", error);
      } catch (e) {
        console.warn("Supabase exception, falling back to local storage:", e);
      }
    }

    const alumni = getLocalAlumni();
    const index = alumni.findIndex((al) => al.id === profileId);
    if (index !== -1) {
      alumni[index].status = "Rejected";
      saveLocalAlumni(alumni);
      return alumni[index];
    }
    throw new Error("Profile not found");
  }
};
