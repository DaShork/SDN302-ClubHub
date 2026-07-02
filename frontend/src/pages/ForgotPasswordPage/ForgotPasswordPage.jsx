import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { AuthLayout, FormField, TextInput } from '@/components';
import { forgotPassword } from '@/services/authService';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const mapAuthError = (msg) => {
  const m = msg.toLowerCase();
  if (m.includes('not found') || m.includes('user not found'))
    return 'Không tìm thấy tài khoản với email này.';
  if (m.includes('rate limit'))
    return 'Quá nhiều lần thử. Vui lòng đợi vài phút rồi thử lại.';
  if (m.includes('network') || m.includes('fetch'))
    return 'Không thể kết nối tới server. Kiểm tra mạng rồi thử lại.';
  return msg;
};

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('form');
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!email.trim()) {
      setFieldError('Vui lòng nhập email.');
      return false;
    }
    if (!EMAIL_RE.test(email)) {
      setFieldError('Email không hợp lệ.');
      return false;
    }
    setFieldError('');
    return true;
  };

  const onChange = (e) => {
    setEmail(e.target.value);
    if (fieldError) setFieldError('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await forgotPassword({ email: email.trim() });
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
        title="Check your inbox"
        subtitle={`Chúng tôi đã gửi link đặt lại mật khẩu tới ${email}. Click vào link trong email để đặt lại mật khẩu mới.`}
        footerLink={{
          text: 'Đã nhớ mật khẩu?',
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
            <strong style={{ display: 'block', marginBottom: 4 }}>Email đã được gửi</strong>
            <span style={{ fontSize: 14 }}>
              Nếu không thấy trong inbox, vui lòng kiểm tra thư mục <em>spam</em>.
              Link đặt lại mật khẩu sẽ hết hạn sau 1 giờ.
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
      eyebrow="Forgot password"
      title="Reset your password"
      subtitle="Nhập email đã đăng ký để nhận link đặt lại mật khẩu."
      footerLink={{
        text: 'Đã nhớ mật khẩu?',
        linkLabel: 'Log in',
        href: '/login',
      }}
    >
      <form onSubmit={onSubmit} noValidate>
        {submitError && <div className="auth__alert" role="alert">{submitError}</div>}

        <FormField label="Email" htmlFor="forgot-email" error={fieldError}>
          <div className="auth-input-wrap">
            <Mail
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
              type="email"
              id="forgot-email"
              name="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={onChange}
              style={{ paddingLeft: 40 }}
              aria-invalid={!!fieldError}
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
              Đang gửi…
            </>
          ) : (
            'Send reset link'
          )}
        </button>

        <p style={{ textAlign: 'center', fontSize: 14, color: '#666', margin: '16px 0 0' }}>
          Link đặt lại mật khẩu sẽ có hiệu lực trong <strong>1 giờ</strong>.
        </p>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AuthLayout>
  );
}
