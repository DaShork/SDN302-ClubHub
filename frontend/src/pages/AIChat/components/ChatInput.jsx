import { useState } from "react";
import Button from "../../../components/shared/Button";

export default function ChatInput({ onSend, disabled }) {
  const [message, setMessage] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setMessage("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Hỏi về CLB, sự kiện, workshop, thông báo..."
        rows={1}
        disabled={disabled}
        className="flex-1 resize-none rounded-xl border border-white/10 bg-primary-600 px-4 py-3 text-sm text-secondary-100 placeholder:text-secondary-300/60 focus:border-accent-blue focus:outline-none disabled:opacity-50"
      />
      <Button type="submit" disabled={disabled || !message.trim()} size="lg">
        Gửi
      </Button>
    </form>
  );
}
