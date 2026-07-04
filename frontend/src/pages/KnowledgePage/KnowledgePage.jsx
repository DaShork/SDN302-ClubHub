import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { knowledgeService } from "../../services/knowledgeService";
import { resolveClubUuid } from "../../services/supabase";
import { useAuth } from "../../contexts/AuthContext";

export default function KnowledgePage() {
  const { clubId } = useParams();
  const { profileId } = useAuth();
  const [resolvedClubId, setResolvedClubId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // 1. Initial Mock Data for Knowledge Articles
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

      const parsed = data.map(art => ({
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

  // List of mock categories and documents for dropdowns
  const categoriesList = ["Guide", "Technical", "Template"];
  const documentsList = [
    "Club_Constitution_v2.pdf",
    "Standard_Event_Planning_Blueprint.pdf",
    "Supabase_RLS_Setup_Guide.pdf",
    "React_19_Seminar_Outline.pdf",
    "None"
  ];

  // 2. States for Filtering & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // 3. States for Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReadModalOpen, setIsReadModalOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    category: "Guide",
    description: "",
    content: "",
    document: "None"
  });

  // 4. Handlers
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
    e.stopPropagation(); // Avoid triggering details modal
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
    e.stopPropagation(); // Avoid triggering details modal
    if (confirm("Are you sure you want to delete this knowledge article?")) {
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

  // 5. Filter & Search Logic
  const filteredArticles = articles.filter((art) => {
    const matchesSearch =
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === "All" || art.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#06231D] tracking-tight">Knowledge Base</h2>
          <p className="text-xs text-[#4A5D59]">Wiki documentation, operational manuals, and guidelines of FPTU Software Engineering Club.</p>
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
            <span>📚</span> Write Article
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#06231D]/10 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#4A5D59]">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search wiki articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#06231D] placeholder-[#4A5D59] focus:outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-all"
          />
        </div>

        {/* Category switcher tabs */}
        <div className="flex gap-1.5 p-1 bg-gray-50 rounded-xl border border-gray-200 w-full md:w-auto overflow-x-auto">
          {["All", ...categoriesList].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat ? "bg-[#22C55E] text-[#06231D] font-bold" : "text-[#4A5D59] hover:text-[#06231D]"
              }`}
            >
              {cat === "All" ? "All Wikis" : cat + "s"}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-[#4A5D59] flex flex-col items-center justify-center gap-2 bg-white border border-gray-200 rounded-2xl">
            <span className="w-6 h-6 border-2 border-[#22C55E] border-t-transparent rounded-full animate-spin"></span>
            <span>Fetching wiki articles...</span>
          </div>
        ) : filteredArticles.length > 0 ? (
          filteredArticles.map((art) => (
            <div
              key={art.id}
              onClick={() => handleOpenReadModal(art)}
              className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col justify-between hover:translate-y-[-4px] hover:shadow-md cursor-pointer transition-all duration-300"
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    art.category === "Guide"
                      ? "bg-teal-500/10 text-teal-700 border-teal-500/20"
                      : art.category === "Technical"
                      ? "bg-blue-500/10 text-blue-700 border-blue-500/20"
                      : "bg-purple-500/10 text-purple-700 border-purple-500/20"
                  }`}>
                    {art.category}
                  </span>
                  <span className="text-[10px] text-[#4A5D59]">{art.date}</span>
                </div>
                <h3 className="text-base font-bold text-[#06231D] mb-2 leading-snug hover:text-[#22C55E] transition-all">
                  {art.title}
                </h3>
                <p className="text-xs text-[#4A5D59] line-clamp-3 leading-relaxed mb-4">
                  {art.description}
                </p>
              </div>

              <div className="border-t border-gray-100 pt-4 mt-2 flex justify-between items-center text-xs">
                <span className="text-[#4A5D59] text-[10px]">Author: <strong className="text-[#06231D]">{art.author}</strong></span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => handleOpenEditModal(e, art)}
                    className="text-xs text-[#22C55E] hover:underline font-bold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => handleDeleteArticle(e, art.id)}
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
            No wiki articles found matching your query.
          </div>
        )}
      </div>

      {/* 3. Read Article Modal */}
      <KnowledgeDetailModal
        isOpen={isReadModalOpen}
        selectedArticle={selectedArticle}
        handleCloseModals={handleCloseModals}
        handleOpenEditModal={handleOpenEditModal}
      />

      {/* 4. CRUD Form Modal (Add / Edit) */}
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

function KnowledgeFormModal({
  isOpen,
  selectedArticle,
  formData,
  categoriesList,
  documentsList,
  handleCloseModals,
  handleInputChange,
  handleSubmit
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseModals}></div>

      <div className="bg-white border border-gray-200 rounded-2xl max-w-lg w-full p-6 z-50 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-fade-in text-sm text-[#06231D]">
        <button onClick={handleCloseModals} className="absolute top-4 right-4 text-[#4A5D59] hover:text-[#06231D] p-1">
          ✕
        </button>
        <h3 className="text-lg font-bold text-[#06231D] mb-4">
          {selectedArticle ? "✏️ Edit Knowledge Article" : "📚 Write Knowledge Article"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title & Category Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-[#4A5D59] uppercase mb-1">Article Title</label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g. Git Operational Policy"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#06231D] focus:outline-none focus:border-[#22C55E]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#4A5D59] uppercase mb-1">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-[#06231D] focus:outline-none focus:border-[#22C55E]"
              >
                {categoriesList.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Brief Summary */}
          <div>
            <label className="block text-xs font-bold text-[#4A5D59] uppercase mb-1">Brief Summary</label>
            <textarea
              name="description"
              required
              rows="2"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Summarize this wiki article in 2 sentences."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-[#06231D] focus:outline-none focus:border-[#22C55E] resize-none"
            ></textarea>
          </div>

          {/* Article Content */}
          <div>
            <label className="block text-xs font-bold text-[#4A5D59] uppercase mb-1">Content (Markdown supported)</label>
            <textarea
              name="content"
              required
              rows="6"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="## Heading 1&#10;Write detailed instructions here..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-[#06231D] font-mono focus:outline-none focus:border-[#22C55E] resize-y"
            ></textarea>
          </div>

          {/* Attached document link */}
          <div>
            <label className="block text-xs font-bold text-[#4A5D59] uppercase mb-1">Attached Document File</label>
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

          {/* Submit buttons */}
          <div className="flex gap-3 justify-end border-t border-gray-100 pt-4 mt-6">
            <button
              type="button"
              onClick={handleCloseModals}
              className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs text-[#4A5D59] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0E4B43] to-[#22C55E] text-white font-bold text-xs hover:opacity-90 cursor-pointer"
            >
              {selectedArticle ? "Save Changes" : "Publish Wiki"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function KnowledgeDetailModal({
  isOpen,
  selectedArticle,
  handleCloseModals,
  handleOpenEditModal
}) {
  if (!isOpen || !selectedArticle) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseModals}></div>

      <div className="bg-white border border-gray-200 rounded-2xl max-w-2xl w-full p-6 md:p-8 z-50 shadow-2xl relative max-h-[85vh] overflow-y-auto animate-fade-in text-sm text-[#06231D]">
        <button onClick={handleCloseModals} className="absolute top-4 right-4 text-[#4A5D59] hover:text-[#06231D] p-1">
          ✕
        </button>
        <div className="flex items-center gap-3 mb-4">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
            selectedArticle.category === "Guide"
              ? "bg-teal-500/10 text-teal-700 border-teal-500/20"
              : selectedArticle.category === "Technical"
              ? "bg-blue-500/10 text-blue-700 border-blue-500/20"
              : "bg-purple-500/10 text-purple-700 border-purple-500/20"
          }`}>
            {selectedArticle.category}
          </span>
          <span className="text-xs text-[#4A5D59]">{selectedArticle.date}</span>
        </div>

        <h3 className="text-2xl font-bold text-[#06231D] mb-2 leading-tight">{selectedArticle.title}</h3>
        <p className="text-xs text-[#4A5D59] mb-6">Preserved by <span className="text-[#22C55E] font-semibold">{selectedArticle.author}</span></p>

        <div className="bg-[#F4F1EA] border border-gray-200 rounded-2xl p-5 mb-6 text-[#06231D] leading-relaxed whitespace-pre-wrap font-sans text-xs md:text-sm">
          {selectedArticle.content}
        </div>

        {selectedArticle.document && selectedArticle.document !== "None" && (
          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs mb-6">
            <span className="text-[#4A5D59] truncate">📁 Attached Document: <strong className="text-[#06231D] ml-1">{selectedArticle.document}</strong></span>
            <a href="#" className="text-[#22C55E] hover:underline font-bold">Download</a>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
          <button
            onClick={(e) => handleOpenEditModal(e, selectedArticle)}
            className="px-4 py-2 rounded-xl bg-[#0E4B43] text-white text-xs font-semibold hover:opacity-90 cursor-pointer"
          >
            Edit Wiki
          </button>
          <button
            onClick={handleCloseModals}
            className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs text-[#4A5D59] font-medium cursor-pointer"
          >
            Close View
          </button>
        </div>
      </div>
    </div>
  );
}
