import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { PageSpinner, StatusBadge, EmptyState } from '../../components/common';

export default function ParentFees() {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/parent/fees')
      .then(r => setFees(r.data.fees))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;
  const fmt = n => '₹' + (n || 0).toLocaleString('en-IN');

  return (
    <div>
      <h1 className="page-title mb-6">Fee Details</h1>
      <div className="space-y-4">
        {fees.map(f => (
          <div key={f._id} className="card">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-semibold text-gray-800">
                  {f.academicYear} — Sem {f.semester}
                </p>
                <p className="text-xs text-gray-400">
                  Due: {f.dueDate ? new Date(f.dueDate).toLocaleDateString('en-IN') : 'N/A'}
                </p>
              </div>
              <StatusBadge status={f.status} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-blue-700">{fmt(f.totalAmount)}</p>
                <p className="text-xs text-blue-500">Total</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-green-700">{fmt(f.totalPaid)}</p>
                <p className="text-xs text-green-500">Paid</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-red-700">{fmt(f.totalDue)}</p>
                <p className="text-xs text-red-500">Due</p>
              </div>
            </div>
          </div>
        ))}
        {fees.length === 0 && <EmptyState message="No fee records" icon="💰" />}
      </div>
    </div>
  );
}