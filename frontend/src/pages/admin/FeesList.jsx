import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import {
  EmptyState,
  FilterBar,
  PageHeader,
  PageSpinner,
  StatCard,
  StatusBadge,
  Table,
} from '../../components/common';
import {
  FiAlertOctagon,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
} from '../../components/common/icons';

export default function FeesList() {
  const [fees, setFees] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    academicYear: '',
    department: '',
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/fees/all', {
        params: {
          status: filters.status,
          academicYear: filters.academicYear,
        },
      }),
      api.get('/fees/summary', {
        params: {
          status: filters.status,
          academicYear: filters.academicYear,
        },
      }),
    ])
      .then(([feesRes, summaryRes]) => {
        setFees(feesRes.data.fees || []);
        setSummary(summaryRes.data.summary || {});
      })
      .finally(() => setLoading(false));
  }, [filters.status, filters.academicYear]);

  const fmt = n => `₹${(n || 0).toLocaleString('en-IN')}`;

  const departments = [...new Set(
    fees
      .map(fee => fee.student?.course?.department?.trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

  const visibleFees = filters.department
    ? fees.filter(fee => fee.student?.course?.department === filters.department)
    : fees;

  const visibleSummary = filters.department
    ? {
        totalBilled: visibleFees.reduce((sum, fee) => sum + (fee.totalAmount || 0), 0),
        totalCollected: visibleFees.reduce((sum, fee) => sum + (fee.totalPaid || 0), 0),
        totalDue: visibleFees.reduce((sum, fee) => sum + (fee.totalDue || 0), 0),
        overdueCount: visibleFees.filter(fee => fee.status === 'overdue').length,
      }
    : summary;

  const groupedFees = visibleFees.reduce((groups, fee) => {
    const department = fee.student?.course?.department || 'Unassigned Department';
    const existingGroup = groups.find(group => group.key === department);

    if (existingGroup) {
      existingGroup.fees.push(fee);
      return groups;
    }

    groups.push({
      key: department,
      title: department,
      fees: [fee],
    });
    return groups;
  }, []);

  const renderFeesTable = feeRows => (
    <Table headers={['Student', 'Course', 'Year/Sem', 'Total', 'Paid', 'Balance', 'Status']}>
      {feeRows.map(fee => (
        <tr key={fee._id} className="hover:bg-gray-50">
          <td className="table-cell">
            <p className="font-medium">
              {fee.student?.firstName} {fee.student?.lastName}
            </p>
            <p className="text-xs text-gray-400">{fee.student?.regNo}</p>
          </td>
          <td className="table-cell text-sm text-gray-500">
            <p>{fee.student?.course?.name || 'Unassigned Course'}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {fee.student?.course?.department || 'No Department'}
            </p>
          </td>
          <td className="table-cell text-sm">
            {fee.academicYear} / Sem {fee.semester}
          </td>
          <td className="table-cell font-medium">{fmt(fee.totalAmount)}</td>
          <td className="table-cell text-green-600">{fmt(fee.totalPaid)}</td>
          <td className="table-cell text-red-600 font-medium">{fmt(fee.totalDue)}</td>
          <td className="table-cell">
            <StatusBadge status={fee.status} />
          </td>
        </tr>
      ))}
    </Table>
  );

  return (
    <div>
      <PageHeader title="Fees List" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<FiDollarSign />} label="Total Billed" value={fmt(visibleSummary.totalBilled)} color="blue" />
        <StatCard icon={<FiCheckCircle />} label="Collected" value={fmt(visibleSummary.totalCollected)} color="green" />
        <StatCard icon={<FiClock />} label="Pending Dues" value={fmt(visibleSummary.totalDue)} color="yellow" />
        <StatCard icon={<FiAlertOctagon />} label="Overdue" value={visibleSummary.overdueCount || 0} color="red" />
      </div>

      <div className="card">
        <FilterBar>
          <select
            className="input w-36"
            value={filters.status}
            onChange={e => setFilters(current => ({ ...current, status: e.target.value }))}
          >
            <option value="">All Status</option>
            {['pending', 'partial', 'paid', 'overdue'].map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <input
            className="input w-48"
            placeholder="Search Academic Year"
            value={filters.academicYear}
            onChange={e => setFilters(current => ({ ...current, academicYear: e.target.value }))}
          />

          <select
            className="input w-48"
            value={filters.department}
            onChange={e => setFilters(current => ({ ...current, department: e.target.value }))}
          >
            <option value="">All Departments</option>
            {departments.map(department => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
        </FilterBar>

        {loading ? (
          <PageSpinner />
        ) : (
          <div className="space-y-8">
            {groupedFees.map(group => (
              <section
                key={group.key}
                className="rounded-2xl border border-gray-100 bg-white overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-gray-100 bg-slate-50">
                  <h2 className="text-xl font-bold text-slate-900">{group.title}</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {group.fees.length} fee record{group.fees.length !== 1 ? 's' : ''}
                  </p>
                </div>
                {renderFeesTable(group.fees)}
              </section>
            ))}
          </div>
        )}

        {!loading && visibleFees.length === 0 && (
          <EmptyState message="No fees records found" />
        )}
      </div>
    </div>
  );
}
