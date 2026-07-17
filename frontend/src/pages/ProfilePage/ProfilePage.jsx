import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User, Mail, IdCard, Phone, GraduationCap, BookOpen,
  Camera, Loader2, Save, ArrowLeft, CheckCircle2, LogOut,
  Shield, Users, Clock, ChevronRight, AlertCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth.jsx';
import { updateProfile, updateAvatar, deleteAvatar, getMyMemberships } from '@/services/authService';
import './ProfilePage.css';

/* ---- FPTU reference data ---- */
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

/* ---- Role display metadata ---- */
const ROLE_META = {
  Administrator: { label: 'Administrator', color: '#EF4444', bg: '#FEF2F2', icon: Shield },
  Manager:      { label: 'Manager',       color: '#7C3AED', bg: '#F5F3FF', icon: Users },
  'Club Leader': { label: 'Club Leader',  color: '#D97706', bg: '#FFFBEB', icon: Users },
  'Club Member': { label: 'Club Member',  color: '#22C55E', bg: '#F0FDF4', icon: Users },
  Mentor:       { label: 'Mentor',        color: '#3B82F6', bg: '#EFF6FF', icon: Users },
  Student:      { label: 'Student',       color: '#16685D', bg: '#E8F5F0', icon: User },
};

/* ---- Helpers ---- */
const mapAuthError = (msg) => {
  const m = (msg || '').toLowerCase();
  if (m.includes('duplicate') || m.includes('unique'))
    return 'Mã sinh viên này đã được sử dụng bởi tài khoản khác.';
  if (m.includes('network') || m.includes('fetch') || m.includes('failed to fetch'))
    return 'Không thể kết nối tới server. Kiểm tra mạng rồi thử lại.';
  if (m.includes('row-level security') || m.includes('violates row-level'))
    return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  return msg || 'Đã xảy ra lỗi không xác định.';
};

function Alert({ message, variant = 'error', onDismiss }) {
  if (!message) return null;
  const isError = variant === 'error';
  return (
    <div className={`profile-alert profile-alert--${variant}`} role="alert">
      {isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
      <span>{message}</span>
      {onDismiss && (
        <button className="profile-alert__dismiss" onClick={onDismiss} aria-label="Dismiss">
          ×
        </button>
      )}
    </div>
  );
}

function RoleBadge({ role }) {
  const raw = role || 'Student';
  // Try exact match first, then fallback to Student
  const meta = ROLE_META[raw] || ROLE_META.Student;
  const Icon = meta.icon;
  return (
    <span
      className="role-badge"
      style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.color}30` }}
    >
      <Icon size={12} />
      {meta.label}
    </span>
  );
}

function SectionCard({ title, icon: Icon, children, className = '' }) {
  return (
    <section className={`profile-section ${className}`}>
      {title && (
        <header className="profile-section__head">
          {Icon && <Icon size={18} className="profile-section__icon" />}
          <h2 className="profile-section__title">{title}</h2>
        </header>
      )}
      <div className="profile-section__body">{children}</div>
    </section>
  );
}

/* ---- Main component ---- */
export default function ProfilePage() {
  const navigate = useNavigate();
  const { profile, user, signOut, refreshProfile } = useAuth();
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
  const [avatarError, setAvatarError] = useState(false);
  const [memberships, setMemberships] = useState([]);
  const [membershipsLoading, setMembershipsLoading] = useState(true);

  /* Sync form when profile loads */
  useEffect(() => {
    if (profile) {
      setForm({
        fullName: profile.full_name ?? '',
        studentCode: profile.student_code ?? '',
        faculty: profile.faculty ?? '',
        major: profile.major ?? '',
        phone: profile.phone ?? '',
      });
    }
  }, [profile]);

  /* Load memberships */
  useEffect(() => {
    if (!profile?.id) return;
    let cancelled = false;
    (async () => {
      const data = await getMyMemberships(profile.id);
      if (!cancelled) setMemberships(data || []);
      setMembershipsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [profile?.id]);

  /* ---- Form handlers ---- */
  const onChange = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
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
      setAvatarError(false);
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

  /* ---- Derived ---- */
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  const joinedAt = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' }) : null;

  return (
    <div className="profile-page">
      <div className="profile-page__container">
        <button className="profile-page__back" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Quay lại
        </button>

        {/* ---- Hero: avatar + name + role ---- */}
        <div className="profile-hero">
          <div className="profile-hero__avatar-wrap">
            <div
              className="profile-hero__avatar"
              onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
            >
              {profile?.avatar_url && !avatarError ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="profile-hero__avatar-img"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className="profile-hero__avatar-initials">{initials}</div>
              )}
              <div className="profile-hero__avatar-overlay">
                {uploadingAvatar ? (
                  <Loader2 size={22} className="spin" />
                ) : (
                  <>
                    <Camera size={22} />
                    <span>Đổi ảnh</span>
                  </>
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
          </div>

          <div className="profile-hero__info">
            <div className="profile-hero__name-row">
              <h1 className="profile-hero__name">{displayName}</h1>
              <RoleBadge role={profile?.role_name} />
            </div>
            <div className="profile-hero__meta">
              {profile?.student_code && (
                <span className="profile-hero__meta-item">
                  <IdCard size={13} />
                  {profile.student_code}
                </span>
              )}
              {profile?.email && (
                <span className="profile-hero__meta-item">
                  <Mail size={13} />
                  {profile.email}
                </span>
              )}
              {joinedAt && (
                <span className="profile-hero__meta-item">
                  <Clock size={13} />
                  Tham gia {joinedAt}
                </span>
              )}
            </div>
          </div>

          <div className="profile-hero__actions">
            <button
              className="profile-btn profile-btn--danger-outline"
              onClick={async () => {
                await signOut();
                navigate('/');
              }}
            >
              <LogOut size={15} /> Đăng xuất
            </button>
          </div>
        </div>

        {/* ---- Alerts ---- */}
        <Alert message={submitError} variant="error" onDismiss={() => setSubmitError('')} />
        <Alert message={successMsg} variant="success" onDismiss={() => setSuccessMsg('')} />

        {/* ---- My Clubs ---- */}
        <SectionCard title="Câu lạc bộ của tôi" icon={Users}>
          {membershipsLoading ? (
            <div className="profile-skeleton-row">
              {[1, 2].map((i) => <div key={i} className="profile-skeleton-line" />)}
            </div>
          ) : memberships.length === 0 ? (
            <div className="profile-empty">
              <Users size={28} className="profile-empty__icon" />
              <p className="profile-empty__title">Chưa tham gia câu lạc bộ nào</p>
              <p className="profile-empty__desc">Khám phá và tham gia các câu lạc bộ tại FPTU.</p>
              <Link to="/clubs" className="profile-btn profile-btn--primary">
                Khám phá câu lạc bộ <ChevronRight size={15} />
              </Link>
            </div>
          ) : (
            <div className="club-membership-list">
              {memberships.map((m) => (
                <Link
                  key={m.id}
                  to={`/clubs/${m.clubs?.slug || m.clubs?.id}`}
                  className="club-membership-card"
                >
                  <div className="club-membership-card__left">
                    {m.clubs?.logo_url ? (
                      <img
                        src={m.clubs.logo_url}
                        alt={m.clubs.name}
                        className="club-membership-card__logo"
                      />
                    ) : (
                      <div className="club-membership-card__logo-initials">
                        {m.clubs?.name?.charAt(0) || '?'}
                      </div>
                    )}
                    <div>
                      <p className="club-membership-card__name">{m.clubs?.name || '—'}</p>
                      <p className="club-membership-card__position">{m.position || 'Member'}</p>
                    </div>
                  </div>
                  <span
                    className="club-membership-card__status"
                    style={{
                      color: m.status === 'active' ? '#22C55E' : '#9CA3AF',
                      background: m.status === 'active' ? '#F0FDF4' : '#F4F1EA',
                    }}
                  >
                    {m.status === 'active' ? 'Đang hoạt động' : m.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>

        {/* ---- Account Info (read-only) ---- */}
        <SectionCard title="Thông tin tài khoản" icon={Shield}>
          <div className="account-info-grid">
            <div className="account-info-item">
              <span className="account-info-item__label">
                <Mail size={13} /> Email
              </span>
              <span className="account-info-item__value">{profile?.email || user?.email || '—'}</span>
              <span className="account-info-item__note">Email không thể thay đổi</span>
            </div>
            <div className="account-info-item">
              <span className="account-info-item__label">
                <Shield size={13} /> Vai trò
              </span>
              <span className="account-info-item__value">
                <RoleBadge role={profile?.role_name} />
              </span>
              <span className="account-info-item__note">Vai trò được cấp bởi quản trị viên</span>
            </div>
            <div className="account-info-item">
              <span className="account-info-item__label">
                <IdCard size={13} /> Mã sinh viên
              </span>
              <span className="account-info-item__value">{profile?.student_code || '—'}</span>
              <span className="account-info-item__note">Dùng để xác minh sinh viên FPTU</span>
            </div>
            {joinedAt && (
              <div className="account-info-item">
                <span className="account-info-item__label">
                  <Clock size={13} /> Ngày tham gia
                </span>
                <span className="account-info-item__value">{joinedAt}</span>
                <span className="account-info-item__note">Ngày tạo tài khoản</span>
              </div>
            )}
          </div>
        </SectionCard>

        {/* ---- Personal Info Form ---- */}
        <SectionCard title="Thông tin cá nhân" icon={User}>
          <form className="profile-form" onSubmit={handleSubmit} noValidate>
            <div className="profile-form__row">
              <div className="profile-form__field">
                <label htmlFor="profile-name" className="profile-form__label">
                  <User size={14} />
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
                {fieldErrors.fullName && <span className="profile-form__error">{fieldErrors.fullName}</span>}
              </div>

              <div className="profile-form__field">
                <label htmlFor="profile-code" className="profile-form__label">
                  <IdCard size={14} />
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
                {fieldErrors.studentCode && <span className="profile-form__error">{fieldErrors.studentCode}</span>}
              </div>
            </div>

            <div className="profile-form__row">
              <div className="profile-form__field">
                <label htmlFor="profile-faculty" className="profile-form__label">
                  <GraduationCap size={14} />
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
                {fieldErrors.faculty && <span className="profile-form__error">{fieldErrors.faculty}</span>}
              </div>

              <div className="profile-form__field">
                <label htmlFor="profile-major" className="profile-form__label">
                  <BookOpen size={14} />
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
                {fieldErrors.major && <span className="profile-form__error">{fieldErrors.major}</span>}
              </div>
            </div>

            <div className="profile-form__single">
              <div className="profile-form__field">
                <label htmlFor="profile-phone" className="profile-form__label">
                  <Phone size={14} />
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
                {fieldErrors.phone && <span className="profile-form__error">{fieldErrors.phone}</span>}
              </div>
            </div>

            <div className="profile-form__actions">
              <button
                type="submit"
                className="profile-btn profile-btn--primary"
                disabled={loading}
              >
                {loading ? <><Loader2 size={15} className="spin" /> Đang lưu…</> : <><Save size={15} /> Lưu thay đổi</>}
              </button>
            </div>
          </form>
        </SectionCard>

        {/* ---- Danger Zone ---- */}
        <SectionCard title="Quản lý ảnh đại diện" icon={Camera}>
          <div className="avatar-manager">
            <div className="avatar-manager__preview">
              <div
                className="avatar-manager__img-wrap"
                onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
              >
                {profile?.avatar_url && !avatarError ? (
                  <img
                    src={profile.avatar_url}
                    alt={displayName}
                    className="avatar-manager__img"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div className="avatar-manager__img-initials">{initials}</div>
                )}
                <div className="avatar-manager__img-overlay">
                  <Camera size={20} />
                </div>
              </div>
              <div className="avatar-manager__info">
                <p className="avatar-manager__hint">
                  JPG, PNG, GIF hoặc WEBP. Tối đa 5MB.
                </p>
                <div className="avatar-manager__btns">
                  <button
                    className="profile-btn profile-btn--primary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? <><Loader2 size={14} className="spin" /> Đang tải lên…</> : <><Camera size={14} /> Tải ảnh mới</>}
                  </button>
                  {profile?.avatar_url && (
                    <button
                      className="profile-btn profile-btn--danger-outline"
                      onClick={handleDeleteAvatar}
                      disabled={uploadingAvatar}
                    >
                      Xóa ảnh
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
