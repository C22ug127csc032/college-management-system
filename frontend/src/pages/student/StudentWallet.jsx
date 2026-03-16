import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { PageSpinner, EmptyState } from '../../components/common';
import toast from 'react-hot-toast';

export default function StudentWallet() {
  const { user }            = useAuth();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [paying, setPaying] = useState(false);

  const studentId = user?.studentRef?._id || user?.studentRef;

  const fetchWallet = async () => {
    if (!studentId) { setLoading(false); return; }
    const r = await api.get(`/wallet/${studentId}`);
    setWallet(r.data.wallet);
    setLoading(false);
  };

  useEffect(() => { fetchWallet(); }, [studentId]);

  const handleTopup = async () => {
    if (!amount || Number(amount) < 10) {
      toast.error('Minimum top-up is ₹10');
      return;
    }
    setPaying(true);
    try {
      const orderRes = await api.post('/wallet/topup/order', {
        studentId,
        amount: Number(amount),
      });
      const { order, key } = orderRes.data;

      const options = {
        key,
        amount:      order.amount,
        currency:    'INR',
        name:        'College Management',
        description: 'Wallet Top-Up',
        order_id:    order.id,
        handler: async response => {
          await api.post('/wallet/topup/verify', {
            ...response,
            studentId,
            amount: Number(amount),
          });
          toast.success(`₹${amount} added to wallet!`);
          setAmount('');
          fetchWallet();
        },
        prefill: { name: user?.name, contact: user?.phone },
        theme:   { color: '#2563eb' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Top-up failed');
    } finally {
      setPaying(false);
    }
  };

  const quickAmounts = [100, 200, 500, 1000];

  if (loading) return <PageSpinner />;

  return (
    <div className="max-w-2xl">
      <h1 className="page-title mb-6">My Wallet</h1>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-primary-700 to-primary-600 rounded-2xl
        p-6 text-white mb-6 shadow-lg">
        <p className="text-primary-200 text-sm mb-1">Available Balance</p>
        <p className="text-5xl font-bold">
          ₹{(wallet?.balance || 0).toLocaleString('en-IN')}
        </p>
        <p className="text-primary-200 text-xs mt-3">
          Use for Shop & Canteen purchases
        </p>
      </div>

      {/* Top Up Section */}
      <div className="card mb-6">
        <h3 className="section-title">Top Up Wallet</h3>

        {/* Quick Amount Buttons */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {quickAmounts.map(a => (
            <button
              key={a}
              onClick={() => setAmount(String(a))}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors
                ${Number(amount) === a
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'}`}
            >
              ₹{a}
            </button>
          ))}
        </div>

        {/* Custom Amount Input */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2
              text-gray-500 font-medium">₹</span>
            <input
              type="number"
              className="input pl-7"
              placeholder="Enter amount"
              min="10"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>
          <button
            onClick={handleTopup}
            disabled={paying || !amount}
            className="btn-primary px-6 whitespace-nowrap"
          >
            {paying ? 'Processing...' : 'Add Money'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Secure payment via Razorpay. Minimum ₹10.
        </p>
      </div>

      {/* Transaction History */}
      <div className="card">
        <h3 className="section-title">Transaction History</h3>
        <div className="space-y-0">
          {!wallet?.transactions?.length && (
            <EmptyState message="No transactions yet" icon="💳" />
          )}
          {[...(wallet?.transactions || [])].reverse().map((txn, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3
                border-b border-gray-50 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center
                  text-sm font-bold
                  ${txn.type === 'credit'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'}`}
                >
                  {txn.type === 'credit' ? '↑' : '↓'}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{txn.description}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(txn.date).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
              <span className={`font-semibold
                ${txn.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                {txn.type === 'credit' ? '+' : '-'}₹{txn.amount?.toLocaleString('en-IN')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}