import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { eventService } from "../../services/eventService";
import { workshopService } from "../../services/workshopService";
import { resolveClubUuid } from "../../services/supabase";
import { useAuth } from "@/hooks/useAuth";
import { HeroSection } from "@/components";
import EventFormModal from "./components/EventFormModal/EventFormModal.jsx";
import "./EventsPage.css";

export default function EventsPageContent() {
  const { clubId } = useParams();
  const { profileId } = useAuth();
  const [resolvedClubId, setResolvedClubId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  /* Mock seed data is shown until Supabase returns real rows. */
  const [activities, setActivities] = useState([
    {
      id: "1",
      type: "Event",
      title: "React 19 & Next.js 15 Seminar",
      speaker: "Nguyễn Hoàng Nam",
      description: "Join us for an in-depth seminar on the latest React 19 features including Server Actions, the new use() hook, and Next.js 15 App Router optimizations. Essential for modern web developers.",
      startTime: "2026-07-15T13:30",
      endTime: "2026-07-15T16:30",
      location: "Beta Building, Room 204",
      maxSlots: 100,
      remainingSlots: 24,
      status: "Upcoming",
      document: "React_19_Seminar_Outline.pdf",
      minutes: "Executive Meeting Minutes 30/06",
      coverColor: "events-cover--teal"
    },
    {
      id: "2",
      type: "Workshop",
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

  async function fetchActivities(uuid) {
    try {
      setLoading(true);
      setErrorMsg(null);

      const [eventsData, workshopsData] = await Promise.all([
        eventService.getClubEvents(uuid).catch(() => []),
        workshopService.getClubWorkshops(uuid).catch(() => [])
      ]);

      const colors = ["events-cover--teal", "events-cover--blue", "events-cover--violet", "events-cover--amber"];
      const parsedEvents = eventsData.map((e, idx) => ({
        id: e.id,
        type: "Event",
        title: e.title,
        speaker: "Nguyễn Hoàng Nam",
        description: e.description || "",
        startTime: e.start_time ? e.start_time.slice(0, 16) : "",
        endTime: e.end_time ? e.end_time.slice(0, 16) : "",
        location: e.location || "Online",
        maxSlots: e.max_participants || 100,
        remainingSlots: e.max_participants || 100,
        status: e.status === "upcoming" ? "Upcoming" : e.status === "ongoing" ? "Ongoing" : "Finished",
        document: "React_19_Seminar_Outline.pdf",
        minutes: "Executive Meeting Minutes 30/06",
        coverColor: colors[idx % colors.length]
      }));

      const parsedWorkshops = workshopsData.map((w, idx) => ({
        id: w.id,
        type: "Workshop",
        title: w.title,
        speaker: "Trần Quốc Bảo",
        description: w.description || "",
        startTime: "",
        endTime: "",
        location: "TBD",
        maxSlots: 40,
        remainingSlots: 40,
        status: "Upcoming",
        document: w.material_url || "Tailwindv4_Workshop_Slides.pdf",
        minutes: "Weekly Planning Minutes 28/06",
        coverColor: colors[(idx + 1) % colors.length]
      }));

      setActivities([...parsedEvents, ...parsedWorkshops]);
    } catch (err) {
      console.warn("Supabase event fetch failed, using local fallback:", err);
      setErrorMsg("Không thể đồng bộ với Supabase — đang hiển thị dữ liệu mẫu.");
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
          fetchActivities(uuid);
        } else {
          setLoading(false);
        }
      }
    }
    init();
  }, [clubId]);

  const documentsList = [
    "React_19_Seminar_Outline.pdf",
    "Tailwindv4_Workshop_Slides.pdf",
    "Hackathon_Rules_and_Prizes.pdf",
    "Sponsorship_Proposal_Template_2026.docx",
    "Standard_Event_Planning_Blueprint.pdf"
  ];

  const minutesList = [
    "Executive Meeting Minutes 30/06",
    "Weekly Planning Minutes 28/06",
    "Hackathon Guidelines Draft v2",
    "Meeting Minutes 01/07.pdf",
    "Orientation_Feedback_Minutes"
  ];

  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [formData, setFormData] = useState({
    type: "Event",
    title: "",
    speaker: "",
    description: "",
    startTime: "",
    endTime: "",
    location: "",
    maxSlots: 50,
    remainingSlots: 50,
    status: "Upcoming",
    document: "",
    minutes: ""
  });

  const handleOpenAddModal = () => {
    setSelectedActivity(null);
    setFormData({
      type: "Event",
      title: "",
      speaker: "",
      description: "",
      startTime: "",
      endTime: "",
      location: "",
      maxSlots: 50,
      remainingSlots: 50,
      status: "Upcoming",
      document: documentsList[0],
      minutes: minutesList[0]
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (act) => {
    setSelectedActivity(act);
    setFormData({
      type: act.type,
      title: act.title,
      speaker: act.speaker,
      description: act.description,
      startTime: act.startTime,
      endTime: act.endTime,
      location: act.location,
      maxSlots: act.maxSlots,
      remainingSlots: act.remainingSlots,
      status: act.status,
      document: act.document,
      minutes: act.minutes
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedActivity(null);
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

    if (formData.type === "Event") {
      const payload = {
        club_id: resolvedClubId || clubId,
        title: formData.title,
        description: formData.description,
        location: formData.location,
        start_time: formData.startTime ? new Date(formData.startTime).toISOString() : null,
        end_time: formData.endTime ? new Date(formData.endTime).toISOString() : null,
        max_participants: formData.maxSlots,
        status: formData.status.toLowerCase(),
        created_by: profileId || null
      };

      try {
        if (selectedActivity) {
          await eventService.updateEvent(selectedActivity.id, payload);
        } else {
          await eventService.createEvent(payload);
        }
        if (resolvedClubId) fetchActivities(resolvedClubId);
      } catch (err) {
        console.warn("Supabase event CRUD failed, using local fallback:", err);
        mutateLocalState();
      }
    } else {
      const payload = {
        club_id: resolvedClubId || clubId,
        title: formData.title,
        description: formData.description,
        material_url: formData.document,
        created_by: profileId || null
      };

      try {
        if (selectedActivity) {
          await workshopService.updateWorkshop(selectedActivity.id, payload);
        } else {
          await workshopService.createWorkshop(payload);
        }
        if (resolvedClubId) fetchActivities(resolvedClubId);
      } catch (err) {
        console.warn("Supabase workshop CRUD failed, using local fallback:", err);
        mutateLocalState();
      }
    }
    handleCloseModal();
  };

  function mutateLocalState() {
    if (selectedActivity) {
      setActivities((prev) =>
        prev.map((act) =>
          act.id === selectedActivity.id ? { ...act, ...formData } : act
        )
      );
    } else {
      const colors = ["events-cover--teal", "events-cover--blue", "events-cover--violet", "events-cover--amber"];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const newActivity = {
        id: String(activities.length + 1),
        coverColor: randomColor,
        ...formData
      };
      setActivities((prev) => [newActivity, ...prev]);
    }
  }

  const handleDeleteActivity = async (id, type) => {
    if (window.confirm(`Are you sure you want to delete this ${type.toLowerCase()}?`)) {
      try {
        if (type === "Event") {
          await eventService.deleteEvent(id);
        } else {
          await workshopService.deleteWorkshop(id);
        }
        if (resolvedClubId) fetchActivities(resolvedClubId);
      } catch (err) {
        console.warn("Supabase delete failed, using local state:", err);
        setActivities((prev) => prev.filter((act) => act.id !== id));
      }
    }
  };

  const filteredActivities = activities.filter((act) => {
    const matchesType = filterType === "All" || act.type === filterType;
    const matchesStatus = filterStatus === "All" || act.status === filterStatus;
    return matchesType && matchesStatus;
  });

  return (
    <div className="events-page">
      <HeroSection
        variant="events"
        eyebrow="Club Activities"
        title="Events &"
        titleGradient="Workshops"
        subtitle="Plan and organize club events, link resources, and review attendance records."
      />

      <div className="events-page__body">
        <div className="events-page__container">
          <div className="events-page__header">
            <div>
              <h2 className="events-page__title">Activity Board</h2>
              <p className="events-page__subtitle">Manage every event and workshop from one place.</p>
            </div>
            <div className="events-page__header-actions">
              {errorMsg && (
                <span className="events-page__warn">⚠️ {errorMsg}</span>
              )}
              <button type="button" className="events-page__btn-primary" onClick={handleOpenAddModal}>
                📅 Create New
              </button>
            </div>
          </div>

          <div className="events-page__toolbar">
            <div className="events-page__type-tabs">
              {["All", "Event", "Workshop"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFilterType(type)}
                  className={`events-page__type-tab ${filterType === type ? "events-page__type-tab--active" : ""}`}
                >
                  {type === "All" ? "All Types" : `${type}s`}
                </button>
              ))}
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
                <span>Fetching events and workshops…</span>
              </div>
            ) : filteredActivities.length > 0 ? (
              filteredActivities.map((act) => (
                <article key={act.id} className="events-card">
                  <div className={`events-card__cover ${act.coverColor}`}>
                    <div className="events-card__cover-head">
                      <span className="events-card__type">{act.type}</span>
                      <span className={`events-card__status events-card__status--${act.status.toLowerCase()}`}>
                        {act.status}
                      </span>
                    </div>
                    <h3 className="events-card__title">{act.title}</h3>
                    <div className="events-card__cover-overlay" />
                  </div>

                  <div className="events-card__body">
                    <p className="events-card__desc">{act.description}</p>
                    <div className="events-card__meta">
                      <div className="events-card__meta-row"><span>👤</span><span>Speaker: <strong>{act.speaker}</strong></span></div>
                      {act.startTime && (
                        <div className="events-card__meta-row">
                          <span>📅</span>
                          <span>
                            {new Date(act.startTime).toLocaleDateString()} (
                            {new Date(act.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
                          </span>
                        </div>
                      )}
                      <div className="events-card__meta-row"><span>📍</span><span className="events-card__location">{act.location}</span></div>
                      <div className="events-card__meta-row">
                        <span>🎟️</span>
                        <span>
                          {act.remainingSlots === 0 ? (
                            <span className="events-card__sold-out">SOLD OUT</span>
                          ) : (
                            <>Slots left: <strong>{act.remainingSlots}</strong> / {act.maxSlots}</>
                          )}
                        </span>
                      </div>
                    </div>

                    {(act.document || act.minutes) && (
                      <div className="events-card__resources">
                        {act.document && (
                          <div className="events-card__resource">📁 Document: <strong>{act.document}</strong></div>
                        )}
                        {act.minutes && (
                          <div className="events-card__resource">📝 Minutes: <strong>{act.minutes}</strong></div>
                        )}
                      </div>
                    )}

                    <div className="events-card__footer">
                      <button type="button" className="events-card__link events-card__link--edit" onClick={() => handleOpenEditModal(act)}>
                        Edit
                      </button>
                      <span className="events-card__divider">|</span>
                      <button type="button" className="events-card__link events-card__link--delete" onClick={() => handleDeleteActivity(act.id, act.type)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="events-page__empty">
                No events or workshops found for the selected filters.
              </div>
            )}
          </div>
        </div>
      </div>

      <EventFormModal
        isOpen={isModalOpen}
        selectedActivity={selectedActivity}
        formData={formData}
        setFormData={setFormData}
        documentsList={documentsList}
        minutesList={minutesList}
        handleCloseModal={handleCloseModal}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
      />
    </div>
  );
}