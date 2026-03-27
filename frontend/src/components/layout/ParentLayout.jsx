import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiCalendar,
  FiClock,
  FiCreditCard,
  FiFileText,
  FiHome,
  FiLogOut,
  FiMenu,
  FiBook,
  FiDollarSign,
  FiUser,
} from '../common/icons';

const NAV = [
  { to: '/parent',          label: 'Dashboard',       icon: FiHome, exact: true },
  { to: '/parent/student',  label: 'My Child',        icon: FiUser },
  { to: '/parent/fees',     label: 'Fees',            icon: FiCreditCard },
  { to: '/parent/payments', label: 'Payments',        icon: FiCreditCard },
  { to: '/parent/ledger',   label: 'Ledger',          icon: FiBook },
  { to: '/parent/wallet',   label: 'Wallet',          icon: FiDollarSign },
  { to: '/parent/leave',    label: 'Leave',           icon: FiCalendar },
  { to: '/parent/outpass',  label: 'Outpass',         icon: FiLogOut },
  { to: '/parent/checkin',  label: 'Check-In History', icon: FiClock },
  { to: '/parent/circulars',label: 'Circulars',       icon: FiFileText },
];

export default function ParentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/parent/login'); };

  return (
    <div className="app-shell flex h-screen overflow-hidden">
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setMobileOpen(false)} />
      )}
      <aside className={`fixed inset-y-0 left-0 z-30 w-60 bg-sidebar flex flex-col
        transform transition-transform duration-300
        lg:relative lg:translate-x-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="border-b border-white/10 p-5">
          <p className="text-white font-bold text-base">Parent Portal</p>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/70">Family access and student support</p>
          <p className="mt-2 truncate text-xs text-white/70">{user?.name}</p>
          <span className="inline-flex mt-1.5 rounded-full bg-primary-700 px-2 py-0.5 text-xs text-white">
            Parent
          </span>
        </div>
        <nav className="portal-sidebar-scroll flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-200
                ${isActive
                  ? 'bg-primary-500 text-white font-medium'
                  : 'text-white/80 hover:bg-primary-700 hover:text-white'}`
              }
              onClick={() => setMobileOpen(false)}>
              <item.icon className="text-base shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 p-3">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2
              text-white/80 hover:text-white text-sm rounded-lg hover:bg-primary-700 transition-colors duration-200">
            <FiLogOut className="shrink-0" /><span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="mx-4 mt-4 flex shrink-0 items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 shadow-sm md:mx-6">
          <button onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 hover:bg-primary-50 lg:hidden"><FiMenu /></button>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-500">Parent Portal</p>
            <span className="text-sm font-medium text-primary-500">Fee, attendance, leave, and student updates</span>
          </div>
          <div className="ml-auto text-sm text-text-secondary">{user?.name}</div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
