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
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setMobileOpen(false)} />
      )}
      <aside className={`fixed inset-y-0 left-0 z-30 w-60 bg-green-900 flex flex-col
        transform transition-transform duration-300
        lg:relative lg:translate-x-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 border-b border-green-700">
          <p className="text-white font-bold text-base">Parent Portal</p>
          <p className="text-green-300 text-xs mt-0.5 truncate">{user?.name}</p>
          <span className="inline-flex mt-1.5 px-2 py-0.5 rounded-full text-xs bg-green-700 text-green-100">
            Parent
          </span>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                ${isActive
                  ? 'bg-white/20 text-white font-medium'
                  : 'text-green-200 hover:bg-white/10 hover:text-white'}`
              }
              onClick={() => setMobileOpen(false)}>
              <item.icon className="text-base shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-green-700">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2
              text-green-300 hover:text-white text-sm rounded-lg hover:bg-white/10 transition-colors">
            <FiLogOut className="shrink-0" /><span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shrink-0">
          <button onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"><FiMenu /></button>
          <span className="text-gray-700 font-medium text-sm">Parent Portal</span>
          <div className="ml-auto text-sm text-gray-500">{user?.name}</div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
