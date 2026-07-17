import { Link } from 'react-router-dom';

const COLUMNS = [
  {
    title: 'Platform',
    links: [
      { label: 'Club Directory', href: '/clubs' },
      { label: 'Events', href: '/events' },
      { label: 'Knowledge Base', href: '/knowledge' },
      { label: 'AI Assistant', href: '/ai' },
      { label: 'Announcements', href: '/announcements' },
    ],
  },
  {
    title: 'For Students',
    links: [
      { label: 'Explore Clubs', href: '/clubs' },
      { label: 'Register for Events', href: '/events' },
      { label: 'View Resources', href: '/knowledge' },
      { label: 'Alumni Directory', href: '/clubs' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Center', href: '/knowledge' },
      { label: 'Contact IC-PDP', href: '/announcements' },
      { label: 'Report an Issue', href: '/announcements' },
      { label: 'Privacy Policy', href: '/announcements' },
    ],
  },
];

export default function Footer() {
  return (
    <footer
      style={{
        background: '#06231D',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
      className="pt-16 pb-8"
    >
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                style={{ background: 'linear-gradient(135deg,#0E4B43,#22C55E)' }}
              >
                CH
              </div>
              <span className="text-white font-bold text-base">
                ClubHub <span style={{ color: '#4ADE80' }}>FPTU</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: '#D2C7B8' }}>
              The centralized platform for FPT University student clubs. Discover, connect, and grow.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-white font-semibold mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.href}
                      className="text-sm transition-colors"
                      style={{ color: '#D2C7B8' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#4ADE80')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#D2C7B8')}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: '#D2C7B8' }}
        >
          <p>© 2026 ClubHub FPTU — FPT University Club Management Platform</p>
          <p>Built with care for the FPT University community</p>
        </div>
      </div>
    </footer>
  );
}