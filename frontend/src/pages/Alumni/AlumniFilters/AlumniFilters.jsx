import { Search, Calendar } from 'lucide-react';
import './AlumniFilters.css';

export function AlumniFilters({ searchQuery, onSearchChange, year, onYearChange, years = [] }) {
  return (
    <div className="alumni-filters">
      <div className="alumni-filters__search">
        <Search size={16} className="alumni-filters__search-icon" />
        <input
          type="text"
          placeholder="Search by name, company, or email..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="alumni-filters__search-input"
        />
      </div>

      <div className="alumni-filters__year">
        <Calendar size={16} className="alumni-filters__year-icon" />
        <select
          value={year || ''}
          onChange={(e) => onYearChange(e.target.value || null)}
          className="alumni-filters__year-select"
        >
          <option value="">All Years</option>
          {years.map((y) => (
            <option key={y} value={y}>
              Class of {y}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}