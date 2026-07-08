import { X } from 'lucide-react';
import './EventFormModal.css';

/* CRUD modal for events and workshops. Owns the form chrome and the
   right-side pill toggle between Event / Workshop types. The parent
   (EventsPage) controls `isOpen`, `formData` and the submit handler. */

export default function EventFormModal({
  isOpen,
  selectedActivity,
  formData,
  setFormData,
  documentsList,
  minutesList,
  handleCloseModal,
  handleInputChange,
  handleSubmit
}) {
  if (!isOpen) return null;

  return (
    <div className="event-modal">
      <div className="event-modal__backdrop" onClick={handleCloseModal} />

      <div className="event-modal__panel">
        <button type="button" className="event-modal__close" onClick={handleCloseModal} aria-label="Close modal">
          <X size={18} />
        </button>
        <h3 className="event-modal__title">
          {selectedActivity ? `✏️ Edit ${formData.type}` : "➕ Create Event / Workshop"}
        </h3>

        <form onSubmit={handleSubmit} className="event-modal__form">
          <div className="event-modal__field">
            <label className="event-modal__label">Type</label>
            <div className="event-modal__type-toggle">
              {["Event", "Workshop"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, type: t }))}
                  className={`event-modal__type-btn ${formData.type === t ? "event-modal__type-btn--active" : ""}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="event-modal__field">
            <label className="event-modal__label">Title / Name</label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g. Next-gen UI Workshop"
              className="event-modal__input"
            />
          </div>

          <div className="event-modal__grid-2">
            <div className="event-modal__field">
              <label className="event-modal__label">Speaker / Leader</label>
              <input
                type="text"
                name="speaker"
                required
                value={formData.speaker}
                onChange={handleInputChange}
                placeholder="Speaker's name"
                className="event-modal__input event-modal__input--sm"
              />
            </div>
            <div className="event-modal__field">
              <label className="event-modal__label">Location</label>
              <input
                type="text"
                name="location"
                required
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g. Room 204 or online"
                className="event-modal__input event-modal__input--sm"
              />
            </div>
          </div>

          <div className="event-modal__field">
            <label className="event-modal__label">Detailed Description</label>
            <div className="event-modal__editor">
              <div className="event-modal__editor-toolbar">
                <span className="event-modal__editor-tool"><b>B</b></span>
                <span className="event-modal__editor-tool"><i>I</i></span>
                <span className="event-modal__editor-tool"><u>U</u></span>
                <span className="event-modal__editor-sep">|</span>
                <span className="event-modal__editor-tool">📝 Quote</span>
                <span className="event-modal__editor-tool">🔗 Link</span>
              </div>
              <textarea
                name="description"
                required
                rows="3"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Explain the workshop agenda, prerequisites, etc."
                className="event-modal__textarea"
              />
            </div>
          </div>

          <div className="event-modal__grid-2">
            <div className="event-modal__field">
              <label className="event-modal__label">Start Date & Time</label>
              <input
                type="datetime-local"
                name="startTime"
                required
                value={formData.startTime}
                onChange={handleInputChange}
                className="event-modal__input event-modal__input--sm"
              />
            </div>
            <div className="event-modal__field">
              <label className="event-modal__label">End Date & Time</label>
              <input
                type="datetime-local"
                name="endTime"
                required
                value={formData.endTime}
                onChange={handleInputChange}
                className="event-modal__input event-modal__input--sm"
              />
            </div>
          </div>

          <div className="event-modal__grid-3">
            <div className="event-modal__field">
              <label className="event-modal__label">Max Slots</label>
              <input
                type="number"
                name="maxSlots"
                min="1"
                required
                value={formData.maxSlots}
                onChange={handleInputChange}
                className="event-modal__input event-modal__input--sm"
              />
            </div>
            <div className="event-modal__field">
              <label className="event-modal__label">Slots Left</label>
              <input
                type="number"
                name="remainingSlots"
                min="0"
                max={formData.maxSlots}
                required
                value={formData.remainingSlots}
                onChange={handleInputChange}
                className="event-modal__input event-modal__input--sm"
              />
            </div>
            <div className="event-modal__field">
              <label className="event-modal__label">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="event-modal__input event-modal__input--sm"
              >
                <option value="Upcoming">Upcoming</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Finished">Finished</option>
              </select>
            </div>
          </div>

          <div className="event-modal__grid-2">
            <div className="event-modal__field">
              <label className="event-modal__label">Linked Document</label>
              <select
                name="document"
                value={formData.document}
                onChange={handleInputChange}
                className="event-modal__input event-modal__input--sm"
              >
                {documentsList.map((doc, idx) => (
                  <option key={idx} value={doc}>{doc}</option>
                ))}
              </select>
            </div>
            <div className="event-modal__field">
              <label className="event-modal__label">Related Minutes</label>
              <select
                name="minutes"
                value={formData.minutes}
                onChange={handleInputChange}
                className="event-modal__input event-modal__input--sm"
              >
                {minutesList.map((min, idx) => (
                  <option key={idx} value={min}>{min}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="event-modal__actions">
            <button type="button" className="event-modal__btn-secondary" onClick={handleCloseModal}>
              Cancel
            </button>
            <button type="submit" className="event-modal__btn-primary">
              {selectedActivity ? "Save Changes" : "Create Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}