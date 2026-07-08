import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import MainLayout from '@/layouts/MainLayout.jsx';
import { documentService } from "../../services/documentService";
import { resolveClubUuid } from "../../services/supabase";
import { useAuth } from "@/hooks/useAuth";
import { HeroSection } from "@/components";
import DocumentUploadModal from "./components/DocumentUploadModal/DocumentUploadModal.jsx";
import "./DocumentsPage.css";

export default function DocumentsPage() {
  return (
    <MainLayout>
      <DocumentsPageContent />
    </MainLayout>
  );
}

function DocumentsPageContent() {
  const { clubId } = useParams();
  const { profileId } = useAuth();
  const [resolvedClubId, setResolvedClubId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // 1. Initial Mock Data for Document Registry
  const [documents, setDocuments] = useState([
    { id: "1", name: "Sponsorship Proposal Template 2026.docx", size: "2.4 MB", type: "Word", date: "2026-06-25", uploader: "Phạm Minh Thư" },
    { id: "2", name: "Club Financial Report Q2.xlsx", size: "1.8 MB", type: "Excel", date: "2026-07-01", uploader: "Lê Thanh Tùng" }
  ]);

  async function fetchDocuments(uuid) {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await documentService.getClubDocuments(uuid).catch(() => []);

      const parsed = data.map(d => ({
        id: d.id,
        name: d.title,
        size: "2.5 MB",
        type: d.type === "pdf" ? "PDF" : d.type === "xlsx" ? "Excel" : "Word",
        date: d.uploaded_at ? d.uploaded_at.slice(0, 10) : new Date().toISOString().split("T")[0],
        uploader: d.profiles?.full_name || "—"
      }));
      setDocuments(parsed);
    } catch (err) {
      console.error("Supabase documents load error, using fallback data:", err);
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
          fetchDocuments(uuid);
        } else {
          setLoading(false);
        }
      }
    }
    init();
  }, [clubId]);

  // 2. States for Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");

  // 3. States for CRUD Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "PDF"
  });

  // 4. Handlers
  const handleOpenUploadModal = () => {
    setFormData({ name: "", type: "PDF" });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const extension = formData.type === "PDF" ? ".pdf" : formData.type === "Word" ? ".docx" : ".xlsx";
    const cleanName = formData.name.endsWith(extension) ? formData.name : formData.name + extension;

    const payload = {
      club_id: resolvedClubId || clubId,
      title: cleanName,
      file_url: `https://placeholder.supabase.co/storage/v1/object/public/documents/${cleanName}`,
      type: formData.type.toLowerCase(),
      uploaded_by: profileId || null
    };

    try {
      await documentService.saveDocumentMetadata(payload);
      if (resolvedClubId) fetchDocuments(resolvedClubId);
    } catch (err) {
      console.warn("Supabase document save failed, using local state fallback:", err);
      const randomSize = (Math.random() * (5 - 0.5) + 0.5).toFixed(1) + " MB";
      const newDoc = {
        id: String(documents.length + 1),
        name: cleanName,
        size: randomSize,
        type: formData.type,
        date: new Date().toISOString().split("T")[0],
        uploader: "Lê Thanh Tùng"
      };
      setDocuments((prev) => [newDoc, ...prev]);
    }
    handleCloseModal();
  };

  const handleDeleteDoc = async (id) => {
    if (confirm("Are you sure you want to permanently delete this document registry?")) {
      try {
        await documentService.deleteDocument(id);
        if (resolvedClubId) fetchDocuments(resolvedClubId);
      } catch (err) {
        console.warn("Supabase document delete failed, updating locally:", err);
        setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      }
    }
  };

  // 5. Filter Logic
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "All" || doc.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="documents-page">
      <HeroSection
        variant="documents"
        eyebrow="Shared Resources"
        title="Document"
        titleGradient="Center"
        subtitle="Central repository for administrative reports, templates, drafts, and proposals."
      />

      <div className="events-page__body documents-page__body">
        <div className="events-page__container documents-page__container">
          {/* Page Header */}
          <div className="events-page__header">
            <div>
              <h2 className="events-page__title">Document Library</h2>
              <p className="events-page__subtitle">Manage and download administrative reports, templates, and shared assets.</p>
            </div>
            <div className="events-page__header-actions">
              {errorMsg && (
                <span className="events-page__warn">⚠️ {errorMsg}</span>
              )}
              <button type="button" className="events-page__btn-primary" onClick={handleOpenUploadModal}>
                📤 Upload Document
              </button>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="documents-page__toolbar">
            <div className="documents-page__search">
              <span className="documents-page__search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search documents by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="documents-page__search-input"
              />
            </div>

            <div className="documents-page__tabs">
              {["All", "PDF", "Word", "Excel"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`documents-page__tab ${selectedType === type ? "documents-page__tab--active" : ""}`}
                >
                  {type === "All" ? "All Files" : type}
                </button>
              ))}
            </div>
          </div>

          {/* Document Items List */}
          <div className="documents-page__list">
            {loading ? (
              <div className="events-page__loading">
                <span className="events-page__spinner" />
                <span>Fetching club documents…</span>
              </div>
            ) : filteredDocs.length > 0 ? (
              filteredDocs.map((d) => (
                <div key={d.id} className="document-row">
                  <div className="document-row__main">
                    <span className={`document-row__icon document-row__icon--${d.type.toLowerCase()}`}>
                      {d.type === "PDF" ? "📕" : d.type === "Word" ? "📘" : "📗"}
                    </span>
                    <div className="document-row__meta">
                      <h4 className="document-row__name">{d.name}</h4>
                      <p className="document-row__info">
                        Size: <strong>{d.size}</strong>
                        <span className="document-row__sep">•</span>
                        Uploaded on: <strong>{d.date}</strong>
                        <span className="document-row__sep">•</span>
                        By: <strong>{d.uploader}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="document-row__actions">
                    <span className={`document-row__type document-row__type--${d.type.toLowerCase()}`}>
                      {d.type}
                    </span>
                    <div className="document-row__links">
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          window.alert(`Simulating document download for: ${d.name}`);
                        }}
                        className="document-row__link document-row__link--download"
                      >
                        Download
                      </a>
                      <span className="document-row__divider">|</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteDoc(d.id)}
                        className="document-row__link document-row__link--delete"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="events-page__empty">
                No documents found matching the criteria.
              </div>
            )}
          </div>
        </div>
      </div>

      <DocumentUploadModal
        isOpen={isModalOpen}
        formData={formData}
        setFormData={setFormData}
        handleCloseModal={handleCloseModal}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
      />
    </div>
  );
}
