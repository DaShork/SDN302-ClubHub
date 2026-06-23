import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { alumniService } from "../services/alumniService";

export default function Alumni() {
  const { role } = useAuth();

  // State
  const [alumni, setAlumni] = useState([]);
  const [pendingAlumni, setPendingAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("All");
  const [selectedClub, setSelectedClub] = useState("All");
  const [selectedYear, setSelectedYear] = useState("All");

  // Admin section active tab
  const [activeDirectoryTab, setActiveDirectoryTab] = useState("directory"); // directory, admin_pending

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [notification, setNotification] = useState(null);

  // Form State
  const [formState, setFormState] = useState({
    name: "",
    graduation_year: 2024,
    major: "Software Engineering",
    former_club: "",
    club_role: "Member",
    current_role: "",
    current_company: "",
    linkedin_url: "",
    email: "",
    bio: "",
    avatar_gradient: "from-blue-500 to-indigo-600"
  });

  // Load directory data
  const loadAlumniData = async () => {
    setLoading(true);
    try {
      const approvedList = await alumniService.getAlumni();
      setAlumni(approvedList);

      if (role === "IC-PDP") {
        const pendingList = await alumniService.getPendingAlumni();
        setPendingAlumni(pendingList);
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load alumni directory. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlumniData();
  }, [role]);

  const showToast = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Submission
  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    if (!formState.name || !formState.email || !formState.former_club) {
      showToast("Please fill in the required fields", "danger");
      return;
    }

    try {
      await alumniService.submitAlumniProfile(formState);
      showToast("Profile submitted! Awaiting IC-PDP admin approval.");
      setShowAddModal(false);
      // Reset form
      setFormState({
        name: "",
        graduation_year: 2024,
        major: "Software Engineering",
        former_club: "",
        club_role: "Member",
        current_role: "",
        current_company: "",
        linkedin_url: "",
        email: "",
        bio: "",
        avatar_gradient: getRandomAvatarColor()
      });
      loadAlumniData();
    } catch (err) {
      showToast(err.message || "Failed to submit profile", "danger");
    }
  };

  // Approval actions
  const handleApprove = async (id) => {
    try {
      await alumniService.approveAlumniProfile(id);
      showToast("Alumni profile approved successfully!");
      loadAlumniData();
    } catch (err) {
      showToast(err.message || "Approval failed", "danger");
    }
  };

  const handleReject = async (id) => {
    try {
      await alumniService.rejectAlumniProfile(id);
      showToast("Alumni profile rejected.", "danger");
      loadAlumniData();
    } catch (err) {
      showToast(err.message || "Rejection failed", "danger");
    }
  };

  // Helper colors
  const avatarGradients = [
    "from-blue-500 to-indigo-600",
    "from-purple-500 to-pink-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
    "from-sky-500 to-blue-600",
    "from-violet-500 to-fuchsia-600",
    "from-rose-500 to-red-600"
  ];

  const getRandomAvatarColor = () => {
    return avatarGradients[Math.floor(Math.random() * avatarGradients.length)];
  };

  // Unique filters generation
  const majorsList = ["All", ...new Set(alumni.map((al) => al.major))];
  const graduationYears = ["All", ...new Set(alumni.map((al) => al.graduation_year.toString()))].sort((a,b)=>b.localeCompare(a));
  
  // Clean club names for filter dropdown
  const clubsList = ["All", ...new Set(alumni.map((al) => {
    // Return first word or abbreviation
    return al.former_club.split(" ")[0];
  }))];

  // Filtering logic
  const filteredAlumni = alumni.filter((al) => {
    const matchesSearch =
      al.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      al.current_role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      al.current_company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      al.former_club.toLowerCase().includes(searchQuery.toLowerCase()) ||
      al.bio.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesMajor = selectedMajor === "All" || al.major === selectedMajor;
    const matchesYear = selectedYear === "All" || al.graduation_year.toString() === selectedYear;
    
    const clubAbbreviation = al.former_club.split(" ")[0];
    const matchesClub = selectedClub === "All" || clubAbbreviation === selectedClub;
    
    return matchesSearch && matchesMajor && matchesYear && matchesClub;
  });

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 relative">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-5 py-3.5 rounded-xl shadow-2xl transition-all duration-300 animate-slide-in ${
          notification.type === "danger" ? "bg-red-500 text-white" : "bg-accent-blue text-white font-bold"
        }`}>
          <span className="text-sm">{notification.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-6 mb-8 text-left">
        <div>
          <h1 className="text-3xl font-extrabold text-secondary-100 tracking-tight margin-0 leading-none">
            Alumni Network Directory
          </h1>
          <p className="text-xs text-secondary-300 mt-2">
            Build connections, find mentors, and stay connected with FPT University graduates.
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          {/* Approve Tab Toggle for PDP */}
          {role === "IC-PDP" && (
            <div className="flex bg-primary-600/30 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setActiveDirectoryTab("directory")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeDirectoryTab === "directory" ? "bg-accent-blue text-white" : "text-secondary-200"
                }`}
              >
                Directory
              </button>
              <button
                onClick={() => setActiveDirectoryTab("admin_pending")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                  activeDirectoryTab === "admin_pending" ? "bg-accent-blue text-white" : "text-secondary-200"
                }`}
              >
                <span>Pending Approval</span>
                {pendingAlumni.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
                    {pendingAlumni.length}
                  </span>
                )}
              </button>
            </div>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-800 to-accent-blue text-white font-bold text-xs shadow-md shadow-accent-blue/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Register Profile</span>
          </button>
        </div>
      </div>

      {activeDirectoryTab === "directory" ? (
        <>
          {/* Filters Panel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search name, job, company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-primary-600/40 border border-white/10 rounded-xl py-2 px-10 text-xs text-secondary-100 placeholder-secondary-300 outline-none focus:border-accent-blue transition-colors h-11 text-left"
              />
              <svg className="absolute left-3.5 top-3.5 w-4 h-4 text-secondary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Major Dropdown */}
            <div className="flex flex-col text-left">
              <select
                value={selectedMajor}
                onChange={(e) => setSelectedMajor(e.target.value)}
                className="w-full bg-primary-600/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-secondary-100 outline-none focus:border-accent-blue h-11 cursor-pointer"
              >
                <option value="All">All Majors</option>
                {majorsList.filter(m=>m!=="All").map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Club Dropdown */}
            <div className="flex flex-col text-left">
              <select
                value={selectedClub}
                onChange={(e) => setSelectedClub(e.target.value)}
                className="w-full bg-primary-600/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-secondary-100 outline-none focus:border-accent-blue h-11 cursor-pointer"
              >
                <option value="All">All Clubs</option>
                {clubsList.filter(c=>c!=="All").map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Year Dropdown */}
            <div className="flex flex-col text-left">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full bg-primary-600/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-secondary-100 outline-none focus:border-accent-blue h-11 cursor-pointer"
              >
                <option value="All">All Grad Years</option>
                {graduationYears.filter(y=>y!=="All").map(y => (
                  <option key={y} value={y}>Class of {y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Directory Grid */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-4 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-secondary-300 mt-4 font-semibold">Loading directory...</span>
            </div>
          ) : error ? (
            <div className="py-20 text-center glass-panel rounded-2xl border border-red-500/10 max-w-lg mx-auto">
              <span className="text-red-500 font-bold block">Error loading directory</span>
              <p className="text-xs text-secondary-300 mt-1">{error}</p>
              <button onClick={loadAlumniData} className="mt-4 px-4 py-2 bg-primary-600 border border-white/10 text-xs rounded-xl font-bold text-secondary-100 hover:bg-primary-700">
                Retry
              </button>
            </div>
          ) : filteredAlumni.length === 0 ? (
            <div className="py-24 text-center glass-panel rounded-2xl border border-white/5">
              <svg className="w-12 h-12 text-secondary-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="block text-secondary-200 font-bold mt-4">No alumni found</span>
              <p className="text-xs text-secondary-300 mt-1">Try modifying your filters or search keywords.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
              {filteredAlumni.map((al) => (
                <div
                  key={al.id}
                  className="bg-card-bg rounded-2xl border border-white/5 p-6 flex flex-col justify-between h-full card-hover"
                >
                  <div>
                    {/* Top Row Profile Metadata */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-tr ${al.avatar_gradient} flex items-center justify-center font-bold text-white text-base shadow`}>
                          {al.name.charAt(0)}
                        </div>
                        <div className="flex flex-col text-left">
                          <h3 className="text-base font-bold text-secondary-100 tracking-tight leading-tight">
                            {al.name}
                          </h3>
                          <span className="text-[10px] text-accent-blue font-bold tracking-wider">
                            Class of {al.graduation_year}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-primary-600 text-secondary-300 font-semibold border border-white/5">
                        {al.major}
                      </span>
                    </div>

                    {/* Job Details */}
                    <div className="mt-4 pt-3 border-t border-white/5">
                      <span className="text-xs font-semibold text-secondary-200 block">
                        {al.current_role}
                      </span>
                      <span className="text-xs text-secondary-300 font-medium block">
                        at <strong className="text-white">{al.current_company}</strong>
                      </span>
                    </div>

                    {/* Bio */}
                    <p className="text-xs text-secondary-300 mt-3 line-clamp-4 leading-relaxed italic">
                      "{al.bio || "Active in the student community. Ready to connect and mentor juniors."}"
                    </p>
                  </div>

                  {/* Connection Details */}
                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex flex-col text-left">
                      <span className="text-[9px] text-secondary-300 uppercase tracking-wider font-semibold">Former Club Role</span>
                      <span className="text-[10px] text-secondary-100 font-medium truncate max-w-[180px]">
                        {al.club_role} @ {al.former_club.split(" ")[0]}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 shrink-0">
                      {al.linkedin_url && (
                        <a
                          href={al.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-primary-600 text-accent-blue border border-white/5 hover:bg-accent-blue/10 hover:border-accent-blue/30 transition-all"
                          title="LinkedIn Profile"
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                          </svg>
                        </a>
                      )}
                      
                      <a
                        href={`mailto:${al.email}`}
                        className="p-1.5 rounded-lg bg-primary-600 text-secondary-200 border border-white/5 hover:bg-primary-700 transition-all"
                        title="Send Email"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Admin Pending List Tab */
        <div className="space-y-6 text-left">
          <div className="bg-primary-600/20 border border-white/10 rounded-xl p-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-secondary-100">IC-PDP Admin Moderation</h3>
              <p className="text-[10px] text-secondary-300 mt-0.5">Review graduate claims before they appear in the public alumni directory.</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded bg-accent-blue text-white font-bold uppercase">
              {pendingAlumni.length} pending
            </span>
          </div>

          {pendingAlumni.length === 0 ? (
            <div className="py-20 text-center glass-panel rounded-2xl border border-white/5">
              <svg className="w-10 h-10 text-secondary-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h4 className="text-sm font-bold text-secondary-200 mt-3">Clean Inbox!</h4>
              <p className="text-xs text-secondary-300 mt-1">There are no pending alumni profile requests at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pendingAlumni.map((pending) => (
                <div key={pending.id} className="bg-card-bg border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-white/5">
                      <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${pending.avatar_gradient} flex items-center justify-center font-bold text-white text-xs`}>
                          {pending.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">{pending.name}</h4>
                          <span className="text-[9px] text-secondary-300">{pending.email}</span>
                        </div>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-red-500/20 text-red-500 border border-red-500/30 uppercase font-bold tracking-wider">
                        Pending
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="block text-[9px] text-secondary-300 uppercase font-semibold">Major & Year</span>
                        <span className="font-medium text-secondary-100">{pending.major} (Class of {pending.graduation_year})</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-secondary-300 uppercase font-semibold">Former Club Role</span>
                        <span className="font-medium text-secondary-100">{pending.club_role} in {pending.former_club.split(" ")[0]}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-[9px] text-secondary-300 uppercase font-semibold">Current Job Title</span>
                        <span className="font-medium text-secondary-100">{pending.current_role} @ {pending.current_company}</span>
                      </div>
                    </div>

                    <p className="text-xs text-secondary-300 mt-3 p-2 bg-primary-900 rounded border border-white/5 italic">
                      "{pending.bio || "No bio advice provided."}"
                    </p>

                    {pending.linkedin_url && (
                      <a href={pending.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-accent-blue hover:underline inline-flex items-center space-x-0.5 mt-2">
                        <span>Check LinkedIn Profile</span>
                        <span>↗</span>
                      </a>
                    )}
                  </div>

                  <div className="mt-6 pt-3 border-t border-white/5 flex items-center justify-end space-x-3">
                    <button
                      onClick={() => handleReject(pending.id)}
                      className="px-3.5 py-2 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Reject Profile
                    </button>
                    <button
                      onClick={() => handleApprove(pending.id)}
                      className="px-3.5 py-2 rounded-xl bg-accent-blue text-white hover:bg-blue-600 text-xs font-bold transition-all shadow-md cursor-pointer"
                    >
                      Approve & Publish
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Register Alumni Profile Form */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-card-bg border border-white/10 rounded-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 text-left relative animate-scale-in">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-secondary-300 hover:text-white cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-xl font-bold text-secondary-100 mb-2">Claim / Register Alumni Profile</h3>
            <p className="text-xs text-secondary-300 mb-6">Let FPT juniors discover your career journey and request mentorship.</p>

            <form onSubmit={handleSubmitProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-secondary-200 mb-1.5 uppercase">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nguyen Van An"
                    value={formState.name}
                    onChange={(e) => setFormState((p) => ({ ...p, name: e.target.value }))}
                    className="w-full bg-primary-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-secondary-100 outline-none focus:border-accent-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-secondary-200 mb-1.5 uppercase">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. an@fpt.edu.vn"
                    value={formState.email}
                    onChange={(e) => setFormState((p) => ({ ...p, email: e.target.value }))}
                    className="w-full bg-primary-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-secondary-100 outline-none focus:border-accent-blue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-secondary-200 mb-1.5 uppercase">Graduation Year *</label>
                  <input
                    type="number"
                    min={2000}
                    max={2030}
                    required
                    value={formState.graduation_year}
                    onChange={(e) => setFormState((p) => ({ ...p, graduation_year: parseInt(e.target.value) }))}
                    className="w-full bg-primary-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-secondary-100 outline-none focus:border-accent-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-secondary-200 mb-1.5 uppercase">FPT Major *</label>
                  <select
                    value={formState.major}
                    onChange={(e) => setFormState((p) => ({ ...p, major: e.target.value }))}
                    className="w-full bg-primary-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-secondary-100 outline-none focus:border-accent-blue cursor-pointer h-11"
                  >
                    <option value="Software Engineering">Software Engineering</option>
                    <option value="Information Assurance">Information Assurance</option>
                    <option value="Business Administration">Business Administration</option>
                    <option value="Graphic Design">Graphic Design</option>
                    <option value="International Business">International Business</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-secondary-200 mb-1.5 uppercase">Former Club Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. JS Club (Javascript Club)"
                    value={formState.former_club}
                    onChange={(e) => setFormState((p) => ({ ...p, former_club: e.target.value }))}
                    className="w-full bg-primary-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-secondary-100 outline-none focus:border-accent-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-secondary-200 mb-1.5 uppercase">Role inside Club</label>
                  <input
                    type="text"
                    placeholder="e.g. Core Member, Tech Lead"
                    value={formState.club_role}
                    onChange={(e) => setFormState((p) => ({ ...p, club_role: e.target.value }))}
                    className="w-full bg-primary-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-secondary-100 outline-none focus:border-accent-blue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-secondary-200 mb-1.5 uppercase">Current Job Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Software Engineer, PO"
                    value={formState.current_role}
                    onChange={(e) => setFormState((p) => ({ ...p, current_role: e.target.value }))}
                    className="w-full bg-primary-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-secondary-100 outline-none focus:border-accent-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-secondary-200 mb-1.5 uppercase">Current Company</label>
                  <input
                    type="text"
                    placeholder="e.g. FPT Software, Google"
                    value={formState.current_company}
                    onChange={(e) => setFormState((p) => ({ ...p, current_company: e.target.value }))}
                    className="w-full bg-primary-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-secondary-100 outline-none focus:border-accent-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary-200 mb-1.5 uppercase">LinkedIn Profile Link</label>
                <input
                  type="url"
                  placeholder="e.g. https://linkedin.com/in/username"
                  value={formState.linkedin_url}
                  onChange={(e) => setFormState((p) => ({ ...p, linkedin_url: e.target.value }))}
                  className="w-full bg-primary-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-secondary-100 outline-none focus:border-accent-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary-200 mb-1.5 uppercase">Bio & Mentorship Advice</label>
                <textarea
                  placeholder="Share advice with FPTU students, describe what you can help them with, or outline your career path..."
                  rows={3}
                  value={formState.bio}
                  onChange={(e) => setFormState((p) => ({ ...p, bio: e.target.value }))}
                  className="w-full bg-primary-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-secondary-100 outline-none focus:border-accent-blue resize-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-secondary-200 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-800 to-accent-blue text-white text-xs font-bold cursor-pointer"
                >
                  Submit Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
