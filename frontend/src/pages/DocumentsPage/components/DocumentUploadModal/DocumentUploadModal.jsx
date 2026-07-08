import { X } from 'lucide-react';
import './DocumentUploadModal.css';

export default function DocumentUploadModal({
  isOpen,
  formData,
  setFormData,
  handleCloseModal,
  handleInputChange,
  handleSubmit
}) {
  if (!isOpen) return null;

  return (
    <div className="doc-modal">
      <div className="doc-modal__backdrop" onClick={handleCloseModal} />

      <div className="doc-modal__panel">
        <button type="button" className="doc-modal__close" onClick={handleCloseModal}>
          <X size={18} />
        </button>
        <h3 className="doc-modal__title">📤 Upload Document File</h3>

        <form onSubmit={handleSubmit} className="doc-modal__form">
          <div className="doc-modal__field">
            <label className="doc-modal__label">Document Display Name</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g. Sponsorship Proposal Draft v3"
              className="doc-modal__input"
            />
          </div>

          <div className="doc-modal__field">
            <label className="doc-modal__label">Document Format Type</label>
            <div className="doc-modal__type-row">
              {["PDF", "Word", "Excel"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, type: t }))}
                  className={`doc-modal__type-btn ${formData.type === t ? "doc-modal__type-btn--active" : ""}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="doc-modal__dropzone">
            <span className="doc-modal__dropzone-icon">📁</span>
            <p className="doc-modal__dropzone-text">Click to select files or drag-and-drop here</p>
            <p className="doc-modal__dropzone-hint">Accepts PDF, DOCX, XLSX up to 10MB</p>
          </div>

          <div className="doc-modal__actions">
            <button type="button" className="doc-modal__btn-secondary" onClick={handleCloseModal}>
              Cancel
            </button>
            <button type="submit" className="doc-modal__btn-primary">
              Confirm Upload
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}