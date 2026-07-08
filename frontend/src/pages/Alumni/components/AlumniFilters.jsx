import { Input } from '../../../components/shared/Input';

export function AlumniFilters({ searchQuery, onSearchChange, year, onYearChange, years = [] }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1">
        <Input
          placeholder="Search by name or company..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <select
        value={year || ''}
        onChange={(e) => onYearChange(e.target.value || null)}
        className="input-base w-full sm:w-40"
      >
        <option value="">All Years</option>
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  );
}
