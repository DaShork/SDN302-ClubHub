import { useEffect, useRef } from "react";
import ChatBubble from "./ChatBubble";
import Loader from "../../../components/shared/Loader";

export default function ChatContainer({ messages, loading }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        {messages.map((msg) => (
          <ChatBubble key={msg.id} role={msg.role} content={msg.content} />
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-secondary-300">
            <Loader size="sm" />
            Đang tìm kiếm trong knowledge base...
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
