import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { PageSpinner, StatusBadge, EmptyState } from '../../components/common';
import toast from 'react-hot-toast';
import {
  FiAlertCircle,
  FiCheckCircle,
  FiCreditCard,
  FiInfo,
} from '../../components/common/icons';

export default function ParentFees() {
  const { user } = useAuth();
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);

  const studentId = user?.studentRef?._id || user?.studentRef;

  const fetchFees = async () => {
    const r = await api.get('/parent/fees');
    setFees(r.data.fees);
    setLoading(false);
  };

  useEffect(() => {
    fetchFees();
  }, []);

  const fmt = n => `Rs. ${(n || 0).toLocaleString('en-IN')}`;
  const payAmount = fee => Math.max(fee?.totalDue || 0, 0);

  const handlePay = async fee => {
    try {
      const amountToPay = payAmount(fee);
      if (amountToPay <= 0) {
        toast.error('No pending due for this semester');
        return;
      }

      const orderRes = await api.post('/payments/create-order', {
        amount: amountToPay,
        studentFeesId: fee._id,
        studentId,
      });
      const { order, key } = orderRes.data;
      const options = {
        key,
        amount: order.amount,
        currency: 'INR',
        name: 'College Management',
        description: `Fee Payment - ${fee.academicYear}`,
        order_id: order.id,
        handler: async response => {
          await api.post('/payments/verify', {
            ...response,
            studentFeesId: fee._id,
            studentId,
            amount: amountToPay,
          });
          toast.success('Payment successful');
          fetchFees();
        },
        prefill: { name: user?.name, contact: user?.phone },
        theme: { color: '#16a34a' },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    }
  };

  if (loading) return <PageSpinner />;

  return (
    <div>
      <h1 className="page-title mb-6">Fee Details</h1>
      <div className="space-y-6">
        {fees.map(f => (
          <div key={f._id} className="card">

            <div className="flex flex-wrap justify-between items-start mb-4">
              <div>
                <p className="font-bold text-gray-900 text-base">
                  {f.academicYear} - Semester {f.semester}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Due Date: {f.dueDate ? new Date(f.dueDate).toLocaleDateString('en-IN') : 'N/A'}
                </p>
              </div>
              <StatusBadge status={f.status} />
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-xs text-blue-500 font-medium mb-1">Total</p>
                <p className="text-lg font-bold text-blue-700">{fmt(f.totalAmount)}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <p className="text-xs text-green-500 font-medium mb-1">Paid</p>
                <p className="text-lg font-bold text-green-700">{fmt(f.totalPaid)}</p>
              </div>
              <div className="bg-red-50 rounded-xl p-3 text-center">
                <p className="text-xs text-red-500 font-medium mb-1">Due</p>
                <p className="text-lg font-bold text-red-700">{fmt(f.totalDue)}</p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 overflow-hidden mb-4">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Fee Structure
                </p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Fee Head</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500">Amount</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500">Paid</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500">Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {f.feeHeads?.map((head, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5 text-gray-700 font-medium">{head.headName}</td>
                      <td className="px-4 py-2.5 text-right text-gray-700">{fmt(head.amount)}</td>
                      <td className="px-4 py-2.5 text-right text-green-600 font-medium">
                        {head.paid > 0 ? fmt(head.paid) : '-'}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium">
                        {head.due > 0 ? (
                          <span className="text-red-600">{fmt(head.due)}</span>
                        ) : (
                          <span className="text-green-500 text-xs font-semibold">Paid</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t-2 border-gray-200">
                    <td className="px-4 py-3 font-bold text-gray-800">Total</td>
                    <td className="px-4 py-3 text-right font-bold text-blue-700">{fmt(f.totalAmount)}</td>
                    <td className="px-4 py-3 text-right font-bold text-green-700">{fmt(f.totalPaid)}</td>
                    <td className="px-4 py-3 text-right font-bold text-red-700">
                      {f.totalDue > 0 ? fmt(f.totalDue) : (
                        <span className="text-green-600">Fully Paid</span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {f.totalFine > 0 && (
              <div className="mb-4 px-4 py-2.5 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-2">
                <FiAlertCircle className="text-orange-500 shrink-0" />
                <p className="text-sm text-orange-700">
                  Late fine applied: <strong>{fmt(f.totalFine)}</strong>
                </p>
              </div>
            )}

            {f.totalDue > 0 && (
              <button onClick={() => handlePay(f)} className="btn-primary w-full">
                Pay Now - {fmt(f.totalDue)}
              </button>
            )}

            {f.totalDue === 0 && (
              <div className="text-center py-3 bg-green-50 rounded-xl border border-green-200">
                <p className="text-green-700 font-semibold text-sm">
                  <FiCheckCircle className="inline mr-1 align-[-2px]" />
                  All fees paid for this semester
                </p>
              </div>
            )}

            {f.totalDue < 0 && (
              <div className="text-center py-3 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-sm text-blue-700">
                  <FiInfo className="inline mr-1 align-[-2px]" />
                  This semester has an advance balance of <strong>{fmt(Math.abs(f.totalDue))}</strong>, so no payment is required now.
                </p>
              </div>
            )}
          </div>
        ))}
        {fees.length === 0 && <EmptyState message="No fee records" icon={<FiCreditCard />} />}
      </div>
    </div>
  );
}
