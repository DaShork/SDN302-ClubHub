import { useSearchParams } from 'react-router-dom';
import { X, Filter } from 'lucide-react';
import LeaderClubPicker from '@/components/LeaderClubPicker/LeaderClubPicker.jsx';
import './LeaderDashboardHeader.css';

const ALL = 'all';

/**
 * LeaderDashboardHeader — small banner shown at the top of every leader page.
 *
 * Props:
 *   - ledClubs:        [{ id, name, ... }]
 *   - eyebrow:         string shown above the title (e.g. "Leading 2 clubs")
 *   - title:           page title (string)
 *   - subtitle?:       optional subtitle
 *   - rightSlot?:      ReactNode rendered on the right (e.g. action buttons)
 *
 * Behaviour:
 *   - Renders eyebrow + title + optional subtitle.
 *   - Renders the LeaderClubPicker on the right when there are >=2 led clubs.
 *   - When the URL has `?club=<uuid>` we show a "Showing only: <name>" banner
 *     with a clear button. Removing the param returns the view to aggregated.
 */
export default function LeaderDashboardHeader({
  ledClubs = [],
  eyebrow,
  title,
  subtitle,
  rightSlot,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const filteredId = searchParams.get('club');
  const filteredClub =
    filteredId && filteredId !== ALL
      ? ledClubs.find((c) => c.id === filteredId)
      : null;

  const clearFilter = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('club');
    setSearchParams(params, { replace: true });
  };

  return (
    <header className="leader-dashboard-header">
      <div className="leader-dashboard-header__top">
        <div className="leader-dashboard-header__text">
          {eyebrow && (
            <p className="leader-dashboard-header__eyebrow">{eyebrow}</p>
          )}
          <h1 className="leader-dashboard-header__title">{title}</h1>
          {subtitle && (
            <p className="leader-dashboard-header__subtitle">{subtitle}</p>
          )}
        </div>

        <div className="leader-dashboard-header__actions">
          {rightSlot}
          <LeaderClubPicker ledClubs={ledClubs} />
        </div>
      </div>

      {filteredClub && (
        <div className="leader-dashboard-header__filter-banner">
          <span className="leader-dashboard-header__filter-icon">
            <Filter size={14} />
          </span>
          <span>
            Showing only: <strong>{filteredClub.name}</strong>
          </span>
          <button
            type="button"
            className="leader-dashboard-header__clear-btn"
            onClick={clearFilter}
            aria-label="Clear club filter"
          >
            <X size={14} /> Clear
          </button>
        </div>
      )}
    </header>
  );
}