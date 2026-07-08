import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User, Mail, IdCard, Phone, GraduationCap, BookOpen,
  Camera, Loader2, Save, ArrowLeft, CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth.jsx';
import { updateProfile, updateAvatar, deleteAvatar } from '@/services/authService';
import './ProfilePage.css';

const FPTU_FACULTIES = [
  'School of Business',
  'School of Computer Science',
  'School of Design',
  'School of Engineering',
  'School of Languages',
  'School of Economics',
  'School of Law',
  'School of Animation & Game',
  'School of Tourism & Hospitality',
  'School of Banking & Finance',
  'International School',
];

const mapAuthError = (msg) => {
  const m = msg.toLowerCase();
  if (m.includes('duplicate') || m.includes('unique'))
    return 'Mã sinh viên này đã được sử dụng bởi tài khoản khác.';
  if (m.includes('network') || m.includes('fetch'))
    return 'Không thể kết nối tới server. Kiểm tra mạng rồi thử lại.';
  return msg;
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { profile, user, refreshProfile } = useAuth();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    fullName: profile?.full_name ?? '',
    studentCode: profile?.student_code ?? '',
    faculty: profile?.faculty ?? '',
    major: profile?.major ?? '',
    phone: profile?.phone ?? '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const onChange = (key) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    if (fieldErrors[key]) setFieldErrors((p) => ({ ...p, [key]: undefined }));
    setSuccessMsg('');
  };

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Vui lòng nhập họ và tên.';
    if (!form.studentCode.trim()) errs.studentCode = 'Vui lòng nhập mã sinh viên.';
    if (!form.faculty) errs.faculty = 'Vui lòng chọn khoa.';
    if (!form.major.trim()) errs.major = 'Vui lòng nhập ngành học.';
    if (form.phone && !/^[0-9+\-\s()]{8,15}$/.test(form.phone))
      errs.phone = 'Số điện thoại không hợp lệ.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSuccessMsg('');
    if (!validate()) return;
    setLoading(true);
    try {
      await updateProfile({
        fullName: form.fullName.trim(),
        studentCode: form.studentCode.trim(),
        faculty: form.faculty,
        major: form.major.trim(),
        phone: form.phone.trim(),
      });
      await refreshProfile();
      setSuccessMsg('Hồ sơ đã được cập nhật thành công!');
    } catch (err) {
      setSubmitError(mapAuthError(err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setSubmitError('Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSubmitError('Kích thước ảnh tối đa là 5MB.');
      return;
    }

    setUploadingAvatar(true);
    setSubmitError('');
    try {
      await updateAvatar({ file });
      await refreshProfile();
      setSuccessMsg('Ảnh đại diện đã được cập nhật!');
    } catch (err) {
      setSubmitError(mapAuthError(err.message));
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleDeleteAvatar = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa ảnh đại diện?')) return;
    setUploadingAvatar(true);
    setSubmitError('');
    try {
      await deleteAvatar();
      await refreshProfile();
      setSuccessMsg('Ảnh đại diện đã được xóa.');
    } catch (err) {
      setSubmitError(mapAuthError(err.message));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const displayName = profile?.full_name ?? user?.email?.split('@')[0] ?? 'User';
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="profile-page">
      <div className="profile-page__container">
        <button
          onClick={() => navigate(-1)}
          className="profile-page__back"
        >
          <ArrowLeft size={18} />
          Quay lại
        </button>

        <div className="profile-page__header">
          <h1 className="profile-page__title">My Profile</h1>
          <p className="profile-page__subtitle">
            Quản lý thông tin cá nhân và ảnh đại diện của bạn.
          </p>
        </div>

        <div className="profile-page__content">
          {/* Avatar Section */}
          <div className="profile-card">
            <h2 className="profile-card__title">Ảnh đại diện</h2>

            <div className="profile-avatar">
              <div className="profile-avatar__preview" onClick={handleAvatarClick}>
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={displayName}
                    className="profile-avatar__img"
                  />
                ) : (
                  <div className="profile-avatar__placeholder">
                    {initials}
                  </div>
                )}
                <div className="profile-avatar__overlay">
                  <Camera size={24} />
                  <span>Thay đổi</span>
                </div>
                {uploadingAvatar && (
                  <div className="profile-avatar__uploading">
                    <Loader2 size={20} className="spin" />
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />

              <div className="profile-avatar__info">
                <p className="profile-avatar__hint">
                  JPG, PNG, GIF hoặc WEBP. Kích thước tối đa 5MB.
                </p>
                {profile?.avatar_url && (
                  <button
                    type="button"
                    className="profile-avatar__delete"
                    onClick={handleDeleteAvatar}
                    disabled={uploadingAvatar}
                  >
                    Xóa ảnh đại diện
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <form className="profile-card" onSubmit={handleSubmit}>
            <h2 className="profile-card__title">Thông tin cá nhân</h2>

            {submitError && (
              <div className="auth__alert" role="alert">{submitError}</div>
            )}
            {successMsg && (
              <div className="auth__alert auth__alert--success" role="status">
                <CheckCircle2 size={16} />
                {successMsg}
              </div>
            )}

            <div className="profile-form">
              <div className="profile-form__row">
                <div className="profile-form__field">
                  <label htmlFor="profile-name" className="profile-form__label">
                    <User size={15} />
                    Họ và tên <span className="required">*</span>
                  </label>
                  <input
                    id="profile-name"
                    type="text"
                    className="profile-form__input"
                    value={form.fullName}
                    onChange={onChange('fullName')}
                    placeholder="Nguyễn Văn A"
                    aria-invalid={!!fieldErrors.fullName}
                  />
                  {fieldErrors.fullName && (
                    <span className="profile-form__error">{fieldErrors.fullName}</span>
                  )}
                </div>

                <div className="profile-form__field">
                  <label htmlFor="profile-code" className="profile-form__label">
                    <IdCard size={15} />
                    Mã sinh viên <span className="required">*</span>
                  </label>
                  <input
                    id="profile-code"
                    type="text"
                    className="profile-form__input"
                    value={form.studentCode}
                    onChange={onChange('studentCode')}
                    placeholder="HE170123"
                    aria-invalid={!!fieldErrors.studentCode}
                  />
                  {fieldErrors.studentCode && (
                    <span className="profile-form__error">{fieldErrors.studentCode}</span>
                  )}
                </div>
              </div>

              <div className="profile-form__row">
                <div className="profile-form__field">
                  <label htmlFor="profile-email" className="profile-form__label">
                    <Mail size={15} />
                    Email
                  </label>
                  <input
                    id="profile-email"
                    type="email"
                    className="profile-form__input profile-form__input--readonly"
                    value={profile?.email ?? user?.email ?? ''}
                    readOnly
                    disabled
                  />
                  <span className="profile-form__hint">Email không thể thay đổi.</span>
                </div>

                <div className="profile-form__field">
                  <label htmlFor="profile-phone" className="profile-form__label">
                    <Phone size={15} />
                    Số điện thoại
                  </label>
                  <input
                    id="profile-phone"
                    type="tel"
                    className="profile-form__input"
                    value={form.phone}
                    onChange={onChange('phone')}
                    placeholder="0912 345 678"
                    aria-invalid={!!fieldErrors.phone}
                  />
                  {fieldErrors.phone && (
                    <span className="profile-form__error">{fieldErrors.phone}</span>
                  )}
                </div>
              </div>

              <div className="profile-form__row">
                <div className="profile-form__field">
                  <label htmlFor="profile-faculty" className="profile-form__label">
                    <GraduationCap size={15} />
                    Khoa <span className="required">*</span>
                  </label>
                  <select
                    id="profile-faculty"
                    className="profile-form__input profile-form__select"
                    value={form.faculty}
                    onChange={onChange('faculty')}
                    aria-invalid={!!fieldErrors.faculty}
                  >
                    <option value="">Chọn khoa...</option>
                    {FPTU_FACULTIES.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                  {fieldErrors.faculty && (
                    <span className="profile-form__error">{fieldErrors.faculty}</span>
                  )}
                </div>

                <div className="profile-form__field">
                  <label htmlFor="profile-major" className="profile-form__label">
                    <BookOpen size={15} />
                    Ngành học <span className="required">*</span>
                  </label>
                  <input
                    id="profile-major"
                    type="text"
                    className="profile-form__input"
                    value={form.major}
                    onChange={onChange('major')}
                    placeholder="Software Engineering"
                    aria-invalid={!!fieldErrors.major}
                  />
                  {fieldErrors.major && (
                    <span className="profile-form__error">{fieldErrors.major}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="profile-form__actions">
              <button
                type="submit"
                className="profile-form__submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    Đang lưu…
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Lưu thay đổi
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        .profile-page {
          min-height: 100vh;
          padding-top: 80px;
          background: #F8FAF8;
        }
        .profile-page__container {
          max-width: 900px;
          margin: 0 auto;
          padding: 32px 24px 64px;
        }
        .profile-page__back {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          margin-bottom: 24px;
          font-size: 14px;
          font-weight: 500;
          color: #16685D;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .profile-page__back:hover {
          background: #F4F1EA;
          border-color: #16685D;
        }
        .profile-page__header {
          margin-bottom: 32px;
        }
        .profile-page__title {
          font-size: 28px;
          font-weight: 700;
          color: #06231D;
          margin: 0 0 8px;
        }
        .profile-page__subtitle {
          font-size: 15px;
          color: #666;
          margin: 0;
        }
        .profile-page__content {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .profile-card {
          background: white;
          border-radius: 16px;
          padding: 28px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          border: 1px solid #f0f0f0;
        }
        .profile-card__title {
          font-size: 18px;
          font-weight: 600;
          color: #06231D;
          margin: 0 0 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f0f0f0;
        }
        .profile-avatar {
          display: flex;
          align-items: center;
          gap: 28px;
        }
        .profile-avatar__preview {
          position: relative;
          width: 120px;
          height: 120px;
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          flex-shrink: 0;
        }
        .profile-avatar__img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .profile-avatar__placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0E4B43, #22C55E);
          color: white;
          font-size: 32px;
          font-weight: 700;
        }
        .profile-avatar__overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          color: white;
          font-size: 13px;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .profile-avatar__preview:hover .profile-avatar__overlay {
          opacity: 1;
        }
        .profile-avatar__uploading {
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0.85);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .profile-avatar__info {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .profile-avatar__hint {
          font-size: 13px;
          color: #888;
          margin: 0;
        }
        .profile-avatar__delete {
          font-size: 13px;
          color: #B91C1C;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          text-decoration: underline;
        }
        .profile-avatar__delete:hover {
          color: #991B1B;
        }
        .profile-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .profile-form__row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        @media (max-width: 640px) {
          .profile-form__row {
            grid-template-columns: 1fr;
          }
        }
        .profile-form__field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .profile-form__label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }
        .profile-form__label svg {
          color: #16685D;
        }
        .profile-form__input {
          width: 100%;
          padding: 12px 16px;
          font-size: 15px;
          color: #1F2937;
          background: #FAFAFA;
          border: 1.5px solid #E5E7EB;
          border-radius: 10px;
          transition: all 0.2s;
          box-sizing: border-box;
        }
        .profile-form__input:focus {
          outline: none;
          border-color: #16685D;
          background: white;
          box-shadow: 0 0 0 3px rgba(22,104,93,0.1);
        }
        .profile-form__input--readonly {
          background: #F3F4F6;
          color: #6B7280;
          cursor: not-allowed;
        }
        .profile-form__select {
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
          background-position: right 12px center;
          background-repeat: no-repeat;
          background-size: 16px;
          padding-right: 40px;
        }
        .profile-form__hint {
          font-size: 12px;
          color: #9CA3AF;
        }
        .profile-form__error {
          font-size: 13px;
          color: #B91C1C;
        }
        .profile-form__actions {
          display: flex;
          justify-content: flex-end;
          padding-top: 16px;
          border-top: 1px solid #f0f0f0;
          margin-top: 8px;
        }
        .profile-form__submit {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 28px;
          font-size: 15px;
          font-weight: 600;
          color: white;
          background: linear-gradient(135deg, #0E4B43, #16685D);
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .profile-form__submit:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(6,35,29,0.25);
        }
        .profile-form__submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .required {
          color: #B91C1C;
        }
        .auth__alert {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          margin-bottom: 16px;
          border-radius: 10px;
          font-size: 14px;
          background: #FEF2F2;
          color: #B91C1C;
          border: 1px solid #FECACA;
        }
        .auth__alert--success {
          background: #F0FDF4;
          color: #16685D;
          border-color: #BBF7D0;
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
