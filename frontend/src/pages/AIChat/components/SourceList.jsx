const TYPE_LABELS = {
  article: 'Knowledge Article',
  meeting: 'Meeting Minutes',
  workshop: 'Workshop',
  announcement: 'Announcement',
};

const TYPE_COLORS = {
  article: '#3B82F6',
  meeting: '#F59E0B',
  workshop: '#22C55E',
  announcement: '#8B5CF6',
};

export function SourceList({ sources = [] }) {
  if (sources.length === 0) return null;

  return (
    <div className="mt-2 px-1">
      <p className="text-xs font-medium mb-2" style={{ color: 'rgba(244,241,234,0.4)' }}>
        Sources:
      </p>
      <div className="flex flex-col gap-1.5">
        {sources.map((s) => (
          <div
            key={s.id}
            className="flex items-start gap-2 px-3 py-2 rounded-lg border text-xs"
            style={{
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderColor: 'rgba(255,255,255,0.06)',
            }}
          >
            <span
              className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium"
              style={{
                backgroundColor: `${TYPE_COLORS[s.type] || '#666'}20`,
                color: TYPE_COLORS[s.type] || '#666',
              }}
            >
              {TYPE_LABELS[s.type] || s.type}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-secondary-100 truncate">{s.title}</p>
              {s.snippet && (
                <p className="mt-0.5 truncate" style={{ color: 'rgba(244,241,234,0.4)' }}>
                  {s.snippet}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
