import React, { useEffect, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import api from '../../api/axios';
import { PageSpinner, StatCard } from '../../components/common';
import { FiAlertCircle, FiAlertOctagon, FiCheckCircle, FiCreditCard, FiDollarSign, FiTrendingDown, FiUsers } from '../../components/common/icons';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/dashboard').then(r => setData(r.data.dashboard)).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;

  const fmt = n => '₹' + (n || 0).toLocaleString('en-IN');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<FiUsers />} label="Total Students" value={data?.totalStudents || 0} color="blue" />
        <StatCard icon={<FiCheckCircle />} label="Active Students" value={data?.activeStudents || 0} color="green" />
        <StatCard icon={<FiDollarSign />} label="Monthly Collection" value={fmt(data?.monthlyCollection)} color="purple" />
        <StatCard icon={<FiAlertCircle />} label="Pending Dues" value={fmt(data?.pendingDues)} color="red" sub={`${data?.overdueCount || 0} overdue`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatCard icon={<FiCreditCard />} label="Total Collected" value={fmt(data?.totalFeesCollected)} color="green" />
        <StatCard icon={<FiTrendingDown />} label="Monthly Expense" value={fmt(data?.expenseThisMonth)} color="yellow" />
        <StatCard icon={<FiAlertOctagon />} label="Overdue Records" value={data?.overdueCount || 0} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="section-title">Fee Collection vs Dues</h3>
          <Doughnut
            data={{
              labels: ['Collected', 'Pending Dues'],
              datasets: [{ data: [data?.totalFeesCollected || 0, data?.pendingDues || 0], backgroundColor: ['#22c55e', '#ef4444'], borderWidth: 0 }]
            }}
            options={{ plugins: { legend: { position: 'bottom' } }, cutout: '65%' }}
          />
        </div>

        <div className="card">
          <h3 className="section-title">Recent Payments</h3>
          <div className="space-y-3 mt-2">
            {data?.recentPayments?.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No payments yet</p>}
            {data?.recentPayments?.map(p => (
              <div key={p._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{p.student?.firstName} {p.student?.lastName}</p>
                  <p className="text-xs text-gray-400">{p.student?.regNo} • {new Date(p.paymentDate).toLocaleDateString('en-IN')}</p>
                </div>
                <span className="text-sm font-semibold text-green-600">₹{p.amount?.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
