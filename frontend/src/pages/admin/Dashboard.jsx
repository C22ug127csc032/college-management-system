import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  BarElement, ArcElement, Title, Tooltip, Legend,
} from 'chart.js';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { PageSpinner } from '../../components/common';
import {
  FiAlertCircle,
  FiArrowRight,
  FiBook,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiEdit3,
  FiFileText,
  FiHome,
  FiPackage,
  FiTrendingDown,
  FiTrendingUp,
  FiUser,
  FiUserPlus,
  FiUsers,
} from '../../components/common/icons';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [studentStats, setStudentStats] = useState(null);
  const [feesSummary, setFeesSummary] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/reports/dashboard'),
      api.get('/students/stats/summary'),
      api.get('/fees/summary'),
    ])
      .then(([dash, stats, fees]) => {
        setData(dash.data.dashboard);
        setStudentStats(stats.data.stats);
        setFeesSummary(fees.data.summary);
      })
      .catch(err => console.error('Dashboard error:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;

  const fmt = n => 'Rs ' + (n || 0).toLocaleString('en-IN');
  const canAccess = roles => !roles || roles.includes(user?.role);
  const isSuperAdmin = user?.role === 'super_admin';

  const financeCards = [
    {
      label: 'Total Collected',
      value: fmt(data?.totalFeesCollected),
      path: '/admin/payments',
      icon: FiDollarSign,
      iconClass: 'bg-green-50 text-green-600',
      roles: ['super_admin'],
    },
    {
      label: 'This Month',
      value: fmt(data?.monthlyCollection),
      path: '/admin/payments',
      icon: FiCalendar,
      iconClass: 'bg-blue-50 text-blue-600',
      roles: ['super_admin'],
    },
    {
      label: 'Pending Dues',
      value: fmt(feesSummary?.totalDue || data?.pendingDues),
      subLabel: `${data?.overdueCount || 0} overdue`,
      path: '/admin/fees/list',
      icon: FiAlertCircle,
      iconClass: 'bg-red-50 text-red-600',
      roles: ['super_admin', 'class_teacher'],
    },
    {
      label: 'Expenses This Month',
      value: fmt(data?.expenseThisMonth),
      path: '/admin/expense',
      icon: FiTrendingDown,
      iconClass: 'bg-orange-50 text-orange-600',
      roles: ['super_admin'],
    },
  ].filter(card => canAccess(card.roles));

  const quickActions = [
    { label: 'Add New Student', icon: FiUser, path: '/admin/students/add', color: 'bg-blue-50 hover:bg-blue-100 text-blue-700', roles: ['super_admin', 'class_teacher'] },
    { label: 'Assign Fees', icon: FiEdit3, path: '/admin/fees/assign', color: 'bg-green-50 hover:bg-green-100 text-green-700', roles: ['super_admin', 'class_teacher'] },
    { label: 'Manual Payment', icon: FiCreditCard, path: '/admin/payments', color: 'bg-purple-50 hover:bg-purple-100 text-purple-700', roles: ['super_admin'] },
    { label: 'Publish Circular', icon: FiFileText, path: '/admin/circulars', color: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700', roles: ['super_admin', 'class_teacher'] },
    { label: 'Issue Book', icon: FiBook, path: '/admin/library', color: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700', roles: ['super_admin', 'librarian'] },
    { label: 'View Reports', icon: FiTrendingUp, path: '/admin/reports', color: 'bg-red-50 hover:bg-red-100 text-red-700', roles: ['super_admin'] },
    { label: 'Check In Student', icon: FiClock, path: '/admin/checkin', color: 'bg-teal-50 hover:bg-teal-100 text-teal-700', roles: ['super_admin', 'class_teacher', 'hostel_warden'] },
  ].filter(action => canAccess(action.roles));

  const moduleCards = [
    { icon: FiCalendar, label: 'Leave', desc: 'Manage student leaves', path: '/admin/leave', color: 'border-blue-200 bg-blue-50', iconBg: 'bg-blue-100 text-blue-600', roles: ['super_admin', 'class_teacher', 'hostel_warden'] },
    { icon: FiArrowRight, label: 'Outpass', desc: 'Hostel outpass requests', path: '/admin/outpass', color: 'border-purple-200 bg-purple-50', iconBg: 'bg-purple-100 text-purple-600', roles: ['super_admin', 'hostel_warden'] },
    { icon: FiPackage, label: 'Inventory', desc: 'Stock management', path: '/admin/inventory', color: 'border-yellow-200 bg-yellow-50', iconBg: 'bg-yellow-100 text-yellow-600', roles: ['super_admin'] },
    { icon: FiBook, label: 'Library', desc: 'Books and issue records', path: '/admin/library', color: 'border-green-200 bg-green-50', iconBg: 'bg-green-100 text-green-600', roles: ['super_admin', 'librarian'] },
    { icon: FiTrendingDown, label: 'Expenses', desc: 'Institution expenses', path: '/admin/expense', color: 'border-red-200 bg-red-50', iconBg: 'bg-red-100 text-red-600', roles: ['super_admin'] },
    { icon: FiUsers, label: 'Staff', desc: 'Manage staff roles', path: '/admin/staff', color: 'border-indigo-200 bg-indigo-50', iconBg: 'bg-indigo-100 text-indigo-600', roles: ['super_admin'] },
    { icon: FiTrendingUp, label: 'Reports', desc: 'All reports and analytics', path: '/admin/reports', color: 'border-teal-200 bg-teal-50', iconBg: 'bg-teal-100 text-teal-600', roles: ['super_admin'] },
    { icon: FiFileText, label: 'Circulars', desc: 'Notices and announcements', path: '/admin/circulars', color: 'border-orange-200 bg-orange-50', iconBg: 'bg-orange-100 text-orange-600', roles: ['super_admin', 'class_teacher'] },
  ].filter(module => canAccess(module.roles));

  const chartOpts = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Welcome back! Here is what is happening today.
          </p>
        </div>
        <div className="text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          })}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Students
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/students')}>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl shrink-0"><FiUser /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{studentStats?.total || data?.totalStudents || 0}</p>
              <p className="text-sm text-gray-500">Total Students</p>
            </div>
          </div>
          <div className="stat-card cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/students')}>
            <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center text-2xl shrink-0"><FiCheckCircle /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{studentStats?.active || data?.activeStudents || 0}</p>
              <p className="text-sm text-gray-500">Active Students</p>
            </div>
          </div>
          <div className="stat-card cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/students')}>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-2xl shrink-0"><FiHome /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{studentStats?.hostel || 0}</p>
              <p className="text-sm text-gray-500">Hostel Students</p>
            </div>
          </div>
          {canAccess(['super_admin', 'class_teacher']) && (
            <div className="stat-card cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/students/add')}>
              <div className="w-12 h-12 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center text-2xl shrink-0"><FiUserPlus /></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{studentStats?.newThisMonth || 0}</p>
                <p className="text-sm text-gray-500">New This Month</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {financeCards.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Finance
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {financeCards.map(card => (
              <div key={card.label} className="stat-card cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(card.path)}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${card.iconClass}`}><card.icon /></div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  {card.subLabel && <p className="text-xs text-red-400 mt-0.5">{card.subLabel}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isSuperAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="section-title">Fee Collection</h3>
            <Doughnut
              options={chartOpts}
              data={{
                labels: ['Collected', 'Pending Dues'],
                datasets: [{
                  data: [data?.totalFeesCollected || 0, feesSummary?.totalDue || data?.pendingDues || 0],
                  backgroundColor: ['#22c55e', '#ef4444'],
                  borderWidth: 0,
                }],
              }}
            />
          </div>

          <div className="card">
            <h3 className="section-title">Fee Status Breakdown</h3>
            <Bar
              options={{ ...chartOpts, plugins: { legend: { display: false } } }}
              data={{
                labels: ['Paid', 'Partial', 'Pending', 'Overdue'],
                datasets: [{
                  data: [feesSummary?.paid || 0, feesSummary?.partial || 0, feesSummary?.pending || 0, feesSummary?.overdue || data?.overdueCount || 0],
                  backgroundColor: ['#22c55e', '#f59e0b', '#3b82f6', '#ef4444'],
                  borderRadius: 6,
                }],
              }}
            />
          </div>
        </div>
      )}

      {quickActions.length > 0 && (
        <div className="card">
          <h3 className="section-title">Quick Actions</h3>
          <div className="space-y-2">
            {quickActions.map(action => (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${action.color}`}
              >
                <action.icon className="text-base shrink-0" />
                {action.label}
                <FiArrowRight className="ml-auto text-gray-400 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {isSuperAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="section-title mb-0">Recent Payments</h3>
              <button onClick={() => navigate('/admin/payments')} className="text-xs text-primary-600 hover:underline">
                View all
              </button>
            </div>
            <div className="space-y-0">
              {data?.recentPayments?.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <div className="flex justify-center mb-2"><FiCreditCard className="text-3xl" /></div>
                  <p className="text-sm">No payments yet</p>
                </div>
              )}
              {data?.recentPayments?.map(p => (
                <div key={p._id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-bold shrink-0">
                      {p.student?.firstName?.[0] || 'S'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{p.student?.firstName} {p.student?.lastName}</p>
                      <p className="text-xs text-gray-400">{p.student?.regNo} • {new Date(p.paymentDate).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-green-600">{fmt(p.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="section-title mb-0">Fee Overview</h3>
              <button onClick={() => navigate('/admin/fees/list')} className="text-xs text-primary-600 hover:underline">
                View all
              </button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Total Fees Billed', value: fmt(feesSummary?.totalBilled), color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Total Collected', value: fmt(feesSummary?.totalCollected || data?.totalFeesCollected), color: 'text-green-600', bg: 'bg-green-50' },
                { label: 'Total Pending', value: fmt(feesSummary?.totalDue || data?.pendingDues), color: 'text-red-600', bg: 'bg-red-50' },
              ].map(item => (
                <div key={item.label} className={`flex justify-between items-center px-4 py-3 rounded-xl ${item.bg}`}>
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <span className={`text-base font-bold ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {moduleCards.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Module Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {moduleCards.map(module => (
              <button
                key={module.path}
                onClick={() => navigate(module.path)}
                className={`p-4 rounded-xl border text-left transition-all hover:shadow-md hover:scale-[1.02] ${module.color}`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-3 ${module.iconBg}`}>
                  <module.icon />
                </div>
                <p className="text-sm font-semibold text-gray-800">{module.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{module.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
