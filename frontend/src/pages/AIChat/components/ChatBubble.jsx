export function ChatBubble({ message, isUser = false, timestamp }) {
  const timeStr = timestamp
    ? new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center mt-1" style={{ background: 'linear-gradient(135deg, #0E4B43, #3B82F6)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M12 2a10 10 0 100 20 10 10 0 000-20z"/>
            <path d="M12 8v4m0 4h.01"/>
          </svg>
        </div>
      )}

      <div className={`flex flex-col gap-1 max-w-[72%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className="px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words"
          style={
            isUser
              ? { background: 'linear-gradient(90deg, #0E4B43, #22C55E)', color: '#fff', borderBottomRightRadius: '4px' }
              : { backgroundColor: '#223148', color: '#F4F1EA', borderBottomLeftRadius: '4px' }
          }
        >
          {message}
        </div>
        {timeStr && (
          <span className="text-xs px-1" style={{ color: 'rgba(244,241,234,0.3)' }}>
            {timeStr}
          </span>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center mt-1 font-semibold text-white text-sm" style={{ background: 'linear-gradient(135deg, #0E4B43, #22C55E)' }}>
          U
        </div>
      )}
    </div>
  );
}
