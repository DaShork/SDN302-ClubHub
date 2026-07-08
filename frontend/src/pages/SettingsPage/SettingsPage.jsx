import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Lock, Bell, Shield, Trash2, ArrowLeft,
  Loader2, CheckCircle2, AlertTriangle, Eye, EyeOff
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth.jsx';
import { updatePassword } from '@/services/authService';
import './SettingsPage.css';

const mapAuthError = (msg) => {
  const m = msg.toLowerCase();
  if (m.includes('same') || m.includes('duplicate'))
    return 'Mật khẩu mới không được trùng với mật khẩu hiện tại.';
  if (m.includes('weak') || m.includes('invalid'))
    return 'Mật khẩu mới không đủ mạnh. Vui lòng sử dụng ít nhất 6 ký tự.';
  if (m.includes('network') || m.includes('fetch'))
    return 'Không thể kết nối tới server. Kiểm tra mạng rồi thử lại.';
  return msg;
};

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState('security');

  /* ---- Password state ---- */
  const [pwdForm, setPwdForm] = useState({ current: '', newPwd: '', confirm: '' });
  const [pwdErrors, setPwdErrors] = useState({});
  const [pwdSubmitError, setPwdSubmitError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false });

  /* ---- Notifications state ---- */
  const [notifications, setNotifications] = useState({
    emailEvents: true,
    emailClubs: true,
    emailAnnouncements: false,
    pushEvents: true,
    pushClubs: false,
    pushAnnouncements: false,
  });

  /* ---- Danger zone state ---- */
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* ---- Password handlers ---- */
  const onPwdChange = (key) => (e) => {
    setPwdForm((f) => ({ ...f, [key]: e.target.value }));
    if (pwdErrors[key]) setPwdErrors((p) => ({ ...p, [key]: undefined }));
    setPwdSuccess('');
  };

  const validatePwd = () => {
    const errs = {};
    if (!pwdForm.current) errs.current = 'Vui lòng nhập mật khẩu hiện tại.';
    if (!pwdForm.newPwd) errs.newPwd = 'Vui lòng nhập mật khẩu mới.';
    else if (pwdForm.newPwd.length < 6)
      errs.newPwd = 'Mật khẩu mới phải có ít nhất 6 ký tự.';
    if (pwdForm.confirm !== pwdForm.newPwd)
      errs.confirm = 'Mật khẩu xác nhận không khớp.';
    setPwdErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePwdSubmit = async (e) => {
    e.preventDefault();
    setPwdSubmitError('');
    setPwdSuccess('');
    if (!validatePwd()) return;
    setPwdLoading(true);
    try {
      await updatePassword({ newPassword: pwdForm.newPwd });
      setPwdSuccess('Mật khẩu đã được thay đổi thành công!');
      setPwdForm({ current: '', newPwd: '', confirm: '' });
    } catch (err) {
      setPwdSubmitError(mapAuthError(err.message));
    } finally {
      setPwdLoading(false);
    }
  };

  /* ---- Delete account handler ---- */
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== user?.email) return;
    setDeleteLoading(true);
    try {
      await signOut();
      navigate('/');
    } catch {
      setDeleteLoading(false);
    }
  };

  const tabs = [
    { id: 'security', label: 'Bảo mật', icon: Lock },
    { id: 'notifications', label: 'Thông báo', icon: Bell },
    { id: 'danger', label: 'Vùng nguy hiểm', icon: Shield },
  ];

  return (
    <div className="settings-page">
      <div className="settings-page__container">
        <button onClick={() => navigate(-1)} className="settings-page__back">
          <ArrowLeft size={18} />
          Quay lại
        </button>

        <div className="settings-page__header">
          <h1 className="settings-page__title">Cài đặt</h1>
          <p className="settings-page__subtitle">
            Quản lý bảo mật tài khoản và tùy chọn thông báo.
          </p>
        </div>

        <div className="settings-page__content">
          <div className="settings-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`settings-tabs__btn ${activeTab === tab.id ? 'active' : ''}`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="settings-panel">
            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="settings-section">
                <h2 className="settings-section__title">
                  <Lock size={18} />
                  Đổi mật khẩu
                </h2>
                <p className="settings-section__desc">
                  Cập nhật mật khẩu để bảo vệ tài khoản của bạn.
                </p>

                <form onSubmit={handlePwdSubmit} className="settings-form">
                  {pwdSubmitError && (
                    <div className="auth__alert" role="alert">{pwdSubmitError}</div>
                  )}
                  {pwdSuccess && (
                    <div className="auth__alert auth__alert--success" role="status">
                      <CheckCircle2 size={16} />
                      {pwdSuccess}
                    </div>
                  )}

                  <div className="settings-form__field">
                    <label htmlFor="settings-current-pwd" className="settings-form__label">
                      Mật khẩu hiện tại
                    </label>
                    <div className="settings-form__input-wrap">
                      <input
                        id="settings-current-pwd"
                        type={showPwd.current ? 'text' : 'password'}
                        className="settings-form__input"
                        value={pwdForm.current}
                        onChange={onPwdChange('current')}
                        placeholder="Nhập mật khẩu hiện tại"
                        aria-invalid={!!pwdErrors.current}
                      />
                      <button
                        type="button"
                        className="settings-form__toggle-pwd"
                        onClick={() => setShowPwd((s) => ({ ...s, current: !s.current }))}
                        tabIndex={-1}
                      >
                        {showPwd.current ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {pwdErrors.current && (
                      <span className="settings-form__error">{pwdErrors.current}</span>
                    )}
                  </div>

                  <div className="settings-form__field">
                    <label htmlFor="settings-new-pwd" className="settings-form__label">
                      Mật khẩu mới
                    </label>
                    <div className="settings-form__input-wrap">
                      <input
                        id="settings-new-pwd"
                        type={showPwd.new ? 'text' : 'password'}
                        className="settings-form__input"
                        value={pwdForm.newPwd}
                        onChange={onPwdChange('newPwd')}
                        placeholder="Tối thiểu 6 ký tự"
                        aria-invalid={!!pwdErrors.newPwd}
                      />
                      <button
                        type="button"
                        className="settings-form__toggle-pwd"
                        onClick={() => setShowPwd((s) => ({ ...s, new: !s.new }))}
                        tabIndex={-1}
                      >
                        {showPwd.new ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {pwdErrors.newPwd && (
                      <span className="settings-form__error">{pwdErrors.newPwd}</span>
                    )}
                  </div>

                  <div className="settings-form__field">
                    <label htmlFor="settings-confirm-pwd" className="settings-form__label">
                      Xác nhận mật khẩu mới
                    </label>
                    <div className="settings-form__input-wrap">
                      <input
                        id="settings-confirm-pwd"
                        type={showPwd.confirm ? 'text' : 'password'}
                        className="settings-form__input"
                        value={pwdForm.confirm}
                        onChange={onPwdChange('confirm')}
                        placeholder="Nhập lại mật khẩu mới"
                        aria-invalid={!!pwdErrors.confirm}
                      />
                      <button
                        type="button"
                        className="settings-form__toggle-pwd"
                        onClick={() => setShowPwd((s) => ({ ...s, confirm: !s.confirm }))}
                        tabIndex={-1}
                      >
                        {showPwd.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {pwdErrors.confirm && (
                      <span className="settings-form__error">{pwdErrors.confirm}</span>
                    )}
                  </div>

                  <div className="settings-form__actions">
                    <button
                      type="submit"
                      className="settings-form__submit"
                      disabled={pwdLoading}
                    >
                      {pwdLoading ? (
                        <>
                          <Loader2 size={16} className="spin" />
                          Đang cập nhật…
                        </>
                      ) : (
                        'Cập nhật mật khẩu'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="settings-section">
                <h2 className="settings-section__title">
                  <Bell size={18} />
                  Tùy chọn thông báo
                </h2>
                <p className="settings-section__desc">
                  Chọn cách bạn muốn nhận thông báo từ ClubHub.
                </p>

                <div className="notification-groups">
                  <div className="notification-group">
                    <h3 className="notification-group__title">Sự kiện</h3>
                    <div className="notification-item">
                      <div className="notification-item__info">
                        <span className="notification-item__label">Email sự kiện mới</span>
                        <span className="notification-item__desc">
                          Nhận email khi có sự kiện mới từ các CLB bạn quan tâm.
                        </span>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={notifications.emailEvents}
                          onChange={(e) => setNotifications((n) => ({ ...n, emailEvents: e.target.checked }))}
                        />
                        <span className="toggle__slider" />
                      </label>
                    </div>
                    <div className="notification-item">
                      <div className="notification-item__info">
                        <span className="notification-item__label">Push notification</span>
                        <span className="notification-item__desc">
                          Nhận thông báo đẩy về sự kiện sắp tới.
                        </span>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={notifications.pushEvents}
                          onChange={(e) => setNotifications((n) => ({ ...n, pushEvents: e.target.checked }))}
                        />
                        <span className="toggle__slider" />
                      </label>
                    </div>
                  </div>

                  <div className="notification-group">
                    <h3 className="notification-group__title">CLB</h3>
                    <div className="notification-item">
                      <div className="notification-item__info">
                        <span className="notification-item__label">Email CLB mới</span>
                        <span className="notification-item__desc">
                          Nhận email khi có CLB mới được tạo.
                        </span>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={notifications.emailClubs}
                          onChange={(e) => setNotifications((n) => ({ ...n, emailClubs: e.target.checked }))}
                        />
                        <span className="toggle__slider" />
                      </label>
                    </div>
                    <div className="notification-item">
                      <div className="notification-item__info">
                        <span className="notification-item__label">Push notification</span>
                        <span className="notification-item__desc">
                          Nhận thông báo đẩy từ các CLB bạn tham gia.
                        </span>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={notifications.pushClubs}
                          onChange={(e) => setNotifications((n) => ({ ...n, pushClubs: e.target.checked }))}
                        />
                        <span className="toggle__slider" />
                      </label>
                    </div>
                  </div>

                  <div className="notification-group">
                    <h3 className="notification-group__title">Thông báo</h3>
                    <div className="notification-item">
                      <div className="notification-item__info">
                        <span className="notification-item__label">Email thông báo</span>
                        <span className="notification-item__desc">
                          Nhận email về các thông báo quan trọng.
                        </span>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={notifications.emailAnnouncements}
                          onChange={(e) => setNotifications((n) => ({ ...n, emailAnnouncements: e.target.checked }))}
                        />
                        <span className="toggle__slider" />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="settings-form__actions">
                  <button className="settings-form__submit">
                    Lưu tùy chọn
                  </button>
                </div>
              </div>
            )}

            {/* Danger Zone Tab */}
            {activeTab === 'danger' && (
              <div className="settings-section settings-section--danger">
                <h2 className="settings-section__title">
                  <AlertTriangle size={18} />
                  Vùng nguy hiểm
                </h2>
                <p className="settings-section__desc">
                  Các hành động dưới đây không thể hoàn tác. Vui lòng cân nhắc kỹ trước khi thực hiện.
                </p>

                <div className="danger-actions">
                  <div className="danger-card">
                    <div className="danger-card__icon">
                      <Trash2 size={24} />
                    </div>
                    <div className="danger-card__info">
                      <h3 className="danger-card__title">Xóa tài khoản</h3>
                      <p className="danger-card__desc">
                        Xóa vĩnh viễn tài khoản và tất cả dữ liệu liên quan. Hành động này không thể hoàn tác.
                      </p>
                    </div>
                    <button
                      className="danger-card__btn"
                      onClick={() => setShowDeleteModal(true)}
                    >
                      Xóa tài khoản
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <AlertTriangle size={24} style={{ color: '#B91C1C' }} />
              <h2 className="modal__title">Xóa tài khoản</h2>
            </div>
            <div className="modal__body">
              <p className="modal__text">
                Bạn có chắc muốn xóa tài khoản này? Tất cả dữ liệu bao gồm thông tin cá nhân,
                lịch sử hoạt động và tham gia CLB sẽ bị <strong>xóa vĩnh viễn</strong>.
              </p>
              <p className="modal__text modal__text--warning">
                Hành động này không thể hoàn tác.
              </p>
              <div className="modal__field">
                <label htmlFor="delete-confirm" className="modal__label">
                  Để xác nhận, hãy nhập email của bạn: <strong>{user?.email}</strong>
                </label>
                <input
                  id="delete-confirm"
                  type="email"
                  className="modal__input"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={user?.email}
                />
              </div>
            </div>
            <div className="modal__footer">
              <button
                className="modal__cancel"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                disabled={deleteLoading}
              >
                Hủy
              </button>
              <button
                className="modal__confirm"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== user?.email || deleteLoading}
              >
                {deleteLoading ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    Đang xóa…
                  </>
                ) : (
                  'Xóa tài khoản'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .settings-page {
          min-height: 100vh;
          padding-top: 80px;
          background: #F8FAF8;
        }
        .settings-page__container {
          max-width: 800px;
          margin: 0 auto;
          padding: 32px 24px 64px;
        }
        .settings-page__back {
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
        .settings-page__back:hover {
          background: #F4F1EA;
          border-color: #16685D;
        }
        .settings-page__header {
          margin-bottom: 32px;
        }
        .settings-page__title {
          font-size: 28px;
          font-weight: 700;
          color: #06231D;
          margin: 0 0 8px;
        }
        .settings-page__subtitle {
          font-size: 15px;
          color: #666;
          margin: 0;
        }
        .settings-page__content {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .settings-tabs {
          display: flex;
          gap: 8px;
          background: white;
          padding: 8px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
        }
        .settings-tabs__btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 500;
          color: #666;
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .settings-tabs__btn:hover {
          color: #06231D;
          background: #F4F1EA;
        }
        .settings-tabs__btn.active {
          color: white;
          background: linear-gradient(135deg, #0E4B43, #16685D);
        }
        .settings-panel {
          background: white;
          border-radius: 16px;
          padding: 32px;
          border: 1px solid #e5e7eb;
        }
        .settings-section__title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 18px;
          font-weight: 600;
          color: #06231D;
          margin: 0 0 8px;
        }
        .settings-section__desc {
          font-size: 14px;
          color: #666;
          margin: 0 0 28px;
        }
        .settings-section--danger .settings-section__title {
          color: #B91C1C;
        }
        .settings-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
          max-width: 480px;
        }
        .settings-form__field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .settings-form__label {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }
        .settings-form__input-wrap {
          position: relative;
        }
        .settings-form__input {
          width: 100%;
          padding: 12px 44px 12px 16px;
          font-size: 15px;
          color: #1F2937;
          background: #FAFAFA;
          border: 1.5px solid #E5E7EB;
          border-radius: 10px;
          transition: all 0.2s;
          box-sizing: border-box;
        }
        .settings-form__input:focus {
          outline: none;
          border-color: #16685D;
          background: white;
          box-shadow: 0 0 0 3px rgba(22,104,93,0.1);
        }
        .settings-form__toggle-pwd {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #9CA3AF;
          padding: 4px;
        }
        .settings-form__toggle-pwd:hover {
          color: #666;
        }
        .settings-form__error {
          font-size: 13px;
          color: #B91C1C;
        }
        .settings-form__actions {
          display: flex;
          padding-top: 8px;
        }
        .settings-form__submit {
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
        .settings-form__submit:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(6,35,29,0.25);
        }
        .settings-form__submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .notification-groups {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .notification-group__title {
          font-size: 15px;
          font-weight: 600;
          color: #06231D;
          margin: 0 0 12px;
        }
        .notification-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: #FAFAFA;
          border-radius: 10px;
          margin-bottom: 8px;
        }
        .notification-item__info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .notification-item__label {
          font-size: 14px;
          font-weight: 500;
          color: #1F2937;
        }
        .notification-item__desc {
          font-size: 13px;
          color: #9CA3AF;
        }
        .toggle {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
          flex-shrink: 0;
        }
        .toggle input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .toggle__slider {
          position: absolute;
          cursor: pointer;
          inset: 0;
          background-color: #E5E7EB;
          transition: 0.3s;
          border-radius: 24px;
        }
        .toggle__slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .toggle input:checked + .toggle__slider {
          background-color: #0E4B43;
        }
        .toggle input:checked + .toggle__slider:before {
          transform: translateX(20px);
        }
        .danger-actions {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .danger-card {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 24px;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          border-radius: 12px;
        }
        .danger-card__icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border-radius: 12px;
          color: #B91C1C;
          flex-shrink: 0;
        }
        .danger-card__info {
          flex: 1;
        }
        .danger-card__title {
          font-size: 16px;
          font-weight: 600;
          color: #B91C1C;
          margin: 0 0 4px;
        }
        .danger-card__desc {
          font-size: 13px;
          color: #666;
          margin: 0;
        }
        .danger-card__btn {
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 600;
          color: white;
          background: #B91C1C;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .danger-card__btn:hover {
          background: #991B1B;
        }
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 24px;
        }
        .modal {
          background: white;
          border-radius: 16px;
          width: 100%;
          max-width: 480px;
          overflow: hidden;
        }
        .modal__header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 24px 24px 0;
        }
        .modal__title {
          font-size: 18px;
          font-weight: 700;
          color: #06231D;
          margin: 0;
        }
        .modal__body {
          padding: 24px;
        }
        .modal__text {
          font-size: 14px;
          color: #374151;
          margin: 0 0 12px;
          line-height: 1.6;
        }
        .modal__text--warning {
          color: #B91C1C;
          font-weight: 500;
        }
        .modal__field {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 16px;
        }
        .modal__label {
          font-size: 14px;
          color: #374151;
        }
        .modal__input {
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
        .modal__input:focus {
          outline: none;
          border-color: #B91C1C;
          background: white;
          box-shadow: 0 0 0 3px rgba(185,28,28,0.1);
        }
        .modal__footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px 24px;
        }
        .modal__cancel {
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          background: white;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .modal__cancel:hover:not(:disabled) {
          background: #F3F4F6;
        }
        .modal__confirm {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 600;
          color: white;
          background: #B91C1C;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .modal__confirm:hover:not(:disabled) {
          background: #991B1B;
        }
        .modal__confirm:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .auth__alert {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
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
