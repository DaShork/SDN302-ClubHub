import { X } from 'lucide-react';
import './MemberDetailModal.css';

export default function MemberDetailModal({ isOpen, selectedMember, handleCloseModal }) {
  if (!isOpen || !selectedMember) return null;

  return (
    <div className="mdetail">
      <div className="mdetail__backdrop" onClick={handleCloseModal} />

      <div className="mdetail__panel">
        <button type="button" className="mdetail__close" onClick={handleCloseModal}>
          <X size={18} />
        </button>
        <h3 className="mdetail__title">👤 Member Profile Card</h3>

        <div className="mdetail__head">
          <img src={selectedMember.avatar} className="mdetail__avatar" alt="" />
          <h4 className="mdetail__name">{selectedMember.name}</h4>
          <p className="mdetail__code">{selectedMember.code} • {selectedMember.term}</p>
          <span className={`mdetail__role mdetail__role--${(selectedMember.role || '').toLowerCase()}`}>
            {selectedMember.role}
          </span>
        </div>

        <div className="mdetail__list">
          <div className="mdetail__row">
            <span className="mdetail__label">Email:</span>
            <span className="mdetail__value">{selectedMember.email}</span>
          </div>
          <div className="mdetail__row">
            <span className="mdetail__label">Phone Number:</span>
            <span className="mdetail__value">{selectedMember.phone}</span>
          </div>
          <div className="mdetail__row">
            <span className="mdetail__label">Joined At:</span>
            <span className="mdetail__value">{selectedMember.joinedAt}</span>
          </div>
          <div className="mdetail__row">
            <span className="mdetail__label">Current Status:</span>
            <span className="mdetail__value mdetail__value--strong">{selectedMember.status}</span>
          </div>
        </div>

        <div className="mdetail__actions">
          <button type="button" className="mdetail__btn-secondary" onClick={handleCloseModal}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}