import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, IdCard, Loader2, CheckCircle2 } from 'lucide-react';
import { AuthLayout, FormField, TextInput } from '@/components';
import { useAuth } from '@/hooks/useAuth.jsx';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const mapAuthError = (msg) => {
  const m = msg.toLowerCase();
  if (m.includes('already registered') || m.includes('user already'))
    return 'Email này đã được đăng ký. Vui lòng đăng nhập.';
  if (m.includes('rate limit'))
    return 'Quá nhiều lần thử. Vui lòng đợi vài phút rồi thử lại.';
  if (m.includes('password'))
    return 'Mật khẩu không đáp ứng yêu cầu (tối thiểu 6 ký tự).';
  if (m.includes('network') || m.includes('fetch'))
    return 'Không thể kết nối tới server. Kiểm tra mạng rồi thử lại.';
  return msg;
};

export default function SignUpPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [step, setStep] = useState('form');
  const [form, setForm] = useState({
    fullName: '',
    studentCode: '',
    email: '',
    password: '',
    confirm: '',
    agree: false,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (key) => (e) => {
    const value = key === 'agree' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    if (fieldErrors[key]) setFieldErrors((p) => ({ ...p, [key]: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Vui lòng nhập họ và tên.';
    if (!form.studentCode.trim()) errs.studentCode = 'Vui lòng nhập mã sinh viên.';
    if (!form.email.trim()) errs.email = 'Vui lòng nhập email.';
    else if (!EMAIL_RE.test(form.email))
      errs.email = 'Email không hợp lệ.';
    if (!form.password) errs.password = 'Vui lòng nhập mật khẩu.';
    else if (form.password.length < 6)
      errs.password = 'Mật khẩu phải có ít nhất 6 ký tự.';
    if (form.confirm !== form.password)
      errs.confirm = 'Mật khẩu xác nhận không khớp.';
    if (!form.agree) errs.agree = 'Bạn cần đồng ý với điều khoản để tiếp tục.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await signUp({
        email: form.email.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        studentCode: form.studentCode.trim(),
      });
      setStep('verify');
    } catch (err) {
      setSubmitError(mapAuthError(err.message));
    } finally {
      setLoading(false);
    }
  };

  /* ===== Verify-email success screen ===== */

  if (step === 'verify') {
    return (
      <AuthLayout
        eyebrow="Almost there"
        title="Check your inbox"
        subtitle={`Chúng tôi vừa gửi link xác nhận tới ${form.email}. Click vào link để kích hoạt tài khoản, sau đó đăng nhập để hoàn tất.`}
        footerLink={{
          text: 'Đã xác nhận xong?',
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
              Nếu không thấy trong inbox, vui lòng kiểm tra thư mục <em>spam</em> hoặc{' '}
              <button
                type="button"
                onClick={() => setStep('form')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0E4B43',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: 0,
                  font: 'inherit',
                }}
              >
                thử lại
              </button>.
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
      eyebrow="Create your account"
      title="Join ClubHub"
      subtitle="Sign up with your email and start exploring the community."
      footerLink={{
        text: 'Đã có tài khoản rồi?',
        linkLabel: 'Log in',
        href: '/login',
      }}
    >
      <form onSubmit={onSubmit} noValidate>
        {submitError && <div className="auth__alert" role="alert">{submitError}</div>}

        <FormField label="Full name" htmlFor="signup-name" error={fieldErrors.fullName}>
          <div className="auth-input-wrap">
            <User
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
              id="signup-name"
              name="fullName"
              autoComplete="name"
              placeholder="Nguyễn Văn A"
              value={form.fullName}
              onChange={onChange('fullName')}
              style={{ paddingLeft: 40 }}
              aria-invalid={!!fieldErrors.fullName}
            />
          </div>
        </FormField>

        <FormField
          label="Student code"
          htmlFor="signup-code"
          error={fieldErrors.studentCode}
          hint="Mã sinh viên FPT University của bạn."
        >
          <div className="auth-input-wrap">
            <IdCard
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
              id="signup-code"
              name="studentCode"
              autoComplete="off"
              placeholder="HE170123"
              value={form.studentCode}
              onChange={onChange('studentCode')}
              style={{ paddingLeft: 40 }}
              aria-invalid={!!fieldErrors.studentCode}
            />
          </div>
        </FormField>

        <FormField label="Email" htmlFor="signup-email" error={fieldErrors.email}>
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
              id="signup-email"
              name="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={onChange('email')}
              style={{ paddingLeft: 40 }}
              aria-invalid={!!fieldErrors.email}
            />
          </div>
        </FormField>

        <FormField
          label="Password"
          htmlFor="signup-password"
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
              id="signup-password"
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
          htmlFor="signup-confirm"
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
              id="signup-confirm"
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

        <div className="auth__row" style={{ alignItems: 'flex-start' }}>
          <label
            className="auth__remember"
            style={{ alignItems: 'flex-start', lineHeight: 1.4 }}
          >
            <input
              type="checkbox"
              checked={form.agree}
              onChange={onChange('agree')}
              style={{ marginTop: 2 }}
              aria-invalid={!!fieldErrors.agree}
            />
            <span>
              Tôi đồng ý với <Link to="/terms" style={{ color: '#0E4B43', fontWeight: 600 }}>Điều khoản</Link> và{' '}
              <Link to="/privacy" style={{ color: '#0E4B43', fontWeight: 600 }}>Chính sách bảo mật</Link> của ClubHub.
            </span>
          </label>
        </div>
        {fieldErrors.agree && (
          <p style={{ fontSize: 13, color: '#B91C1C', margin: '4px 0 12px' }} role="alert">
            {fieldErrors.agree}
          </p>
        )}

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
              Creating account…
            </>
          ) : (
            'Create account'
          )}
        </button>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </form>
    </AuthLayout>
  );
}