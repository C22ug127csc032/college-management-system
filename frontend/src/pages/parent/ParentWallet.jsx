import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { PageSpinner, EmptyState } from '../../components/common';
import toast from 'react-hot-toast';
import { FiArrowDown, FiArrowUp, FiCreditCard } from '../../components/common/icons';

export default function ParentWallet() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [paying, setPaying] = useState(false);
  const rupee = '\u20B9';

  const studentId = user?.studentRef?._id || user?.studentRef;

  const fetchWallet = async () => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    const r = await api.get(`/wallet/${studentId}`);
    setWallet(r.data.wallet);
    setLoading(false);
  };

  useEffect(() => {
    fetchWallet();
  }, [studentId]);

  const handleTopup = async () => {
    if (!amount || Number(amount) < 10) {
      toast.error(`Minimum top-up is ${rupee}10`);
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
        amount: order.amount,
        currency: 'INR',
        name: 'College Management',
        description: 'Wallet Top-Up',
        order_id: order.id,
        handler: async response => {
          await api.post('/wallet/topup/verify', {
            ...response,
            studentId,
            amount: Number(amount),
          });
          toast.success(`${rupee}${amount} added to wallet`);
          setAmount('');
          fetchWallet();
        },
        prefill: { name: user?.name, contact: user?.phone },
        theme: { color: '#16a34a' },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Top-up failed');
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="max-w-2xl">
      <h1 className="page-title mb-6">Child Wallet</h1>
      <div className="bg-gradient-to-r from-green-700 to-green-600 rounded-2xl p-6 text-white mb-6 shadow-lg">
        <p className="text-green-100 text-sm mb-1">Available Balance</p>
        <p className="text-5xl font-bold">{rupee}{(wallet?.balance || 0).toLocaleString('en-IN')}</p>
        <p className="text-green-100 text-xs mt-3">Use for Shop & Canteen purchases</p>
      </div>
      <div className="card mb-6">
        <h3 className="section-title">Top Up Wallet</h3>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">{rupee}</span>
            <input type="number" className="input pl-7" placeholder="Enter amount" min="10" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <button onClick={handleTopup} disabled={paying || !amount} className="btn-primary px-6 whitespace-nowrap">
            {paying ? 'Processing...' : 'Add Money'}
          </button>
        </div>
      </div>
      <div className="card">
        <h3 className="section-title">Transaction History</h3>
        {!wallet?.transactions?.length && <EmptyState message="No transactions yet" icon={<FiCreditCard />} />}
        {[...(wallet?.transactions || [])].reverse().map((txn, i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${txn.type === 'credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {txn.type === 'credit' ? <FiArrowUp /> : <FiArrowDown />}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{txn.description}</p>
                <p className="text-xs text-gray-400">{new Date(txn.date).toLocaleString('en-IN')}</p>
              </div>
            </div>
            <span className={txn.type === 'credit' ? 'font-semibold text-green-600' : 'font-semibold text-red-600'}>
              {txn.type === 'credit' ? '+' : '-'}{rupee}{txn.amount?.toLocaleString('en-IN')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
