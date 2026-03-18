import React, { useState, useEffect, useCallback } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  BarElement, ArcElement,
  Title, Tooltip, Legend,
} from 'chart.js';
import api from '../../api/axios';
import {
  PageSpinner, StatCard, FilterBar,
  EmptyState, Table, StatusBadge,
} from '../../components/common';
import {
  FiAlertCircle,
  FiBarChart2,
  FiBook,
  FiCheckCircle,
  FiClock,
  FiClipboard,
  FiCreditCard,
  FiDollarSign,
  FiPackage,
  FiShoppingBag,
  FiTrendingDown,
  FiTrendingUp,
  FiUser,
} from '../../components/common/icons';

ChartJS.register(
  CategoryScale, LinearScale,
  BarElement, ArcElement,
  Title, Tooltip, Legend
);

const TABS = [
  'Overview', 'Fees', 'Payments',
  'Expenses', 'Inventory', 'Library',
  'Shop & Canteen', 'Attendance',
];

export default function ReportsPage() {
  const [tab, setTab]         = useState('Overview');
  const [loading, setLoading] = useState(false);
  const [data, setData]       = useState({});
  const [filters, setFilters] = useState({
    startDate: '', endDate: '', academicYear: '', status: '', type: 'shop',
  });

  const fmt = n => '₹' + (n || 0).toLocaleString('en-IN');
  const chartOpts = { responsive: true, plugins: { legend: { position: 'bottom' } } };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      let r;
      if      (tab === 'Overview')      r = await api.get('/reports/dashboard');
      else if (tab === 'Fees')          r = await api.get('/reports/fees',       { params });
      else if (tab === 'Payments')      r = await api.get('/reports/payments',   { params });
      else if (tab === 'Expenses')      r = await api.get('/reports/expenses',   { params });
      else if (tab === 'Inventory')     r = await api.get('/reports/inventory',  { params });
      else if (tab === 'Library')       r = await api.get('/reports/library',    { params });
      else if (tab === 'Shop & Canteen')r = await api.get('/reports/shop',       { params: { ...params, type: filters.type } });
      else if (tab === 'Attendance')    r = await api.get('/reports/attendance', { params });
      setData(tab === 'Overview' ? r.data.dashboard : r.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tab, filters]);

  useEffect(() => { load(); }, [load]);

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  return (
    <div>
      <h1 className="page-title mb-1">Reports & Analytics</h1>
      <p className="text-sm text-gray-500 mb-5">Comprehensive system-wide reports</p>

      {/* Tab Bar */}
      <div className="flex gap-1 flex-wrap border-b border-gray-200 mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setData({}); }}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
              ${tab === t
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Filters */}
      {tab !== 'Overview' && (
        <FilterBar>
          <input type="date" className="input w-40" value={filters.startDate}
            onChange={e => setFilter('startDate', e.target.value)} />
          <input type="date" className="input w-40" value={filters.endDate}
            onChange={e => setFilter('endDate', e.target.value)} />
          {tab === 'Fees' && (
            <input className="input w-36" placeholder="Academic Year e.g. 2024-25"
              value={filters.academicYear}
              onChange={e => setFilter('academicYear', e.target.value)} />
          )}
          {tab === 'Shop & Canteen' && (
            <select className="input w-36" value={filters.type}
              onChange={e => setFilter('type', e.target.value)}>
              <option value="shop">Shop</option>
              <option value="canteen">Canteen</option>
            </select>
          )}
        </FilterBar>
      )}

      {loading ? <PageSpinner /> : (
        <>
          {/* ── OVERVIEW ──────────────────────────────────────────────── */}
          {tab === 'Overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={<FiUser />} label="Total Students"    value={data.totalStudents   || 0} color="blue" />
                <StatCard icon={<FiCheckCircle />} label="Active Students"   value={data.activeStudents  || 0} color="green" />
                <StatCard icon={<FiDollarSign />} label="Monthly Collection"value={fmt(data.monthlyCollection)} color="purple" />
                <StatCard icon={<FiAlertCircle />} label="Overdue Records"  value={data.overdueCount    || 0} color="red" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="section-title">Fee Collection vs Dues</h3>
                  <Doughnut
                    options={chartOpts}
                    data={{
                      labels: ['Collected', 'Pending Dues'],
                      datasets: [{
                        data: [data.totalFeesCollected || 0, data.pendingDues || 0],
                        backgroundColor: ['#22c55e', '#ef4444'],
                        borderWidth: 0,
                      }],
                    }}
                  />
                </div>
                <div className="card">
                  <h3 className="section-title">Recent Payments</h3>
                  <div className="space-y-2 mt-2">
                    {data.recentPayments?.map(p => (
                      <div key={p._id}
                        className="flex justify-between items-center py-2
                          border-b border-gray-50 last:border-0">
                        <div>
                          <p className="text-sm font-medium">
                            {p.student?.firstName} {p.student?.lastName}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(p.paymentDate).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                        <span className="font-semibold text-green-600 text-sm">
                          {fmt(p.amount)}
                        </span>
                      </div>
                    ))}
                    {!data.recentPayments?.length && (
                      <EmptyState message="No recent payments" icon={<FiCreditCard />} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── FEES ───────────────────────────────────────────────────── */}
          {tab === 'Fees' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={<FiDollarSign />} label="Total Billed"  value={fmt(data.summary?.totalBilled)}    color="blue" />
                <StatCard icon={<FiCheckCircle />} label="Collected"     value={fmt(data.summary?.totalCollected)}  color="green" />
                <StatCard icon={<FiClock />} label="Total Due"     value={fmt(data.summary?.totalDue)}        color="yellow" />
                <StatCard icon={<FiAlertCircle />} label="Overdue Count" value={data.summary?.overdue || 0}         color="red" />
              </div>
              <div className="card">
                <h3 className="section-title">Status Breakdown</h3>
                <div className="grid grid-cols-4 gap-3">
                  {['paid', 'partial', 'pending', 'overdue'].map(s => (
                    <div key={s} className="text-center p-3 bg-gray-50 rounded-xl">
                      <p className="text-2xl font-bold text-gray-800">
                        {data.summary?.[s] || 0}
                      </p>
                      <p className="text-xs text-gray-500 capitalize mt-1">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card overflow-x-auto">
                <Table headers={['Student', 'Reg No', 'Year/Sem', 'Total', 'Paid', 'Due', 'Status']}>
                  {data.fees?.slice(0, 50).map(f => (
                    <tr key={f._id} className="hover:bg-gray-50">
                      <td className="table-cell font-medium">
                        {f.student?.firstName} {f.student?.lastName}
                      </td>
                      <td className="table-cell font-mono text-xs text-gray-500">
                        {f.student?.regNo}
                      </td>
                      <td className="table-cell text-sm">
                        {f.academicYear} / {f.semester}
                      </td>
                      <td className="table-cell">{fmt(f.totalAmount)}</td>
                      <td className="table-cell text-green-600">{fmt(f.totalPaid)}</td>
                      <td className="table-cell text-red-600 font-medium">{fmt(f.totalDue)}</td>
                      <td className="table-cell"><StatusBadge status={f.status} /></td>
                    </tr>
                  ))}
                </Table>
                {!data.fees?.length && <EmptyState message="No fee records" />}
              </div>
            </div>
          )}

          {/* ── PAYMENTS ───────────────────────────────────────────────── */}
          {tab === 'Payments' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="section-title">Total Collected</h3>
                  <p className="text-4xl font-bold text-green-600">{fmt(data.totalAmount)}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {data.payments?.length || 0} transactions
                  </p>
                </div>
                <div className="card">
                  <h3 className="section-title">By Payment Mode</h3>
                  {Object.entries(data.byMode || {}).map(([mode, amt]) => (
                    <div key={mode}
                      className="flex justify-between items-center py-2
                        border-b border-gray-50 last:border-0">
                      <span className="text-sm uppercase font-medium text-gray-600">
                        {mode}
                      </span>
                      <span className="font-semibold text-gray-800">{fmt(amt)}</span>
                    </div>
                  ))}
                  {!Object.keys(data.byMode || {}).length && (
                    <EmptyState message="No data" />
                  )}
                </div>
              </div>
              {data.byMode && Object.keys(data.byMode).length > 0 && (
                <div className="card">
                  <h3 className="section-title">Collection by Mode</h3>
                  <Bar
                    options={chartOpts}
                    data={{
                      labels: Object.keys(data.byMode),
                      datasets: [{
                        label: 'Amount (₹)',
                        data: Object.values(data.byMode),
                        backgroundColor: '#3b82f6',
                      }],
                    }}
                  />
                </div>
              )}
              <div className="card overflow-x-auto">
                <Table headers={['Receipt', 'Student', 'Date', 'Amount', 'Mode', 'Status']}>
                  {data.payments?.slice(0, 50).map(p => (
                    <tr key={p._id} className="hover:bg-gray-50">
                      <td className="table-cell font-mono text-xs">{p.receiptNo}</td>
                      <td className="table-cell">
                        <p className="font-medium">
                          {p.student?.firstName} {p.student?.lastName}
                        </p>
                        <p className="text-xs text-gray-400">{p.student?.regNo}</p>
                      </td>
                      <td className="table-cell">
                        {new Date(p.paymentDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="table-cell font-semibold text-green-600">
                        {fmt(p.amount)}
                      </td>
                      <td className="table-cell uppercase text-xs">{p.paymentMode}</td>
                      <td className="table-cell"><StatusBadge status={p.status} /></td>
                    </tr>
                  ))}
                </Table>
                {!data.payments?.length && <EmptyState message="No payments" icon={<FiCreditCard />} />}
              </div>
            </div>
          )}

          {/* ── EXPENSES ───────────────────────────────────────────────── */}
          {tab === 'Expenses' && (
            <div className="space-y-5">
              <div className="card flex items-center gap-5 p-5">
                <p className="text-4xl font-bold text-red-600">{fmt(data.totalAmount)}</p>
                <p className="text-sm text-gray-500">
                  Total Expenses<br />{data.expenses?.length || 0} entries
                </p>
              </div>
              {data.byCategory?.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="card">
                    <h3 className="section-title">By Category</h3>
                    <Doughnut
                      options={chartOpts}
                      data={{
                        labels: data.byCategory.map(c => c._id),
                        datasets: [{
                          data: data.byCategory.map(c => c.total),
                          backgroundColor: [
                            '#3b82f6','#22c55e','#f59e0b',
                            '#ef4444','#8b5cf6','#ec4899','#06b6d4',
                          ],
                          borderWidth: 0,
                        }],
                      }}
                    />
                  </div>
                  <div className="card">
                    <h3 className="section-title">Category Breakdown</h3>
                    {data.byCategory.map(c => (
                      <div key={c._id}
                        className="flex justify-between items-center py-2
                          border-b border-gray-50 last:border-0">
                        <span className="text-sm capitalize text-gray-600">{c._id}</span>
                        <span className="font-semibold text-gray-800">{fmt(c.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="card overflow-x-auto">
                <Table headers={['Title', 'Category', 'Date', 'Mode', 'Amount']}>
                  {data.expenses?.map(e => (
                    <tr key={e._id} className="hover:bg-gray-50">
                      <td className="table-cell font-medium">{e.title}</td>
                      <td className="table-cell capitalize">{e.category}</td>
                      <td className="table-cell">
                        {new Date(e.date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="table-cell uppercase text-xs">{e.paymentMode}</td>
                      <td className="table-cell font-semibold text-red-600">
                        {fmt(e.amount)}
                      </td>
                    </tr>
                  ))}
                </Table>
                {!data.expenses?.length && <EmptyState message="No expenses" icon={<FiTrendingDown />} />}
              </div>
            </div>
          )}

          {/* ── INVENTORY ──────────────────────────────────────────────── */}
          {tab === 'Inventory' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard icon={<FiPackage />} label="Total Stock Value" value={fmt(data.totalValue)}            color="blue" />
                <StatCard icon={<FiAlertCircle />} label="Low Stock Items"  value={data.lowStockItems?.length || 0} color="red" />
                <StatCard icon={<FiBarChart2 />} label="Categories"       value={data.byCategory?.length    || 0} color="purple" />
              </div>
              {data.lowStockItems?.length > 0 && (
                <div className="card border-red-200 bg-red-50">
                  <h3 className="section-title text-red-700 inline-flex items-center gap-2"><FiAlertCircle /> Low Stock Alerts</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {data.lowStockItems.map(i => (
                      <div key={i._id} className="bg-white p-3 rounded-lg border border-red-100">
                        <p className="text-sm font-medium text-gray-800">{i.name}</p>
                        <p className="text-xl font-bold text-red-600">{i.currentStock}</p>
                        <p className="text-xs text-gray-400">
                          Min: {i.minStockAlert} · {i.category}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="card overflow-x-auto">
                <Table headers={['Name', 'Category', 'Stock', 'Unit Price', 'Total Value']}>
                  {data.items?.map(i => (
                    <tr key={i._id}
                      className={`hover:bg-gray-50
                        ${i.currentStock <= i.minStockAlert ? 'bg-red-50' : ''}`}>
                      <td className="table-cell font-medium">{i.name}</td>
                      <td className="table-cell capitalize">{i.category}</td>
                      <td className="table-cell">
                        <span className={i.currentStock <= i.minStockAlert
                          ? 'text-red-600 font-bold' : 'font-medium'}>
                          {i.currentStock} {i.unit}
                        </span>
                      </td>
                      <td className="table-cell">{fmt(i.purchasePrice)}</td>
                      <td className="table-cell font-medium">
                        {fmt(i.currentStock * i.purchasePrice)}
                      </td>
                    </tr>
                  ))}
                </Table>
                {!data.items?.length && <EmptyState message="No inventory items" icon={<FiPackage />} />}
              </div>
            </div>
          )}

          {/* ── LIBRARY ────────────────────────────────────────────────── */}
          {tab === 'Library' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={<FiBook />} label="Total Books"  value={data.summary?.totalBooks    || 0} color="purple" />
                <StatCard icon={<FiTrendingUp />} label="Issued"       value={data.summary?.totalIssued   || 0} color="blue" />
                <StatCard icon={<FiCheckCircle />} label="Returned"     value={data.summary?.totalReturned || 0} color="green" />
                <StatCard icon={<FiAlertCircle />} label="Overdue"     value={data.summary?.overdue       || 0} color="red" />
              </div>
              {data.summary?.totalFine > 0 && (
                <div className="card bg-yellow-50 border-yellow-200">
                  <p className="text-sm text-yellow-700">
                    Total Fine Collected:{' '}
                    <strong className="text-xl">{fmt(data.summary?.totalFine)}</strong>
                  </p>
                </div>
              )}
              <div className="card overflow-x-auto">
                <Table headers={['Student', 'Book', 'Author', 'Issued', 'Due', 'Status', 'Fine']}>
                  {data.issues?.map(i => (
                    <tr key={i._id} className="hover:bg-gray-50">
                      <td className="table-cell">
                        <p className="font-medium">
                          {i.student?.firstName} {i.student?.lastName}
                        </p>
                        <p className="text-xs text-gray-400">{i.student?.regNo}</p>
                      </td>
                      <td className="table-cell font-medium">{i.book?.title}</td>
                      <td className="table-cell text-gray-500">{i.book?.author}</td>
                      <td className="table-cell">
                        {new Date(i.issueDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="table-cell">
                        {new Date(i.dueDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="table-cell"><StatusBadge status={i.status} /></td>
                      <td className="table-cell">
                        {i.fine > 0
                          ? <span className="text-red-600 font-medium">{fmt(i.fine)}</span>
                          : '–'}
                      </td>
                    </tr>
                  ))}
                </Table>
                {!data.issues?.length && <EmptyState message="No issue records" icon={<FiBook />} />}
              </div>
            </div>
          )}

          {/* ── SHOP & CANTEEN ─────────────────────────────────────────── */}
          {tab === 'Shop & Canteen' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard icon={<FiDollarSign />} label="Total Revenue"  value={fmt(data.summary?.totalRevenue)} color="green" />
                <StatCard icon={<FiClipboard />} label="Total Sales"    value={data.summary?.totalSales || 0}   color="blue" />
                <StatCard icon={<FiCreditCard />} label="Credit Pending" value={fmt(data.summary?.totalCredit)}  color="yellow" />
              </div>
              {data.dailySales?.length > 0 && (
                <div className="card">
                  <h3 className="section-title">Daily Sales (Last 30 days)</h3>
                  <Bar
                    options={chartOpts}
                    data={{
                      labels: [...(data.dailySales || [])].reverse().map(d => d._id),
                      datasets: [{
                        label: 'Revenue (₹)',
                        data: [...(data.dailySales || [])].reverse().map(d => d.total),
                        backgroundColor: '#22c55e',
                      }],
                    }}
                  />
                </div>
              )}
              <div className="card overflow-x-auto">
                <Table headers={['Bill No', 'Student', 'Date', 'Amount', 'Mode', 'Status']}>
                  {data.sales?.slice(0, 50).map(s => (
                    <tr key={s._id} className="hover:bg-gray-50">
                      <td className="table-cell font-mono text-xs">{s.billNo}</td>
                      <td className="table-cell">
                        {s.student
                          ? `${s.student.firstName} ${s.student.lastName}`
                          : 'Walk-in'}
                      </td>
                      <td className="table-cell">
                        {new Date(s.date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="table-cell font-medium">{fmt(s.totalAmount)}</td>
                      <td className="table-cell capitalize">{s.paymentMode}</td>
                      <td className="table-cell"><StatusBadge status={s.status} /></td>
                    </tr>
                  ))}
                </Table>
                {!data.sales?.length && <EmptyState message="No sales records" icon={<FiShoppingBag />} />}
              </div>
            </div>
          )}

          {/* ── ATTENDANCE ─────────────────────────────────────────────── */}
          {tab === 'Attendance' && (
            <div className="space-y-5">
              <div className="card">
                <p className="text-sm text-gray-500 mb-1">Total Records</p>
                <p className="text-3xl font-bold text-gray-800">{data.total || 0}</p>
              </div>
              <div className="card overflow-x-auto">
                <Table headers={['Student', 'Type', 'Location', 'Date & Time', 'Remarks']}>
                  {data.records?.map(r => (
                    <tr key={r._id} className="hover:bg-gray-50">
                      <td className="table-cell">
                        <p className="font-medium">
                          {r.student?.firstName} {r.student?.lastName}
                        </p>
                        <p className="text-xs text-gray-400">{r.student?.regNo}</p>
                      </td>
                      <td className="table-cell">
                        <span className={`badge-${r.type === 'check_in' ? 'green' : 'yellow'}`}>
                          {r.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="table-cell capitalize">{r.location}</td>
                      <td className="table-cell">
                        {new Date(r.timestamp).toLocaleString('en-IN')}
                      </td>
                      <td className="table-cell text-gray-500">{r.remarks || '–'}</td>
                    </tr>
                  ))}
                </Table>
                {!data.records?.length && (
                  <EmptyState message="No attendance records" icon={<FiClock />} />
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
