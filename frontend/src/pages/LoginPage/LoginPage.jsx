import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { AuthLayout, FormField, TextInput } from '@/components';
import { useAuth } from '@/hooks/useAuth.jsx';
import './LoginPage.css';

const mapAuthError = (msg) => {
  const m = msg.toLowerCase();
  if (m.includes('invalid login') || m.includes('invalid credentials'))
    return 'Email hoặc mật khẩu không chính xác.';
  if (m.includes('email not confirmed'))
    return 'Vui lòng xác nhận email trước khi đăng nhập (check inbox/spam).';
  if (m.includes('rate limit'))
    return 'Quá nhiều lần thử. Vui lòng đợi vài phút rồi thử lại.';
  if (m.includes('network') || m.includes('fetch'))
    return 'Không thể kết nối tới server. Kiểm tra mạng rồi thử lại.';
  return msg;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();

  const [form, setForm] = useState({ email: '', password: '', remember: true });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectTo = location.state?.from?.pathname ?? '/';

  const validate = () => {
    const errs = {};
    if (!form.email.trim()) errs.email = 'Vui lòng nhập email.';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email))
      errs.email = 'Email không hợp lệ.';
    if (!form.password) errs.password = 'Vui lòng nhập mật khẩu.';
    else if (form.password.length < 6)
      errs.password = 'Mật khẩu phải có ít nhất 6 ký tự.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onChange = (key) => (e) => {
    const value = key === 'remember' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    if (fieldErrors[key]) setFieldErrors((p) => ({ ...p, [key]: undefined }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await signIn({ email: form.email.trim(), password: form.password });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setSubmitError(mapAuthError(err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Log in to ClubHub"
      subtitle="Continue exploring clubs, events and the FPTU community."
      footerLink={{
        text: "Don't have an account yet?",
        linkLabel: 'Sign up',
        href: '/signup',
      }}
    >
      <form onSubmit={onSubmit} noValidate>
        {submitError && <div className="auth__alert" role="alert">{submitError}</div>}

        <FormField label="Email" htmlFor="login-email" error={fieldErrors.email}>
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
              id="login-email"
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

        <FormField label="Password" htmlFor="login-password" error={fieldErrors.password}>
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
              id="login-password"
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={form.password}
              onChange={onChange('password')}
              style={{ paddingLeft: 40 }}
              aria-invalid={!!fieldErrors.password}
            />
          </div>
        </FormField>

        <div className="auth__row">
          <label className="auth__remember">
            <input
              type="checkbox"
              checked={form.remember}
              onChange={onChange('remember')}
            />
            Remember me
          </label>
          <Link to="/forgot-password" className="auth__forgot">
            Forgot password?
          </Link>
        </div>

        <button type="submit" className="auth__submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2
                size={16}
                style={{ verticalAlign: 'middle', marginRight: 8, animation: 'spin 1s linear infinite' }}
              />
              Signing in…
            </>
          ) : (
            'Log in'
          )}
        </button>

        <div className="auth__divider">or</div>

          <p style={{ textAlign: 'center', fontSize: 14, color: '#16685D', margin: 0 }}>
            Use your email account to access club features.
          </p>
      </form>
    </AuthLayout>
  );
}