import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { PageHeader, Table, StatusBadge, FilterBar, EmptyState, Modal, PageSpinner } from '../../components/common';
import { FiCalendar, FiCheck, FiX } from '../../components/common/icons';
import toast from 'react-hot-toast';

export default function LeaveManagement() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selected, setSelected] = useState(null);
  const [remark, setRemark] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/leave', { params: { status: filter || undefined } });
      setLeaves(r.data.leaves);
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleAction = async (id, status) => {
    try {
      await api.put(`/leave/${id}/status`, { status, remarks: remark });
      toast.success(`Leave ${status}`);
      setSelected(null); setRemark('');
      fetch();
    } catch { toast.error('Failed'); }
  };

  return (
    <div>
      <PageHeader title="Leave Management" subtitle={`${leaves.length} records`} />
      <div className="card">
        <FilterBar>
          {['', 'pending', 'approved', 'rejected'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s || 'All'}
            </button>
          ))}
        </FilterBar>
        {loading ? <PageSpinner /> : (
          <Table headers={['Student', 'Type', 'From', 'To', 'Days', 'Reason', 'Status', 'Actions']}>
            {leaves.map(l => (
              <tr key={l._id} className="hover:bg-gray-50">
                <td className="table-cell"><p className="font-medium">{l.student?.firstName} {l.student?.lastName}</p><p className="text-xs text-gray-400">{l.student?.regNo}</p></td>
                <td className="table-cell capitalize">{l.leaveType}</td>
                <td className="table-cell">{new Date(l.fromDate).toLocaleDateString('en-IN')}</td>
                <td className="table-cell">{new Date(l.toDate).toLocaleDateString('en-IN')}</td>
                <td className="table-cell text-center">{l.noOfDays}</td>
                <td className="table-cell max-w-xs truncate" title={l.reason}>{l.reason}</td>
                <td className="table-cell"><StatusBadge status={l.status} /></td>
                <td className="table-cell">
                  {l.status === 'pending' && (
                    <button onClick={() => { setSelected(l); setRemark(''); }} className="text-primary-600 hover:underline text-sm">Review</button>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        )}
        {!loading && leaves.length === 0 && <EmptyState message="No leave requests" icon={<FiCalendar />} />}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Review Leave Request">
        {selected && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
              <p><span className="text-gray-500">Student:</span> <strong>{selected.student?.firstName} {selected.student?.lastName}</strong></p>
              <p><span className="text-gray-500">Period:</span> {new Date(selected.fromDate).toLocaleDateString('en-IN')} - {new Date(selected.toDate).toLocaleDateString('en-IN')} ({selected.noOfDays} days)</p>
              <p><span className="text-gray-500">Reason:</span> {selected.reason}</p>
            </div>
            <div>
              <label className="label">Remarks (optional)</label>
              <textarea className="input" rows={3} value={remark} onChange={e => setRemark(e.target.value)} placeholder="Add remarks..." />
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleAction(selected._id, 'approved')} className="btn-success flex-1 flex items-center justify-center gap-2"><FiCheck /> Approve</button>
              <button onClick={() => handleAction(selected._id, 'rejected')} className="btn-danger flex-1 flex items-center justify-center gap-2"><FiX /> Reject</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
