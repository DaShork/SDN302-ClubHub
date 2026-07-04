import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { announcementService } from "../../services/announcementService";
import { resolveClubUuid } from "../../services/supabase";
import { useAuth } from "@/hooks/useAuth";

export default function AnnouncementsPage() {
  const { clubId } = useParams();
  const { profileId } = useAuth();
  const [resolvedClubId, setResolvedClubId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // 1. Initial Mock Data for Announcements Notice Board
  const [announcements, setAnnouncements] = useState([
    {
      id: "1",
      title: "Weekly Tech Workshop: TailwindCSS v4 Setup & Best Practices",
      author: "Nguyễn Hoàng Nam",
      date: "2026-07-02",
      content: "Hi members, our weekly training session starts today at ALAGRE Space at 14:00. Make sure to pull the latest changes from Github, install dependencies before joining, and bring your laptops. We will be coding the Tailwind v4 responsive grids.",
      audience: "Members",
      pinned: true
    }
  ]);

  async function fetchAnnouncements(uuid) {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await announcementService.getAnnouncements(uuid).catch(() => []);

      const parsed = data.map(ann => ({
        id: ann.id,
        title: ann.title,
        author: ann.profiles?.full_name || "—",
        date: ann.created_at ? ann.created_at.slice(0, 10) : new Date().toISOString().split("T")[0],
        content: ann.content || "",
        audience: ann.audience ? ann.audience.charAt(0).toUpperCase() + ann.audience.slice(1) : "Public",
        pinned: ann.is_pinned || false
      }));
      setAnnouncements(parsed);
    } catch (err) {
      console.error("Supabase announcements load failed, utilizing fallback data:", err);
      setErrorMsg("Không thể tải dữ liệu từ database.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function init() {
      if (clubId) {
        const uuid = await resolveClubUuid(clubId);
        setResolvedClubId(uuid);
        if (uuid) {
          fetchAnnouncements(uuid);
        } else {
          setLoading(false);
        }
      }
    }
    init();
  }, [clubId]);

  // List of visibility and audience filters
  const audienceList = ["Public", "Members", "Leaders"];

  // 2. States for Filtering & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAudience, setSelectedAudience] = useState("All");

  // 3. States for CRUD Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    audience: "Public",
    pinned: false
  });

  // 4. Handlers
  const handleOpenAddModal = () => {
    setSelectedAnnouncement(null);
    setFormData({
      title: "",
      content: "",
      audience: "Public",
      pinned: false
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (ann) => {
    setSelectedAnnouncement(ann);
    setFormData({
      title: ann.title,
      content: ann.content,
      audience: ann.audience,
      pinned: ann.pinned
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAnnouncement(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      club_id: resolvedClubId || clubId,
      title: formData.title,
      content: formData.content,
      audience: formData.audience.toLowerCase(),
      is_pinned: formData.pinned,
      created_by: profileId || null
    };

    try {
      if (selectedAnnouncement) {
        await announcementService.updateAnnouncement(selectedAnnouncement.id, payload);
      } else {
        await announcementService.createAnnouncement(payload);
      }
      if (resolvedClubId) fetchAnnouncements(resolvedClubId);
    } catch (err) {
      console.warn("Supabase announcement save failed, running local state update:", err);
      if (selectedAnnouncement) {
        setAnnouncements((prev) =>
          prev.map((ann) =>
            ann.id === selectedAnnouncement.id ? { ...ann, ...formData } : ann
          )
        );
      } else {
        const newAnn = {
          id: String(announcements.length + 1),
          author: "Lê Thanh Tùng",
          date: new Date().toISOString().split("T")[0],
          ...formData
        };
        setAnnouncements((prev) => [newAnn, ...prev]);
      }
    }
    handleCloseModal();
  };

  const handleDeleteAnn = async (id) => {
    if (confirm("Are you sure you want to permanently delete this announcement?")) {
      try {
        await announcementService.deleteAnnouncement(id);
        if (resolvedClubId) fetchAnnouncements(resolvedClubId);
      } catch (err) {
        console.warn("Supabase delete notice failed, updating state locally:", err);
        setAnnouncements((prev) => prev.filter((ann) => ann.id !== id));
      }
    }
  };

  const handleTogglePin = async (id) => {
    const notice = announcements.find(ann => ann.id === id);
    if (!notice) return;

    try {
      await announcementService.updateAnnouncement(id, { is_pinned: !notice.pinned });
      if (resolvedClubId) fetchAnnouncements(resolvedClubId);
    } catch (err) {
      console.warn("Supabase pin toggle failed, updating state locally:", err);
      setAnnouncements((prev) =>
        prev.map((ann) => (ann.id === id ? { ...ann, pinned: !ann.pinned } : ann))
      );
    }
  };

  // 5. Filter Logic
  const filteredAnnouncements = announcements
    .filter((ann) => {
      const matchesSearch =
        ann.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ann.content.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesAudience = selectedAudience === "All" || ann.audience === selectedAudience;

      return matchesSearch && matchesAudience;
    })
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#06231D] tracking-tight">Announcement Center</h2>
          <p className="text-xs text-[#4A5D59]">Publish administrative updates, event briefs, or specific committee alerts.</p>
        </div>
        <div className="flex gap-2">
          {errorMsg && (
            <span className="bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-2 rounded-xl flex items-center gap-1 font-medium animate-fade-in">
              ⚠️ {errorMsg}
            </span>
          )}
          <button
            onClick={handleOpenAddModal}
            className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-[#0E4B43] to-[#22C55E] text-white font-bold text-xs hover:opacity-90 transition-all flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <span>📣</span> Create Notice
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#06231D]/10 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#4A5D59]">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search announcements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#06231D] placeholder-[#4A5D59] focus:outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-all"
          />
        </div>

        {/* Audience filter dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#4A5D59]">Audience:</span>
          <select
            value={selectedAudience}
            onChange={(e) => setSelectedAudience(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-[#06231D] focus:outline-none focus:border-[#22C55E]"
          >
            <option value="All">All Audiences</option>
            <option value="Public">Public (All Students)</option>
            <option value="Members">Club Members</option>
            <option value="Leaders">Committee Leaders</option>
          </select>
        </div>
      </div>

      {/* Announcements List Layout */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-[#4A5D59] flex flex-col items-center justify-center gap-2 bg-white border border-gray-200 rounded-2xl">
            <span className="w-6 h-6 border-2 border-[#22C55E] border-t-transparent rounded-full animate-spin"></span>
            <span>Fetching announcements...</span>
          </div>
        ) : filteredAnnouncements.length > 0 ? (
          filteredAnnouncements.map((ann) => (
            <div
              key={ann.id}
              className={`p-6 rounded-2xl bg-white border shadow-sm relative overflow-hidden transition-all duration-300 ${
                ann.pinned ? "border-[#22C55E]/60 ring-1 ring-[#22C55E]/5" : "border-gray-200"
              }`}
            >
              {/* Pin Banner Badge */}
              {ann.pinned && (
                <span className="absolute top-0 right-0 bg-[#22C55E]/20 text-[#0E4B43] border-b border-l border-[#22C55E]/30 text-[9px] font-bold tracking-widest uppercase px-3.5 py-1 rounded-bl-xl select-none">
                  📌 Pinned Notice
                </span>
              )}

              {/* Title & Author row */}
              <div className="mb-3.5 max-w-[80%] md:max-w-none">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                    ann.audience === "Public"
                      ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                      : ann.audience === "Members"
                      ? "bg-teal-500/10 text-teal-700 border-teal-500/20"
                      : "bg-red-500/10 text-red-600 border-red-500/20"
                  }`}>
                    {ann.audience}
                  </span>
                  <span className="text-[10px] text-[#4A5D59]">• Uploaded: {ann.date}</span>
                </div>
                <h3 className="text-base md:text-lg font-bold text-[#06231D] leading-tight">{ann.title}</h3>
                <p className="text-[10px] text-[#4A5D59] mt-1">
                  Published by <strong className="text-[#06231D] font-bold">{ann.author}</strong>
                </p>
              </div>

              {/* Content body */}
              <p className="text-xs md:text-sm text-[#06231D] leading-relaxed whitespace-pre-wrap mb-4 bg-[#F4F1EA]/60 p-4 rounded-xl border border-gray-200">
                {ann.content}
              </p>

              {/* Actions row */}
              <div className="border-t border-gray-100 pt-3.5 flex gap-3 justify-end items-center text-xs">
                <button
                  onClick={() => handleTogglePin(ann.id)}
                  className="text-[#4A5D59] hover:text-[#06231D] transition-all font-medium animate-fade-in"
                >
                  {ann.pinned ? "Unpin Notice" : "Pin to Top"}
                </button>
                <span className="text-gray-200">|</span>
                <button
                  onClick={() => handleOpenEditModal(ann)}
                  className="text-[#22C55E] hover:underline font-bold"
                >
                  Edit
                </button>
                <span className="text-gray-200">|</span>
                <button
                  onClick={() => handleDeleteAnn(ann.id)}
                  className="text-red-500 hover:text-red-600 font-semibold transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-[#4A5D59] bg-white border border-gray-200 rounded-2xl">
            No notices published matching filters.
          </div>
        )}
      </div>

      {/* CRUD Form Modal (Add / Edit) */}
      <AnnouncementFormModal
        isOpen={isModalOpen}
        selectedAnnouncement={selectedAnnouncement}
        formData={formData}
        audienceList={audienceList}
        handleCloseModal={handleCloseModal}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
      />
    </div>
  );
}

function AnnouncementFormModal({
  isOpen,
  selectedAnnouncement,
  formData,
  audienceList,
  handleCloseModal,
  handleInputChange,
  handleSubmit
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseModal}></div>

      <div className="bg-white border border-gray-200 rounded-2xl max-w-md w-full p-6 z-50 shadow-2xl relative animate-fade-in text-sm text-[#06231D]">
        <button onClick={handleCloseModal} className="absolute top-4 right-4 text-[#4A5D59] hover:text-[#06231D] p-1">
          ✕
        </button>
        <h3 className="text-lg font-bold text-[#06231D] mb-4">
          {selectedAnnouncement ? "✏️ Edit Announcement" : "📣 Publish Announcement"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-[#4A5D59] uppercase mb-1">Title</label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g. Critical training alert!"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#06231D] focus:outline-none focus:border-[#22C55E]"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-bold text-[#4A5D59] uppercase mb-1">Detailed Message</label>
            <textarea
              name="content"
              required
              rows="5"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="Write the full announcement details here..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-[#06231D] focus:outline-none focus:border-[#22C55E]"
            ></textarea>
          </div>

          {/* Grid: Audience & Pinned toggle */}
          <div className="grid grid-cols-2 gap-4 items-center">
            {/* Audience Selection */}
            <div>
              <label className="block text-xs font-bold text-[#4A5D59] uppercase mb-1">Target Audience</label>
              <select
                name="audience"
                value={formData.audience}
                onChange={handleInputChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-[#06231D] focus:outline-none focus:border-[#22C55E]"
              >
                {audienceList.map((aud, idx) => (
                  <option key={idx} value={aud}>{aud} Only</option>
                ))}
              </select>
            </div>

            {/* Pinned Toggle */}
            <div className="flex items-center gap-2 mt-4 select-none">
              <input
                type="checkbox"
                id="pinned"
                name="pinned"
                checked={formData.pinned}
                onChange={handleInputChange}
                className="w-4 h-4 rounded accent-[#22C55E]"
              />
              <label htmlFor="pinned" className="text-xs font-bold text-[#4A5D59] cursor-pointer">Pin to noticeboard</label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end border-t border-gray-100 pt-4 mt-6">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs text-[#4A5D59] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0E4B43] to-[#22C55E] text-white font-bold text-xs hover:opacity-90 cursor-pointer"
            >
              {selectedAnnouncement ? "Save Changes" : "Publish Notice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
