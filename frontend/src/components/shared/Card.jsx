export function Card({ children, className = '', hover = true, as: Tag = 'div', ...props }) {
  return (
    <Tag
      className={`bg-card-bg rounded-[16px] border p-6 ${
        hover ? 'card-base' : ''
      } ${className}`}
      style={{ borderColor: 'rgba(255,255,255,0.05)' }}
      {...props}
    >
      {children}
    </Tag>
  );
}
