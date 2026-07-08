import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Bot, Trash2, LogIn, ArrowRight, BookOpen, Megaphone, Wrench, FileText, ShieldCheck } from 'lucide-react';
import { Button, Card } from '@/components';
import { useAuth } from '@/hooks/useAuth.jsx';
import { searchKnowledge, listChatHistory, createChatEntry, clearChatHistory } from '@/services/chatHistoryService';
import { ChatBubble } from './ChatBubble/ChatBubble.jsx';
import { ChatInput } from './ChatInput/ChatInput.jsx';
import { SourceList } from './SourceList/SourceList.jsx';
import './AIPage.css';

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

const LANDING_FEATURES = [
  { icon: '⚡', title: 'Instant Answers', desc: 'No more searching multiple platforms.', bg: '#E8F5F0' },
  { icon: '📚', title: 'Knowledge Search', desc: 'Access all club articles and docs.', bg: '#EFF6FF' },
  { icon: '🛡️', title: 'Accurate & Reliable', desc: 'Only answers from verified sources.', bg: '#F5F3FF' },
  { icon: '💬', title: 'Natural Language', desc: 'Just ask in your own words.', bg: '#FFFBEB' },
  { icon: '🔗', title: 'Citation Links', desc: 'Every answer links back to source material.', bg: '#F0FDF4' },
  { icon: '🧭', title: 'Context-Aware', desc: 'Searches across clubs, events, workshops and announcements.', bg: '#FEF2F2' },
];

const KNOWLEDGE_SOURCES = [
  { icon: BookOpen, label: 'Knowledge Articles', color: '#3B82F6' },
  { icon: FileText, label: 'Meeting Minutes', color: '#F59E0B' },
  { icon: Wrench, label: 'Workshop Materials', color: '#22C55E' },
  { icon: Megaphone, label: 'Announcements', color: '#8B5CF6' },
];

export default function AIPage() {
  const { isAuthenticated, profile, profileId } = useAuth();

  if (isAuthenticated) {
    return <AIPageContent profile={profile} profileId={profileId} />;
  }
  return <AILanding />;
}

/* Landing — visible to signed-out visitors. Encourages them to sign in to chat. */
function AILanding() {
  return (
    <div className="ai-landing">
      <section className="py-24 relative overflow-hidden">
        <div
          className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(34, 197, 94, 0.08) 0%, transparent 70%)' }}
        />
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
              style={{ background: 'linear-gradient(135deg, #0E4B43, #22C55E)' }}
            >
              <Sparkles size={28} className="text-white" />
            </div>

            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-1 h-6 rounded-full" style={{ background: '#22C55E' }} />
              <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: '#16685D' }}>
                AI Assistant
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold leading-tight" style={{ color: '#06231D' }}>
              Your Personal <span style={{ color: '#22C55E' }}>Club Guide</span>
            </h1>
            <p className="mt-4 text-lg leading-relaxed" style={{ color: '#16685D' }}>
              Ask anything — from which clubs are recruiting, to finding workshop materials
              and event schedules. Sign in to start chatting with your knowledge base.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-white font-semibold transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(90deg, #0E4B43, #22C55E)' }}
              >
                <LogIn size={18} /> Sign in to start chatting
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold transition-all hover:bg-white"
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(22, 104, 93, 0.3)',
                  color: '#16685D',
                }}
              >
                Create an account <ArrowRight size={18} />
              </Link>
            </div>

            <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full border" style={{ borderColor: 'rgba(22, 104, 93, 0.25)', background: 'rgba(22, 104, 93, 0.07)' }}>
              <ShieldCheck size={14} style={{ color: '#16685D' }} />
              <span className="text-sm font-medium" style={{ color: '#16685D' }}>
                Authentication required to preserve your chat history
              </span>
            </div>
          </div>

          <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {LANDING_FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl p-6 space-y-3"
                style={{
                  background: '#ffffff',
                  border: '1px solid rgba(6, 35, 29, 0.07)',
                  boxShadow: '0 4px 16px rgba(6, 35, 29, 0.06)',
                }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: f.bg }}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-base" style={{ color: '#06231D' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#16685D' }}>{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 max-w-3xl mx-auto">
            <p className="text-center text-sm font-semibold uppercase tracking-widest mb-6" style={{ color: '#16685D' }}>
              Searches across your club knowledge base
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {KNOWLEDGE_SOURCES.map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.label}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white"
                    style={{ border: '1px solid rgba(6, 35, 29, 0.07)' }}
                  >
                    <Icon size={16} style={{ color: s.color }} />
                    <span className="text-sm font-medium" style={{ color: '#06231D' }}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* Chat — visible once the user is signed in. */
function AIPageContent({ profile, profileId }) {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [currentSources, setCurrentSources] = useState([]);
  const [showSources, setShowSources] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showSources]);

  useEffect(() => {
    if (!profileId || historyLoaded) return;
    let cancelled = false;
    (async () => {
      const { data } = await listChatHistory(profileId).catch(() => ({ data: [] }));
      if (cancelled) return;
      if (Array.isArray(data) && data.length > 0) {
        const restored = [...data]
          .reverse()
          .flatMap((row) => [
            { isUser: true, message: row.question, timestamp: row.created_at },
            { isUser: false, message: row.answer, timestamp: row.created_at },
          ]);
        setMessages([WELCOME_MESSAGE, ...restored]);
      }
      setHistoryLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [profileId, historyLoaded]);

  const handleSend = async (query) => {
    if (!query.trim()) return;

    const userMsg = { isUser: true, message: query, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setShowSources(false);

    try {
      const results = await searchKnowledge(query, { profileId });
      let answer = results.answer || '';
      const sources = results.sources || [];

      if (!answer) {
        answer = `I couldn't find specific information about "${query}" in the knowledge base.

Try asking about:
• Specific clubs or club activities
• Events and workshops
• Knowledge articles or meeting minutes
• Club announcements and policies`;
      }

      const aiMsg = { isUser: false, message: answer, timestamp: new Date().toISOString() };
      setMessages((prev) => [...prev, aiMsg]);

      if (sources.length > 0) {
        setCurrentSources(sources);
        setShowSources(true);
      }

      if (profile?.id) {
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
    if (profile?.id) {
      await clearChatHistory(profile.id).catch(() => null);
    }
  };

  return (
    <div className="aichat-page">
      <Card className="aichat-page__card">
        <header className="aichat-page__head">
          <div className="aichat-page__brand">
            <div className="aichat-page__avatar">
              <Sparkles size={20} color="#fff" />
            </div>
            <div>
              <h1 className="aichat-page__title">AI Assistant</h1>
              <p className="aichat-page__subtitle">
                {profile?.full_name
                  ? `Hi ${profile.full_name.split(' ')[0]} • Powered by ClubHub Knowledge Base`
                  : 'Powered by ClubHub Knowledge Base'}
              </p>
            </div>
          </div>
          {messages.length > 1 && (
            <Button variant="ghost" size="sm" onClick={handleClear} leftIcon={<Trash2 size={14} />}>
              Clear chat
            </Button>
          )}
        </header>

        <div className="aichat-page__messages">
          <div className="aichat-page__messages-inner">
            {messages.map((msg, i) => (
              <div key={i} className="aichat-page__msg">
                <ChatBubble {...msg} />
                {msg.isUser === false && i === messages.length - 1 && showSources && currentSources.length > 0 && (
                  <div className="aichat-page__sources">
                    <SourceList sources={currentSources} />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="aichat-page__typing">
                <div className="aichat-page__typing-avatar">
                  <Bot size={14} color="#fff" />
                </div>
                <div className="aichat-page__typing-bubble">
                  <span /><span /><span />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        <ChatInput onSend={handleSend} disabled={loading} />
      </Card>
    </div>
  );
}
