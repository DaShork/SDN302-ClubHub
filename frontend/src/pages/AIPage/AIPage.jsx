import { Sparkles } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout.jsx';
import { PagePlaceholder } from '@/components';

export default function AIPage() {
  return (
    <MainLayout>
      <PagePlaceholder
        icon={Sparkles}
        eyebrow="AI Assistant"
        title="Your Personal Club Guide"
        description="Ask anything — from which clubs are recruiting, to finding workshop materials and event schedules."
        features={[
          { icon: '⚡', title: 'Instant Answers', desc: 'No more searching multiple platforms.', bg: '#E8F5F0' },
          { icon: '📚', title: 'Knowledge Search', desc: 'Access all club articles and docs.', bg: '#EFF6FF' },
          { icon: '🛡️', title: 'Accurate & Reliable', desc: 'Only answers from verified sources.', bg: '#F5F3FF' },
          { icon: '💬', title: 'Natural Language', desc: 'Just ask in your own words.', bg: '#FFFBEB' },
          { icon: '🌐', title: '24/7 Available', desc: 'Always-on assistant for students.', bg: '#FEF2F2' },
          { icon: '🔗', title: 'Citation Links', desc: 'Every answer links back to source material.', bg: '#F0FDF4' },
        ]}
      />
    </MainLayout>
  );
}