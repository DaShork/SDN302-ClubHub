import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Megaphone, Pin } from "lucide-react";
import { announcementService } from "../../services/announcementService";
import { resolveClubUuid } from "../../services/supabase";
import { useAuth } from "@/hooks/useAuth";
import { HeroSection } from "@/components";
import AnnouncementFormModal from "./components/AnnouncementFormModal/AnnouncementFormModal.jsx";
import "./AnnouncementsPage.css";

export default function AnnouncementsPageContent() {
  const { clubId } = useParams();
  const { profileId, can } = useAuth();
  const [resolvedClubId, setResolvedClubId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  /* Club Leader is the only role allowed to create / edit / delete
     announcements (and toggle pin). Without this guard, every visitor
     — anon or signed-in Student — would see Create / Edit / Delete /
     Pin controls. Backend RLS is the authoritative check; this is
     purely a UI affordance. */
  const isLeader = can('announcement:create') && can('announcement:edit') && can('announcement:delete');

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

      const parsed = data.map((ann) => ({
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
      } else {
        fetchAnnouncements(null);
        setLoading(false);
      }
    }
    init();
  }, [clubId]);

  const audienceList = ["Public", "Members", "Leaders"];

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAudience, setSelectedAudience] = useState("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    audience: "Public",
    pinned: false
  });

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

    /* Defense in depth: refuse to submit even if the modal is somehow
       opened by a non-leader. Server RLS is the real gate; this just
       surfaces a clearer error message. */
    if (!isLeader) {
      window.alert("You don't have permission to create or edit announcements.");
      return;
    }

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
    if (!isLeader) {
      window.alert("You don't have permission to delete announcements.");
      return;
    }
    if (window.confirm("Are you sure you want to permanently delete this announcement?")) {
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
    if (!isLeader) {
      window.alert("You don't have permission to pin announcements.");
      return;
    }
    const notice = announcements.find((ann) => ann.id === id);
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
    <div className="announcements-page">
      <HeroSection
        variant="announcements"
        eyebrow="Communication"
        title="Announcement"
        titleGradient="Center"
        subtitle="Publish administrative updates, event briefs, or specific committee alerts."
      />

      <div className="announcements-page__body">
        <div className="announcements-page__container">
          <div className="announcements-page__header">
            <div>
              <h2 className="announcements-page__title">Notice Board</h2>
              <p className="announcements-page__subtitle">Pin important updates and broadcast to members or leaders.</p>
            </div>
            <div className="announcements-page__header-actions">
              {errorMsg && (
                <span className="announcements-page__warn">⚠️ {errorMsg}</span>
              )}
              {isLeader && (
                <button type="button" className="announcements-page__btn-primary" onClick={handleOpenAddModal}>
                  <Megaphone size={14} /> Create Notice
                </button>
              )}
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

            <div className="announcements-page__audience">
              <span className="announcements-page__audience-label">Audience:</span>
              <select
                value={selectedAudience}
                onChange={(e) => setSelectedAudience(e.target.value)}
                className="announcements-page__audience-select"
              >
                <option value="All">All Audiences</option>
                <option value="Public">Public (All Students)</option>
                <option value="Members">Club Members</option>
                <option value="Leaders">Committee Leaders</option>
              </select>
            </div>
          </div>

          <div className="announcements-page__list">
            {loading ? (
              <div className="announcements-page__loading">
                <span className="announcements-page__spinner" />
                <span>Fetching announcements…</span>
              </div>
            ) : filteredAnnouncements.length > 0 ? (
              filteredAnnouncements.map((ann) => (
                <article
                  key={ann.id}
                  className={`announcement-card ${ann.pinned ? "announcement-card--pinned" : ""}`}
                >
                  {ann.pinned && (
                    <span className="announcement-card__pin-tag">
                      <Pin size={11} /> Pinned Notice
                    </span>
                  )}

                  <div className="announcement-card__head">
                    <div className="announcement-card__chips">
                      <span className={`announcement-card__audience announcement-card__audience--${ann.audience.toLowerCase()}`}>
                        {ann.audience}
                      </span>
                      <span className="announcement-card__date">• Uploaded: {ann.date}</span>
                    </div>
                    <div className="announcement-card__head-body">
                      <h3 className="announcement-card__title">{ann.title}</h3>
                      <p className="announcement-card__author">
                        Published by <strong>{ann.author}</strong>
                      </p>
                    </div>
                  </div>

                  <p className="announcement-card__content">{ann.content}</p>

                  {isLeader && (
                    <div className="announcement-card__footer">
                      <button
                        type="button"
                        className="announcement-card__pin-toggle"
                        onClick={() => handleTogglePin(ann.id)}
                      >
                        {ann.pinned ? "Unpin Notice" : "Pin to Top"}
                      </button>
                      <span className="announcement-card__divider">|</span>
                      <button
                        type="button"
                        className="announcement-card__link announcement-card__link--edit"
                        onClick={() => handleOpenEditModal(ann)}
                      >
                        Edit
                      </button>
                      <span className="announcement-card__divider">|</span>
                      <button
                        type="button"
                        className="announcement-card__link announcement-card__link--delete"
                        onClick={() => handleDeleteAnn(ann.id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </article>
              ))
            ) : (
              <div className="announcements-page__empty">
                No notices published matching filters.
              </div>
            )}
          </div>
        </div>
      </div>

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