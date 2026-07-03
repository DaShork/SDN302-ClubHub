import { Users } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout.jsx';
import { CTABanner } from '@/components';
import ClubsDirectory from './components/ClubsDirectory/ClubsDirectory.jsx';

export default function ClubsPage() {
  return (
    <MainLayout>
      <section
        className="clubs-hero"
        style={{ background: '#F4F1EA' }}
      >
        <div className="max-w-[1280px] mx-auto px-6 py-20">
          <div className="clubs-hero__inner">
            <div className="clubs-hero__badge">
              <Users size={14} style={{ color: '#16685D' }} />
              <span className="clubs-hero__badge-text">42 active clubs</span>
            </div>

            <h1 className="clubs-hero__title" style={{ color: '#06231D' }}>
              Club
              <span className="clubs-hero__title-gradient">Directory</span>
            </h1>
            <p className="clubs-hero__subtitle" style={{ color: '#16685D' }}>
              Discover student communities at FPT University. Browse by category, find
              your people, and join clubs that match your interests.
            </p>
          </div>
        </div>

        <style>{`
          .clubs-hero {
            position: relative;
            overflow: hidden;
          }
          .clubs-hero::before {
            content: '';
            position: absolute;
            inset: 0;
            background-image: radial-gradient(circle, #D2C7B8 1px, transparent 1px);
            background-size: 28px 28px;
            opacity: 0.35;
            pointer-events: none;
          }
          .clubs-hero__inner {
            position: relative;
            max-width: 720px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
          }
          .clubs-hero__badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 6px 14px;
            border-radius: 999px;
            border: 1px solid rgba(22, 104, 93, 0.25);
            background: rgba(22, 104, 93, 0.07);
          }
          .clubs-hero__badge-text {
            font-size: 13px;
            font-weight: 500;
            color: #16685D;
          }
          .clubs-hero__title {
            font-size: clamp(36px, 5vw, 56px);
            font-weight: 700;
            line-height: 1.1;
            letter-spacing: -0.02em;
            margin: 0;
          }
          .clubs-hero__title-gradient {
            display: inline-block;
            margin-left: 12px;
            background: linear-gradient(90deg, #0E4B43, #22C55E);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            color: transparent;
          }
          .clubs-hero__subtitle {
            font-size: 18px;
            line-height: 1.6;
            margin: 0;
          }
        `}</style>
      </section>

      <ClubsDirectory />

      <CTABanner
        badge="Can't find your fit?"
        title="Start your own"
        titleGradient="club at FPTU"
        description="Have an idea for a new student community? Apply to register a club with IC-PDP and bring your vision to life."
        primaryCta={{ label: 'Apply for a New Club', href: '/signup' }}
        secondaryCta={{ label: 'Read the Guide', href: '/knowledge' }}
      />
    </MainLayout>
  );
}