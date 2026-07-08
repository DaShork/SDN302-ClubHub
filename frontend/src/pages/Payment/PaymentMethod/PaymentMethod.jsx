import { CreditCard, Banknote, Building2 } from 'lucide-react';
import './PaymentMethod.css';

const METHODS = [
  {
    id: 'sandbox',
    label: 'Sandbox Payment',
    description: 'Simulated payment for MVP testing (auto-approved)',
    icon: CreditCard,
  },
  {
    id: 'bank_transfer',
    label: 'Bank Transfer',
    description: 'Transfer to club bank account (manual approval)',
    icon: Building2,
  },
  {
    id: 'cash',
    label: 'Cash Payment',
    description: 'Pay in cash to club treasurer (manual recording)',
    icon: Banknote,
  },
];

export function PaymentMethod({ value, onChange }) {
  return (
    <div className="payment-method">
      <p className="payment-method__title">Payment Method</p>
      <div className="payment-method__list">
        {METHODS.map((method) => {
          const Icon = method.icon;
          const active = value === method.id;
          return (
            <label
              key={method.id}
              className={`payment-method__option ${active ? 'payment-method__option--active' : ''}`}
            >
              <input
                type="radio"
                name="payment-method"
                value={method.id}
                checked={active}
                onChange={() => onChange(method.id)}
                className="payment-method__radio"
              />
              <div className="payment-method__icon">
                <Icon size={20} />
              </div>
              <div className="payment-method__copy">
                <span className="payment-method__label">{method.label}</span>
                <span className="payment-method__desc">{method.description}</span>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}