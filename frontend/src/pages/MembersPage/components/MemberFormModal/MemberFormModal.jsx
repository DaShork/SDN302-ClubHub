import { X } from 'lucide-react';
import './MemberFormModal.css';

export default function MemberFormModal({
  isOpen,
  selectedMember,
  formData,
  handleCloseModal,
  handleInputChange,
  handleSubmit
}) {
  if (!isOpen) return null;

  return (
    <div className="mform">
      <div className="mform__backdrop" onClick={handleCloseModal} />

      <div className="mform__panel">
        <button type="button" className="mform__close" onClick={handleCloseModal}>
          <X size={18} />
        </button>
        <h3 className="mform__title">
          {selectedMember ? "✏️ Edit Member Info" : "➕ Add New Member"}
        </h3>

        <form onSubmit={handleSubmit} className="mform__form">
          <div className="mform__field">
            <label className="mform__label">Full Name</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g. Nguyễn Văn A"
              className="mform__input"
            />
          </div>

          <div className="mform__grid-2">
            <div className="mform__field">
              <label className="mform__label">Email (FPT)</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                placeholder="name_se123@fpt.edu.vn"
                className="mform__input mform__input--sm"
              />
            </div>
            <div className="mform__field">
              <label className="mform__label">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="0987654321"
                className="mform__input mform__input--sm"
              />
            </div>
          </div>

          <div className="mform__field">
            <label className="mform__label">Student Code</label>
            <input
              type="text"
              name="studentCode"
              value={formData.studentCode}
              onChange={handleInputChange}
              placeholder="e.g. SE160123"
              className="mform__input mform__input--sm"
            />
          </div>

          <div className="mform__grid-2">
            <div className="mform__field">
              <label className="mform__label">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="mform__input mform__input--sm"
              >
                <option value="Leader">Leader</option>
                <option value="Member">Member</option>
                <option value="Mentor">Mentor</option>
              </select>
            </div>

            <div className="mform__field">
              <label className="mform__label">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="mform__input mform__input--sm"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="mform__field">
            <label className="mform__label">Membership Plan (Term)</label>
            <select
              name="term"
              value={formData.term}
              onChange={handleInputChange}
              className="mform__input mform__input--sm"
            >
              <option value="Term 11 (2026)">Term 11 (2026) - Current</option>
              <option value="Term 10 (Alumni)">Term 10 (Alumni)</option>
              <option value="Term 9 (Alumni)">Term 9 (Alumni)</option>
            </select>
          </div>

          <div className="mform__actions">
            <button type="button" className="mform__btn-secondary" onClick={handleCloseModal}>
              Cancel
            </button>
            <button type="submit" className="mform__btn-primary">
              {selectedMember ? "Save Changes" : "Create Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}