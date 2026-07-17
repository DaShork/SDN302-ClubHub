import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function CTABanner({
  badge = 'Join 3,800+ FPT University students',
  title = 'Ready to Find Your',
  titleGradient = 'Community?',
  description = "Sign in with your FPT University account and start exploring clubs, events, and resources today.",
  primaryCta = { label: "Get Started — It's Free", href: '/signup' },
  secondaryCta = { label: 'Browse Clubs', href: '/clubs' },
}) {
  return (
    <section className="cta-section">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="cta-section__card">
          <div className="cta-section__grid" />
          <div className="cta-section__glow" />

          <div className="cta-section__content">
            <div className="cta-section__badge">
              <Sparkles size={14} className="cta-section__badge-icon" />
              <span className="cta-section__badge-text">{badge}</span>
            </div>

            <h2 className="cta-section__title">
              {title}
              <span className="cta-section__title-gradient">{titleGradient}</span>
            </h2>

            <p className="cta-section__description">{description}</p>

            <div className="cta-section__actions">
              <Link to={primaryCta.href} className="cta-section__btn cta-section__btn--primary">
                {primaryCta.label} <ArrowRight size={18} />
              </Link>
              <Link to={secondaryCta.href} className="cta-section__btn cta-section__btn--ghost">
                {secondaryCta.label}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .cta-section {
          padding: 96px 0;
          background: #E8E2D8;
        }
        .cta-section__card {
          position: relative;
          overflow: hidden;
          border-radius: 24px;
          padding: 80px 32px;
          text-align: center;
          background: linear-gradient(135deg, #06231D 0%, #223148 100%);
          box-shadow: 0 24px 80px rgba(6, 35, 29, 0.25);
        }
        @media (min-width: 768px) {
          .cta-section__card { padding: 96px 64px; }
        }
        .cta-section__grid {
          position: absolute;
          inset: 0;
          border-radius: 24px;
          background-image:
            linear-gradient(rgba(34, 197, 94, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 197, 94, 0.04) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }
        .cta-section__glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 384px;
          height: 384px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(34, 197, 94, 0.10) 0%, transparent 70%);
          pointer-events: none;
        }
        .cta-section__content {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 24px;
          align-items: center;
        }
        .cta-section__badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 999px;
          border: 1px solid rgba(34, 197, 94, 0.30);
          background: rgba(34, 197, 94, 0.10);
        }
        .cta-section__badge-icon { color: #4ADE80; }
        .cta-section__badge-text { color: #4ADE80; font-size: 14px; font-weight: 500; }
        .cta-section__title {
          font-size: clamp(32px, 4vw, 48px);
          font-weight: 700;
          line-height: 1.15;
          color: #ffffff;
          margin: 0;
        }
        .cta-section__title-gradient {
          display: block;
          background: linear-gradient(90deg, #4ADE80, #22C55E);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
        }
        .cta-section__description {
          color: #D2C7B8;
          font-size: 18px;
          max-width: 560px;
          margin: 0;
        }
        .cta-section__actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 16px;
          margin-top: 16px;
        }
        .cta-section__btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 16px 40px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 15px;
          transition: all 0.2s ease;
        }
        .cta-section__btn--primary {
          background: linear-gradient(90deg, #0E4B43, #22C55E);
          color: #ffffff;
        }
        .cta-section__btn--primary:hover {
          opacity: 0.9;
          box-shadow: 0 0 40px rgba(34, 197, 94, 0.35);
        }
        .cta-section__btn--ghost {
          color: #4ADE80;
          border: 1px solid rgba(34, 197, 94, 0.40);
          background: transparent;
        }
        .cta-section__btn--ghost:hover {
          background: rgba(34, 197, 94, 0.08);
        }
      `}</style>
    </section>
  );
}