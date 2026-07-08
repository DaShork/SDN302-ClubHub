import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export function Drawer({ open, onClose, title, children, side = 'right', width = '400px' }) {
  const overlayRef = useRef(null);

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

  const isRight = side === 'right';
  const translate = isRight ? 'translateX(0)' : 'translateX(0)';

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex justify-end"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose?.(); }}
    >
      <div
        className="h-full flex flex-col border-l"
        style={{
          width,
          backgroundColor: '#0D1824',
          borderColor: 'rgba(255,255,255,0.08)',
          animation: 'slideInRight 0.3s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {title && (
            <h2 className="text-lg font-semibold text-secondary-100">{title}</h2>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-secondary-200 hover:text-white hover:bg-primary-600 transition-colors"
            aria-label="Close drawer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
