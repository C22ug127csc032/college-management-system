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
    <div className="min-h-screen bg-amber-50">
      <header className="border-b border-amber-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
              College Management
            </p>
            <h1 className="text-lg font-bold text-slate-900">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 sm:block">
              {user?.name}
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-amber-50"
            >
              <FiLogOut />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 md:px-6 lg:flex-row">
        <aside className="w-full rounded-2xl border border-amber-200 bg-white p-3 lg:w-64 lg:self-start">
          <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Workspace
          </p>
          <nav className="space-y-1">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-amber-500 text-white'
                      : 'text-slate-700 hover:bg-amber-50'
                  }`
                }
              >
                <item.icon className="text-base" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
