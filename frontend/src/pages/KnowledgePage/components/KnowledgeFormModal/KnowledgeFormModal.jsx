import { X } from 'lucide-react';
import './KnowledgeFormModal.css';

export default function KnowledgeFormModal({
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
    <div className="knowledge-modal">
      <div className="knowledge-modal__backdrop" onClick={handleCloseModals} />

      <div className="knowledge-modal__panel">
        <button type="button" className="knowledge-modal__close" onClick={handleCloseModals}>
          <X size={18} />
        </button>
        <h3 className="knowledge-modal__title">
          {selectedArticle ? "✏️ Edit Knowledge Article" : "📚 Write Knowledge Article"}
        </h3>

        <form onSubmit={handleSubmit} className="knowledge-modal__form">
          <div className="knowledge-modal__grid">
            <div className="knowledge-modal__field knowledge-modal__field--title">
              <label className="knowledge-modal__label">Article Title</label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g. Git Operational Policy"
                className="knowledge-modal__input"
              />
            </div>
            <div className="knowledge-modal__field">
              <label className="knowledge-modal__label">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="knowledge-modal__input knowledge-modal__input--sm"
              >
                {categoriesList.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="knowledge-modal__field">
            <label className="knowledge-modal__label">Brief Summary</label>
            <textarea
              name="description"
              required
              rows="2"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Summarize this wiki article in 2 sentences."
              className="knowledge-modal__input knowledge-modal__textarea knowledge-modal__textarea--noresize"
            />
          </div>

          <div className="knowledge-modal__field">
            <label className="knowledge-modal__label">Content (Markdown supported)</label>
            <textarea
              name="content"
              required
              rows="6"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="## Heading 1&#10;Write detailed instructions here..."
              className="knowledge-modal__input knowledge-modal__textarea knowledge-modal__textarea--mono"
            />
          </div>

          <div className="knowledge-modal__field">
            <label className="knowledge-modal__label">Attached Document File</label>
            <select
              name="document"
              value={formData.document}
              onChange={handleInputChange}
              className="knowledge-modal__input knowledge-modal__input--sm"
            >
              {documentsList.map((doc, idx) => (
                <option key={idx} value={doc}>{doc}</option>
              ))}
            </select>
          </div>

          <div className="knowledge-modal__actions">
            <button type="button" className="knowledge-modal__btn-secondary" onClick={handleCloseModals}>
              Cancel
            </button>
            <button type="submit" className="knowledge-modal__btn-primary">
              {selectedArticle ? "Save Changes" : "Publish Wiki"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}