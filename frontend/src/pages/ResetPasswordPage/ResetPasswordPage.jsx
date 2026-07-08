import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Loader2, CheckCircle2 } from 'lucide-react';
import { AuthLayout, FormField, TextInput } from '@/components';
import { updatePassword } from '@/services/authService';
import './ResetPasswordPage.css';

const mapAuthError = (msg) => {
  const m = msg.toLowerCase();
  if (m.includes('expired') || m.includes('invalid'))
    return 'Link đặt lại mật khẩu đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu link mới.';
  if (m.includes('rate limit'))
    return 'Quá nhiều lần thử. Vui lòng đợi vài phút rồi thử lại.';
  if (m.includes('network') || m.includes('fetch'))
    return 'Không thể kết nối tới server. Kiểm tra mạng rồi thử lại.';
  return msg;
};

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('form');
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (fieldErrors[key]) setFieldErrors((p) => ({ ...p, [key]: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (!form.password) errs.password = 'Vui lòng nhập mật khẩu mới.';
    else if (form.password.length < 6)
      errs.password = 'Mật khẩu phải có ít nhất 6 ký tự.';
    if (form.confirm !== form.password)
      errs.confirm = 'Mật khẩu xác nhận không khớp.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await updatePassword({ newPassword: form.password });
      setStep('success');
    } catch (err) {
      setSubmitError(mapAuthError(err.message));
    } finally {
      setLoading(false);
    }
  };

  /* ===== Success screen ===== */

  if (step === 'success') {
    return (
      <AuthLayout
        eyebrow="Password reset"
        title="Password updated"
        subtitle="Mật khẩu của bạn đã được cập nhật thành công."
        footerLink={{
          text: 'Đăng nhập ngay',
          linkLabel: 'Log in',
          href: '/login',
        }}
      >
        <div
          className="auth__alert auth__alert--success"
          style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}
        >
          <CheckCircle2 size={20} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong style={{ display: 'block', marginBottom: 4 }}>Thành công!</strong>
            <span style={{ fontSize: 14 }}>
              Bạn có thể đăng nhập ngay với mật khẩu mới của mình.
            </span>
          </div>
        </div>

        <button
          type="button"
          className="auth__submit"
          onClick={() => navigate('/login')}
        >
          Go to Login
        </button>
      </AuthLayout>
    );
  }

  /* ===== Main form ===== */

  return (
    <AuthLayout
      eyebrow="New password"
      title="Create new password"
      subtitle="Nhập mật khẩu mới cho tài khoản của bạn."
      footerLink={{
        text: 'Quay lại',
        linkLabel: 'Log in',
        href: '/login',
      }}
    >
      <form onSubmit={onSubmit} noValidate>
        {submitError && <div className="auth__alert" role="alert">{submitError}</div>}

        <FormField
          label="New password"
          htmlFor="reset-password"
          error={fieldErrors.password}
          hint="Tối thiểu 6 ký tự. Nên dùng kết hợp chữ, số và ký tự đặc biệt."
        >
          <div className="auth-input-wrap">
            <Lock
              size={16}
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#16685D',
              }}
            />
            <TextInput
              type="password"
              id="reset-password"
              name="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={form.password}
              onChange={onChange('password')}
              style={{ paddingLeft: 40 }}
              aria-invalid={!!fieldErrors.password}
            />
          </div>
        </FormField>

        <FormField
          label="Confirm password"
          htmlFor="reset-confirm"
          error={fieldErrors.confirm}
        >
          <div className="auth-input-wrap">
            <Lock
              size={16}
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#16685D',
              }}
            />
            <TextInput
              type="password"
              id="reset-confirm"
              name="confirm"
              autoComplete="new-password"
              placeholder="••••••••"
              value={form.confirm}
              onChange={onChange('confirm')}
              style={{ paddingLeft: 40 }}
              aria-invalid={!!fieldErrors.confirm}
            />
          </div>
        </FormField>

        <button type="submit" className="auth__submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2
                size={16}
                style={{
                  verticalAlign: 'middle',
                  marginRight: 8,
                  animation: 'spin 1s linear infinite',
                }}
              />
              Updating password…
            </>
          ) : (
            'Update password'
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
