export default function ChatBubble({ role, content }) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-accent-green text-white rounded-br-sm"
            : "bg-primary-600 text-secondary-100 rounded-bl-sm"
        }`}
      >
        {!isUser && (
          <p className="mb-1 text-xs font-semibold text-accent-blue-light">
            ClubHub AI
          </p>
        )}
        {content}
      </div>
    </div>
  );
}
