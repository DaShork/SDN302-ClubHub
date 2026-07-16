import { X } from 'lucide-react';
import './WorkshopFormModal.css';

export default function WorkshopFormModal({
  open,
  selectedWorkshop,
  formData,
  onChange,
  onSubmit,
  onClose,
  documentsList,
  minutesList,
  isSubmitting,
}) {
  if (!open) return null;

  return (
    <div className="ws-modal">
      <div className="ws-modal__backdrop" onClick={onClose} />

      <div className="ws-modal__panel">
        <button type="button" className="ws-modal__close" onClick={onClose}>
          <X size={18} />
        </button>
        <h3 className="ws-modal__title">
          {selectedWorkshop ? "✏️ Edit Workshop Info" : "➕ Create Workshop"}
        </h3>

        <form onSubmit={onSubmit} className="ws-modal__form">
          <div className="ws-modal__field">
            <label className="ws-modal__label">Workshop Name</label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={onChange}
              placeholder="e.g. Intro to Git & Github"
              className="ws-modal__input"
            />
          </div>

          <div className="ws-modal__grid-2">
            <div className="ws-modal__field">
              <label className="ws-modal__label">Instructor / Leader</label>
              <input
                type="text"
                name="speaker"
                required
                value={formData.speaker}
                onChange={onChange}
                placeholder="Instructor's name"
                className="ws-modal__input ws-modal__input--sm"
              />
            </div>
            <div className="ws-modal__field">
              <label className="ws-modal__label">Location</label>
              <input
                type="text"
                name="location"
                required
                value={formData.location}
                onChange={onChange}
                placeholder="e.g. Lab 301 or online"
                className="ws-modal__input ws-modal__input--sm"
              />
            </div>
          </div>

          <div className="ws-modal__field">
            <label className="ws-modal__label">Detailed Description</label>
            <div className="ws-modal__editor">
              <div className="ws-modal__editor-toolbar">
                <span className="ws-modal__editor-tool"><b>B</b></span>
                <span className="ws-modal__editor-tool"><i>I</i></span>
                <span className="ws-modal__editor-tool"><u>U</u></span>
                <span className="ws-modal__editor-sep">|</span>
                <span className="ws-modal__editor-tool">📝 Quote</span>
                <span className="ws-modal__editor-tool">🔗 Link</span>
              </div>
              <textarea
                name="description"
                required
                rows="3"
                value={formData.description}
                onChange={onChange}
                placeholder="Explain the workshop agenda, prerequisites, etc."
                className="ws-modal__textarea"
              />
            </div>
          </div>

          <div className="ws-modal__grid-2">
            <div className="ws-modal__field">
              <label className="ws-modal__label">Start Date & Time</label>
              <input
                type="datetime-local"
                name="startTime"
                required
                value={formData.startTime}
                onChange={onChange}
                className="ws-modal__input ws-modal__input--sm"
              />
            </div>
            <div className="ws-modal__field">
              <label className="ws-modal__label">End Date & Time</label>
              <input
                type="datetime-local"
                name="endTime"
                required
                value={formData.endTime}
                onChange={onChange}
                className="ws-modal__input ws-modal__input--sm"
              />
            </div>
          </div>

          <div className="ws-modal__grid-3">
            <div className="ws-modal__field">
              <label className="ws-modal__label">Max Slots</label>
              <input
                type="number"
                name="maxSlots"
                min="1"
                required
                value={formData.maxSlots}
                onChange={onChange}
                className="ws-modal__input ws-modal__input--sm"
              />
            </div>
            <div className="ws-modal__field">
              <label className="ws-modal__label">Slots Left</label>
              <input
                type="number"
                name="remainingSlots"
                min="0"
                max={formData.maxSlots}
                required
                value={formData.remainingSlots}
                onChange={onChange}
                className="ws-modal__input ws-modal__input--sm"
              />
            </div>
            <div className="ws-modal__field">
              <label className="ws-modal__label">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={onChange}
                className="ws-modal__input ws-modal__input--sm"
              >
                <option value="Upcoming">Upcoming</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Finished">Finished</option>
              </select>
            </div>
          </div>

          <div className="ws-modal__grid-2">
            <div className="ws-modal__field">
              <label className="ws-modal__label">Linked Slide/Material</label>
              <select
                name="document"
                value={formData.document}
                onChange={onChange}
                className="ws-modal__input ws-modal__input--sm"
              >
                <option value="">-- None --</option>
                {(documentsList || []).map((doc, idx) => (
                  <option key={idx} value={doc}>{doc}</option>
                ))}
              </select>
            </div>
            <div className="ws-modal__field">
              <label className="ws-modal__label">Related Minutes</label>
                <select
                name="minutes"
                value={formData.minutes}
                onChange={onChange}
                className="ws-modal__input ws-modal__input--sm"
              >
                <option value="">-- None --</option>
                {(minutesList || []).map((min, idx) => (
                  <option key={idx} value={min}>{min}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="ws-modal__actions">
            <button type="button" className="ws-modal__btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="ws-modal__btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : selectedWorkshop ? "Save Changes" : "Create Workshop"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}