import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiBookOpen,
  FiCalendar,
  FiCreditCard,
  FiFileText,
  FiHome,
  FiLogOut,
  FiMenu,
  FiUser,
} from '../common/icons';

const NAV = [
  { to: '/student',           label: 'Dashboard',  icon: FiHome, exact: true },
  { to: '/student/fees',      label: 'My Fees',    icon: FiCreditCard },
  { to: '/student/ledger',    label: 'Ledger',     icon: FiBookOpen },
  { to: '/student/wallet',    label: 'Wallet',     icon: FiCreditCard },
  { to: '/student/leave',     label: 'Leave',      icon: FiCalendar },
  { to: '/student/outpass',   label: 'Outpass',    icon: FiLogOut },
  { to: '/student/circulars', label: 'Circulars',  icon: FiFileText },
  { to: '/student/profile',   label: 'My Profile', icon: FiUser },
];

export default function StudentLayout() {
  const { user, logout }  = useAuth();
  const navigate          = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-60 bg-indigo-900 flex flex-col
        transform transition-transform duration-300
        lg:relative lg:translate-x-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* Header */}
        <div className="p-5 border-b border-indigo-700">
          <p className="text-white font-bold">Student Portal</p>
          <p className="text-indigo-300 text-xs mt-0.5 truncate">{user?.name}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                ${isActive
                  ? 'bg-white/20 text-white font-medium'
                  : 'text-indigo-200 hover:bg-white/10 hover:text-white'}`
              }
              onClick={() => setMobileOpen(false)}
            >
              <item.icon className="text-base shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-indigo-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2
              text-indigo-300 hover:text-white text-sm transition-colors
              rounded-lg hover:bg-white/10"
          >
            <FiLogOut className="shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 py-3
          flex items-center gap-3 shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
          >
            <FiMenu />
          </button>
          <span className="text-gray-700 font-medium text-sm">Student Portal</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
