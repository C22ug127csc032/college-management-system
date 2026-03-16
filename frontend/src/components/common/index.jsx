import React from 'react';

export const Spinner = ({ size = 'md' }) => {
  const s = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }[size];
  return <div className={`animate-spin rounded-full border-b-2 border-primary-600 ${s}`} />;
};

export const PageSpinner = () => (
  <div className="flex justify-center items-center py-20"><Spinner size="lg" /></div>
);

export const StatusBadge = ({ status }) => {
  const map = {
    active: 'badge-green', inactive: 'badge-gray', paid: 'badge-green',
    partial: 'badge-yellow', pending: 'badge-yellow', overdue: 'badge-red',
    approved: 'badge-green', rejected: 'badge-red', success: 'badge-green',
    failed: 'badge-red', returned: 'badge-blue', issued: 'badge-yellow',
    graduated: 'badge-blue', dropped: 'badge-gray',
  };
  return <span className={map[status] || 'badge-gray'}>{status?.replace('_', ' ')}</span>;
};

export const EmptyState = ({ message = 'No data found', icon = '📭' }) => (
  <div className="text-center py-16 text-gray-400">
    <div className="text-4xl mb-3">{icon}</div>
    <p className="text-sm">{message}</p>
  </div>
);

export const PageHeader = ({ title, subtitle, action }) => (
  <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
    <div>
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

export const StatCard = ({ icon, label, value, color = 'blue', sub }) => {
  const colors = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red:    'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="stat-card">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${colors[color]}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
};

export const Modal = ({ open, onClose, title, children, size = 'md' }) => {
  if (!open) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className={`relative bg-white rounded-xl shadow-xl w-full ${sizes[size]} z-10`}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
};

export const Table = ({ headers, children, empty }) => (
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-gray-50 border-b border-gray-100">
        <tr>{headers.map((h, i) => <th key={i} className="table-header">{h}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-gray-50">{children}</tbody>
    </table>
    {empty}
  </div>
);

export const FormField = ({ label, error, children, required }) => (
  <div>
    <label className="label">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
    {children}
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

export const FilterBar = ({ children }) => (
  <div className="flex flex-wrap gap-3 mb-4 p-4 bg-gray-50 rounded-xl border border-gray-100">{children}</div>
);

export const Pagination = ({ page, pages, onPage }) => {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center gap-2 justify-center mt-4">
      <button disabled={page === 1} onClick={() => onPage(page - 1)} className="btn-secondary px-3 py-1 text-sm disabled:opacity-40">← Prev</button>
      <span className="text-sm text-gray-600">Page {page} of {pages}</span>
      <button disabled={page === pages} onClick={() => onPage(page + 1)} className="btn-secondary px-3 py-1 text-sm disabled:opacity-40">Next →</button>
    </div>
  );
};
