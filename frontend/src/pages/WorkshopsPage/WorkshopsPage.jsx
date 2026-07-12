import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { workshopService } from "../../services/workshopService";
import { resolveClubUuid } from "../../services/supabase";

export default function WorkshopsPage() {
  const { clubId } = useParams();
  const [resolvedClubId, setResolvedClubId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // 1. Initial Mock Data for Workshops
  const [workshops, setWorkshops] = useState([
    {
      id: "1",
      title: "TailwindCSS v4 Setup & Build Optimization",
      speaker: "Trần Quốc Bảo",
      description: "A hands-on workshop focused on transitioning to TailwindCSS v4. We will cover the new Rust-based compiler engine, Vite plugin integration, and advanced configuration options.",
      startTime: "2026-07-28T08:00",
      endTime: "2026-07-28T18:00",
      location: "ALAGRE Space",
      maxSlots: 40,
      remainingSlots: 12,
      status: "Upcoming",
      document: "Tailwindv4_Workshop_Slides.pdf",
      minutes: "Weekly Planning Minutes 28/06",
      coverColor: "from-blue-500 to-indigo-700"
    }
  ]);

  async function fetchWorkshops(uuid) {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await workshopService.getClubWorkshops(uuid).catch(() => []);

      if (data.length > 0) {
        const parsed = data.map(w => ({
          id: w.id,
          title: w.title,
          speaker: w.profiles?.full_name || "Trần Quốc Bảo",
          description: w.description || "",
          startTime: w.events?.start_time ? w.events.start_time.slice(0, 16) : "2026-07-28T08:00",
          endTime: w.events?.start_time ? w.events.start_time.slice(0, 16) : "2026-07-28T18:00",
          location: w.events?.location || "ALAGRE Space",
          maxSlots: 40,
          remainingSlots: 12,
          status: "Upcoming",
          document: w.material_url || "Tailwindv4_Workshop_Slides.pdf",
          minutes: "Weekly Planning Minutes 28/06",
          coverColor: "from-blue-500 to-indigo-700"
        }));
        setWorkshops(parsed);
      }
    } catch (err) {
      console.error("Supabase workshops load error, using fallback data:", err);
      setErrorMsg("Database connection error. Showing fallback state.");
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
          fetchWorkshops(uuid);
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
    init();
  }, [clubId]);

  // Mock lists for dropdowns in form
  const documentsList = [
    "Tailwindv4_Workshop_Slides.pdf",
    "React_Hooks_Deep_Dive.pdf",
    "Sponsorship_Proposal_Template_2026.docx",
    "Standard_Event_Planning_Blueprint.pdf"
  ];

  const minutesList = [
    "Weekly Planning Minutes 28/06",
    "Training Session 3 Review Minutes",
    "Meeting Minutes 01/07.pdf",
    "Orientation_Feedback_Minutes"
  ];

  // 2. States for Filtering
  const [filterStatus, setFilterStatus] = useState("All"); // All, Upcoming, Ongoing, Finished

  // 3. States for CRUD Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    speaker: "",
    description: "",
    startTime: "",
    endTime: "",
    location: "",
    maxSlots: 40,
    remainingSlots: 40,
    status: "Upcoming",
    document: "",
    minutes: ""
  });

  // 4. Handlers
  const handleOpenAddModal = () => {
    setSelectedWorkshop(null);
    setFormData({
      title: "",
      speaker: "",
      description: "",
      startTime: "",
      endTime: "",
      location: "",
      maxSlots: 40,
      remainingSlots: 40,
      status: "Upcoming",
      document: documentsList[0],
      minutes: minutesList[0]
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (w) => {
    setSelectedWorkshop(w);
    setFormData({
      title: w.title,
      speaker: w.speaker,
      description: w.description,
      startTime: w.startTime,
      endTime: w.endTime,
      location: w.location,
      maxSlots: w.maxSlots,
      remainingSlots: w.remainingSlots,
      status: w.status,
      document: w.document,
      minutes: w.minutes
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedWorkshop(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "maxSlots" || name === "remainingSlots" ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      club_id: resolvedClubId || clubId,
      title: formData.title,
      description: formData.description,
      material_url: formData.document
    };

    try {
      if (selectedWorkshop) {
        await workshopService.updateWorkshop(selectedWorkshop.id, payload);
      } else {
        await workshopService.createWorkshop(payload);
      }
      if (resolvedClubId) fetchWorkshops(resolvedClubId);
    } catch (err) {
      console.warn("Supabase workshop save failed, using fallback state:", err);
      if (selectedWorkshop) {
        setWorkshops((prev) =>
          prev.map((w) =>
            w.id === selectedWorkshop.id ? { ...w, ...formData } : w
          )
        );
      } else {
        const colors = ["from-teal-500 to-emerald-700", "from-blue-500 to-indigo-700", "from-purple-500 to-pink-700"];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const newWorkshop = {
          id: String(workshops.length + 1),
          coverColor: randomColor,
          ...formData
        };
        setWorkshops((prev) => [newWorkshop, ...prev]);
      }
    }
    handleCloseModal();
  };

  const handleDeleteWorkshop = async (id) => {
    if (confirm("Are you sure you want to delete this workshop?")) {
      try {
        await workshopService.deleteWorkshop(id);
        if (resolvedClubId) fetchWorkshops(resolvedClubId);
      } catch (err) {
        console.warn("Supabase workshop delete failed, updating state locally:", err);
        setWorkshops((prev) => prev.filter((w) => w.id !== id));
      }
    }
  };

  // 5. Filter Logic
  const filteredWorkshops = workshops.filter((w) => {
    return filterStatus === "All" || w.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#06231D] tracking-tight">Workshops Management</h2>
          <p className="text-xs text-[#4A5D59]">Conduct training programs, link learning slides, and upload workshop materials.</p>
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
            <span>🎤</span> Create Workshop
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-[#06231D]/10 shadow-sm flex items-center justify-between">
        <div className="text-xs font-bold text-[#22C55E] uppercase tracking-wider bg-[#22C55E]/10 border border-[#22C55E]/20 px-3 py-1 rounded-xl">
          Active Workshops: {filteredWorkshops.length}
        </div>

        {/* Status filter dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#4A5D59]">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-[#06231D] focus:outline-none focus:border-[#22C55E]"
          >
            <option value="All">All Statuses</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Finished">Finished</option>
          </select>
        </div>
      </div>

      {/* Workshop Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-[#4A5D59] flex flex-col items-center justify-center gap-2 bg-white border border-gray-200 rounded-2xl">
            <span className="w-6 h-6 border-2 border-[#22C55E] border-t-transparent rounded-full animate-spin"></span>
            <span>Fetching workshops...</span>
          </div>
        ) : filteredWorkshops.length > 0 ? (
          filteredWorkshops.map((w) => (
            <div
              key={w.id}
              className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden flex flex-col justify-between hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300"
            >
              {/* Card Cover */}
              <div className={`h-36 bg-gradient-to-r ${w.coverColor} p-4 flex flex-col justify-between relative`}>
                <div className="flex justify-between items-center z-10">
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase bg-black/40 text-white border border-white/10">
                    Workshop
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                    w.status === "Upcoming"
                      ? "bg-[#22C55E]/20 text-[#22C55E] border-[#22C55E]/30 font-extrabold"
                      : "bg-white/20 text-white border-white/10 font-extrabold"
                  }`}>
                    {w.status}
                  </span>
                </div>
                <div className="z-10">
                  <h3 className="font-bold text-white text-base leading-tight truncate-2-lines">{w.title}</h3>
                </div>
                <div className="absolute inset-0 bg-black/20 z-0"></div>
              </div>

              {/* Card Details Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5 text-xs text-[#06231D]">
                  <p className="text-[#4A5D59] line-clamp-2 leading-relaxed text-[11px]">{w.description}</p>
                  <div className="border-t border-gray-100 pt-2.5 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[#4A5D59] w-4">👤</span>
                      <span>Instructor: <strong className="text-[#06231D]">{w.speaker}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#4A5D59] w-4">📅</span>
                      <span>
                        {new Date(w.startTime).toLocaleDateString()} (
                        {new Date(w.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#4A5D59] w-4">📍</span>
                      <span className="truncate font-medium">{w.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#4A5D59] w-4">🎟️</span>
                      <span>
                        {w.remainingSlots === 0 ? (
                          <span className="text-red-500 font-bold">SOLD OUT</span>
                        ) : (
                          <span>Slots left: <strong className="text-[#06231D]">{w.remainingSlots}</strong> / {w.maxSlots}</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sub links inside card */}
                {(w.document || w.minutes) && (
                  <div className="p-3 rounded-xl bg-[#F4F1EA]/60 border border-gray-200 space-y-1.5 text-[11px]">
                    {w.document && (
                      <div className="flex items-center justify-between text-[#4A5D59]">
                        <span className="truncate">📁 Material: <span className="text-[#06231D] font-bold">{w.document}</span></span>
                      </div>
                    )}
                    {w.minutes && (
                      <div className="flex items-center justify-between text-[#4A5D59]">
                        <span className="truncate">📝 Minutes: <span className="text-[#06231D] font-bold">{w.minutes}</span></span>
                      </div>
                    )}
                  </div>
                )}

                {/* Card Action footer */}
                <div className="border-t border-gray-100 pt-3.5 flex gap-2 justify-end">
                  <button
                    onClick={() => handleOpenEditModal(w)}
                    className="text-xs text-[#22C55E] hover:underline font-bold"
                  >
                    Edit
                  </button>
                  <span className="text-gray-200">|</span>
                  <button
                    onClick={() => handleDeleteWorkshop(w.id)}
                    className="text-xs text-red-500 hover:text-red-600 transition-all font-semibold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-[#4A5D59] bg-white border border-gray-200 rounded-2xl">
            No workshops found for the selected filters.
          </div>
        )}
      </div>

      {/* CRUD Modal Form */}
      <WorkshopFormModal
        isOpen={isModalOpen}
        selectedWorkshop={selectedWorkshop}
        formData={formData}
        documentsList={documentsList}
        minutesList={minutesList}
        handleCloseModal={handleCloseModal}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
      />
    </div>
  );
}

function WorkshopFormModal({
  isOpen,
  selectedWorkshop,
  formData,
  documentsList,
  minutesList,
  handleCloseModal,
  handleInputChange,
  handleSubmit
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseModal}></div>

      <div className="bg-white border border-gray-200 rounded-2xl max-w-lg w-full p-6 z-50 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-fade-in text-sm text-[#06231D]">
        <button onClick={handleCloseModal} className="absolute top-4 right-4 text-[#4A5D59] hover:text-[#06231D] p-1">
          ✕
        </button>
        <h3 className="text-lg font-bold text-[#06231D] mb-4">
          {selectedWorkshop ? "✏️ Edit Workshop Info" : "➕ Create Workshop"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-[#4A5D59] uppercase mb-1">Workshop Name</label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g. Intro to Git & Github"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#06231D] focus:outline-none focus:border-[#22C55E]"
            />
          </div>

          {/* Speaker & Location Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Speaker */}
            <div>
              <label className="block text-xs font-bold text-[#4A5D59] uppercase mb-1">Instructor / Leader</label>
              <input
                type="text"
                name="speaker"
                required
                value={formData.speaker}
                onChange={handleInputChange}
                placeholder="Instructor's name"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-[#06231D] focus:outline-none focus:border-[#22C55E]"
              />
            </div>
            {/* Location */}
            <div>
              <label className="block text-xs font-bold text-[#4A5D59] uppercase mb-1">Location</label>
              <input
                type="text"
                name="location"
                required
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g. Lab 301 or online"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-[#06231D] focus:outline-none focus:border-[#22C55E]"
              />
            </div>
          </div>

          {/* Description (Rich Text style textarea) */}
          <div>
            <label className="block text-xs font-bold text-[#4A5D59] uppercase mb-1">Detailed Description</label>
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 focus-within:border-[#22C55E] transition-all">
              {/* Rich text mock toolbar */}
              <div className="flex gap-1.5 bg-[#F4F1EA]/80 px-3 py-1.5 border-b border-gray-200 text-xs text-[#4A5D59] select-none">
                <span className="hover:text-[#06231D] cursor-pointer px-1"><b>B</b></span>
                <span className="hover:text-[#06231D] cursor-pointer px-1"><i>I</i></span>
                <span className="hover:text-[#06231D] cursor-pointer px-1"><u>U</u></span>
                <span className="text-gray-300">|</span>
                <span className="hover:text-[#06231D] cursor-pointer px-1">📝 Quote</span>
                <span className="hover:text-[#06231D] cursor-pointer px-1">🔗 Link</span>
              </div>
              <textarea
                name="description"
                required
                rows="3"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Explain the workshop agenda, prerequisites, etc."
                className="w-full px-3 py-2 text-xs text-[#06231D] bg-transparent outline-none border-none resize-none"
              ></textarea>
            </div>
          </div>

          {/* Dates Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Start Time */}
            <div>
              <label className="block text-xs font-bold text-[#4A5D59] uppercase mb-1">Start Date & Time</label>
              <input
                type="datetime-local"
                name="startTime"
                required
                value={formData.startTime}
                onChange={handleInputChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-[#06231D] focus:outline-none focus:border-[#22C55E]"
              />
            </div>
            {/* End Time */}
            <div>
              <label className="block text-xs font-bold text-[#4A5D59] uppercase mb-1">End Date & Time</label>
              <input
                type="datetime-local"
                name="endTime"
                required
                value={formData.endTime}
                onChange={handleInputChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-[#06231D] focus:outline-none focus:border-[#22C55E]"
              />
            </div>
          </div>

          {/* Slots and Status Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#4A5D59] uppercase mb-1">Max Slots</label>
              <input
                type="number"
                name="maxSlots"
                min="1"
                required
                value={formData.maxSlots}
                onChange={handleInputChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-[#06231D] focus:outline-none focus:border-[#22C55E]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#4A5D59] uppercase mb-1">Slots Left</label>
              <input
                type="number"
                name="remainingSlots"
                min="0"
                max={formData.maxSlots}
                required
                value={formData.remainingSlots}
                onChange={handleInputChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-[#06231D] focus:outline-none focus:border-[#22C55E]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#4A5D59] uppercase mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-[#06231D] focus:outline-none focus:border-[#22C55E]"
              >
                <option value="Upcoming">Upcoming</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Finished">Finished</option>
              </select>
            </div>
          </div>

          {/* Resource Attachments (Documents & Minutes) */}
          <div className="grid grid-cols-2 gap-4">
            {/* Linked Document */}
            <div>
              <label className="block text-xs font-bold text-[#4A5D59] uppercase mb-1">Linked Slide/Material</label>
              <select
                name="document"
                value={formData.document}
                onChange={handleInputChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-[#06231D] focus:outline-none focus:border-[#22C55E]"
              >
                {documentsList.map((doc, idx) => (
                  <option key={idx} value={doc}>{doc}</option>
                ))}
              </select>
            </div>

            {/* Linked Minutes */}
            <div>
              <label className="block text-xs font-bold text-[#4A5D59] uppercase mb-1">Related Minutes</label>
              <select
                name="minutes"
                value={formData.minutes}
                onChange={handleInputChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-[#06231D] focus:outline-none focus:border-[#22C55E]"
              >
                {minutesList.map((min, idx) => (
                  <option key={idx} value={min}>{min}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit Action Buttons */}
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
              {selectedWorkshop ? "Save Changes" : "Create Workshop"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
