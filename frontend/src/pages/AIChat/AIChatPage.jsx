import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  useChatHistory,
  useClearChatHistory,
  useDeleteChatEntry,
} from "../../hooks/useChatHistory";
import { useAIChat } from "../../hooks/useAIChat";
import Button from "../../components/shared/Button";
import Input from "../../components/shared/Input";
import Loader from "../../components/shared/Loader";
import { signIn } from "../../services/authService";
import ChatContainer from "./components/ChatContainer";
import ChatInput from "./components/ChatInput";
import ChatSidebar from "./components/ChatSidebar";
import SuggestedQuestions from "./components/SuggestedQuestions";

function LoginPrompt() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err.message ?? "Đăng nhập thất bại");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-white/5 bg-card p-8">
      <h2 className="mb-2 text-xl font-semibold text-secondary-100">
        Đăng nhập để dùng AI Assistant
      </h2>
      <p className="mb-6 text-sm text-secondary-300">
        Bạn cần đăng nhập để lưu lịch sử chat và truy cập knowledge base theo
        quyền của mình.
      </p>
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@fpt.edu.vn"
          required
        />
        <Input
          label="Mật khẩu"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? <Loader size="sm" /> : "Đăng nhập"}
        </Button>
      </form>
    </div>
  );
}

export default function AIChatPage() {
  const { user, loading: authLoading } = useAuth();
  const profileId = user?.id;

  const { data: history = [], isLoading: historyLoading } =
    useChatHistory(profileId);
  const aiChat = useAIChat(profileId);
  const deleteEntry = useDeleteChatEntry(profileId);
  const clearHistory = useClearChatHistory(profileId);

  const [messages, setMessages] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);

  function handleSelectHistory(item) {
    setActiveId(item.id);
    setMessages([
      { id: `${item.id}-q`, role: "user", content: item.question },
      { id: `${item.id}-a`, role: "assistant", content: item.answer },
    ]);
    setShowSidebar(false);
  }

  async function handleSend(question) {
    const userMsg = { id: `temp-${Date.now()}`, role: "user", content: question };
    setMessages((prev) => [...prev, userMsg]);
    setActiveId(null);

    try {
      const result = await aiChat.mutateAsync(question);
      setMessages((prev) => [
        ...prev,
        { id: result.id, role: "assistant", content: result.answer },
      ]);
      setActiveId(result.id);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "Đã xảy ra lỗi khi xử lý câu hỏi. Vui lòng thử lại.",
        },
      ]);
    }
  }

  function handleNewChat() {
    setMessages([]);
    setActiveId(null);
  }

  if (authLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-12">
        <LoginPrompt />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100svh-80px)] flex-col">
      {/* Hero header */}
      <div className="bg-gradient-to-r from-primary-800 to-accent-blue px-6 py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">AI Assistant</h1>
            <p className="mt-1 text-sm text-secondary-200/80">
              Tìm kiếm thông tin CLB từ knowledge base của ClubHub
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="border-white/30 text-white lg:hidden"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              Lịch sử
            </Button>
            <Button variant="secondary" size="sm" onClick={handleNewChat}>
              Chat mới
            </Button>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="mx-auto flex w-full max-w-6xl flex-1 overflow-hidden">
        <div
          className={`${showSidebar ? "block" : "hidden"} absolute inset-0 top-[calc(80px+88px)] z-10 bg-chat-bg lg:relative lg:top-0 lg:block lg:bg-transparent`}
        >
          <ChatSidebar
            history={history}
            loading={historyLoading}
            activeId={activeId}
            onSelect={handleSelectHistory}
            onDelete={(id) => deleteEntry.mutate(id)}
            onClear={() => clearHistory.mutate()}
            clearing={clearHistory.isPending}
          />
        </div>

        <div className="flex flex-1 flex-col bg-chat-bg">
          <ChatContainer messages={messages} loading={aiChat.isPending} />

          <div className="border-t border-white/5 p-4">
            {messages.length === 0 && (
              <div className="mb-4">
                <p className="mb-3 text-sm text-secondary-300">
                  Gợi ý câu hỏi:
                </p>
                <SuggestedQuestions
                  onSelect={handleSend}
                  disabled={aiChat.isPending}
                />
              </div>
            )}
            <ChatInput onSend={handleSend} disabled={aiChat.isPending} />
          </div>
        </div>
      </div>
    </div>
  );
}
