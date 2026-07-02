export default function Input({
  label,
  error,
  className = "",
  id,
  ...props
}) {
  const inputId = id ?? props.name;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm text-secondary-200">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`h-12 w-full rounded-xl border border-white/10 bg-primary-600 px-4 text-secondary-100 placeholder:text-secondary-300/60 focus:border-accent-green focus:outline-none ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
