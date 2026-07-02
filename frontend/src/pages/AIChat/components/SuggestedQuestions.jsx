const SUGGESTIONS = [
  "Có những câu lạc bộ nào đang tuyển thành viên?",
  "Thông báo mới nhất của các CLB là gì?",
  "Workshop nào sắp diễn ra?",
  "Tìm kiếm thông tin về CLB công nghệ",
];

export default function SuggestedQuestions({ onSelect, disabled }) {
  return (
    <div className="flex flex-wrap gap-2">
      {SUGGESTIONS.map((question) => (
        <button
          key={question}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(question)}
          className="rounded-full border border-accent-blue/30 bg-accent-blue/10 px-4 py-2 text-sm text-accent-blue-light transition-colors hover:bg-accent-blue/20 disabled:opacity-50"
        >
          {question}
        </button>
      ))}
    </div>
  );
}
