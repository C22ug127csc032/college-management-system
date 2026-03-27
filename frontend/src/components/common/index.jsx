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
  <div className="float-in rounded-[28px] border border-dashed border-slate-200 bg-white/70 px-6 py-16 text-center text-slate-400">
    <div className="mb-4 flex justify-center text-4xl text-slate-300">{icon}</div>
    <p className="text-sm font-medium">{message}</p>
  </div>
);

export const PageHeader = ({ title, subtitle, action }) => (
  <div className="campus-panel soft-grid float-in mb-6 flex flex-wrap items-start justify-between gap-4 px-6 py-5">
    <div className="max-w-3xl">
      <span className="institution-tag mb-3">Academic Workspace</span>
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">{subtitle}</p>}
    </div>
    {action && <div className="self-center">{action}</div>}
  </div>
);

export const StatCard = ({ icon, label, value, color = 'blue', sub }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="stat-card">
      <div className={`h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${colors[color]}`}>{icon}</div>
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
        <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm" onClick={onClose} />
        <div className={`relative w-full overflow-hidden rounded-[30px] border border-white/70 bg-white shadow-[0_24px_90px_-28px_rgba(15,23,42,0.45)] ${sizes[size]} z-10`}>
          <div className="soft-grid flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button onClick={onClose} className="text-xl leading-none text-gray-400 transition-colors hover:text-gray-600">
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
  <div className="overflow-x-auto rounded-[26px] border border-slate-100 bg-white/95 shadow-[0_16px_40px_-30px_rgba(15,23,42,0.35)]">
    <table className="w-full">
      <thead className="bg-slate-50/95 border-b border-slate-100">
        <tr>{headers.map((h, i) => <th key={i} className="table-header">{h}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-slate-50">{children}</tbody>
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
  <div className="soft-grid mb-4 flex flex-wrap gap-3 rounded-[24px] border border-slate-100 bg-white/85 p-4 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.28)]">{children}</div>
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
