import { Bot, User } from 'lucide-react';
import './ChatBubble.css';

export function ChatBubble({ message, isUser = false, timestamp }) {
  const timeStr = timestamp
    ? new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className={`chat-bubble ${isUser ? 'chat-bubble--user' : 'chat-bubble--ai'}`}>
      <div className={`chat-bubble__avatar ${isUser ? 'chat-bubble__avatar--user' : 'chat-bubble__avatar--ai'}`}>
        {isUser ? <User size={14} color="#fff" /> : <Bot size={14} color="#fff" />}
      </div>

      <div className={`chat-bubble__col ${isUser ? 'chat-bubble__col--right' : 'chat-bubble__col--left'}`}>
        <div className={`chat-bubble__msg ${isUser ? 'chat-bubble__msg--user' : 'chat-bubble__msg--ai'}`}>
          {message}
        </div>
        {timeStr && <span className="chat-bubble__time">{timeStr}</span>}
      </div>
    </div>
  );
}