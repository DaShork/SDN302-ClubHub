import { X } from 'lucide-react';
import './AnnouncementFormModal.css';

export default function AnnouncementFormModal({
  isOpen,
  selectedAnnouncement,
  formData,
  audienceList,
  handleCloseModal,
  handleInputChange,
  handleSubmit
}) {
  if (!isOpen) return null;

  return (
    <div className="ann-modal">
      <div className="ann-modal__backdrop" onClick={handleCloseModal} />

      <div className="ann-modal__panel">
        <button type="button" className="ann-modal__close" onClick={handleCloseModal}>
          <X size={18} />
        </button>
        <h3 className="ann-modal__title">
          {selectedAnnouncement ? "✏️ Edit Announcement" : "📣 Publish Announcement"}
        </h3>

        <form onSubmit={handleSubmit} className="ann-modal__form">
          <div className="ann-modal__field">
            <label className="ann-modal__label">Title</label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g. Critical training alert!"
              className="ann-modal__input"
            />
          </div>

          <div className="ann-modal__field">
            <label className="ann-modal__label">Detailed Message</label>
            <textarea
              name="content"
              required
              rows="5"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="Write the full announcement details here..."
              className="ann-modal__textarea"
            />
          </div>

          <div className="ann-modal__grid">
            <div className="ann-modal__field">
              <label className="ann-modal__label">Target Audience</label>
              <select
                name="audience"
                value={formData.audience}
                onChange={handleInputChange}
                className="ann-modal__input ann-modal__input--sm"
              >
                {audienceList.map((aud, idx) => (
                  <option key={idx} value={aud}>{aud} Only</option>
                ))}
              </select>
            </div>

            <div className="ann-modal__field ann-modal__field--pin">
              <input
                type="checkbox"
                id="pinned"
                name="pinned"
                checked={formData.pinned}
                onChange={handleInputChange}
                className="ann-modal__checkbox"
              />
              <label htmlFor="pinned" className="ann-modal__pin-label">Pin to noticeboard</label>
            </div>
          </div>

          <div className="ann-modal__actions">
            <button type="button" className="ann-modal__btn-secondary" onClick={handleCloseModal}>
              Cancel
            </button>
            <button type="submit" className="ann-modal__btn-primary">
              {selectedAnnouncement ? "Save Changes" : "Publish Notice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}