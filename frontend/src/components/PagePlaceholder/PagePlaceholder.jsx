import { Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PagePlaceholder({ eyebrow, title, description, features = [], icon: Icon }) {
  return (
    <div style={{ background: '#F4F1EA', minHeight: 'calc(100vh - 80px)' }}>
      <section className="py-24 relative overflow-hidden">
        <div
          className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(34, 197, 94, 0.08) 0%, transparent 70%)' }}
        />
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center">
            {Icon && (
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
                style={{ background: 'linear-gradient(135deg, #0E4B43, #22C55E)' }}
              >
                <Icon size={28} className="text-white" />
              </div>
            )}

            {eyebrow && (
              <div className="inline-flex items-center gap-2 mb-4">
                <div className="w-1 h-6 rounded-full" style={{ background: '#22C55E' }} />
                <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: '#16685D' }}>
                  {eyebrow}
                </span>
              </div>
            )}

            <h1 className="text-4xl md:text-5xl font-bold leading-tight" style={{ color: '#06231D' }}>
              {title}
            </h1>
            {description && (
              <p className="mt-4 text-lg leading-relaxed" style={{ color: '#16685D' }}>
                {description}
              </p>
            )}

            <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full border" style={{ borderColor: 'rgba(22, 104, 93, 0.25)', background: 'rgba(22, 104, 93, 0.07)' }}>
              <Sparkles size={14} style={{ color: '#16685D' }} />
              <span className="text-sm font-medium" style={{ color: '#16685D' }}>
                Coming soon — MVP roadmap
              </span>
            </div>
          </div>

          {features.length > 0 && (
            <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="rounded-2xl p-6 space-y-3"
                  style={{
                    background: '#ffffff',
                    border: '1px solid rgba(6, 35, 29, 0.07)',
                    boxShadow: '0 4px 16px rgba(6, 35, 29, 0.06)',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: f.bg ?? '#E8F5F0' }}
                  >
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-base" style={{ color: '#06231D' }}>
                    {f.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#16685D' }}>
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-16 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-white font-semibold transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(90deg, #0E4B43, #22C55E)' }}
            >
              Back to Home <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}