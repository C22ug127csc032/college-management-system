import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ALL_NAV = [
  {
    to: '/admin',
    label: 'Dashboard',
    icon: '📊',
    exact: true,
    roles: ['super_admin', 'class_teacher', 'hostel_warden', 'shop_operator', 'canteen_operator', 'librarian'],
  },

  // ── Students ──────────────────────────────────────────────
  {
    section: 'Students',
    roles: ['super_admin', 'class_teacher'],
  },
  {
    to: '/admin/students',
    label: 'Students',
    icon: '🎓',
    roles: ['super_admin', 'class_teacher'],
  },
  {
    to: '/admin/courses',
    label: 'Courses',
    icon: '🎯',
    roles: ['super_admin', 'class_teacher'],
  },

  // ── Fees & Payments ───────────────────────────────────────
  {
    section: 'Fees & Payments',
    roles: ['super_admin'],
  },
  {
    to: '/admin/fees/structure',
    label: 'Fee Structure',
    icon: '📋',
    roles: ['super_admin'],
  },
  {
    to: '/admin/fees/assign',
    label: 'Assign Fees',
    icon: '📝',
    roles: ['super_admin'],
  },
  {
    to: '/admin/fees/list',
    label: 'Fees List',
    icon: '💰',
    roles: ['super_admin', 'class_teacher'],
  },
  {
    to: '/admin/payments',
    label: 'Payments',
    icon: '💳',
    roles: ['super_admin'],
  },

  // ── Hostel & Attendance ───────────────────────────────────
  {
    section: 'Hostel & Attendance',
    roles: ['super_admin', 'class_teacher', 'hostel_warden'],
  },
  {
    to: '/admin/leave',
    label: 'Leave',
    icon: '📅',
    roles: ['super_admin', 'class_teacher', 'hostel_warden'],
  },
  {
    to: '/admin/outpass',
    label: 'Outpass',
    icon: '🚪',
    roles: ['super_admin', 'hostel_warden'],
  },
  {
    to: '/admin/checkin',
    label: 'Check In/Out',
    icon: '🕒',
    roles: ['super_admin', 'hostel_warden'],
  },

  // ── Shop & Canteen ────────────────────────────────────────
  {
    section: 'Shop & Canteen',
    roles: ['super_admin', 'shop_operator', 'canteen_operator'],
  },
  {
    to: '/admin/shop',
    label: 'Shop & Canteen',
    icon: '🏪',
    roles: ['super_admin', 'shop_operator', 'canteen_operator'],
  },

  // ── Library ───────────────────────────────────────────────
  {
    section: 'Library',
    roles: ['super_admin', 'librarian'],
  },
  {
    to: '/admin/library',
    label: 'Library',
    icon: '📚',
    roles: ['super_admin', 'librarian'],
  },

  // ── Administration ────────────────────────────────────────
  {
    section: 'Administration',
    roles: ['super_admin', 'class_teacher'],
  },
  {
    to: '/admin/inventory',
    label: 'Inventory',
    icon: '📦',
    roles: ['super_admin'],
  },
  {
    to: '/admin/expense',
    label: 'Expenses',
    icon: '💸',
    roles: ['super_admin'],
  },
  {
    to: '/admin/circulars',
    label: 'Circulars',
    icon: '📢',
    roles: ['super_admin', 'class_teacher'],
  },

  // ── Settings & Reports ────────────────────────────────────
  {
    section: 'Settings & Reports',
    roles: ['super_admin'],
  },
  {
    to: '/admin/staff',
    label: 'Staff',
    icon: '👥',
    roles: ['super_admin'],
  },
  {
    to: '/admin/reports',
    label: 'Reports',
    icon: '📈',
    roles: ['super_admin'],
  },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  // Filter nav items based on current user role
  const filteredNav = ALL_NAV.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role);
  });

  // Role display names and colors
  const roleConfig = {
    super_admin:      { label: 'Super Admin',      color: 'bg-red-500' },
    class_teacher:    { label: 'Class Teacher',    color: 'bg-blue-500' },
    hostel_warden:    { label: 'Hostel Warden',    color: 'bg-green-500' },
    shop_operator:    { label: 'Shop Operator',    color: 'bg-yellow-500' },
    canteen_operator: { label: 'Canteen Operator', color: 'bg-orange-500' },
    librarian:        { label: 'Librarian',        color: 'bg-purple-500' },
  };

  const currentRole = roleConfig[user?.role] || { label: user?.role, color: 'bg-gray-500' };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-primary-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center text-primary-700 font-bold text-lg shrink-0">
            C
          </div>
          {sidebarOpen && (
            <div>
              <p className="text-white font-bold text-sm leading-tight">College</p>
              <p className="text-primary-300 text-xs">Management System</p>
            </div>
          )}
        </div>
      </div>

      {/* Role Badge */}
      {sidebarOpen && (
        <div className="px-4 py-2 border-b border-primary-700">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium text-white ${currentRole.color}`}>
            {currentRole.label}
          </span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {filteredNav.map((item, i) => {
          // Section header
          if (item.section) {
            return sidebarOpen ? (
              <p key={i} className="text-primary-400 text-xs font-semibold uppercase tracking-wider px-3 pt-4 pb-1">
                {item.section}
              </p>
            ) : (
              <hr key={i} className="border-primary-700 my-2" />
            );
          }

          // Nav link
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-white/20 text-white font-medium'
                    : 'text-primary-200 hover:bg-white/10 hover:text-white'
                }`
              }
              onClick={() => setMobileOpen(false)}
            >
              <span className="text-base shrink-0">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User info */}
      <div className="p-3 border-t border-primary-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-400 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {user?.name?.charAt(0) || 'A'}
          </div>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <p className="text-primary-300 text-xs">{currentRole.label}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            title="Logout"
            className="text-primary-300 hover:text-white transition-colors text-lg shrink-0"
          >
            ⏏
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Desktop */}
      <aside
        className={`hidden lg:flex flex-col bg-primary-800 transition-all duration-300 shrink-0 ${
          sidebarOpen ? 'w-60' : 'w-16'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Sidebar Mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-60 bg-primary-800 flex flex-col lg:hidden transform transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shrink-0">
          <button
            onClick={() => { setSidebarOpen(!sidebarOpen); setMobileOpen(!mobileOpen); }}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            ☰
          </button>
          <h1 className="text-gray-800 font-semibold text-sm hidden sm:block">
            College Management System
          </h1>
          <div className="ml-auto flex items-center gap-3">
            <span className={`hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium text-white ${currentRole.color}`}>
              {currentRole.label}
            </span>
            <span className="text-sm text-gray-500 hidden sm:block">
              <span className="font-medium text-gray-700">{user?.name}</span>
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}