import { useState } from 'react';
import { Send } from 'lucide-react';
import './ChatInput.css';

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
    <div className="chat-input">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about clubs, events, workshops..."
        disabled={disabled}
        rows={1}
        className="chat-input__textarea"
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!value.trim() || disabled}
        className="chat-input__send"
        aria-label="Send message"
      >
        <Send size={18} color="#fff" />
      </button>
    </div>
  );
}