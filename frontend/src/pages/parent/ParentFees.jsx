import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { PageSpinner, StatusBadge, EmptyState } from '../../components/common';
import toast from 'react-hot-toast';
import { FiCreditCard } from '../../components/common/icons';

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

  const handlePay = async fee => {
    try {
      const orderRes = await api.post('/payments/create-order', {
        amount: fee.totalDue,
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
            amount: fee.totalDue,
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
      <div className="space-y-4">
        {fees.map(f => (
          <div key={f._id} className="card">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-semibold text-gray-800">
                  {f.academicYear} - Sem {f.semester}
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
            {f.status !== 'paid' && f.totalDue > 0 && (
              <button onClick={() => handlePay(f)} className="btn-primary w-full mt-4">
                Pay Now - {fmt(f.totalDue)}
              </button>
            )}
          </div>
        ))}
        {fees.length === 0 && <EmptyState message="No fee records" icon={<FiCreditCard />} />}
      </div>
    </div>
  );
}
