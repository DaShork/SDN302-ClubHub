import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { eventService } from "../../services/eventService";
import { workshopService } from "../../services/workshopService";
import { resolveClubUuid } from "../../services/supabase";
import { useAuth } from "@/hooks/useAuth";
import { HeroSection } from "@/components";
import EventFormModal from "./components/EventFormModal/EventFormModal.jsx";
import "./EventsPage.css";

export default function EventsPageContent() {
  const { clubId: routeClubId } = useParams();
  const [searchParams] = useSearchParams();
  const clubId = routeClubId || searchParams.get('club');
  const { profileId, can } = useAuth();
  const [resolvedClubId, setResolvedClubId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  /* Club Leader is the only role allowed to create / edit / delete
     events and workshops. Without this guard, the Create New button
     and per-card Edit/Delete controls would be visible to every
     visitor — anon or signed-in Student alike. Backend RLS is the
     authoritative check; this is purely a UI affordance. */
  const isLeader = can('event:create') && can('event:edit') && can('event:delete');

  /* Events from API - will be transformed to match UI format */
  const [activities, setActivities] = useState([]);

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
        speaker: e.speaker || e.profiles?.full_name || "FPTU",
        description: e.description || "",
        startTime: e.start_time ? e.start_time.slice(0, 16) : "",
        endTime: e.end_time ? e.end_time.slice(0, 16) : "",
        location: e.location || "Online",
        maxSlots: e.max_participants || 100,
        remainingSlots: Math.max(0, (e.max_participants || 100) - (e.registrationCount || 0)),
        status: e.status === "upcoming"
          ? "Upcoming"
          : e.status === "ongoing"
            ? "Ongoing"
            : e.status === "cancelled"
              ? "Cancelled"
              : "Finished",
        document: "",
        minutes: "",
        coverColor: colors[idx % colors.length]
      }));

      const parsedWorkshops = workshopsData.map((w, idx) => ({
        id: w.id,
        type: "Workshop",
        title: w.title,
        speaker: w.speaker || w.profiles?.full_name || "FPTU",
        description: w.description || "",
        startTime: w.start_time || "",
        endTime: w.end_time || "",
        location: w.location || "TBD",
        maxSlots: w.max_participants || 40,
        remainingSlots: Math.max(0, (w.max_participants || 40) - (w.registrationCount || 0)),
        status: "Upcoming",
        document: w.material_url || "",
        minutes: "",
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
      } else {
        // No clubId - fetch all public events for the events listing page
        await fetchAllEvents();
        setLoading(false);
      }
    }
    init();
  }, [clubId]);

  async function fetchAllEvents() {
    try {
      setLoading(true);
      setErrorMsg(null);

      const eventsData = await eventService.getAll({ limit: 50 });

      const colors = ["events-cover--teal", "events-cover--blue", "events-cover--violet", "events-cover--amber"];
      const parsedEvents = eventsData.map((e, idx) => ({
        id: e.id,
        type: "Event",
        title: e.title,
        speaker: e.speaker || "FPTU",
        description: e.description || "",
        startTime: e.start_time ? e.start_time.slice(0, 16) : "",
        endTime: e.end_time ? e.end_time.slice(0, 16) : "",
        location: e.location || "Online",
        maxSlots: e.max_participants || 100,
        remainingSlots: Math.max(0, (e.max_participants || 100) - (e.registrationCount || 0)),
        registrationCount: e.registrationCount || 0,
        status: e.status === "upcoming"
          ? "Upcoming"
          : e.status === "ongoing"
            ? "Ongoing"
            : e.status === "cancelled"
              ? "Cancelled"
              : "Finished",
        coverColor: colors[idx % colors.length],
        clubName: e.clubs?.name || "Club"
      }));

      setActivities(parsedEvents);
    } catch (err) {
      console.warn("Failed to fetch events:", err);
      setErrorMsg("Không thể tải danh sách sự kiện.");
    } finally {
      setLoading(false);
    }
  }

  // Document/minutes options for the create modal are derived from the
  // event's `material_url` field (DB). If the leader has no materials
  // uploaded yet, leave the list empty so they must enter a URL or skip.
  const documentsList = activities
    .filter((a) => a.type === "Workshop" && a.document)
    .map((a) => a.document);
  const minutesList = [];

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
    minutes: "",
    autoRegisterCreator: false,
    requiresApproval: false,
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
      minutes: minutesList[0],
      autoRegisterCreator: false,
      requiresApproval: false,
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
      minutes: act.minutes,
      autoRegisterCreator: !!act.autoRegisterCreator,
      requiresApproval: !!act.requiresApproval,
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

    /* Defense in depth: even if a non-leader manages to open the modal
       via devtools, refuse to submit. The server-side RLS policy is
       the authoritative gate, but failing fast here gives a clearer
       error than the cryptic Supabase 42501. */
    if (!isLeader) {
      window.alert("You don't have permission to create or edit events.");
      return;
    }

    if (formData.type === "Event") {
      // Guard: refuse to submit when slug resolution failed (would produce
      // 22P02 invalid_uuid). The leader must click "Edit" from a valid
      // /club/:uuid/events URL, not a slug.
      if (!resolvedClubId) {
        window.alert("Không xác định được club. Mở trang từ URL /club/<UUID>/events.");
        return;
      }
      const payload = {
        club_id: resolvedClubId,
        title: formData.title,
        description: formData.description,
        location: formData.location,
        start_time: formData.startTime ? new Date(formData.startTime).toISOString() : null,
        end_time: formData.endTime ? new Date(formData.endTime).toISOString() : null,
        max_participants: formData.maxSlots,
        status: formData.status.toLowerCase(),
        requires_approval: !!formData.requiresApproval,
        auto_register_creator: !!formData.autoRegisterCreator,
        created_by: profileId || null
      };

      try {
        let createdId = null;
        if (selectedActivity) {
          const updated = await eventService.updateEvent(selectedActivity.id, payload);
          createdId = selectedActivity.id;
          void updated;
        } else {
          const created = await eventService.createEvent(payload);
          createdId = created?.id;
          // Toggle: tự đăng ký người tạo
          if (createdId && formData.autoRegisterCreator && profileId) {
            await eventService
              .registerCreatorForEvent(createdId, profileId)
              .catch((err) => console.warn("auto-register failed:", err));
          }
        }
        if (resolvedClubId) fetchActivities(resolvedClubId);
      } catch (err) {
        console.warn("Supabase event CRUD failed, using local fallback:", err);
        mutateLocalState();
      }
    } else {
      if (!resolvedClubId) {
        window.alert("Không xác định được club. Mở trang từ URL /club/<UUID>/events.");
        return;
      }
      const payload = {
        club_id: resolvedClubId,
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
        // Deterministic round-robin so the optimistic card doesn't pick a
        // different tint on each render.
        const newActivity = {
          id: typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          coverColor: colors[(activities.length) % colors.length],
          ...formData
        };
        setActivities((prev) => [newActivity, ...prev]);
      }
  }

  const handleDeleteActivity = async (id, type) => {
    if (!isLeader) {
      window.alert("You don't have permission to delete events.");
      return;
    }
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
              {isLeader && (
                <button type="button" className="events-page__btn-primary" onClick={handleOpenAddModal}>
                  📅 Create New
                </button>
              )}
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
                <option value="Cancelled">Cancelled</option>
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
                    {act.clubName && (
                      <p className="events-card__club-name">by {act.clubName}</p>
                    )}
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

                    {!isLeader && (
                      <div className="events-card__footer">
                        <Link to={`/events/${act.id}`} className="events-card__link">
                          View Details →
                        </Link>
                      </div>
                    )}

                    {isLeader && (
                      <div className="events-card__footer">
                        <button type="button" className="events-card__link events-card__link--edit" onClick={() => handleOpenEditModal(act)}>
                          Edit
                        </button>
                        <span className="events-card__divider">|</span>
                        <button type="button" className="events-card__link events-card__link--delete" onClick={() => handleDeleteActivity(act.id, act.type)}>
                          Delete
                        </button>
                      </div>
                    )}
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