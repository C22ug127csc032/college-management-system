import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiCoffee,
  FiLogOut,
  FiShoppingBag,
} from '../common/icons';

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
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-500">
              College Commerce Desk
            </p>
            <h1 className="text-lg font-bold text-primary-500">{title}</h1>
            <p className="mt-1 text-sm text-text-secondary">
              Student-facing shop and canteen operations for campus services
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="hidden rounded-full border border-border bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-500 sm:block">
              {user?.name}
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold text-text-secondary shadow-sm transition duration-200 hover:bg-primary-50 hover:text-primary-500"
            >
              <FiLogOut />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 md:px-6 lg:flex-row">
        <aside className="w-full rounded-xl border border-sidebar bg-sidebar p-3 shadow-sm lg:w-72 lg:self-start">
          <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
            Workspace
          </p>
          <nav className="portal-sidebar-scroll space-y-1 overflow-y-auto">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'text-white/80 hover:bg-primary-700 hover:text-white'
                  }`
                }
              >
                <item.icon className="text-base" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Institution</p>
            <p className="mt-2 text-sm font-semibold text-white">College Management System</p>
            <p className="mt-1 text-xs leading-5 text-white/70">
              Billing, item issue, and student purchase tracking for campus facilities.
            </p>
          </div>
        </aside>

        <main className="min-w-0 flex-1 float-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
