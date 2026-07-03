import { useId } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export function FormField({ label, error, children, hint, htmlFor }) {
  return (
    <div className="auth-field">
      <label htmlFor={htmlFor} className="auth-field__label">
        {label}
      </label>
      {children}
      {error ? (
        <p className="auth-field__error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="auth-field__hint">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextInput({ type = 'text', ...rest }) {
  const id = useId();
  const isPassword = type === 'password';
  const [show, setShow] = useState(false);

  if (isPassword) {
    return (
      <div className="auth-input-wrap">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          className="auth-input"
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
  return <input id={id} type={type} className="auth-input" {...rest} />;
}