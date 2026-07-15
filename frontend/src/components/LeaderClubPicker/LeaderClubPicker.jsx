import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Crown } from 'lucide-react';
import './LeaderClubPicker.css';

const ALL = 'all';

/**
 * LeaderClubPicker — dropdown bound to the URL search param `?club=<uuid|all>`.
 *
 * Props:
 *   - ledClubs: Array<{ id, name }>  — clubs the current user leads
 *   - value?:    string               — controlled override (optional)
 *   - onChange?: (next: string) => void
 *
 * Reads from / writes to `?club=` in the current URL. Default value is "all",
 * which signals "show aggregated data across every led club".
 *
 * The dropdown is intentionally compact so it can sit inside a page header
 * next to a title without taking over the visual hierarchy. When only one
 * club is being led we hide the picker entirely — there's nothing to switch
 * to.
 */
export default function LeaderClubPicker({ ledClubs = [], value, onChange }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlValue = searchParams.get('club') || ALL;
  const current = value ?? urlValue;

  const options = useMemo(() => {
    return [
      { id: ALL, name: 'All my clubs' },
      ...ledClubs.map((c) => ({ id: c.id, name: c.name })),
    ];
  }, [ledClubs]);

  // Hide the picker when there's only one led club (or none yet).
  if (ledClubs.length < 2) {
    return null;
  }

  const handleChange = (e) => {
    const next = e.target.value;
    if (onChange) {
      onChange(next);
      return;
    }
    const params = new URLSearchParams(searchParams);
    if (next === ALL) {
      params.delete('club');
    } else {
      params.set('club', next);
    }
    setSearchParams(params, { replace: true });
  };

  return (
    <label className="leader-club-picker">
      <span className="leader-club-picker__icon" aria-hidden="true">
        <Crown size={14} />
      </span>
      <span className="leader-club-picker__label">Club</span>
      <select
        className="leader-club-picker__select"
        value={current}
        onChange={handleChange}
        aria-label="Filter dashboard by club"
      >
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.name}
          </option>
        ))}
      </select>
    </label>
  );
}