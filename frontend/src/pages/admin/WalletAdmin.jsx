import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { PageHeader, Table, EmptyState, Modal, PageSpinner, FilterBar } from '../../components/common';
import toast from 'react-hot-toast';

export default function WalletAdmin() {
  const [students, setStudents]   = useState([]);
  const [wallets, setWallets]     = useState({});
  const [search, setSearch]       = useState('');
  const [showTopup, setShowTopup] = useState(null);
  const [topupForm, setTopupForm] = useState({ amount: '', description: '' });
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    api.get('/students?limit=200')
      .then(r => setStudents(r.data.students))
      .finally(() => setLoading(false));
  }, []);

  const loadWallet = async studentId => {
    if (wallets[studentId]) return;
    const r = await api.get(`/wallet/${studentId}`);
    setWallets(w => ({ ...w, [studentId]: r.data.wallet }));
  };

  const handleTopup = async e => {
    e.preventDefault();
    try {
      await api.post('/wallet/topup/manual', {
        studentId:   showTopup._id,
        amount:      Number(topupForm.amount),
        description: topupForm.description || 'Admin top-up',
      });
      toast.success(`₹${topupForm.amount} added to wallet`);
      setWallets(w => {
        const existing = w[showTopup._id];
        if (existing) {
          return {
            ...w,
            [showTopup._id]: {
              ...existing,
              balance: existing.balance + Number(topupForm.amount),
            },
          };
        }
        return w;
      });
      setShowTopup(null);
      setTopupForm({ amount: '', description: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const filtered = students.filter(s =>
    !search ||
    `${s.firstName} ${s.lastName} ${s.regNo}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Wallet Management"
        subtitle="Top up student prepaid wallets for shop & canteen"
      />

      <div className="card">
        <FilterBar>
          <input
            className="input w-64"
            placeholder="Search student name or reg no..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </FilterBar>

        {loading ? <PageSpinner /> : (
          <Table headers={['Student', 'Reg No', 'Course', 'Wallet Balance', 'Actions']}>
            {filtered.map(s => (
              <tr
                key={s._id}
                className="hover:bg-gray-50 transition-colors"
                onMouseEnter={() => loadWallet(s._id)}
              >
                <td className="table-cell">
                  <p className="font-medium text-gray-800">
                    {s.firstName} {s.lastName}
                  </p>
                  <p className="text-xs text-gray-400">{s.phone}</p>
                </td>
                <td className="table-cell font-mono text-xs text-gray-500">
                  {s.regNo}
                </td>
                <td className="table-cell text-sm text-gray-500">
                  {s.course?.name || '–'}
                </td>
                <td className="table-cell">
                  <span className="text-base font-bold text-green-600">
                    ₹{wallets[s._id]?.balance?.toLocaleString('en-IN') ?? '—'}
                  </span>
                </td>
                <td className="table-cell">
                  <button
                    onClick={() => {
                      setShowTopup(s);
                      setTopupForm({ amount: '', description: '' });
                      loadWallet(s._id);
                    }}
                    className="btn-primary text-xs px-3 py-1.5"
                  >
                    + Top Up
                  </button>
                </td>
              </tr>
            ))}
          </Table>
        )}
        {!loading && filtered.length === 0 && (
          <EmptyState message="No students found" icon="👤" />
        )}
      </div>

      {/* Top Up Modal */}
      <Modal
        open={!!showTopup}
        onClose={() => setShowTopup(null)}
        title={`Top Up — ${showTopup?.firstName} ${showTopup?.lastName}`}
      >
        {showTopup && (
          <div className="space-y-4">
            <div className="bg-green-50 p-3 rounded-lg flex justify-between items-center">
              <span className="text-sm text-green-700">Current Balance</span>
              <span className="text-xl font-bold text-green-700">
                ₹{wallets[showTopup._id]?.balance?.toLocaleString('en-IN') ?? '0'}
              </span>
            </div>
            <form onSubmit={handleTopup} className="space-y-3">
              <div>
                <label className="label">Amount to Add (₹) *</label>
                <input
                  type="number"
                  className="input text-xl font-semibold"
                  min="1"
                  placeholder="0"
                  value={topupForm.amount}
                  onChange={e => setTopupForm(f => ({ ...f, amount: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="label">Description</label>
                <input
                  className="input"
                  placeholder="e.g. Monthly allowance"
                  value={topupForm.description}
                  onChange={e => setTopupForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              {topupForm.amount && (
                <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700">
                  New balance will be:{' '}
                  <strong>
                    ₹{(
                      (wallets[showTopup._id]?.balance || 0) + Number(topupForm.amount)
                    ).toLocaleString('en-IN')}
                  </strong>
                </div>
              )}
              <div className="flex gap-3 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowTopup(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-success">
                  Add ₹{topupForm.amount || 0}
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
}