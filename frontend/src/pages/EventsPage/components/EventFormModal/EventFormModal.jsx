import { X } from 'lucide-react';
import './EventFormModal.css';

/* CRUD modal for events and workshops. Owns the form chrome and the
   right-side pill toggle between Event / Workshop types. The parent
   (EventsPage) controls `isOpen`, `formData` and the submit handler. */

export default function EventFormModal({
  open,
  selectedActivity,
  formData,
  setFormData,
  documentsList,
  minutesList,
  onChange,
  onSubmit,
  onClose,
  isSubmitting,
}) {
  if (!open) return null;

  return (
    <div className="event-modal">
      <div className="event-modal__backdrop" onClick={onClose} />

      <div className="event-modal__panel">
        <button type="button" className="event-modal__close" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>
        <h3 className="event-modal__title">
          {selectedActivity ? `✏️ Edit ${formData.type}` : "➕ Create Event / Workshop"}
        </h3>

        <form onSubmit={onSubmit} className="event-modal__form">
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
              onChange={onChange}
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
                onChange={onChange}
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
                onChange={onChange}
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
                onChange={onChange}
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
                onChange={onChange}
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
                onChange={onChange}
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
                onChange={onChange}
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
                onChange={onChange}
                className="event-modal__input event-modal__input--sm"
              />
            </div>
          <div className="event-modal__field">
            <label className="event-modal__label">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={onChange}
              className="event-modal__input event-modal__input--sm"
            >
              <option value="Upcoming">Upcoming</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Finished">Finished</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="event-modal__field event-modal__field--toggle">
          <label className="event-modal__checkbox-row">
            <input
              type="checkbox"
              name="autoRegisterCreator"
              checked={!!formData.autoRegisterCreator}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  autoRegisterCreator: e.target.checked,
                }))
              }
            />
            <span>
              <strong>Tự động đăng ký tham gia cho người tạo</strong>
              <span className="event-modal__help">
                Tôi (leader) sẽ được đăng ký sự kiện này ngay khi tạo.
              </span>
            </span>
          </label>
        </div>

        <div className="event-modal__field event-modal__field--toggle">
          <label className="event-modal__checkbox-row">
            <input
              type="checkbox"
              name="requiresApproval"
              checked={!!formData.requiresApproval}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  requiresApproval: e.target.checked,
                }))
              }
            />
            <span>
              <strong>Yêu cầu Leader duyệt đăng ký</strong>
              <span className="event-modal__help">
                Nếu bật, sinh viên gửi yêu cầu sẽ ở trạng thái "chờ duyệt" cho tới khi được duyệt.
                Nếu tắt, đăng ký được xác nhận ngay.
              </span>
            </span>
          </label>
        </div>

          <div className="event-modal__grid-2">
            <div className="event-modal__field">
              <label className="event-modal__label">Linked Document</label>
              <select
                name="document"
                value={formData.document}
                onChange={onChange}
                className="event-modal__input event-modal__input--sm"
              >
                <option value="">-- None --</option>
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
                onChange={onChange}
                className="event-modal__input event-modal__input--sm"
              >
                <option value="">-- None --</option>
                {minutesList.map((min, idx) => (
                  <option key={idx} value={min}>{min}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="event-modal__actions">
            <button type="button" className="event-modal__btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="event-modal__btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : selectedActivity ? "Save Changes" : "Create Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}