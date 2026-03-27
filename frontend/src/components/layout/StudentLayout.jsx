import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiAlertTriangle,
  FiBookOpen,
  FiCalendar,
  FiCreditCard,
  FiFileText,
  FiHome,
  FiLogOut,
  FiMenu,
  FiUser,
} from '../common/icons';
import PortalCopyright from '../common/PortalCopyright';

const NAV = [
  { to: '/student', label: 'Dashboard', icon: FiHome, exact: true },
  { to: '/student/fees', label: 'My Fees', icon: FiCreditCard },
  { to: '/student/ledger', label: 'Ledger', icon: FiBookOpen },
  { to: '/student/wallet', label: 'Wallet', icon: FiCreditCard },
  { to: '/student/leave', label: 'Leave', icon: FiCalendar },
  { to: '/student/outpass', label: 'Outpass', icon: FiLogOut },
  { to: '/student/circulars', label: 'Circulars', icon: FiFileText },
  { to: '/student/profile', label: 'My Profile', icon: FiUser },
];

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/student/login'); };

  useEffect(() => {
    if (user?.isFirstLogin && location.pathname !== '/student/set-password') {
      navigate('/student/set-password', { replace: true });
    }
  }, [user, location.pathname, navigate]);

  if (user?.isFirstLogin && location.pathname !== '/student/set-password') {
    return null;
  }

  return (
    <div className="app-shell flex h-screen overflow-hidden">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-30 w-60 bg-gradient-to-b from-indigo-950 via-indigo-900 to-slate-900 flex flex-col transform transition-transform duration-300 lg:relative lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="border-b border-white/10 p-5">
          <p className="text-white font-bold">Student Portal</p>
          <p className="mt-0.5 text-xs uppercase tracking-[0.18em] text-indigo-200">Campus Academic Access</p>
          <p className="mt-2 truncate text-xs text-indigo-300">{user?.name}</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  user?.isFirstLogin
                    ? 'text-indigo-400 cursor-not-allowed opacity-50 pointer-events-none'
                    : isActive
                      ? 'bg-white/20 text-white font-medium'
                      : 'text-indigo-200 hover:bg-white/10 hover:text-white'
                }`
              }
              onClick={e => {
                if (user?.isFirstLogin) {
                  e.preventDefault();
                  return;
                }
                setMobileOpen(false);
              }}
            >
              <item.icon className="text-base shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-indigo-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <FiLogOut className="shrink-0" />
            <span>Logout</span>
          </button>
          <PortalCopyright className="mt-3 px-1 text-indigo-200" />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="campus-panel mx-4 mt-4 flex shrink-0 items-center gap-3 px-4 py-3 md:mx-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-xl p-2 hover:bg-gray-100 lg:hidden"
          >
            <FiMenu />
          </button>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-600">Student Portal</p>
            <span className="text-sm font-medium text-gray-700">Academic self-service and student records</span>
          </div>

          {user?.isFirstLogin && (
            <div className="ml-3 flex items-center gap-2 px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-lg">
              <FiAlertTriangle className="text-yellow-500 text-sm shrink-0" />
              <p className="text-xs text-yellow-700 font-medium">
                Please set your password to continue
              </p>
            </div>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
