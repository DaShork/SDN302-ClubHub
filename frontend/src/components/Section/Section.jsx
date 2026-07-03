import { cn } from '@/lib/utils.js';

const toneStyles = {
  cream: { background: '#F4F1EA', color: '#06231D' },
  sand: { background: '#E8E2D8', color: '#06231D' },
  dark: { background: '#06231D', color: '#F4F1EA' },
  white: { background: '#FFFFFF', color: '#06231D' },
};

export default function Section({ tone = 'cream', children, className, container = true }) {
  const style = toneStyles[tone] ?? toneStyles.cream;
  return (
    <section style={style} className={cn('py-20 md:py-24', className)}>
      {container ? (
        <div className="max-w-[1280px] mx-auto px-6">{children}</div>
      ) : (
        children
      )}
    </section>
  );
}