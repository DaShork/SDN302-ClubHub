import { X, Download } from 'lucide-react';
import './KnowledgeDetailModal.css';

export default function KnowledgeDetailModal({
  isOpen,
  selectedArticle,
  handleCloseModals,
  handleOpenEditModal
}) {
  if (!isOpen || !selectedArticle) return null;

  return (
    <div className="knowledge-detail">
      <div className="knowledge-detail__backdrop" onClick={handleCloseModals} />

      <div className="knowledge-detail__panel">
        <button type="button" className="knowledge-detail__close" onClick={handleCloseModals}>
          <X size={18} />
        </button>
        <div className="knowledge-detail__head">
          <span className={`knowledge-detail__category knowledge-detail__category--${selectedArticle.category.toLowerCase()}`}>
            {selectedArticle.category}
          </span>
          <span className="knowledge-detail__date">{selectedArticle.date}</span>
        </div>

        <h3 className="knowledge-detail__title">{selectedArticle.title}</h3>
        <p className="knowledge-detail__author">
          Preserved by <span className="knowledge-detail__author-name">{selectedArticle.author}</span>
        </p>

        <div className="knowledge-detail__content">
          {selectedArticle.content}
        </div>

        {selectedArticle.document && selectedArticle.document !== "None" && (
          <div className="knowledge-detail__attachment">
            <span className="knowledge-detail__attachment-text">
              📁 Attached Document: <strong>{selectedArticle.document}</strong>
            </span>
            <a href="#" className="knowledge-detail__download">
              <Download size={14} /> Download
            </a>
          </div>
        )}

        <div className="knowledge-detail__actions">
          <button
            type="button"
            onClick={(e) => handleOpenEditModal(e, selectedArticle)}
            className="knowledge-detail__btn-primary"
          >
            Edit Wiki
          </button>
          <button
            type="button"
            onClick={handleCloseModals}
            className="knowledge-detail__btn-secondary"
          >
            Close View
          </button>
        </div>
      </div>
    </div>
  );
}