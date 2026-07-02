export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      {icon && <div className="text-4xl opacity-60">{icon}</div>}
      <h3 className="text-lg font-semibold text-secondary-100">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm text-secondary-300">{description}</p>
      )}
      {action}
    </div>
  );
}
