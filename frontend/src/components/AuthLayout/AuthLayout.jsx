import { Link } from 'react-router-dom';
import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import './AuthLayout.css';

/* ===== Layout ===== */

export default function AuthLayout({
  eyebrow,
  title,
  subtitle,
  illustration,
  children,
  footerLink,
}) {
  return (
    <div className="auth">
      <div className="auth__panel auth__panel--form">
        <header className="auth__header">
          <Link to="/" className="auth__logo" aria-label="ClubHub home">
            <span className="auth__logo-icon">CH</span>
            <span className="auth__logo-text">ClubHub</span>
          </Link>
        </header>

        <main className="auth__main">
          <div className="auth__intro">
            {eyebrow && <span className="auth__eyebrow">{eyebrow}</span>}
            <h1 className="auth__title">{title}</h1>
            {subtitle && <p className="auth__subtitle">{subtitle}</p>}
          </div>
          {children}
        </main>

        <footer className="auth__footer">
          <p>
            {footerLink.text}{' '}
            <Link to={footerLink.href} className="auth__footer-link">
              {footerLink.linkLabel} →
            </Link>
          </p>
        </footer>
      </div>

      <aside className="auth__panel auth__panel--art" aria-hidden="true">
        {illustration ?? (
          <div className="auth__art-default">
            <div className="auth__art-glow auth__art-glow--green" />
            <div className="auth__art-glow auth__art-glow--blue" />
            <div className="auth__art-content">
              <span className="auth__art-eyebrow">IC-PDP · FPT University</span>
              <h2 className="auth__art-title">
                One account.<br />
                All student clubs.
              </h2>
              <p className="auth__art-desc">
                Join 3,800+ students discovering clubs, events and communities across FPTU.
              </p>
              <div className="auth__art-stats">
                <div><strong>42</strong><span>Active Clubs</span></div>
                <div><strong>120+</strong><span>Events / year</span></div>
                <div><strong>3.8k</strong><span>Members</span></div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

/* ===== Form helpers ===== */

export function FormField({ label, error, children, hint, htmlFor }) {
  return (
    <div className="auth-field">
      {label && (
        <label htmlFor={htmlFor} className="auth-field__label">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="auth-field__error" role="alert">{error}</p>
      ) : hint ? (
        <p className="auth-field__hint">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextInput({ type = 'text', ...rest }) {
  const id = useId();
  const [show, setShow] = useState(false);

  if (type === 'password') {
    return (
      <div className="auth-input-wrap">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          className="auth-input"
          autoComplete={rest.autoComplete ?? 'off'}
          {...rest}
        />
        <button
          type="button"
          className="auth-input__eye"
          aria-label={show ? 'Hide password' : 'Show password'}
          onClick={() => setShow((s) => !s)}
          tabIndex={-1}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    );
  }

  return (
    <input
      id={id}
      type={type}
      className="auth-input"
      autoComplete={rest.autoComplete ?? 'off'}
      {...rest}
    />
  );
}
