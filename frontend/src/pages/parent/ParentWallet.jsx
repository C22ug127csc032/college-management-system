import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { PageSpinner, EmptyState } from '../../components/common';
import toast from 'react-hot-toast';
import {
  FiArrowDown, FiArrowUp, FiCreditCard,
} from '../../components/common/icons';

const QUICK = [100, 200, 500, 1000];

export default function ParentWallet() {
  const { user }            = useAuth();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount]   = useState('');
  const [desc, setDesc]       = useState('');
  const [paying, setPaying]   = useState(false);

  const studentId = user?.studentRef?._id || user?.studentRef;

  const fetchWallet = async () => {
    if (!studentId) { setLoading(false); return; }
    try {
      const r = await api.get(`/wallet/${studentId}`);
      setWallet(r.data.wallet);
    } catch {
      toast.error('Failed to load wallet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWallet(); }, [studentId]);

  const handleTopup = async () => {
    if (!amount || Number(amount) < 10) {
      toast.error('Minimum top-up is ₹10');
      return;
    }
    setPaying(true);
    try {
      await api.post('/wallet/topup/manual', {
        studentId,
        amount:      Number(amount),
        description: desc || `Top-up by parent — ₹${amount}`,
      });
      toast.success(`₹${amount} added to wallet!`);
      setAmount('');
      setDesc('');
      fetchWallet();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Top-up failed');
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="max-w-2xl">
      <h1 className="page-title mb-6">Child's Wallet</h1>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-green-700 to-green-600
        rounded-2xl p-6 text-white mb-6 shadow-lg">
        <p className="text-green-100 text-sm mb-1">Available Balance</p>
        <p className="text-5xl font-bold">
          ₹{(wallet?.balance || 0).toLocaleString('en-IN')}
        </p>
        <p className="text-green-100 text-xs mt-3">
          Used at Canteen and Shop inside college
        </p>
      </div>

      {/* Top Up */}
      <div className="card mb-6">
        <h3 className="section-title mb-4">Add Money to Wallet</h3>

        {/* Quick amounts */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {QUICK.map(a => (
            <button key={a}
              onClick={() => setAmount(String(a))}
              className={`px-4 py-2 rounded-lg border text-sm font-medium
                transition-colors ${
                Number(amount) === a
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'
              }`}>
              ₹{a}
            </button>
          ))}
        </div>

        {/* Amount input */}
        <div className="relative mb-3">
          <span className="absolute left-3 top-1/2 -translate-y-1/2
            text-gray-500 font-medium">₹</span>
          <input
            type="number"
            className="input pl-7 text-lg"
            placeholder="Enter amount (min ₹10)"
            min="10"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
        </div>

        {/* Description */}
        <input
          className="input mb-3"
          placeholder="Note (optional) e.g. Monthly canteen allowance"
          value={desc}
          onChange={e => setDesc(e.target.value)}
        />

        {/* New balance preview */}
        {amount && Number(amount) >= 10 && (
          <div className="flex items-center justify-between p-3 bg-green-50
            border border-green-200 rounded-xl mb-3">
            <span className="text-sm text-green-700">New balance after top-up</span>
            <span className="text-lg font-bold text-green-700">
              ₹{((wallet?.balance || 0) + Number(amount)).toLocaleString('en-IN')}
            </span>
          </div>
        )}

        <button
          onClick={handleTopup}
          disabled={paying || !amount || Number(amount) < 10}
          className="w-full py-3 bg-green-600 hover:bg-green-700 text-white
            font-semibold rounded-lg transition-colors disabled:opacity-50">
          {paying ? 'Adding...' : `Add ₹${amount || 0} to Wallet`}
        </button>
      </div>

      {/* Transaction History */}
      <div className="card">
        <h3 className="section-title mb-4">Transaction History</h3>
        {!wallet?.transactions?.length
          ? <EmptyState message="No transactions yet" icon={<FiCreditCard />} />
          : (
            <div className="space-y-0">
              {[...(wallet.transactions)].reverse().map((txn, i) => (
                <div key={i}
                  className="flex items-center justify-between py-3
                    border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center
                      justify-center text-sm font-bold ${
                      txn.type === 'credit'
                        ? 'bg-green-100 text-green-700'
                        : txn.description?.toLowerCase().includes('canteen')
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-red-100 text-red-700'
                    }`}>
                      {txn.type === 'credit' ? <FiArrowUp /> : <FiArrowDown />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {txn.description}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(txn.date).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <span className={`font-semibold ${
                    txn.type === 'credit' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {txn.type === 'credit' ? '+' : '-'}₹{txn.amount?.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  );
}