const METHODS = [
  {
    id: 'sandbox',
    label: 'Sandbox Payment',
    description: 'Simulated payment for MVP testing (auto-approved)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
  },
  {
    id: 'bank_transfer',
    label: 'Bank Transfer',
    description: 'Transfer to club bank account (manual approval)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/>
      </svg>
    ),
  },
  {
    id: 'cash',
    label: 'Cash Payment',
    description: 'Pay in cash to club treasurer (manual recording)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
      </svg>
    ),
  },
];

export function PaymentMethod({ value, onChange }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium" style={{ color: 'rgba(244,241,234,0.7)' }}>
        Payment Method
      </p>
      {METHODS.map((method) => (
        <label
          key={method.id}
          className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
            value === method.id ? 'border-accent-green' : ''
          }`}
          style={{
            backgroundColor: value === method.id ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.02)',
            borderColor: value === method.id ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.06)',
          }}
        >
          <input
            type="radio"
            name="payment-method"
            value={method.id}
            checked={value === method.id}
            onChange={() => onChange(method.id)}
            className="mt-1 accent-accent-green"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span style={{ color: value === method.id ? '#22C55E' : '#F4F1EA' }}>{method.icon}</span>
              <span className="text-sm font-medium text-secondary-100">{method.label}</span>
            </div>
            <p className="text-xs" style={{ color: 'rgba(244,241,234,0.4)' }}>{method.description}</p>
          </div>
        </label>
      ))}
    </div>
  );
}
