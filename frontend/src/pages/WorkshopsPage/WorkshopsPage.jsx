import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import MainLayout from '@/layouts/MainLayout.jsx';
import { workshopService } from "../../services/workshopService";
import { resolveClubUuid } from "../../services/supabase";
import { HeroSection } from "@/components";
import WorkshopFormModal from "./components/WorkshopFormModal/WorkshopFormModal.jsx";
import "./WorkshopsPage.css";

export default function WorkshopsPage() {
  return (
    <MainLayout>
      <WorkshopsPageContent />
    </MainLayout>
  );
}

function WorkshopsPageContent() {
  const { clubId } = useParams();
  const [resolvedClubId, setResolvedClubId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

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
      coverColor: "events-cover--blue"
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
          coverColor: "events-cover--blue"
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
      }
    }
    init();
  }, [clubId]);

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

  const [filterStatus, setFilterStatus] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);

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
        const colors = ["events-cover--teal", "events-cover--blue", "events-cover--violet", "events-cover--amber"];
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

  const filteredWorkshops = workshops.filter((w) => {
    return filterStatus === "All" || w.status === filterStatus;
  });

  return (
    <div className="workshops-page">
      <HeroSection
        variant="workshops"
        eyebrow="Hands-on Learning"
        title="Workshops"
        titleGradient="Management"
        subtitle="Conduct training programs, link learning slides, and upload workshop materials."
      />

      <div className="events-page__body workshops-page__body">
        <div className="events-page__container workshops-page__container">
          <div className="events-page__header">
            <div>
              <h2 className="events-page__title">Workshops Board</h2>
              <p className="events-page__subtitle">Schedule and manage every workshop session from one place.</p>
            </div>
            <div className="events-page__header-actions">
              {errorMsg && (
                <span className="events-page__warn">⚠️ {errorMsg}</span>
              )}
              <button type="button" className="events-page__btn-primary" onClick={handleOpenAddModal}>
                🎤 Create Workshop
              </button>
            </div>
          </div>

          <div className="workshops-page__toolbar">
            <div className="workshops-page__counter">
              Active Workshops: {filteredWorkshops.length}
            </div>
            <div className="events-page__status">
              <span className="events-page__status-label">Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="events-page__status-select"
              >
                <option value="All">All Statuses</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Finished">Finished</option>
              </select>
            </div>
          </div>

          <div className="events-page__grid">
            {loading ? (
              <div className="events-page__loading">
                <span className="events-page__spinner" />
                <span>Fetching workshops…</span>
              </div>
            ) : filteredWorkshops.length > 0 ? (
              filteredWorkshops.map((w) => (
                <article key={w.id} className="events-card">
                  <div className={`events-card__cover ${w.coverColor}`}>
                    <div className="events-card__cover-head">
                      <span className="events-card__type">Workshop</span>
                      <span className={`events-card__status events-card__status--${w.status.toLowerCase()}`}>
                        {w.status}
                      </span>
                    </div>
                    <h3 className="events-card__title">{w.title}</h3>
                    <div className="events-card__cover-overlay" />
                  </div>

                  <div className="events-card__body">
                    <p className="events-card__desc">{w.description}</p>
                    <div className="events-card__meta">
                      <div className="events-card__meta-row"><span>👤</span><span>Instructor: <strong>{w.speaker}</strong></span></div>
                      <div className="events-card__meta-row"><span>📅</span><span>{new Date(w.startTime).toLocaleDateString()} ({new Date(w.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span></div>
                      <div className="events-card__meta-row"><span>📍</span><span className="events-card__location">{w.location}</span></div>
                      <div className="events-card__meta-row">
                        <span>🎟️</span>
                        <span>
                          {w.remainingSlots === 0 ? (
                            <span className="events-card__sold-out">SOLD OUT</span>
                          ) : (
                            <>Slots left: <strong>{w.remainingSlots}</strong> / {w.maxSlots}</>
                          )}
                        </span>
                      </div>
                    </div>

                    {(w.document || w.minutes) && (
                      <div className="events-card__resources">
                        {w.document && (<div className="events-card__resource">📁 Material: <strong>{w.document}</strong></div>)}
                        {w.minutes && (<div className="events-card__resource">📝 Minutes: <strong>{w.minutes}</strong></div>)}
                      </div>
                    )}

                    <div className="events-card__footer">
                      <button type="button" className="events-card__link events-card__link--edit" onClick={() => handleOpenEditModal(w)}>
                        Edit
                      </button>
                      <span className="events-card__divider">|</span>
                      <button type="button" className="events-card__link events-card__link--delete" onClick={() => handleDeleteWorkshop(w.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="events-page__empty">
                No workshops found for the selected filters.
              </div>
            )}
          </div>
        </div>
      </div>

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
