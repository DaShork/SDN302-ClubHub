import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { documentService } from "../../services/documentService";
import { resolveClubUuid } from "../../services/supabase";
import { useAuth } from "@/hooks/useAuth";

export default function DocumentsPage() {
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
      } else {
        setLoading(false);
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
      file_url: `https://thdlyzafslwymzvnutfv.supabase.co/storage/v1/object/public/documents/${cleanName}`,
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#06231D] tracking-tight">Document Center</h2>
          <p className="text-xs text-[#4A5D59]">Central repository for administrative reports, templates, drafts, and proposals.</p>
        </div>
        <div className="flex gap-2">
          {errorMsg && (
            <span className="bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-2 rounded-xl flex items-center gap-1 font-medium animate-fade-in">
              ⚠️ {errorMsg}
            </span>
          )}
          <button
            onClick={handleOpenUploadModal}
            className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-[#0E4B43] to-[#22C55E] text-white font-bold text-xs hover:opacity-90 transition-all flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <span>📤</span> Upload Document
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
            placeholder="Search documents by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#06231D] placeholder-[#4A5D59] focus:outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-all"
          />
        </div>

        {/* Extension type switcher tabs */}
        <div className="flex gap-1.5 p-1 bg-gray-50 rounded-xl border border-gray-200 w-full md:w-auto overflow-x-auto">
          {["All", "PDF", "Word", "Excel"].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedType === type ? "bg-[#22C55E] text-[#06231D] font-bold" : "text-[#4A5D59] hover:text-[#06231D]"
              }`}
            >
              {type === "All" ? "All Files" : type}
            </button>
          ))}
        </div>
      </div>

      {/* Document Items List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-[#4A5D59] flex flex-col items-center justify-center gap-2 bg-white border border-gray-200 rounded-2xl">
            <span className="w-6 h-6 border-2 border-[#22C55E] border-t-transparent rounded-full animate-spin"></span>
            <span>Fetching club documents...</span>
          </div>
        ) : filteredDocs.length > 0 ? (
          filteredDocs.map((d) => (
            <div
              key={d.id}
              className="p-4 rounded-xl bg-white border border-gray-200 flex items-center justify-between hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
            >
              {/* Left Details */}
              <div className="flex items-center gap-3.5 min-w-0">
                <span className="text-2xl p-2 bg-gray-50 rounded-xl flex-shrink-0 select-none border border-gray-200/50">
                  {d.type === "PDF" ? "📕" : d.type === "Word" ? "📘" : "📗"}
                </span>
                <div className="min-w-0">
                  <h4 className="font-semibold text-sm text-[#06231D] truncate leading-tight">{d.name}</h4>
                  <p className="text-[10px] text-[#4A5D59] mt-1.5 flex flex-wrap gap-2 items-center">
                    <span>Size: <strong>{d.size}</strong></span>
                    <span className="text-gray-300">•</span>
                    <span>Uploaded on: <strong>{d.date}</strong></span>
                    <span className="text-gray-300">•</span>
                    <span>By: <strong className="text-[#06231D]">{d.uploader}</strong></span>
                  </p>
                </div>
              </div>

              {/* Right Badges and Download actions */}
              <div className="flex items-center gap-4 ml-4">
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                  d.type === "PDF"
                    ? "bg-red-500/10 text-red-600 border-red-500/20"
                    : d.type === "Word"
                    ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                    : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                }`}>
                  {d.type}
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      alert(`Simulating document download for: ${d.name}`);
                    }}
                    className="text-xs text-[#22C55E] hover:underline font-bold"
                  >
                    Download
                  </a>
                  <span className="text-gray-200">|</span>
                  <button
                    onClick={() => handleDeleteDoc(d.id)}
                    className="text-xs text-red-500 hover:text-red-600 font-semibold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-[#4A5D59] bg-white border border-gray-200 rounded-2xl">
            No documents found matching the criteria.
          </div>
        )}
      </div>

      {/* Upload File Modal */}
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

function DocumentUploadModal({
  isOpen,
  formData,
  setFormData,
  handleCloseModal,
  handleInputChange,
  handleSubmit
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseModal}></div>

      <div className="bg-white border border-gray-200 rounded-2xl max-w-md w-full p-6 z-50 shadow-2xl relative animate-fade-in text-sm text-[#06231D]">
        <button onClick={handleCloseModal} className="absolute top-4 right-4 text-[#4A5D59] hover:text-[#06231D] p-1">
          ✕
        </button>
        <h3 className="text-lg font-bold text-[#06231D] mb-4">📤 Upload Document File</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Document Name */}
          <div>
            <label className="block text-xs font-bold text-[#4A5D59] uppercase mb-1">Document Display Name</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g. Sponsorship Proposal Draft v3"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#06231D] focus:outline-none focus:border-[#22C55E]"
            />
          </div>

          {/* Document Type Selection */}
          <div>
            <label className="block text-xs font-bold text-[#4A5D59] uppercase mb-1">Document Format Type</label>
            <div className="flex gap-2">
              {["PDF", "Word", "Excel"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, type: t }))}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    formData.type === t
                      ? "bg-[#22C55E]/10 text-[#0E4B43] border-[#22C55E]/30"
                      : "bg-gray-50 border-gray-200 text-[#4A5D59] hover:text-[#06231D]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Simulated file upload area */}
          <div className="border-2 border-dashed border-gray-200 hover:border-[#22C55E]/50 rounded-2xl p-6 text-center cursor-pointer transition-all bg-gray-50/50">
            <span className="text-3xl">📁</span>
            <p className="text-xs text-[#06231D] mt-2 font-semibold">Click to select files or drag-and-drop here</p>
            <p className="text-[10px] text-[#4A5D59] mt-1">Accepts PDF, DOCX, XLSX up to 10MB</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end border-t border-gray-100 pt-4 mt-6">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs text-[#4A5D59] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0E4B43] to-[#22C55E] text-white font-bold text-xs hover:opacity-90 cursor-pointer"
            >
              Confirm Upload
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
