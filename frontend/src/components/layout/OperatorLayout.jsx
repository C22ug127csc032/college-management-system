import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiCoffee,
  FiLogOut,
  FiShoppingBag,
} from '../common/icons';
import PortalCopyright from '../common/PortalCopyright';

const navByRole = {
  shop_operator: [
    { to: '/operator/shop', label: 'Shop Counter', icon: FiShoppingBag },
    { to: '/operator/canteen', label: 'Canteen Counter', icon: FiCoffee },
  ],
};

const titleByRole = {
  shop_operator: 'Operator Portal',
};

export default function OperatorLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = navByRole[user?.role] || [];
  const title = titleByRole[user?.role] || 'Operator Portal';

  const handleLogout = () => {
    logout();
    navigate('/operator/login');
  };

  return (
    <div className="app-shell">
      <header className="border-b border-amber-200/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
              College Commerce Desk
            </p>
            <h1 className="text-lg font-bold text-slate-900">{title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              Student-facing shop and canteen operations for campus services
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="hidden rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 sm:block">
              {user?.name}
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-50"
            >
              <FiLogOut />
              Logout
            </button>
            <PortalCopyright className="max-w-xs text-right text-slate-500" />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 md:px-6 lg:flex-row">
        <aside className="campus-panel soft-grid w-full p-3 lg:w-72 lg:self-start">
          <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Workspace
          </p>
          <nav className="space-y-1">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-300/40'
                      : 'text-slate-700 hover:translate-x-1 hover:bg-amber-50'
                  }`
                }
              >
                <item.icon className="text-base" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-4 rounded-2xl border border-amber-100 bg-white/90 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Institution</p>
            <p className="mt-2 text-sm font-semibold text-slate-800">College Management System</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Billing, item issue, and student purchase tracking for campus facilities.
            </p>
            <PortalCopyright className="mt-3 text-left text-slate-500" />
          </div>
        </aside>

        <main className="min-w-0 flex-1 float-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
