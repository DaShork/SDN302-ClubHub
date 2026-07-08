import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnOverlay = true,
}) {
  const overlayRef = useRef(null);
  const titleId = `modal-title-${Math.random().toString(36).slice(2)}`;

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClass = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }[size] || 'max-w-lg';

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={closeOnOverlay ? (e) => { if (e.target === overlayRef.current) onClose?.(); } : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className={`w-full ${sizeClass} rounded-[16px] border overflow-hidden`}
        style={{ backgroundColor: '#0D1824', borderColor: 'rgba(255,255,255,0.08)', maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div>
            {title && (
              <h2 id={titleId} className="text-lg font-semibold text-secondary-100">{title}</h2>
            )}
            {description && (
              <p className="mt-1 text-sm" style={{ color: 'rgba(244,241,234,0.5)' }}>{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-secondary-200 hover:text-white hover:bg-primary-600 transition-colors"
            aria-label="Close modal"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 p-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
