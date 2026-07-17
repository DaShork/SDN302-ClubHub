import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Play, Users, Calendar, Clock, MapPin, ChevronDown } from 'lucide-react';
import { StatusBadge } from '@/components';
import './HeroSection.css';

const STATS = [
  { value: '42+', label: 'Active Clubs' },
  { value: '3,800+', label: 'Student Members' },
  { value: '120+', label: 'Events This Year' },
  { value: '950+', label: 'Knowledge Articles' },
];

export default function HeroSection() {
  return (
    <section className="hero">
      <div className="hero__glow1" />
      <div className="hero__glow2" />

      <div className="hero__inner">
        <div className="hero__grid">
          <div className="hero__copy">
            <div className="hero__badge">
              <Sparkles size={14} className="hero__badge-icon" />
              <span className="hero__badge-text">FPT University Club Platform</span>
            </div>

            <div className="hero__headline-block">
              <h1 className="hero__title">
                Discover Your
                <span className="hero__title-gradient">Community</span>
                at FPTU
              </h1>
              <p className="hero__subtitle">
                ClubHub is the all-in-one platform connecting FPT University students with clubs,
                events, knowledge resources, and an AI assistant — all in one place.
              </p>
            </div>

            <div className="hero__cta-row">
              <Link to="/clubs" className="hero__btn-primary">
                Explore Clubs <ArrowRight size={18} />
              </Link>
              <Link to="/ai" className="hero__btn-secondary">
                <Play size={16} /> Try AI Assistant
              </Link>
            </div>

            <div className="hero__stats">
              {STATS.map((s) => (
                <div key={s.label} className="hero__stat-item">
                  <div className="hero__stat-value">{s.value}</div>
                  <div className="hero__stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="hero__visual">
            <div className="hero__visual-card hero__featured-card">
              <div className="hero__featured-head">
                <span className="hero__featured-eyebrow">Featured Club</span>
                <StatusBadge status="Recruiting" />
              </div>
              <div className="hero__featured-emoji">🤖</div>
              <div>
                <h3 className="hero__featured-title">FPT Robotics Club</h3>
                <p className="hero__featured-desc">Building the future through robotics and automation.</p>
              </div>
              <div className="hero__featured-meta">
                <Users size={14} className="hero__featured-meta-icon" />
                148 members
              </div>
              <button className="hero__featured-btn">Join Club</button>
            </div>

            <div className="hero__visual-card hero__event-card">
              <div className="hero__event-tag">
                <Calendar size={12} /> Upcoming Event
              </div>
              <h4 className="hero__event-title">Tech Innovation Summit 2026</h4>
              <div className="hero__event-meta">
                <Clock size={11} /> July 15, 2026 · 08:00 – 17:00
              </div>
              <div className="hero__event-meta">
                <MapPin size={11} /> Hall A, FPT University HCM
              </div>
              <div className="hero__avatars">
                {['🧑‍💻', '👩‍🎨', '🧑‍🔬', '👨‍🚀'].map((e, i) => (
                  <div key={i} className="hero__avatar">{e}</div>
                ))}
                <div className="hero__avatar hero__avatar--count">+</div>
              </div>
            </div>

            <div className="hero__visual-card hero__ai-badge">
              <div className="hero__ai-icon-wrap">
                <Sparkles size={18} className="hero__ai-icon" />
              </div>
              <div>
                <div className="hero__ai-text-main">AI Assistant</div>
                <div className="hero__ai-text-sub">Ask anything about clubs</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="hero__scroll">
        <span className="hero__scroll-text">Scroll to explore</span>
        <ChevronDown size={16} className="hero__scroll-icon" />
      </div>
    </section>
  );
}