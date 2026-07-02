import { createChatEntry } from "./chatHistoryService";
import { searchKnowledge } from "./knowledgeSearchService";

const TYPE_LABELS = {
  club: "Câu lạc bộ",
  knowledge: "Knowledge Base",
  announcement: "Thông báo",
  meeting_minutes: "Biên bản họp",
  workshop: "Workshop",
};

function truncate(text, max = 200) {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function buildAnswerFromResults(question, results) {
  if (results.length === 0) {
    return (
      "Tôi không tìm thấy thông tin liên quan trong knowledge base của ClubHub. " +
      "Hãy thử hỏi về câu lạc bộ, sự kiện, workshop hoặc thông báo cụ thể hơn."
    );
  }

  const intro = `Dựa trên knowledge base, đây là thông tin liên quan đến "${question}":\n\n`;

  const sections = results.map((item, index) => {
    const label = TYPE_LABELS[item.type] ?? item.type;
    return `${index + 1}. **[${label}] ${item.title}**\n${truncate(item.content)}`;
  });

  const footer =
    "\n\n---\n*Câu trả lời được tạo từ dữ liệu có sẵn trên ClubHub. " +
    "Thông tin nội bộ CLB chỉ hiển thị nếu bạn có quyền truy cập.*";

  return intro + sections.join("\n\n") + footer;
}

export async function askQuestion(question, profileId) {
  const results = await searchKnowledge(question);
  const answer = buildAnswerFromResults(question, results);

  const entry = await createChatEntry({
    profileId,
    question,
    answer,
  });

  return {
    id: entry.id,
    question: entry.question,
    answer: entry.answer,
    sources: results,
    createdAt: entry.created_at,
  };
}

export async function askQuestionWithoutSave(question) {
  const results = await searchKnowledge(question);
  const answer = buildAnswerFromResults(question, results);
  return { answer, sources: results };
}
