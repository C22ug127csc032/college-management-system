import React, { useEffect, useRef, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../common/NotificationBell';
import {
  FiBarChart2,
  FiBell,
  FiBook,
  FiCalendar,
  FiClipboard,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiEdit3,
  FiFileText,
  FiLogOut,
  FiMenu,
  FiPackage,
  FiTarget,
  FiTrendingDown,
  FiTrendingUp,
  FiUser,
  FiUsers,
} from '../common/icons';

const ALL_NAV = [
  // ── Dashboard ──────────────────────────────────────────────────────────────
  {
    to: '/admin', label: 'Dashboard', icon: FiBarChart2, exact: true,
    roles: ['super_admin','admin','hostel_warden','librarian','accountant','admission_staff'],
  },

  // ── Students ───────────────────────────────────────────────────────────────
  { section: 'Students', roles: ['super_admin','admin','class_teacher','admission_staff'] },
  {
    to: '/admin/students', label: 'Students', icon: FiUser,
    roles: ['super_admin','admin','class_teacher','admission_staff'],
  },
  {
    to: '/admin/courses', label: 'Courses', icon: FiTarget,
    roles: ['super_admin'],
  },

  // ── Fees & Payments ────────────────────────────────────────────────────────
  { section: 'Fees & Payments', roles: ['super_admin','admin','accountant'] },
  {
    to: '/admin/fees/structure', label: 'Fee Structure', icon: FiClipboard,
    roles: ['super_admin','admin'],
  },
  {
    to: '/admin/fees/assign', label: 'Assign Fees', icon: FiEdit3,
    roles: ['super_admin','admin'],
  },
  {
    to: '/admin/fees/list', label: 'Fees List', icon: FiDollarSign,
    roles: ['super_admin','admin','accountant'],
  },
  {
    to: '/admin/payments', label: 'Payments', icon: FiCreditCard,
    roles: ['super_admin','admin','accountant'],
  },

  // ── Hostel & Attendance ────────────────────────────────────────────────────
  {
    section: 'Hostel & Attendance',
    roles: ['super_admin','admin','class_teacher','hostel_warden'],
  },
  {
    to: '/admin/leave', label: 'Leave', icon: FiCalendar,
    roles: ['super_admin','admin','class_teacher'],
  },
  {
    to: '/admin/outpass', label: 'Outpass', icon: FiLogOut,
    roles: ['super_admin','admin','hostel_warden'],
  },
  {
    to: '/admin/checkin', label: 'Check In/Out', icon: FiClock,
    roles: ['super_admin','admin','hostel_warden','class_teacher'],
  },

  // ── Shop & Canteen ─────────────────────────────────────────────────────────

  // ── Library ────────────────────────────────────────────────────────────────
  { section: 'Library', roles: ['super_admin','admin','librarian'] },
  {
    to: '/admin/library', label: 'Library', icon: FiBook,
    roles: ['super_admin','admin','librarian'],
    exact: true,
  },

  // ── Administration ─────────────────────────────────────────────────────────
  {
    section: 'Administration',
    roles: ['super_admin','admin','accountant'],
  },
  {
    to: '/admin/inventory', label: 'Inventory', icon: FiPackage,
    roles: ['super_admin','admin'],
  },
  {
    to: '/admin/expense', label: 'Expenses', icon: FiTrendingDown,
    roles: ['super_admin','admin','accountant'],
  },
  // Communication
  {
    section: 'Communication',
    roles: ['super_admin','admin','class_teacher'],
  },
  {
    to: '/admin/circulars', label: 'Circulars', icon: FiFileText,
    roles: ['super_admin','admin','class_teacher'],
  },

  // ── Settings & Reports ─────────────────────────────────────────────────────
  { section: 'Settings & Reports', roles: ['super_admin','admin','accountant'] },
  {
    to: '/admin/staff', label: 'Staff', icon: FiUsers,
    roles: ['super_admin'],
  },
  {
    to: '/admin/reports', label: 'Reports', icon: FiTrendingUp,
    roles: ['super_admin','admin','accountant'],
  },

  // ── Notifications ──────────────────────────────────────────────────────────
  {
    to: '/admin/notifications', label: 'Notifications', icon: FiBell,
    roles: ['super_admin','admin','class_teacher','hostel_warden','librarian','accountant','admission_staff'],
  },
];

const roleConfig = {
  super_admin:      { label: 'Super Admin',      color: 'bg-primary-500' },
  admin:            { label: 'Admin',            color: 'bg-primary-500' },
  class_teacher:    { label: 'Class Teacher',    color: 'bg-primary-500' },
  hostel_warden:    { label: 'Hostel Warden',    color: 'bg-primary-500' },
  shop_operator:    { label: 'Operator',         color: 'bg-primary-500' },
  librarian:        { label: 'Librarian',        color: 'bg-primary-500' },
  accountant:       { label: 'Accountant',       color: 'bg-primary-500' },
  admission_staff:  { label: 'Admission Staff',  color: 'bg-primary-500' },
};

export default function AdminLayout() {
  const { user, logout }              = useAuth();
  const navigate                      = useNavigate();
  const location                      = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const desktopNavRef                 = useRef(null);
  const mobileNavRef                  = useRef(null);
  const sidebarScrollPositions        = useRef({
    desktop: 0,
    mobile: 0,
  });

  const handleLogout = () => { logout(); navigate('/login'); };

  const filteredNav = ALL_NAV
    .filter(item => !item.roles || item.roles.includes(user?.role))
    .map(item => {
      if (user?.role === 'librarian' && item.to === '/admin') {
        return {
          ...item,
          to: '/admin/library/dashboard',
          exact: true,
        };
      }
      if (user?.role === 'hostel_warden' && item.to === '/admin') {
        return {
          ...item,
          to: '/admin/hostel/dashboard',
          exact: true,
        };
      }
      if (user?.role === 'class_teacher' && item.to === '/admin') {
        return {
          ...item,
          to: '/admin/students',
          exact: true,
        };
      }
      if (user?.role === 'admission_staff' && item.to === '/admin') {
        return {
          ...item,
          to: '/admin',
          exact: true,
        };
      }
      return item;
    });
  const currentRole = roleConfig[user?.role] || {
    label: user?.role, color: 'bg-gray-500',
  };

  useEffect(() => {
    if (desktopNavRef.current) {
      desktopNavRef.current.scrollTop = sidebarScrollPositions.current.desktop;
    }
    if (mobileNavRef.current) {
      mobileNavRef.current.scrollTop = sidebarScrollPositions.current.mobile;
    }
  }, [location.pathname, mobileOpen, sidebarOpen]);

  const SidebarContent = ({ expanded, navRef, navKey }) => (
    <div className="flex flex-col h-full">

      {/* Logo */}
      <div className="border-b border-white/10 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-lg font-bold text-primary-500 shadow-sm">
            C
          </div>
          {expanded && (
            <div>
              <p className="text-sm font-bold leading-tight text-white">
                College
              </p>
              <p className="text-xs uppercase tracking-[0.18em] text-white/70">Management System</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav Items */}
      <nav
        ref={navRef}
        className="portal-sidebar-scroll flex-1 space-y-0.5 overflow-y-auto px-2 py-4"
        onScroll={e => {
          sidebarScrollPositions.current[navKey] = e.currentTarget.scrollTop;
        }}
      >
        {filteredNav.map((item, i) => {
          if (item.section) {
            return expanded
              ? <p key={i} className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                  {item.section}
                </p>
              : <hr key={i} className="my-2 border-white/10" />;
          }
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm
                transition-all duration-200
                ${isActive
                  ? 'bg-primary-500 text-white shadow-sm font-semibold'
                  : 'text-white/80 hover:bg-primary-700 hover:text-white'}`
              }
              onClick={e => {
                const navElement = e.currentTarget.closest('nav');
                if (navElement) {
                  sidebarScrollPositions.current[navKey] = navElement.scrollTop;
                }
                setMobileOpen(false);
              }}
            >
              <item.icon className="text-base shrink-0" />
              {expanded && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-500 text-sm font-bold text-white">
            {user?.name?.charAt(0) || 'A'}
          </div>
          {expanded && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {user?.name}
              </p>
            </div>
          )}
          <button
            onClick={handleLogout}
            title="Logout"
            className="shrink-0 text-lg text-white/70 transition-colors hover:text-white"
          >
            <FiLogOut />
          </button>
        </div>
        {expanded && (
          null
        )}
      </div>
    </div>
  );

  return (
    <div className="app-shell flex h-screen overflow-hidden">

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col bg-sidebar
        transition-all duration-300 shrink-0
        ${sidebarOpen ? 'w-60' : 'w-16'}`}>
        <SidebarContent
          expanded={sidebarOpen}
          navRef={desktopNavRef}
          navKey="desktop"
        />
      </aside>

      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-60 bg-sidebar
        flex flex-col lg:hidden transform transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent
          expanded
          navRef={mobileNavRef}
          navKey="mobile"
        />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Bar */}
        <header className="mx-4 mt-4 flex shrink-0 items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 shadow-sm md:mx-6">
          <button
            onClick={() => {
              setSidebarOpen(!sidebarOpen);
              setMobileOpen(!mobileOpen);
            }}
            className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-primary-50"
          >
            <FiMenu />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-500">College Management System</p>
            <h1 className="truncate text-sm font-semibold text-primary-500">Academic operations and administration workspace</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <NotificationBell />
            <span className={`hidden sm:inline-flex items-center px-2.5 py-1
              rounded-full text-xs font-medium text-white ${currentRole.color}`}>
              {currentRole.label}
            </span>
            <span className="text-sm text-gray-700 font-medium hidden sm:block">
              {user?.name}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
