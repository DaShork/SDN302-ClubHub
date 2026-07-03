import { BookOpen } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout.jsx';
import { PagePlaceholder } from '@/components';

export default function KnowledgePage() {
  return (
    <MainLayout>
      <PagePlaceholder
        icon={BookOpen}
        eyebrow="Knowledge Base"
        title="Learn from the Community"
        description="Guides, templates and best practices — written by FPTU club leaders for FPTU students."
        features={[
          { icon: '📚', title: 'Articles & Guides', desc: 'How-tos, tutorials and best practices.', bg: '#E8F5F0' },
          { icon: '📋', title: 'Templates', desc: 'Reusable docs: meeting minutes, proposals, reports.', bg: '#EFF6FF' },
          { icon: '🔍', title: 'Smart Search', desc: 'Find any document in seconds.', bg: '#F5F3FF' },
          { icon: '✍️', title: 'Rich Authoring', desc: 'Write with markdown and media support.', bg: '#FFFBEB' },
          { icon: '🏷️', title: 'Tag & Category', desc: 'Organize knowledge across clubs.', bg: '#FEF2F2' },
          { icon: '🤖', title: 'AI-Powered Q&A', desc: 'Ask the AI Assistant anything.', bg: '#F0FDF4' },
        ]}
      />
    </MainLayout>
  );
}