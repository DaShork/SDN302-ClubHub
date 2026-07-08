import { useState } from 'react';

export function ChatInput({ onSend, disabled = false }) {
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex items-end gap-3 px-4 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: '#0B1220' }}>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about clubs, events, workshops..."
        disabled={disabled}
        rows={1}
        className="flex-1 bg-primary-600 text-secondary-100 rounded-xl px-4 py-3 text-sm resize-none outline-none placeholder:text-muted"
        style={{
          border: '1px solid rgba(255,255,255,0.08)',
          maxHeight: '120px',
          overflowY: 'auto',
        }}
      />
      <button
        onClick={handleSubmit}
        disabled={!value.trim() || disabled}
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-30"
        style={{ background: 'linear-gradient(90deg, #0E4B43, #22C55E)' }}
        aria-label="Send message"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </button>
    </div>
  );
}
