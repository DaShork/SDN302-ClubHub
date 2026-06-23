import { useState } from "react";

// 1. Knowledge Base Placeholder Component
export function KnowledgeBase() {
  const [articles, setArticles] = useState([
    { id: 1, title: "Freshman Welcome Strategy 2025", club: "JS Club", author: "Nguyen Van Anh", date: "2025-09-12", downloads: 45, size: "1.2 MB" },
    { id: 2, title: "Golden Bell English Contest Question Bank", club: "English Club", author: "Tran Thi Bich", date: "2025-11-04", downloads: 28, size: "432 KB" },
    { id: 3, title: "Sponsorship Pitch Deck Template", club: "IC-PDP", author: "Admin", date: "2026-02-15", downloads: 110, size: "2.4 MB" },
    { id: 4, title: "Vovinam Basic Forms Video Guide Links", club: "Vovinam Club", author: "Le Hoang Cuong", date: "2025-10-20", downloads: 19, size: "12 KB" }
  ]);

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-secondary-100 tracking-tight margin-0 leading-none">
            Knowledge Base
          </h1>
          <p className="text-xs text-secondary-300 mt-2">
            Preserve documentation, plans, and files across generations.
          </p>
        </div>
        <button
          onClick={() => alert("This feature is placeholder in this MVP.")}
          className="mt-4 md:mt-0 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-800 to-accent-blue text-white font-bold text-xs shadow hover:scale-[1.02] active:scale-95 transition-all flex items-center space-x-1.5 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span>Upload File</span>
        </button>
      </div>

      {/* Grid of articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {articles.map((art) => (
          <div key={art.id} className="bg-card-bg border border-white/5 rounded-2xl p-6 flex flex-col justify-between hover:border-purple-500/20 transition-all card-hover">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-extrabold text-purple-400">
                  {art.club}
                </span>
                <span className="text-[10px] text-secondary-300">
                  {art.date}
                </span>
              </div>
              <h3 className="text-base font-bold text-secondary-100 mt-2 hover:text-purple-400 transition-colors">
                {art.title}
              </h3>
              <p className="text-xs text-secondary-300 mt-2">
                Uploaded by {art.author} • Size: {art.size}
              </p>
            </div>
            
            <div className="flex items-center justify-between mt-5 pt-3 border-t border-white/5">
              <span className="text-[10px] text-secondary-300">
                Downloaded {art.downloads} times
              </span>
              <button
                onClick={() => alert("Downloading file...")}
                className="text-xs text-accent-blue font-bold hover:underline inline-flex items-center space-x-1 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download File</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 2. AI Assistant Placeholder Component (Themed Chat UI)
export function AIAssistant() {
  const [messages, setMessages] = useState([
    { sender: "ai", text: "Xin chào! Tôi là Trợ lý AI của ClubHub FPTU. Tôi có thể giúp gì cho bạn hôm nay? Ví dụ: Tìm các sự kiện sắp diễn ra trong tuần, thông tin về JS Club, hoặc các cựu sinh viên tiêu biểu." }
  ]);
  const [inputValue, setInputValue] = useState("");

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg = inputValue;
    setMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setInputValue("");

    // Simulate AI response after 1 second
    setTimeout(() => {
      let aiResponse = "Tôi đã ghi nhận câu hỏi của bạn. Tuy nhiên, tính năng AI Assistant đang được tích hợp thêm API khóa OpenAI để hoạt động đầy đủ trong bản phát hành chính thức.";
      
      if (userMsg.toLowerCase().includes("sự kiện") || userMsg.toLowerCase().includes("event")) {
        aiResponse = "Tại FPT University, JS Club đang chuẩn bị tổ chức sự kiện 'FPT TechDay 2026' vào ngày 15/07. Ngoài ra, English Club cũng sẽ tổ chức 'Golden Bell Challenge' vào ngày 20/07. Bạn có thể đăng ký trực tiếp ở tab Events!";
      } else if (userMsg.toLowerCase().includes("cựu sinh viên") || userMsg.toLowerCase().includes("alumni")) {
        aiResponse = "Tôi tìm thấy cựu sinh viên Nguyen Van Anh (Class of 2022) từ JS Club, hiện là Senior Software Engineer tại FPT Software. Ngoài ra còn có Tran Thi Bich (VinGroup), Le Hoang Cuong (Viettel). Bạn hãy xem chi tiết ở tab Alumni Directory nhé!";
      }
      
      setMessages((prev) => [...prev, { sender: "ai", text: aiResponse }]);
    }, 800);
  };

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-6 py-10 text-left flex flex-col h-[calc(100vh-160px)]">
      <div>
        <h1 className="text-3xl font-extrabold text-secondary-100 tracking-tight margin-0 leading-none">
          AI Assistant
        </h1>
        <p className="text-xs text-secondary-300 mt-2 pb-6 border-b border-white/5">
          Ask AI questions about clubs, events, documents, and alumni advice.
        </p>
      </div>

      {/* Chat Area - BG from UI guidelines #0B1220 */}
      <div className="flex-1 bg-[#0B1220] border border-white/5 rounded-2xl p-5 my-6 overflow-y-auto space-y-4 flex flex-col min-h-[350px]">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${
              msg.sender === "user"
                ? "bg-accent-green text-white self-end ml-auto" // User bubble bg #22C55E, text #FFFFFF
                : "bg-primary-600 text-white self-start" // AI bubble bg #223148, text #FFFFFF
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      {/* Chat Form */}
      <form onSubmit={handleSend} className="flex space-x-3 items-center">
        <input
          type="text"
          placeholder="Ask AI something (e.g., 'Có sự kiện gì sắp tới không?')..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="flex-1 bg-[#223148] border border-white/10 rounded-xl px-4 py-3 text-sm text-secondary-100 outline-none focus:border-accent-green h-12"
        />
        <button
          type="submit"
          className="h-12 px-6 rounded-xl button-gradient text-white font-bold text-xs shadow hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex items-center justify-center shrink-0"
        >
          Send
        </button>
      </form>
    </div>
  );
}
