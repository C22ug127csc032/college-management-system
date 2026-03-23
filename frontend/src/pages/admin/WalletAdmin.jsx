import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
  PageHeader, EmptyState, FilterBar,
  PageSpinner,
} from '../../components/common';
import {
  FiUser, FiArrowUp, FiArrowDown, FiCreditCard, FiArrowRight, FiInfo, FiX,
} from '../../components/common/icons';
import toast from 'react-hot-toast';

export default function WalletAdmin() {
  const [students, setStudents] = useState([]);
  const [wallets, setWallets] = useState({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [txnLoading, setTxnLoading] = useState(false);

  useEffect(() => {
    api.get('/students?limit=200')
      .then(r => setStudents(r.data.students))
      .finally(() => setLoading(false));
  }, []);

  const loadWallet = async studentId => {
    if (wallets[studentId]) return;
    try {
      const r = await api.get(`/wallet/${studentId}`);
      setWallets(w => ({ ...w, [studentId]: r.data.wallet }));
    } catch { /* ignore */ }
  };

  const openDetail = async student => {
    setSelected(student);
    setTxnLoading(true);
    try {
      const r = await api.get(`/wallet/${student._id}`);
      setWallets(w => ({ ...w, [student._id]: r.data.wallet }));
    } catch {
      toast.error('Failed to load wallet');
    } finally {
      setTxnLoading(false);
    }
  };

  const filtered = students.filter(s =>
    !search ||
    `${s.firstName} ${s.lastName} ${s.admissionNo} ${s.phone}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const wallet = selected ? wallets[selected._id] : null;

  return (
    <div>
      <PageHeader
        title="Wallet Management"
        subtitle="View student wallet balances - parents top up via Parent Portal"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card">
          <FilterBar>
            <input
              className="input w-64"
              placeholder="Search by name, admission no, phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </FilterBar>

          {loading ? <PageSpinner /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-header">Student</th>
                    <th className="table-header">Admission No</th>
                    <th className="table-header">Balance</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(s => (
                    <tr
                      key={s._id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onMouseEnter={() => loadWallet(s._id)}
                      onClick={() => openDetail(s)}
                    >
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {s.firstName?.[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">
                              {s.firstName} {s.lastName}
                            </p>
                            <p className="text-xs text-gray-400">{s.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell font-mono text-xs text-gray-500">
                        {s.admissionNo || s.regNo || '-'}
                      </td>
                      <td className="table-cell">
                        <span className="text-base font-bold text-green-600">
                          ₹{wallets[s._id]?.balance?.toLocaleString('en-IN') ?? '-'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <button
                          onClick={e => { e.stopPropagation(); openDetail(s); }}
                          className="text-xs text-primary-600 hover:underline font-medium inline-flex items-center gap-1"
                        >
                          <span>View History</span>
                          <FiArrowRight className="shrink-0" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <EmptyState message="No students found" icon={<FiUser />} />
              )}
            </div>
          )}
        </div>

        <div className="card">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-300">
              <FiCreditCard className="text-4xl mb-3" />
              <p className="text-sm">Click a student to view wallet</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 font-bold flex items-center justify-center">
                  {selected.firstName?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">
                    {selected.firstName} {selected.lastName}
                  </p>
                  <p className="text-xs text-gray-400 font-mono">
                    {selected.admissionNo || selected.regNo}
                  </p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="ml-auto text-gray-400 hover:text-gray-600"
                >
                  <FiX />
                </button>
              </div>

              <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-xl p-4 text-white mb-4">
                <p className="text-green-100 text-xs mb-1">Wallet Balance</p>
                <p className="text-3xl font-bold">
                  ₹{(wallet?.balance || 0).toLocaleString('en-IN')}
                </p>
                <p className="text-green-200 text-xs mt-1">
                  Parent tops up via Parent Portal
                </p>
              </div>

              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl mb-4">
                <FiInfo className="text-blue-500 text-sm mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700">
                  Only parents can top up the wallet.
                  Canteen and Shop operators deduct from wallet
                  when student makes a purchase.
                </p>
              </div>

              <p className="text-sm font-semibold text-gray-700 mb-3">
                Recent Transactions
              </p>
              {txnLoading ? (
                <div className="text-center py-6 text-gray-400 text-sm">
                  Loading...
                </div>
              ) : !wallet?.transactions?.length ? (
                <p className="text-center py-6 text-gray-400 text-sm">
                  No transactions yet
                </p>
              ) : (
                <div className="space-y-0 max-h-80 overflow-y-auto">
                  {[...(wallet.transactions)].reverse().map((txn, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                          txn.type === 'credit'
                            ? 'bg-green-100 text-green-700'
                            : txn.description?.toLowerCase().includes('canteen')
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-red-100 text-red-700'
                        }`}>
                          {txn.type === 'credit' ? <FiArrowUp /> : <FiArrowDown />}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-700">
                            {txn.description}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(txn.date).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs font-bold ${
                        txn.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {txn.type === 'credit' ? '+' : '-'}₹{txn.amount}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
