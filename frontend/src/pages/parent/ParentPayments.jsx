import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { StatusBadge, EmptyState } from '../../components/common';
import { FiCreditCard } from '../../components/common/icons';

export default function ParentPayments() {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    api.get('/parent/payments').then(r => setPayments(r.data.payments));
  }, []);

  const fmt = n => '₹' + (n || 0).toLocaleString('en-IN');

  return (
    <div>
      <h1 className="page-title mb-6">Payment History</h1>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header">Receipt</th>
              <th className="table-header">Date</th>
              <th className="table-header">Amount</th>
              <th className="table-header">Mode</th>
              <th className="table-header">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {payments.map(p => (
              <tr key={p._id} className="hover:bg-gray-50">
                <td className="table-cell font-mono text-xs">{p.receiptNo}</td>
                <td className="table-cell">
                  {new Date(p.paymentDate).toLocaleDateString('en-IN')}
                </td>
                <td className="table-cell font-semibold text-green-600">{fmt(p.amount)}</td>
                <td className="table-cell capitalize">{p.paymentMode}</td>
                <td className="table-cell"><StatusBadge status={p.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {payments.length === 0 && <EmptyState message="No payments yet" icon={<FiCreditCard />} />}
      </div>
    </div>
  );
}
