import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { PageSpinner, EmptyState } from '../../components/common';
import { FiBook } from '../../components/common/icons';

export default function ParentLedger() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const studentId = user?.studentRef?._id || user?.studentRef;
    if (!studentId) {
      setLoading(false);
      return;
    }
    api.get(`/ledger/student/${studentId}`)
      .then(r => setEntries(r.data.entries))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <PageSpinner />;
  const fmt = n => `Rs. ${(n || 0).toLocaleString('en-IN')}`;

  return (
    <div>
      <h1 className="page-title mb-6">Ledger</h1>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header">Date</th>
              <th className="table-header">Category</th>
              <th className="table-header">Description</th>
              <th className="table-header">Debit</th>
              <th className="table-header">Credit</th>
              <th className="table-header">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {entries.map((e, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="table-cell">{new Date(e.date).toLocaleDateString('en-IN')}</td>
                <td className="table-cell capitalize">{e.category?.replace('_', ' ')}</td>
                <td className="table-cell text-gray-500">{e.description}</td>
                <td className="table-cell text-red-600 font-medium">{e.type === 'debit' ? fmt(e.amount) : ''}</td>
                <td className="table-cell text-green-600 font-medium">{e.type === 'credit' ? fmt(e.amount) : ''}</td>
                <td className="table-cell font-semibold">{fmt(e.runningBalance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && <EmptyState message="No ledger entries" icon={<FiBook />} />}
      </div>
    </div>
  );
}
