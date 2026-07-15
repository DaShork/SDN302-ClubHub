import { useEffect, useState, useMemo } from "react";
import { knowledgeService } from "../../services/knowledgeService";
import { LeaderDashboardHeader, LeaderEmptyState, Loading } from "@/components";
import { useAuth } from "@/hooks/useAuth.jsx";
import { useLeaderScope } from "@/contexts/LeaderScopeContext.jsx";
import KnowledgeFormModal from "./components/KnowledgeFormModal/KnowledgeFormModal.jsx";
import KnowledgeDetailModal from "./components/KnowledgeDetailModal/KnowledgeDetailModal.jsx";
import "./KnowledgePage.css";

export default function LeaderKnowledgePage() {
  const {
    ledClubs,
    ledClubIds,
    loading: leaderLoading,
    selectedClubId,
    selectedClub,
    isAllScope,
  } = useLeaderScope();
  const { profileId } = useAuth();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [articles, setArticles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReadModalOpen, setIsReadModalOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    category: "Guide",
    description: "",
    content: "",
    document: "None",
  });

  const targetIds = useMemo(() => {
    if (isAllScope) return ledClubIds;
    return selectedClubId ? [selectedClubId] : [];
  }, [isAllScope, selectedClubId, ledClubIds]);

  async function loadForClub(uuid, clubName) {
    const data = await knowledgeService.getArticles(uuid).catch(() => []);
    return (data || []).map((art) => ({
      id: art.id,
      clubId: uuid,
      clubName,
      title: art.title,
      category: art.category || "Guide",
      description: art.content ? art.content.slice(0, 150) + "..." : "No description provided.",
      content: art.content || "",
      author: art.profiles?.full_name || "—",
      date: art.created_at ? art.created_at.slice(0, 10) : new Date().toISOString().split("T")[0],
      document: art.attachment_url || "None",
    }));
  }

  async function loadAll() {
    if (targetIds.length === 0) {
      setArticles([]);
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
      setArticles(rows);
    } catch (err) {
      console.error("Supabase wiki articles load failed:", err);
      setErrorMsg("Không thể tải dữ liệu từ database.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetIds.join("|")]);

  const filteredArticles = articles.filter((art) => {
    const matchesSearch =
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || art.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenAddModal = () => {
    if (isAllScope) {
      alert("Vui lòng chọn 1 CLB cụ thể trước khi viết bài.");
      return;
    }
    setSelectedArticle(null);
    setFormData({ title: "", category: "Guide", description: "", content: "", document: "None" });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (e, art) => {
    e.stopPropagation();
    if (isAllScope) {
      alert("Vui lòng chọn 1 CLB cụ thể trước khi sửa bài.");
      return;
    }
    setSelectedArticle(art);
    setFormData({
      title: art.title,
      category: art.category,
      description: art.description,
      content: art.content,
      document: art.document,
    });
    setIsModalOpen(true);
  };

  const handleOpenReadModal = (art) => {
    setSelectedArticle(art);
    setIsReadModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsModalOpen(false);
    setIsReadModalOpen(false);
    setSelectedArticle(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClubId) return;
    const payload = {
      club_id: selectedClubId,
      title: formData.title,
      content: formData.content,
      category: formData.category,
      attachment_url: formData.document === "None" ? null : formData.document,
      created_by: profileId || null,
    };
    try {
      if (selectedArticle) {
        await knowledgeService.updateArticle(selectedArticle.id, payload);
      } else {
        await knowledgeService.createArticle(payload);
      }
      loadAll();
    } catch (err) {
      console.warn("Supabase wiki save failed:", err);
      setArticles((prev) =>
        selectedArticle
          ? prev.map((a) => (a.id === selectedArticle.id ? { ...a, ...formData } : a))
          : [
              {
                id: String(Date.now()),
                clubId: selectedClubId,
                clubName: selectedClub?.name || "",
                author: "—",
                date: new Date().toISOString().split("T")[0],
                ...formData,
              },
              ...prev,
            ]
      );
    }
    handleCloseModals();
  };

  const handleDeleteArticle = async (e, id) => {
    e.stopPropagation();
    if (isAllScope) {
      alert("Vui lòng chọn 1 CLB cụ thể trước khi xóa bài.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this article?")) {
      try {
        await knowledgeService.deleteArticle(id);
        loadAll();
      } catch (err) {
        console.warn("Supabase wiki delete failed:", err);
        setArticles((prev) => prev.filter((art) => art.id !== id));
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
          eyebrow="Knowledge"
          title="Knowledge Base"
          subtitle="Wiki documentation, operational manuals, and guidelines across every club you lead."
        />
        <LeaderEmptyState />
      </>
    );
  }

  const eyebrow = isAllScope
    ? `Knowledge across ${ledClubs.length} club${ledClubs.length === 1 ? "" : "s"}`
    : selectedClub
      ? `Knowledge of ${selectedClub.name}`
      : "Knowledge";

  return (
    <div className="knowledge-page">
      <div className="knowledge-page__body">
        <div className="knowledge-page__container">
          <LeaderDashboardHeader
            ledClubs={ledClubs}
            eyebrow={eyebrow}
            title="Knowledge Base"
            subtitle="Browse or write operational, technical and template articles."
          />

          <div className="knowledge-page__header">
            <div>
              <h2 className="knowledge-page__title">Article Library</h2>
              <p className="knowledge-page__subtitle">Browse or write operational, technical and template articles.</p>
            </div>
            <div className="knowledge-page__header-actions">
              {errorMsg && <span className="knowledge-page__warn">⚠️ {errorMsg}</span>}
              <button type="button" className="knowledge-page__btn-primary" onClick={handleOpenAddModal}>
                📚 Write Article
              </button>
            </div>
          </div>

          <div className="knowledge-page__toolbar">
            <div className="knowledge-page__search">
              <span className="knowledge-page__search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search wiki articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="knowledge-page__search-input"
              />
            </div>

            <div className="knowledge-page__tabs">
              {["All", "Guide", "Technical", "Template"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`knowledge-page__tab ${selectedCategory === cat ? "knowledge-page__tab--active" : ""}`}
                >
                  {cat === "All" ? "All Wikis" : `${cat}s`}
                </button>
              ))}
            </div>
          </div>

          <div className="knowledge-page__grid">
            {loading ? (
              <div className="events-page__loading">
                <span className="events-page__spinner" />
                <span>Fetching wiki articles…</span>
              </div>
            ) : filteredArticles.length > 0 ? (
              filteredArticles.map((art) => (
                <div key={`${art.id}-${art.clubId}`} className="knowledge-card" onClick={() => handleOpenReadModal(art)}>
                  <div className="knowledge-card__head">
                    <span className="knowledge-card__category">{art.category}</span>
                    {isAllScope && <span className="knowledge-card__club">{art.clubName}</span>}
                  </div>
                  <h3 className="knowledge-card__title">{art.title}</h3>
                  <p className="knowledge-card__desc">{art.description}</p>
                  <div className="knowledge-card__meta">
                    <span>{art.author}</span>
                    <span>{art.date}</span>
                  </div>
                  <div className="knowledge-card__actions">
                    <button
                      type="button"
                      onClick={(e) => handleOpenEditModal(e, art)}
                      className="knowledge-card__btn knowledge-card__btn--edit"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteArticle(e, art.id)}
                      className="knowledge-card__btn knowledge-card__btn--delete"
                    >
                      🗑 Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="knowledge-page__empty">No wiki articles yet.</div>
            )}
          </div>
        </div>
      </div>

      <KnowledgeFormModal
        open={isModalOpen}
        onClose={handleCloseModals}
        formData={formData}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        editing={!!selectedArticle}
      />
      <KnowledgeDetailModal
        open={isReadModalOpen}
        onClose={handleCloseModals}
        article={selectedArticle}
      />
    </div>
  );
}