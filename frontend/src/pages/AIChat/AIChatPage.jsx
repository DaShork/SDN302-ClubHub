import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { searchKnowledge, listChatHistory, createChatEntry, clearChatHistory } from '../../services/chatHistoryService';
import { ChatBubble } from './components/ChatBubble';
import { ChatInput } from './components/ChatInput';
import { SourceList } from './components/SourceList';
import { Button } from '../../components/shared/Button';
import { EmptyState } from '../../components/shared/EmptyState';
import { Loader } from '../../components/shared/Loader';

const WELCOME_MESSAGE = {
  isUser: false,
  message: `Hello! I'm your ClubHub AI Assistant. I can help you find information about:

• Clubs at FPT University
• Upcoming events and workshops
• Knowledge articles and meeting minutes
• Announcements from clubs

Just ask me anything in natural language!`,
  timestamp: new Date().toISOString(),
};

export default function AIChatPage() {
  const { profile, isDemo } = useAuth();
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [currentSources, setCurrentSources] = useState([]);
  const [showSources, setShowSources] = useState(false);
  const bottomRef = useRef(null);
  const chatRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showSources]);

  const handleSend = async (query) => {
    if (!query.trim()) return;

    const userMsg = { isUser: true, message: query, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setShowSources(false);

    try {
      const results = await searchKnowledge(query, { profileId: profile?.id });
      let answer = results.answer || '';
      const sources = results.sources || [];

      if (!answer) {
        answer = `I couldn't find specific information about "${query}" in the knowledge base.\n\nTry asking about:\n• Specific clubs or club activities\n• Events and workshops\n• Knowledge articles or meeting minutes\n• Club announcements and policies`;
      }

      const aiMsg = { isUser: false, message: answer, timestamp: new Date().toISOString() };
      setMessages((prev) => [...prev, aiMsg]);

      if (sources.length > 0) {
        setCurrentSources(sources);
        setShowSources(true);
      }

      if (profile?.id && !isDemo) {
        await createChatEntry(profile.id, { question: query, answer });
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          isUser: false,
          message: 'Sorry, I encountered an error while searching. Please try again.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    setMessages([WELCOME_MESSAGE]);
    setCurrentSources([]);
    setShowSources(false);
    if (profile?.id && !isDemo) {
      await clearChatHistory(profile.id);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(90deg, #0E4B43, #3B82F6)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 2a10 10 0 100 20 10 10 0 000-20z"/>
              <path d="M12 8v4m0 4h.01"/>
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-secondary-100">AI Assistant</h1>
            <p className="text-xs" style={{ color: 'rgba(244,241,234,0.4)' }}>
              Powered by ClubHub Knowledge Base
            </p>
          </div>
        </div>
        {messages.length > 1 && (
          <Button variant="ghost" size="sm" onClick={handleClear}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
            Clear Chat
          </Button>
        )}
      </div>

      {/* Chat messages */}
      <div
        ref={chatRef}
        className="flex-1 overflow-y-auto px-6 py-4"
        style={{ backgroundColor: '#0B1220' }}
      >
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          {messages.map((msg, i) => (
            <div key={i}>
              <ChatBubble {...msg} />
              {msg.isUser === false && i === messages.length - 1 && showSources && currentSources.length > 0 && (
                <SourceList sources={currentSources} />
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0E4B43, #3B82F6)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M12 2a10 10 0 100 20 10 10 0 000-20z"/>
                </svg>
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-bl-none" style={{ backgroundColor: '#223148' }}>
                <div className="flex gap-1">
                  {[0, 1, 2].map((j) => (
                    <div
                      key={j}
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: '#22C55E',
                        animation: `typingDot 1.4s ease-in-out ${j * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.length === 1 && (
            <EmptyState
              title="Start a conversation"
              description="Ask me anything about clubs, events, workshops, or any topic from the ClubHub knowledge base."
              className="py-12"
            />
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={loading} />

      {/* Typing animation keyframes */}
      <style>{`
        @keyframes typingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
