import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import MainLayout from '@/layouts/MainLayout.jsx';
import { knowledgeService } from "../../services/knowledgeService";
import { resolveClubUuid } from "../../services/supabase";
import { useAuth } from "@/hooks/useAuth";
import { HeroSection } from "@/components";
import KnowledgeFormModal from "./components/KnowledgeFormModal/KnowledgeFormModal.jsx";
import KnowledgeDetailModal from "./components/KnowledgeDetailModal/KnowledgeDetailModal.jsx";
import "./KnowledgePage.css";

export default function KnowledgePage() {
  return (
    <MainLayout>
      <KnowledgePageContent />
    </MainLayout>
  );
}

function KnowledgePageContent() {
  const { clubId } = useParams();
  const { profileId } = useAuth();
  const [resolvedClubId, setResolvedClubId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const [articles, setArticles] = useState([
    {
      id: "1",
      title: "Club Constitution & Operational Guidelines",
      category: "Guide",
      description: "This document contains the official club constitution, executive board duties, general member expectations, and guidelines for standard club operations at FPT University.",
      content: "## Article I: Name & Objective\nThe club name is FPTU Software Engineering Club (F-Code). Our primary objective is to cultivate passion, exchange skills, and build software products that serve FPTU students.\n\n## Article II: Executive Committee\nThe committee consists of: President, Vice President, Head of Technology, and Head of Media. Terms last for exactly one year.\n\n## Article III: Conduct Code\nAll members are expected to maintain respect, participate in at least 70% of weekly training sessions, and deliver assigned duties on time.",
      author: "Lê Thanh Tùng",
      date: "2026-05-01",
      document: "Club_Constitution_v2.pdf"
    }
  ]);

  async function fetchArticles(uuid) {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await knowledgeService.getArticles(uuid).catch(() => []);

      const parsed = data.map((art) => ({
        id: art.id,
        title: art.title,
        category: art.category || "Guide",
        description: art.content ? art.content.slice(0, 150) + "..." : "No description provided.",
        content: art.content || "",
        author: art.profiles?.full_name || "—",
        date: art.created_at ? art.created_at.slice(0, 10) : new Date().toISOString().split("T")[0],
        document: art.attachment_url || "None"
      }));
      setArticles(parsed);
    } catch (err) {
      console.error("Supabase wiki articles load failed, using fallback:", err);
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
          fetchArticles(uuid);
        } else {
          setLoading(false);
        }
      }
    }
    init();
  }, [clubId]);

  const categoriesList = ["Guide", "Technical", "Template"];
  const documentsList = [
    "Club_Constitution_v2.pdf",
    "Standard_Event_Planning_Blueprint.pdf",
    "Supabase_RLS_Setup_Guide.pdf",
    "React_19_Seminar_Outline.pdf",
    "None"
  ];

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
    document: "None"
  });

  const handleOpenAddModal = () => {
    setSelectedArticle(null);
    setFormData({
      title: "",
      category: "Guide",
      description: "",
      content: "",
      document: "None"
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (e, art) => {
    e.stopPropagation();
    setSelectedArticle(art);
    setFormData({
      title: art.title,
      category: art.category,
      description: art.description,
      content: art.content,
      document: art.document
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

    const payload = {
      club_id: resolvedClubId || clubId,
      title: formData.title,
      content: formData.content,
      category: formData.category,
      attachment_url: formData.document === "None" ? null : formData.document,
      created_by: profileId || null
    };

    try {
      if (selectedArticle) {
        await knowledgeService.updateArticle(selectedArticle.id, payload);
      } else {
        await knowledgeService.createArticle(payload);
      }
      if (resolvedClubId) {
        fetchArticles(resolvedClubId);
      }
    } catch (err) {
      console.warn("Supabase wiki save failed, utilizing fallback local state:", err);
      if (selectedArticle) {
        setArticles((prev) =>
          prev.map((art) =>
            art.id === selectedArticle.id ? { ...art, ...formData } : art
          )
        );
      } else {
        const newArticle = {
          id: String(articles.length + 1),
          author: "Lê Thanh Tùng",
          date: new Date().toISOString().split("T")[0],
          ...formData
        };
        setArticles((prev) => [newArticle, ...prev]);
      }
    }
    handleCloseModals();
  };

  const handleDeleteArticle = async (e, id) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this knowledge article?")) {
      try {
        await knowledgeService.deleteArticle(id);
        if (resolvedClubId) {
          fetchArticles(resolvedClubId);
        }
      } catch (err) {
        console.warn("Supabase wiki delete failed, updating state locally:", err);
        setArticles((prev) => prev.filter((art) => art.id !== id));
      }
    }
  };

  const filteredArticles = articles.filter((art) => {
    const matchesSearch =
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === "All" || art.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="knowledge-page">
      <HeroSection
        variant="knowledge"
        eyebrow="Wiki & Documentation"
        title="Knowledge"
        titleGradient="Base"
        subtitle="Wiki documentation, operational manuals, and guidelines of FPTU Software Engineering Club."
      />

      <div className="knowledge-page__body">
        <div className="knowledge-page__container">
          <div className="knowledge-page__header">
            <div>
              <h2 className="knowledge-page__title">Article Library</h2>
              <p className="knowledge-page__subtitle">Browse or write operational, technical and template articles.</p>
            </div>
            <div className="knowledge-page__header-actions">
              {errorMsg && (
                <span className="knowledge-page__warn">⚠️ {errorMsg}</span>
              )}
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
              {["All", ...categoriesList].map((cat) => (
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
              <div className="knowledge-page__loading">
                <span className="knowledge-page__spinner" />
                <span>Fetching wiki articles…</span>
              </div>
            ) : filteredArticles.length > 0 ? (
              filteredArticles.map((art) => (
                <article
                  key={art.id}
                  onClick={() => handleOpenReadModal(art)}
                  className="knowledge-card"
                >
                  <div className="knowledge-card__head">
                    <span className={`knowledge-card__category knowledge-card__category--${art.category.toLowerCase()}`}>
                      {art.category}
                    </span>
                    <span className="knowledge-card__date">{art.date}</span>
                  </div>
                  <h3 className="knowledge-card__title">{art.title}</h3>
                  <p className="knowledge-card__desc">{art.description}</p>

                  <div className="knowledge-card__footer">
                    <span className="knowledge-card__author">By <strong>{art.author}</strong></span>
                    <div className="knowledge-card__actions">
                      <button type="button" className="knowledge-card__link knowledge-card__link--edit" onClick={(e) => handleOpenEditModal(e, art)}>
                        Edit
                      </button>
                      <span className="knowledge-card__divider">|</span>
                      <button type="button" className="knowledge-card__link knowledge-card__link--delete" onClick={(e) => handleDeleteArticle(e, art.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="knowledge-page__empty">
                No wiki articles found matching your query.
              </div>
            )}
          </div>
        </div>
      </div>

      <KnowledgeDetailModal
        isOpen={isReadModalOpen}
        selectedArticle={selectedArticle}
        handleCloseModals={handleCloseModals}
        handleOpenEditModal={handleOpenEditModal}
      />

      <KnowledgeFormModal
        isOpen={isModalOpen}
        selectedArticle={selectedArticle}
        formData={formData}
        categoriesList={categoriesList}
        documentsList={documentsList}
        handleCloseModals={handleCloseModals}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
      />
    </div>
  );
}