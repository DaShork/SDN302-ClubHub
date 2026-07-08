import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const ICONS = {
  success: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  error: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ),
  info: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  warning: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
};

const BG_MAP = {
  success: 'rgba(34,197,94,0.1)',
  error: 'rgba(239,68,68,0.1)',
  info: 'rgba(59,130,246,0.1)',
  warning: 'rgba(245,158,11,0.1)',
};

let toastId = 0;
let addToastFn = null;

export function toast(message, options = {}) {
  if (addToastFn) addToastFn({ message, ...options });
}

function Toast({ id, message, type = 'info', duration = 4000, onDismiss }) {
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => onDismiss(id), duration);
    return () => clearTimeout(timerRef.current);
  }, [id, duration, onDismiss]);

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg min-w-[280px] max-w-sm"
      style={{
        backgroundColor: BG_MAP[type] || BG_MAP.info,
        borderColor: 'rgba(255,255,255,0.08)',
      }}
      role="alert"
    >
      {ICONS[type]}
      <p className="text-sm text-secondary-100 flex-1">{message}</p>
      <button
        onClick={() => onDismiss(id)}
        className="text-secondary-200 hover:text-white transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ message, type = 'info', duration = 4000 }) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => { addToastFn = null; };
  }, [addToast]);

  return (
    <>
      {children}
      {createPortal(
        <div
          className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2"
          aria-live="polite"
          aria-label="Notifications"
        >
          {toasts.map((t) => (
            <Toast key={t.id} {...t} onDismiss={dismiss} />
          ))}
        </div>,
        document.body
      )}
    </>
  );
}
