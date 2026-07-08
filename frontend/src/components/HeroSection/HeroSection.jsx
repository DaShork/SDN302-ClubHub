import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import './HeroSection.css';

/* Shared hero section, used by every page that follows the Page-Based
   Architecture's recommended layout:
     Navbar → Hero Section (optional) → Page Content → Footer.

   The HomePage also has its own HeroSection (a richer, more elaborate
   one) which renders the visual cards cluster. This shared version is
   the lighter, page-specific variant — a single eyebrow badge, title
   with optional gradient accent, subtitle and optional CTA row.

   Visual language is taken from the HomePage hero:
     - background #F4F1EA
     - dot pattern overlay (radial-gradient #D2C7B8 / 28px / 0.35 opacity)
     - corner glows
     - "pill" eyebrow badge with brand teal
     - 60px / 700 / #06231D title
     - linear-gradient(90deg, #0E4B43, #22C55E) accent text
     - 1280px container, 96px vertical padding

   Variants change only the right-side decoration and the eyebrow icon
   so each page still has a distinctive visual cue while sharing the
   rest of the chrome. */

const VARIANT_META = {
  clubs: {
    eyebrowIcon: '👥',
    visualEmoji: '🧑‍🤝‍🧑',
    visualLabel: '42 clubs, 8 categories',
  },
  events: {
    eyebrowIcon: '📅',
    visualEmoji: '🎤',
    visualLabel: '120+ events this year',
  },
  knowledge: {
    eyebrowIcon: '📚',
    visualEmoji: '🧠',
    visualLabel: '950+ knowledge articles',
  },
  announcements: {
    eyebrowIcon: '📣',
    visualEmoji: '📌',
    visualLabel: 'Pin & broadcast in seconds',
  },
  workshops: {
    eyebrowIcon: '🛠️',
    visualEmoji: '⚙️',
    visualLabel: 'Hands-on learning sessions',
  },
  documents: {
    eyebrowIcon: '📁',
    visualEmoji: '🗂️',
    visualLabel: 'Shared club resources',
  },
  gallery: {
    eyebrowIcon: '🖼️',
    visualEmoji: '🎞️',
    visualLabel: 'Relive club moments',
  },
  ai: {
    eyebrowIcon: '🤖',
    visualEmoji: '✨',
    visualLabel: 'AI-powered answers',
  },
  myclubs: {
    eyebrowIcon: '⭐',
    visualEmoji: '🎯',
    visualLabel: 'Your joined communities',
  },
  myregistrations: {
    eyebrowIcon: '🎟️',
    visualEmoji: '📆',
    visualLabel: 'Your upcoming events',
  },
  checkin: {
    eyebrowIcon: '📱',
    visualEmoji: '✅',
    visualLabel: 'QR check-in for events',
  },
  club: {
    eyebrowIcon: '🏛️',
    visualEmoji: '🏠',
    visualLabel: 'Inside your club',
  },
  dashboard: {
    eyebrowIcon: '📊',
    visualEmoji: '📈',
    visualLabel: 'Live operational metrics',
  },
  members: {
    eyebrowIcon: '👥',
    visualEmoji: '🧑‍💼',
    visualLabel: 'Manage your members',
  },
  profile: {
    eyebrowIcon: '👤',
    visualEmoji: '🙋',
    visualLabel: 'Your personal space',
  },
  settings: {
    eyebrowIcon: '⚙️',
    visualEmoji: '🔒',
    visualLabel: 'Account & preferences',
  },
};

export default function HeroSection({
  variant = 'clubs',
  eyebrow,
  title,
  titleGradient,
  subtitle,
  primaryCta,
  secondaryCta,
  meta,
}) {
  const meta4 = VARIANT_META[variant] ?? VARIANT_META.clubs;

  return (
    <section className={`page-hero page-hero--${variant}`}>
      <div className="page-hero__glow page-hero__glow--green" />
      <div className="page-hero__glow page-hero__glow--blue" />

      <div className="page-hero__inner">
        <div className="page-hero__copy">
          <div className="page-hero__badge">
            <span className="page-hero__badge-icon">{meta4.eyebrowIcon}</span>
            <span className="page-hero__badge-text">{eyebrow ?? meta4.visualLabel}</span>
          </div>

          <h1 className="page-hero__title">
            {title}
            {titleGradient && (
              <span className="page-hero__title-gradient">{titleGradient}</span>
            )}
          </h1>

          {subtitle && <p className="page-hero__subtitle">{subtitle}</p>}

          {(primaryCta || secondaryCta) && (
            <div className="page-hero__cta-row">
              {primaryCta && (
                <Link to={primaryCta.href} className="page-hero__btn-primary">
                  {primaryCta.label}
                  <ArrowRight size={18} />
                </Link>
              )}
              {secondaryCta && (
                <Link to={secondaryCta.href} className="page-hero__btn-secondary">
                  {secondaryCta.label}
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="page-hero__visual" aria-hidden="true">
          <div className="page-hero__visual-card">
            <span className="page-hero__visual-emoji">{meta4.visualEmoji}</span>
            <span className="page-hero__visual-label">{meta4.visualLabel}</span>
          </div>
        </div>
      </div>
    </section>
  );
}