import { UserPlus } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout.jsx';
import { PagePlaceholder } from '@/components';

export default function SignUpPage() {
  return (
    <MainLayout>
      <PagePlaceholder
        icon={UserPlus}
        eyebrow="Get Started"
        title="Create your ClubHub account"
        description="Join 3,800+ FPTU students discovering clubs, events and resources."
        features={[
          { icon: '🎉', title: "It's Free", desc: 'No cost for FPT University students.', bg: '#E8F5F0' },
          { icon: '⚡', title: 'Quick Setup', desc: 'Get started in under 2 minutes.', bg: '#EFF6FF' },
          { icon: '🌱', title: 'Grow With Us', desc: 'Build your campus presence over time.', bg: '#F5F3FF' },
        ]}
      />
    </MainLayout>
  );
}