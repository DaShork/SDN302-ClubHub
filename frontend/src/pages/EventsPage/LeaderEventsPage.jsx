import { useEffect, useState, useMemo } from "react";
import { eventService } from "../../services/eventService";
import { workshopService } from "../../services/workshopService";
import { LeaderDashboardHeader, LeaderEmptyState, Loading } from "@/components";
import { useAuth } from "@/hooks/useAuth.jsx";
import { useLeaderScope } from "@/contexts/LeaderScopeContext.jsx";
import EventFormModal from "./components/EventFormModal/EventFormModal.jsx";
import "./EventsPage.css";

/**
 * LeaderEventsPage — aggregated view of events AND workshops across every
 * club the current user leads.
 *
 * The original /events public route still uses EventsPage (this file's
 * sibling). For the leader dashboard family we want a single screen that
 * lists everything they can edit, so this file is a fork with leader-only
 * affordances and aggregated data fetching.
 *
 * Mutations still require a single-club filter to avoid ambiguous writes.
 */
export default function LeaderEventsPage() {
  const {
    ledClubs,
    ledClubIds,
    loading: leaderLoading,
    selectedClubId,
    selectedClub,
    isAllScope,
  } = useLeaderScope();
  const { profileId, can } = useAuth();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [activities, setActivities] = useState([]);
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
  });

  const isLeader =
    can("event:create") && can("event:edit") && can("event:delete");

  const targetIds = useMemo(() => {
    if (isAllScope) return ledClubIds;
    return selectedClubId ? [selectedClubId] : [];
  }, [isAllScope, selectedClubId, ledClubIds]);

  async function loadForClub(uuid, clubName) {
    const [eventsData, workshopsData] = await Promise.all([
      eventService.getClubEvents(uuid).catch(() => []),
      workshopService.getClubWorkshops(uuid).catch(() => []),
    ]);
    const colors = ["events-cover--teal", "events-cover--blue", "events-cover--violet", "events-cover--amber"];
    const parsedEvents = (eventsData || []).map((e, idx) => ({
      id: e.id,
      clubId: uuid,
      clubName,
      type: "Event",
      title: e.title,
      speaker: e.speaker || e.profiles?.full_name || "FPTU",
      description: e.description || "",
      startTime: e.start_time ? e.start_time.slice(0, 16) : "",
      endTime: e.end_time ? e.end_time.slice(0, 16) : "",
      location: e.location || "Online",
      maxSlots: e.max_participants || 100,
      remainingSlots: Math.max(0, (e.max_participants || 100) - (e.registrationCount || 0)),
      status: e.status === "upcoming" ? "Upcoming" : e.status === "ongoing" ? "Ongoing" : e.status === "cancelled" ? "Cancelled" : "Finished",
      document: "",
      minutes: "",
      coverColor: colors[idx % colors.length],
    }));
    const parsedWorkshops = (workshopsData || []).map((w, idx) => ({
      id: w.id,
      clubId: uuid,
      clubName,
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
      coverColor: colors[(idx + 1) % colors.length],
    }));
    return [...parsedEvents, ...parsedWorkshops];
  }

  async function loadAll() {
    if (targetIds.length === 0) {
      setActivities([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setErrorMsg(null);
      const rows = (await Promise.all(targetIds.map((id) => loadForClub(id, selectedClub?.name || "")))).flat();
      setActivities(rows);
    } catch (err) {
      console.warn("Supabase event fetch failed:", err);
      setErrorMsg("Không thể đồng bộ với Supabase.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetIds.join("|")]);

  const handleOpenAddModal = () => {
    if (isAllScope) {
      alert("Vui lòng chọn 1 CLB cụ thể trước khi tạo sự kiện.");
      return;
    }
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
      document: "",
      minutes: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (act) => {
    if (isAllScope) {
      alert("Vui lòng chọn 1 CLB cụ thể trước khi sửa sự kiện.");
      return;
    }
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
      [name]: name === "maxSlots" || name === "remainingSlots" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClubId) return;
    if (formData.type === "Event") {
      const payload = {
        club_id: selectedClubId,
        title: formData.title,
        description: formData.description,
        location: formData.location,
        start_time: formData.startTime ? new Date(formData.startTime).toISOString() : null,
        end_time: formData.endTime ? new Date(formData.endTime).toISOString() : null,
        max_participants: formData.maxSlots,
        status: formData.status.toLowerCase(),
        created_by: profileId || null,
      };
      try {
        if (selectedActivity) await eventService.updateEvent(selectedActivity.id, payload);
        else await eventService.createEvent(payload);
        loadAll();
      } catch (err) {
        console.warn("Supabase event CRUD failed:", err);
      }
    } else {
      const payload = {
        club_id: selectedClubId,
        title: formData.title,
        description: formData.description,
        material_url: formData.document,
        created_by: profileId || null,
      };
      try {
        if (selectedActivity) await workshopService.updateWorkshop(selectedActivity.id, payload);
        else await workshopService.createWorkshop(payload);
        loadAll();
      } catch (err) {
        console.warn("Supabase workshop CRUD failed:", err);
      }
    }
    handleCloseModal();
  };

  const handleDeleteActivity = async (id, type) => {
    if (isAllScope) {
      alert("Vui lòng chọn 1 CLB cụ thể trước khi xóa sự kiện.");
      return;
    }
    if (window.confirm(`Are you sure you want to delete this ${type.toLowerCase()}?`)) {
      try {
        if (type === "Event") await eventService.deleteEvent(id);
        else await workshopService.deleteWorkshop(id);
        loadAll();
      } catch (err) {
        console.warn("Supabase delete failed:", err);
        setActivities((prev) => prev.filter((a) => a.id !== id));
      }
    }
  };

  const filteredActivities = activities.filter((act) => {
    const matchesType = filterType === "All" || act.type === filterType;
    const matchesStatus = filterStatus === "All" || act.status === filterStatus;
    return matchesType && matchesStatus;
  });

  if (leaderLoading) {
    return <Loading fullScreen />;
  }

  if (!leaderLoading && ledClubs.length === 0) {
    return (
      <>
        <LeaderDashboardHeader
          ledClubs={ledClubs}
          eyebrow="Events"
          title="Events & Workshops"
          subtitle="Plan and organize events, link resources, and review attendance."
        />
        <LeaderEmptyState />
      </>
    );
  }

  const eyebrow = isAllScope
    ? `Events across ${ledClubs.length} club${ledClubs.length === 1 ? "" : "s"}`
    : selectedClub
      ? `Events of ${selectedClub.name}`
      : "Events";

  return (
    <div className="events-page">
      <div className="events-page__body">
        <div className="events-page__container">
          <LeaderDashboardHeader
            ledClubs={ledClubs}
            eyebrow={eyebrow}
            title="Events & Workshops"
            subtitle="Manage every event and workshop from one place."
          />

          <div className="events-page__header">
            <div>
              <h2 className="events-page__title">Activity Board</h2>
              <p className="events-page__subtitle">Manage every event and workshop from one place.</p>
            </div>
            <div className="events-page__header-actions">
              {errorMsg && <span className="events-page__warn">⚠️ {errorMsg}</span>}
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
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="events-page__status-select">
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
                <article key={`${act.id}-${act.clubId}-${act.type}`} className="events-card">
                  <div className={`events-card__cover ${act.coverColor}`}>
                    <div className="events-card__cover-head">
                      <span className="events-card__type">{act.type}</span>
                      {isAllScope && <span className="events-card__type" style={{ marginLeft: 6 }}>{act.clubName}</span>}
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
                          <span>{new Date(act.startTime).toLocaleDateString()}</span>
                        </div>
                      )}
                      <div className="events-card__meta-row"><span>📍</span><span className="events-card__location">{act.location}</span></div>
                    </div>
                    <div className="events-card__footer">
                      <button type="button" onClick={() => handleOpenEditModal(act)} className="events-card__btn events-card__btn--ghost">
                        ✏️ Edit
                      </button>
                      <button type="button" onClick={() => handleDeleteActivity(act.id, act.type)} className="events-card__btn events-card__btn--danger">
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="events-page__empty">No activities yet.</div>
            )}
          </div>
        </div>
      </div>

      <EventFormModal
        open={isModalOpen}
        onClose={handleCloseModal}
        formData={formData}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        editing={!!selectedActivity}
      />
    </div>
  );
}