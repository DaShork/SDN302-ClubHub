import { useEffect, useState, useMemo } from "react";
import { Megaphone, Pin } from "lucide-react";
import { announcementService } from "../../services/announcementService";
import { LeaderDashboardHeader, LeaderEmptyState, Loading } from "@/components";
import { useAuth } from "@/hooks/useAuth.jsx";
import { useLeaderScope } from "@/contexts/LeaderScopeContext.jsx";
import AnnouncementFormModal from "./components/AnnouncementFormModal/AnnouncementFormModal.jsx";
import "./AnnouncementsPage.css";

/**
 * LeaderAnnouncementsPage — aggregated announcement view for club leaders.
 *
 * Public /announcements route uses AnnouncementsPage (the original file);
 * this is the leader-scoped version that supports the multi-club leader
 * experience. Mutations require a single-club filter so writes have an
 * unambiguous target.
 */
export default function LeaderAnnouncementsPage() {
  const {
    ledClubs,
    ledClubIds,
    loading: leaderLoading,
    selectedClubId,
    selectedClub,
    isAllScope,
  } = useLeaderScope();
  const { profileId, profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAudience, setSelectedAudience] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    audience: "Public",
    pinned: false,
  });

  const targetIds = useMemo(() => {
    if (isAllScope) return ledClubIds;
    return selectedClubId ? [selectedClubId] : [];
  }, [isAllScope, selectedClubId, ledClubIds]);

  async function loadForClub(uuid, clubName) {
    const data = await announcementService.getAnnouncements(uuid).catch(() => []);
    return (data || []).map((ann) => ({
      id: ann.id,
      clubId: uuid,
      clubName,
      title: ann.title,
      author: ann.profiles?.full_name || "—",
      date: ann.created_at ? ann.created_at.slice(0, 10) : new Date().toISOString().split("T")[0],
      content: ann.content || "",
      audience: ann.audience ? ann.audience.charAt(0).toUpperCase() + ann.audience.slice(1) : "Public",
      pinned: ann.is_pinned || false,
    }));
  }

  async function loadAll() {
    if (targetIds.length === 0) {
      setAnnouncements([]);
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
      setAnnouncements(rows);
    } catch (err) {
      console.error("Supabase announcements load failed:", err);
      setErrorMsg("Không thể tải dữ liệu từ database.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetIds.join("|")]);

  const filteredAnnouncements = announcements
    .filter((ann) => {
      const matchesSearch =
        ann.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ann.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesAudience = selectedAudience === "All" || ann.audience === selectedAudience;
      return matchesSearch && matchesAudience;
    })
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  const handleOpenAddModal = () => {
    if (isAllScope) {
      alert("Vui lòng chọn 1 CLB cụ thể trước khi đăng thông báo.");
      return;
    }
    setSelectedAnnouncement(null);
    setFormData({ title: "", content: "", audience: "Public", pinned: false });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (ann) => {
    if (isAllScope) {
      alert("Vui lòng chọn 1 CLB cụ thể trước khi sửa thông báo.");
      return;
    }
    setSelectedAnnouncement(ann);
    setFormData({
      title: ann.title,
      content: ann.content,
      audience: ann.audience,
      pinned: ann.pinned,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAnnouncement(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClubId) return;
    const payload = {
      club_id: selectedClubId,
      title: formData.title,
      content: formData.content,
      audience: formData.audience.toLowerCase(),
      is_pinned: formData.pinned,
      created_by: profileId || null,
    };
    try {
      if (selectedAnnouncement) {
        await announcementService.updateAnnouncement(selectedAnnouncement.id, payload);
      } else {
        await announcementService.createAnnouncement(payload);
      }
      loadAll();
    } catch (err) {
      console.warn("Supabase announcement save failed:", err);
      const authorFallback =
        profile?.full_name || profile?.email?.split("@")[0] || "Author";
      setAnnouncements((prev) =>
        selectedAnnouncement
          ? prev.map((a) => (a.id === selectedAnnouncement.id ? { ...a, ...formData, author: authorFallback } : a))
          : [
              {
                id: `tmp-${Date.now()}`,
                clubId: selectedClubId,
                clubName: selectedClub?.name || "",
                author: authorFallback,
                date: new Date().toISOString().split("T")[0],
                ...formData,
              },
              ...prev,
            ]
      );
    }
    handleCloseModal();
  };

  const handleDeleteAnn = async (id) => {
    if (isAllScope) {
      alert("Vui lòng chọn 1 CLB cụ thể trước khi xóa thông báo.");
      return;
    }
    if (window.confirm("Are you sure you want to permanently delete this announcement?")) {
      try {
        await announcementService.deleteAnnouncement(id);
        loadAll();
      } catch (err) {
        console.warn("Supabase delete notice failed:", err);
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      }
    }
  };

  const handleTogglePin = async (id) => {
    if (isAllScope) {
      alert("Vui lòng chọn 1 CLB cụ thể trước khi ghim thông báo.");
      return;
    }
    const notice = announcements.find((a) => a.id === id);
    if (!notice) return;
    try {
      await announcementService.updateAnnouncement(id, { is_pinned: !notice.pinned });
      loadAll();
    } catch (err) {
      console.warn("Supabase pin toggle failed:", err);
      setAnnouncements((prev) => prev.map((a) => (a.id === id ? { ...a, pinned: !a.pinned } : a)));
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
          eyebrow="Announcements"
          title="Announcement Center"
          subtitle="Publish administrative updates, event briefs, or specific committee alerts."
        />
        <LeaderEmptyState />
      </>
    );
  }

  const eyebrow = isAllScope
    ? `Announcements across ${ledClubs.length} club${ledClubs.length === 1 ? "" : "s"}`
    : selectedClub
      ? `Announcements of ${selectedClub.name}`
      : "Announcements";

  return (
    <div className="announcements-page">
      <div className="announcements-page__body">
        <div className="announcements-page__container">
          <LeaderDashboardHeader
            ledClubs={ledClubs}
            eyebrow={eyebrow}
            title="Announcement Center"
            subtitle="Pin important updates and broadcast to members or leaders."
          />

          <div className="announcements-page__header">
            <div>
              <h2 className="announcements-page__title">Notice Board</h2>
              <p className="announcements-page__subtitle">Pin important updates and broadcast to members or leaders.</p>
            </div>
            <div className="announcements-page__header-actions">
              {errorMsg && <span className="announcements-page__warn">⚠️ {errorMsg}</span>}
              <button type="button" className="announcements-page__btn-primary" onClick={handleOpenAddModal}>
                ➕ New Announcement
              </button>
            </div>
          </div>

          <div className="announcements-page__toolbar">
            <div className="announcements-page__search">
              <span className="announcements-page__search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search announcements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="announcements-page__search-input"
              />
            </div>

            <div className="announcements-page__tabs">
              {["All", "Public", "Members", "Leaders"].map((aud) => (
                <button
                  key={aud}
                  type="button"
                  onClick={() => setSelectedAudience(aud)}
                  className={`announcements-page__tab ${selectedAudience === aud ? "announcements-page__tab--active" : ""}`}
                >
                  {aud}
                </button>
              ))}
            </div>
          </div>

          <div className="announcements-page__list">
            {loading ? (
              <div className="events-page__loading">
                <span className="events-page__spinner" />
                <span>Fetching announcements…</span>
              </div>
            ) : filteredAnnouncements.length > 0 ? (
              filteredAnnouncements.map((ann) => (
                <div key={`${ann.id}-${ann.clubId}`} className="announcement-row">
                  <div className="announcement-row__main">
                    <div className="announcement-row__head">
                      {ann.pinned && <Pin size={14} className="announcement-row__pin" />}
                      <Megaphone size={16} />
                      <span className="announcement-row__title">{ann.title}</span>
                      {isAllScope && <span className="announcement-row__club">{ann.clubName}</span>}
                    </div>
                    <p className="announcement-row__content">{ann.content}</p>
                    <div className="announcement-row__meta">
                      <span>{ann.author}</span>
                      <span>{ann.date}</span>
                      <span className="announcement-row__audience">{ann.audience}</span>
                    </div>
                  </div>
                  <div className="announcement-row__actions">
                    <button type="button" onClick={() => handleTogglePin(ann.id)} className="announcement-row__btn">
                      {ann.pinned ? "Unpin" : "Pin"}
                    </button>
                    <button type="button" onClick={() => handleOpenEditModal(ann)} className="announcement-row__btn">
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDeleteAnn(ann.id)} className="announcement-row__btn announcement-row__btn--danger">
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="announcements-page__empty">No announcements yet.</div>
            )}
          </div>
        </div>
      </div>

      <AnnouncementFormModal
        open={isModalOpen}
        onClose={handleCloseModal}
        formData={formData}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        editing={!!selectedAnnouncement}
      />
    </div>
  );
}