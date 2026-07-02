export default function SectionEyebrow({ tone = 'green', children }) {
  const styles = {
    green: { color: '#16685D', bar: '#22C55E' },
    blue: { color: '#3B82F6', bar: '#3B82F6' },
    amber: { color: '#D97706', bar: '#F59E0B' },
  };
  const s = styles[tone] ?? styles.green;
  return (
    <div className="inline-flex items-center gap-2 mb-3">
      <div className="w-1 h-6 rounded-full" style={{ background: s.bar }} />
      <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: s.color }}>
        {children}
      </span>
    </div>
  );
}