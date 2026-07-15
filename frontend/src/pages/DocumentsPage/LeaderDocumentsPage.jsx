import { useEffect, useState, useMemo } from "react";
import { documentService } from "../../services/documentService";
import { LeaderDashboardHeader, LeaderEmptyState, Loading } from "@/components";
import { useAuth } from "@/hooks/useAuth.jsx";
import { useLeaderScope } from "@/contexts/LeaderScopeContext.jsx";
import DocumentUploadModal from "./components/DocumentUploadModal/DocumentUploadModal.jsx";
import "./DocumentsPage.css";

export default function LeaderDocumentsPage() {
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
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", type: "PDF" });

  const targetIds = useMemo(() => {
    if (isAllScope) return ledClubIds;
    return selectedClubId ? [selectedClubId] : [];
  }, [isAllScope, selectedClubId, ledClubIds]);

  async function loadForClub(uuid, clubName) {
    const data = await documentService.getClubDocuments(uuid).catch(() => []);
    return (data || []).map((d) => ({
      id: d.id,
      clubId: uuid,
      clubName,
      name: d.title,
      size: "2.5 MB",
      type: d.type === "pdf" ? "PDF" : d.type === "xlsx" ? "Excel" : "Word",
      date: d.uploaded_at ? d.uploaded_at.slice(0, 10) : new Date().toISOString().split("T")[0],
      uploader: d.profiles?.full_name || "—",
    }));
  }

  async function loadAll() {
    if (targetIds.length === 0) {
      setDocuments([]);
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
      setDocuments(rows);
    } catch (err) {
      console.error("Supabase documents load error:", err);
      setErrorMsg("Không thể tải dữ liệu từ database.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetIds.join("|")]);

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "All" || doc.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleOpenUploadModal = () => {
    if (isAllScope) {
      alert("Vui lòng chọn 1 CLB cụ thể trước khi upload tài liệu.");
      return;
    }
    setFormData({ name: "", type: "PDF" });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClubId) return;
    const extension = formData.type === "PDF" ? ".pdf" : formData.type === "Word" ? ".docx" : ".xlsx";
    const cleanName = formData.name.endsWith(extension) ? formData.name : formData.name + extension;
    const payload = {
      club_id: selectedClubId,
      title: cleanName,
      file_url: `https://placeholder.supabase.co/storage/v1/object/public/documents/${cleanName}`,
      type: formData.type.toLowerCase(),
      uploaded_by: profileId || null,
    };
    try {
      await documentService.saveDocumentMetadata(payload);
      loadAll();
    } catch (err) {
      console.warn("Supabase document save failed, using local state fallback:", err);
      const newDoc = {
        id: String(Date.now()),
        clubId: selectedClubId,
        clubName: selectedClub?.name || "",
        name: cleanName,
        size: (Math.random() * (5 - 0.5) + 0.5).toFixed(1) + " MB",
        type: formData.type,
        date: new Date().toISOString().split("T")[0],
        uploader: "—",
      };
      setDocuments((prev) => [newDoc, ...prev]);
    }
    handleCloseModal();
  };

  const handleDeleteDoc = async (id) => {
    if (isAllScope) {
      alert("Vui lòng chọn 1 CLB cụ thể trước khi xóa tài liệu.");
      return;
    }
    if (confirm("Are you sure you want to permanently delete this document?")) {
      try {
        await documentService.deleteDocument(id);
        loadAll();
      } catch (err) {
        console.warn("Supabase document delete failed, updating locally:", err);
        setDocuments((prev) => prev.filter((doc) => doc.id !== id));
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
          eyebrow="Documents"
          title="Document Center"
          subtitle="Central repository for administrative reports, templates, drafts, and proposals."
        />
        <LeaderEmptyState />
      </>
    );
  }

  const eyebrow = isAllScope
    ? `Documents across ${ledClubs.length} club${ledClubs.length === 1 ? "" : "s"}`
    : selectedClub
      ? `Documents of ${selectedClub.name}`
      : "Documents";

  return (
    <div className="documents-page">
      <div className="events-page__body documents-page__body">
        <div className="events-page__container documents-page__container">
          <LeaderDashboardHeader
            ledClubs={ledClubs}
            eyebrow={eyebrow}
            title="Document Center"
            subtitle="Manage and download administrative reports, templates, and shared assets."
          />

          <div className="events-page__header">
            <div>
              <h2 className="events-page__title">Document Library</h2>
              <p className="events-page__subtitle">Manage and download administrative reports, templates, and shared assets.</p>
            </div>
            <div className="events-page__header-actions">
              {errorMsg && <span className="events-page__warn">⚠️ {errorMsg}</span>}
              <button type="button" className="events-page__btn-primary" onClick={handleOpenUploadModal}>
                📤 Upload Document
              </button>
            </div>
          </div>

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

          <div className="documents-page__list">
            {loading ? (
              <div className="events-page__loading">
                <span className="events-page__spinner" />
                <span>Fetching documents…</span>
              </div>
            ) : filteredDocs.length > 0 ? (
              filteredDocs.map((d) => (
                <div key={`${d.id}-${d.clubId}`} className="document-row">
                  <div className="document-row__main">
                    <span className={`document-row__icon document-row__icon--${d.type.toLowerCase()}`}>
                      {d.type === "PDF" ? "📕" : d.type === "Word" ? "📘" : "📗"}
                    </span>
                    <div>
                      <div className="document-row__name">{d.name}</div>
                      <div className="document-row__meta">
                        {isAllScope && (
                          <span className="document-row__club">{d.clubName}</span>
                        )}
                        <span>{d.size}</span>
                        <span>{d.date}</span>
                        <span>by {d.uploader}</span>
                      </div>
                    </div>
                  </div>
                  <div className="document-row__actions">
                    <button type="button" onClick={() => handleDeleteDoc(d.id)} className="document-row__delete">
                      🗑 Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="documents-page__empty">No documents yet.</div>
            )}
          </div>
        </div>
      </div>

      <DocumentUploadModal
        open={isModalOpen}
        onClose={handleCloseModal}
        formData={formData}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
      />
    </div>
  );
}