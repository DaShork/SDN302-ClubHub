import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SectionHeader({
  eyebrow,
  title,
  description,
  ctaLabel,
  ctaHref,
  tone = 'green',
  align = 'left',
}) {
  return (
    <div
      className={`flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 ${
        align === 'center' ? 'text-center md:flex-col md:items-center' : ''
      }`}
    >
      <div className={align === 'center' ? 'max-w-2xl' : ''}>
        {eyebrow}
        <h2 className="text-3xl md:text-4xl font-bold leading-tight" style={{ color: '#06231D' }}>
          {title}
        </h2>
        {description && (
          <p className="mt-3 max-w-lg text-base" style={{ color: '#16685D' }}>
            {description}
          </p>
        )}
      </div>
      {ctaLabel && ctaHref && (
        <Link
          to={ctaHref}
          className="flex items-center gap-2 text-sm font-semibold hover:gap-3 transition-all"
          style={{ color: tone === 'blue' ? '#3B82F6' : tone === 'amber' ? '#D97706' : '#16685D' }}
        >
          {ctaLabel} <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}