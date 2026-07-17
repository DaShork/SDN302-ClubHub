import { HeroSection, CTABanner } from '@/components';
import ClubsDirectory from './components/ClubsDirectory/ClubsDirectory.jsx';

export default function ClubsPage() {
  return (
    <>
      <HeroSection
        variant="clubs"
        eyebrow="42 active clubs"
        title="Club"
        titleGradient="Directory"
        subtitle="Discover student communities at FPT University. Browse by category, find your people, and join clubs that match your interests."
      />

      <ClubsDirectory />

      <CTABanner
        badge="Can't find your fit?"
        title="Start your own"
        titleGradient="club at FPTU"
        description="Have an idea for a new student community? Apply to register a club with IC-PDP and bring your vision to life."
        primaryCta={{ label: 'Apply for a New Club', href: '/signup' }}
        secondaryCta={{ label: 'Read the Guide', href: '/knowledge' }}
      />
    </>
  );
}