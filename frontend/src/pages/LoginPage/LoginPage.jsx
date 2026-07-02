import { LogIn } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout.jsx';
import { PagePlaceholder } from '@/components';

export default function LoginPage() {
  return (
    <MainLayout>
      <PagePlaceholder
        icon={LogIn}
        eyebrow="Authentication"
        title="Sign in to ClubHub"
        description="Use your FPT University account to access clubs, events and resources."
        features={[
          { icon: '🔐', title: 'Secure Auth', desc: 'Email & password backed by Supabase.', bg: '#E8F5F0' },
          { icon: '🎓', title: 'FPT SSO Ready', desc: 'Single sign-on with FPT email.', bg: '#EFF6FF' },
          { icon: '🛡️', title: 'Role-Based Access', desc: 'Six tiers from Student to Admin.', bg: '#F5F3FF' },
        ]}
      />
    </MainLayout>
  );
}