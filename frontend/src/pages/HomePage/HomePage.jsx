import HeroSection from './components/HeroSection/HeroSection.jsx';
import CategorySection from './components/CategorySection/CategorySection.jsx';
import ClubsDirectory from '../ClubsPage/components/ClubsDirectory/ClubsDirectory.jsx';
import UpcomingEvents from './components/UpcomingEvents/UpcomingEvents.jsx';
import AboutSection from './components/AboutSection/AboutSection.jsx';
import AISection from './components/AISection/AISection.jsx';
import KnowledgeSection from './components/KnowledgeSection/KnowledgeSection.jsx';
import { CTABanner } from '@/components';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <CategorySection />
      <ClubsDirectory variant="homepage" />
      <UpcomingEvents />
      <AISection />
      <KnowledgeSection />
      <CTABanner />
    </>
  );
}