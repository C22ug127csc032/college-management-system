import React from 'react';

export default function ListControls({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  sortValue,
  onSortChange,
  sortOptions = [],
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  resultCount,
  extraFilters,
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
        {typeof searchValue === 'string' && onSearchChange && (
          <input
            className="input w-64"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={e => onSearchChange(e.target.value)}
          />
        )}

        {sortOptions.length > 0 && onSortChange && (
          <select
            className="input w-48"
            value={sortValue}
            onChange={e => onSortChange(e.target.value)}
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}

        {onPageSizeChange && (
          <select
            className="input w-32"
            value={pageSize}
            onChange={e => onPageSizeChange(Number(e.target.value))}
          >
            {pageSizeOptions.map(option => (
              <option key={option} value={option}>
                {option} / page
              </option>
            ))}
          </select>
        )}

        {extraFilters}
      </div>

      {typeof resultCount === 'number' && (
        <p className="text-xs text-gray-500">
          {resultCount} result{resultCount !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
