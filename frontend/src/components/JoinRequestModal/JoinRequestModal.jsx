import { useState } from 'react';
import { X, User, Mail, Phone, BookOpen, FileText, Loader2, CheckCircle } from 'lucide-react';
import './JoinRequestModal.css';

export default function JoinRequestModal({
  isOpen,
  onClose,
  onSubmit,
  type = 'club', // 'club' or 'event'
  title = '',
  loading = false
}) {
  const [formData, setFormData] = useState({
    fullName: '',
    studentCode: '',
    email: '',
    phone: '',
    motivation: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Họ và tên là bắt buộc';
    }
    if (!formData.studentCode.trim()) {
      newErrors.studentCode = 'Mã số sinh viên là bắt buộc';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await onSubmit(formData);
      setSubmitted(true);
    } catch (err) {
      console.error('Submit failed:', err);
    }
  };

  const handleClose = () => {
    setFormData({
      fullName: '',
      studentCode: '',
      email: '',
      phone: '',
      motivation: '',
      notes: ''
    });
    setErrors({});
    setSubmitted(false);
    onClose();
  };

  if (submitted) {
    return (
      <div className="join-modal__overlay" onClick={handleClose}>
        <div className="join-modal join-modal--success" onClick={e => e.stopPropagation()}>
          <button className="join-modal__close" onClick={handleClose}>
            <X size={20} />
          </button>
          
          <div className="join-modal__success">
            <div className="join-modal__success-icon">
              <CheckCircle size={64} />
            </div>
            <h2 className="join-modal__success-title">Đã gửi yêu cầu!</h2>
            <p className="join-modal__success-text">
              {type === 'club' 
                ? 'Yêu cầu tham gia CLB của bạn đã được gửi đến Leader. Bạn sẽ nhận được thông báo khi được duyệt.'
                : 'Yêu cầu đăng ký sự kiện của bạn đã được gửi. Bạn sẽ nhận được thông báo khi được duyệt.'}
            </p>
            <button className="join-modal__btn join-modal__btn--primary" onClick={handleClose}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="join-modal__overlay" onClick={handleClose}>
      <div className="join-modal" onClick={e => e.stopPropagation()}>
        <button className="join-modal__close" onClick={handleClose}>
          <X size={20} />
        </button>

        <div className="join-modal__header">
          <h2 className="join-modal__title">
            {type === 'club' ? 'Đăng ký tham gia CLB' : 'Đăng ký tham gia sự kiện'}
          </h2>
          <p className="join-modal__subtitle">
            {type === 'club' 
              ? `Yêu cầu của bạn sẽ được gửi đến Leader của "${title}" để duyệt`
              : `Yêu cầu của bạn sẽ được gửi đến người quản lý sự kiện "${title}" để duyệt`}
          </p>
        </div>

        <form className="join-modal__form" onSubmit={handleSubmit}>
          <div className="join-modal__field">
            <label className="join-modal__label">
              <User size={14} />
              Họ và tên <span className="join-modal__required">*</span>
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className={`join-modal__input ${errors.fullName ? 'join-modal__input--error' : ''}`}
              placeholder="Nguyễn Văn A"
            />
            {errors.fullName && <span className="join-modal__error">{errors.fullName}</span>}
          </div>

          <div className="join-modal__field">
            <label className="join-modal__label">
              <BookOpen size={14} />
              Mã số sinh viên <span className="join-modal__required">*</span>
            </label>
            <input
              type="text"
              name="studentCode"
              value={formData.studentCode}
              onChange={handleChange}
              className={`join-modal__input ${errors.studentCode ? 'join-modal__input--error' : ''}`}
              placeholder="SE123456"
            />
            {errors.studentCode && <span className="join-modal__error">{errors.studentCode}</span>}
          </div>

          <div className="join-modal__field">
            <label className="join-modal__label">
              <Mail size={14} />
              Email FPT <span className="join-modal__required">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`join-modal__input ${errors.email ? 'join-modal__input--error' : ''}`}
              placeholder="email@fpt.edu.vn"
            />
            {errors.email && <span className="join-modal__error">{errors.email}</span>}
          </div>

          <div className="join-modal__field">
            <label className="join-modal__label">
              <Phone size={14} />
              Số điện thoại
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="join-modal__input"
              placeholder="0912 345 678"
            />
          </div>

          <div className="join-modal__field">
            <label className="join-modal__label">
              <FileText size={14} />
              {type === 'club' ? 'Lý do tham gia' : 'Ghi chú'}
            </label>
            <textarea
              name={type === 'club' ? 'motivation' : 'notes'}
              value={type === 'club' ? formData.motivation : formData.notes}
              onChange={handleChange}
              className="join-modal__textarea"
              placeholder={type === 'club' 
                ? 'Chia sẻ lý do bạn muốn tham gia CLB này...'
                : 'Thông tin thêm về bạn (tùy chọn)...'}
              rows={3}
            />
          </div>

          <div className="join-modal__actions">
            <button type="button" className="join-modal__btn join-modal__btn--secondary" onClick={handleClose}>
              Hủy
            </button>
            <button type="submit" className="join-modal__btn join-modal__btn--primary" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className="join-modal__spinner" />
                  Đang gửi...
                </>
              ) : (
                'Gửi yêu cầu'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
