import React from 'react';
import { FiChevronLeft, FiChevronRight, FiInbox, FiX } from './icons';
export { default as ListControls } from './ListControls';

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

export const EmptyState = ({ message = 'No data found', icon = <FiInbox /> }) => (
  <div className="float-in rounded-xl border border-dashed border-border bg-white px-6 py-16 text-center text-text-secondary shadow-sm">
    <div className="mb-4 flex justify-center text-4xl text-primary-300">{icon}</div>
    <p className="text-sm font-medium">{message}</p>
  </div>
);

export const PageHeader = ({ title, subtitle, action }) => (
  <div className="campus-panel float-in mb-6 flex flex-wrap items-start justify-between gap-4 px-6 py-5">
    <div className="max-w-3xl">
      <span className="institution-tag mb-3">Academic Workspace</span>
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="mt-1.5 max-w-2xl text-sm leading-6 text-text-secondary">{subtitle}</p>}
    </div>
    {action && <div className="self-center">{action}</div>}
  </div>
);

export const StatCard = ({ icon, label, value, color = 'blue', sub }) => {
  const colors = {
    blue: 'bg-primary-50 text-primary-600',
    green: 'bg-primary-50 text-primary-600',
    yellow: 'bg-red-50 text-accent',
    red: 'bg-red-50 text-accent',
    purple: 'bg-primary-50 text-primary-600',
  };
  return (
    <div className="stat-card">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${colors[color]}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-text-primary">{value}</p>
        <p className="text-sm text-text-secondary">{label}</p>
        {sub && <p className="mt-0.5 text-xs text-text-secondary">{sub}</p>}
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
        <div className="fixed inset-0 bg-slate-900/35" onClick={onClose} />
        <div className={`relative z-10 w-full overflow-hidden rounded-xl border border-border bg-white shadow-md ${sizes[size]}`}>
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
            <button onClick={onClose} className="text-xl leading-none text-text-secondary transition-colors hover:text-text-primary">
              <FiX />
            </button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
};

export const Table = ({ headers, children, empty }) => (
  <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-sm">
    <table className="w-full">
      <thead className="border-b border-border bg-primary-50">
        <tr>{headers.map((h, i) => <th key={i} className="table-header">{h}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-border">{children}</tbody>
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
  <div className="mb-4 flex flex-wrap gap-3 rounded-xl border border-border bg-white p-4 shadow-sm">{children}</div>
);

export const Pagination = ({ page, pages, onPage }) => {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center gap-2 justify-center mt-4">
      <button disabled={page === 1} onClick={() => onPage(page - 1)} className="btn-secondary px-3 py-1 text-sm disabled:opacity-40 flex items-center gap-1">
        <FiChevronLeft /> Prev
      </button>
      <span className="text-sm text-gray-600">Page {page} of {pages}</span>
      <button disabled={page === pages} onClick={() => onPage(page + 1)} className="btn-secondary px-3 py-1 text-sm disabled:opacity-40 flex items-center gap-1">
        Next <FiChevronRight />
      </button>
    </div>
  );
};
