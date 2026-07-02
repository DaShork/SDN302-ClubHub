import { Link } from 'react-router-dom';
import './AboutSection.css';

const blocks = [
  {
    icon: '🔍',
    title: 'Discover & Connect',
    desc: 'Browse all 42 clubs across 8 categories. Find your people in seconds.',
  },
  {
    icon: '🎟️',
    title: 'Host & Attend Events',
    desc: 'Register for workshops, tournaments, and meetups with one tap.',
  },
];

export default function AboutSection() {
  return (
    <section className="about">
      <div className="about__inner">
        <div className="about__head">
          <span className="about__eyebrow">About ClubHub</span>
          <h2 className="about__title">
            Built by students,<br />for FPTU students.
          </h2>
          <p className="about__lead">
            ClubHub is the central platform that brings every student club at FPT University
            together. Whether you're looking to join an existing club or organize your own —
            we've got the tools you need.
          </p>
        </div>

        <div className="about__grid">
          {blocks.map((b) => (
            <div key={b.title} className="about__card">
              <div className="about__card-icon">{b.icon}</div>
              <h3 className="about__card-title">{b.title}</h3>
              <p className="about__card-desc">{b.desc}</p>
            </div>
          ))}
        </div>

        <div className="about__cta">
          <Link to="/about" className="about__link">
            Learn more about how ClubHub works →
          </Link>
        </div>
      </div>
    </section>
  );
}