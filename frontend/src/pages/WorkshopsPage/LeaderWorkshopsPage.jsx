import { useEffect, useState, useMemo } from "react";
import { workshopService } from "../../services/workshopService";
import { LeaderDashboardHeader, LeaderEmptyState, Loading } from "@/components";
import { useLeaderScope } from "@/contexts/LeaderScopeContext.jsx";
import WorkshopFormModal from "./components/WorkshopFormModal/WorkshopFormModal.jsx";
import "./WorkshopsPage.css";

/**
 * LeaderWorkshopsPage — aggregated view of every workshop across the clubs
 * the user leads. Mutations require a single-club filter to avoid
 * ambiguous writes.
 */
export default function LeaderWorkshopsPage() {
  const {
    ledClubs,
    ledClubIds,
    loading: leaderLoading,
    selectedClubId,
    selectedClub,
    isAllScope,
  } = useLeaderScope();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [workshops, setWorkshops] = useState([]);
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
    minutes: "",
  });

  const targetIds = useMemo(() => {
    if (isAllScope) return ledClubIds;
    return selectedClubId ? [selectedClubId] : [];
  }, [isAllScope, selectedClubId, ledClubIds]);

  async function loadForClub(uuid, clubName) {
    const data = await workshopService.getClubWorkshops(uuid).catch(() => []);
    return (data || []).map((w) => ({
      id: w.id,
      clubId: uuid,
      clubName,
      title: w.title,
      speaker: w.profiles?.full_name || "Trần Quốc Bảo",
      description: w.description || "",
      startTime: w.events?.start_time ? w.events.start_time.slice(0, 16) : "2026-07-28T08:00",
      endTime: w.events?.start_time ? w.events.start_time.slice(0, 16) : "2026-07-28T08:00",
      location: w.events?.location || "ALAGRE Space",
      maxSlots: 40,
      remainingSlots: 12,
      status: "Upcoming",
      document: w.material_url || "Tailwindv4_Workshop_Slides.pdf",
      minutes: "Weekly Planning Minutes 28/06",
      coverColor: "events-cover--blue",
    }));
  }

  async function loadAll() {
    if (targetIds.length === 0) {
      setWorkshops([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setErrorMsg(null);
      const clubById = new Map(ledClubs.map((c) => [c.id, c.name]));
      const rows = (
        await Promise.all(targetIds.map((id) => loadForClub(id, clubById.get(id) || "—")))
      ).flat();
      setWorkshops(rows);
    } catch (err) {
      console.error("Supabase workshops load error:", err);
      setErrorMsg("Database connection error.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetIds.join("|")]);

  const filteredWorkshops = workshops.filter((w) => filterStatus === "All" || w.status === filterStatus);

  const handleOpenAddModal = () => {
    if (isAllScope) {
      alert("Vui lòng chọn 1 CLB cụ thể trước khi tạo workshop.");
      return;
    }
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
      document: "Tailwindv4_Workshop_Slides.pdf",
      minutes: "Weekly Planning Minutes 28/06",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (w) => {
    if (isAllScope) {
      alert("Vui lòng chọn 1 CLB cụ thể trước khi sửa workshop.");
      return;
    }
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
      minutes: w.minutes,
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
      [name]: name === "maxSlots" || name === "remainingSlots" ? Number(value) : value,
    }));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClubId) return;
    setIsSubmitting(true);
    const payload = {
      club_id: selectedClubId,
      title: formData.title,
      description: formData.description,
      material_url: formData.document,
      approval_status: "pending_mentor",
    };
    try {
      if (selectedWorkshop) {
        await workshopService.updateWorkshop(selectedWorkshop.id, payload);
      } else {
        await workshopService.createWorkshop(payload);
      }
      loadAll();
    } catch (err) {
      console.warn("Supabase workshop save failed:", err);
    }
    setIsSubmitting(false);
    handleCloseModal();
  };

  const handleDeleteWorkshop = async (id) => {
    if (isAllScope) {
      alert("Vui lòng chọn 1 CLB cụ thể trước khi xóa workshop.");
      return;
    }
    if (confirm("Are you sure you want to delete this workshop?")) {
      try {
        await workshopService.deleteWorkshop(id);
        loadAll();
      } catch (err) {
        console.warn("Supabase workshop delete failed, updating state locally:", err);
        setWorkshops((prev) => prev.filter((w) => w.id !== id));
      }
    }
  };

  if (leaderLoading) {
    return <Loading fullScreen />;
  }

  if (!leaderLoading && ledClubs.length === 0) {
    return (
      <>
        <LeaderDashboardHeader
          ledClubs={ledClubs}
          eyebrow="Workshops"
          title="Workshops Management"
          subtitle="Conduct training programs, link learning slides, and upload workshop materials."
        />
        <LeaderEmptyState />
      </>
    );
  }

  const eyebrow = isAllScope
    ? `Workshops across ${ledClubs.length} club${ledClubs.length === 1 ? "" : "s"}`
    : selectedClub
      ? `Workshops of ${selectedClub.name}`
      : "Workshops";

  return (
    <div className="workshops-page">
      <div className="events-page__body workshops-page__body">
        <div className="events-page__container workshops-page__container">
          <LeaderDashboardHeader
            ledClubs={ledClubs}
            eyebrow={eyebrow}
            title="Workshops Management"
            subtitle="Schedule and manage every workshop session from one place."
          />

          <div className="events-page__header">
            <div>
              <h2 className="events-page__title">Workshops Board</h2>
              <p className="events-page__subtitle">Schedule and manage every workshop session from one place.</p>
            </div>
            <div className="events-page__header-actions">
              {errorMsg && <span className="events-page__warn">⚠️ {errorMsg}</span>}
              <button type="button" className="events-page__btn-primary" onClick={handleOpenAddModal}>
                🎤 Create Workshop
              </button>
            </div>
          </div>

          <div className="workshops-page__toolbar">
            <div className="workshops-page__counter">
              Workshops: {filteredWorkshops.length}
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
                <article key={`${w.id}-${w.clubId}`} className="events-card">
                  <div className={`events-card__cover ${w.coverColor}`}>
                    <div className="events-card__cover-head">
                      <span className="events-card__type">Workshop</span>
                      {isAllScope && <span className="events-card__type" style={{ marginLeft: 6 }}>{w.clubName}</span>}
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
                      <div className="events-card__meta-row"><span>📅</span><span>{w.startTime ? new Date(w.startTime).toLocaleDateString() : "TBD"}</span></div>
                      <div className="events-card__meta-row"><span>📍</span><span className="events-card__location">{w.location}</span></div>
                    </div>
                    <div className="events-card__footer">
                      <button type="button" onClick={() => handleOpenEditModal(w)} className="events-card__btn events-card__btn--ghost">
                        ✏️ Edit
                      </button>
                      <button type="button" onClick={() => handleDeleteWorkshop(w.id)} className="events-card__btn events-card__btn--danger">
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="events-page__empty">No workshops scheduled yet.</div>
            )}
          </div>
        </div>
      </div>

      <WorkshopFormModal
        open={isModalOpen}
        onClose={handleCloseModal}
        formData={formData}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        editing={!!selectedWorkshop}
        documentsList={[]}
        minutesList={[]}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}