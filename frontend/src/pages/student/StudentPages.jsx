import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { PageSpinner, StatusBadge, StatCard, EmptyState } from '../../components/common';
import { FiBell, FiBook, FiCalendar, FiClipboard, FiDollarSign, FiLogOut, HiOutlineHandRaised } from '../../components/common/icons';
import toast from 'react-hot-toast';

// ─── STUDENT DASHBOARD ───────────────────────────────────────────────────────
export function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.studentRef) { setLoading(false); return; }
    const id = user.studentRef._id || user.studentRef;
    Promise.all([
      api.get(`/fees/student/${id}`),
      api.get(`/leave?studentId=${id}`),
      api.get(`/circulars`),
    ]).then(([f, l, c]) => setData({ fees: f.data.fees, leaves: l.data.leaves, circulars: c.data.circulars }))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <PageSpinner />;

  const pendingFees = data?.fees?.filter(f => f.status !== 'paid') || [];
  const totalDue = pendingFees.reduce((s, f) => s + (f.totalDue || 0), 0);
  const pendingLeaves = data?.leaves?.filter(l => l.status === 'pending').length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title flex items-center gap-2">Welcome, {user?.name}! <HiOutlineHandRaised className="text-amber-500" /></h1>
        <p className="text-sm text-gray-500 mt-0.5">Here's your academic summary</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<FiDollarSign />} label="Total Due" value={'₹' + totalDue.toLocaleString('en-IN')} color="red" />
        <StatCard icon={<FiClipboard />} label="Fee Records" value={data?.fees?.length || 0} color="blue" />
        <StatCard icon={<FiCalendar />} label="Pending Leaves" value={pendingLeaves} color="yellow" />
        <StatCard icon={<FiBell />} label="Circulars" value={data?.circulars?.length || 0} color="purple" />
      </div>
      <div className="card">
        <h3 className="section-title">Recent Circulars</h3>
        {data?.circulars?.slice(0, 3).map(c => (
          <div key={c._id} className="py-3 border-b border-gray-50 last:border-0">
            <p className="font-medium text-gray-800 text-sm">{c.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">{new Date(c.publishDate).toLocaleDateString('en-IN')}</p>
          </div>
        ))}
        {(!data?.circulars?.length) && <EmptyState message="No circulars" icon={<FiBell />} />}
      </div>
    </div>
  );
}

// ─── STUDENT FEES ─────────────────────────────────────────────────────────────
export function StudentFees() {
  const { user } = useAuth();
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = user?.studentRef?._id || user?.studentRef;
    if (!id) { setLoading(false); return; }
    api.get(`/fees/student/${id}`).then(r => setFees(r.data.fees)).finally(() => setLoading(false));
  }, [user]);

  const handlePay = async (fee) => {
    try {
      const orderRes = await api.post('/payments/create-order', {
        amount: fee.totalDue,
        studentFeesId: fee._id,
        studentId: user.studentRef?._id || user.studentRef,
      });
      const { order, key } = orderRes.data;
      const options = {
        key,
        amount: order.amount,
        currency: 'INR',
        name: 'College Management',
        description: `Fee Payment – ${fee.academicYear}`,
        order_id: order.id,
        handler: async (response) => {
          await api.post('/payments/verify', {
            ...response,
            studentFeesId: fee._id,
            studentId: user.studentRef?._id || user.studentRef,
            amount: fee.totalDue,
          });
          toast.success('Payment successful!');
          const r = await api.get(`/fees/student/${user.studentRef?._id || user.studentRef}`);
          setFees(r.data.fees);
        },
        prefill: { name: user.name, contact: user.phone },
        theme: { color: '#2563eb' },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error('Payment failed: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <PageSpinner />;
  const fmt = n => '₹' + (n || 0).toLocaleString('en-IN');

  return (
    <div>
      <h1 className="page-title mb-6">My Fees</h1>
      <div className="space-y-4">
        {fees.map(f => (
          <div key={f._id} className="card">
            <div className="flex flex-wrap justify-between items-start mb-4">
              <div>
                <p className="font-semibold text-gray-800">{f.academicYear} – Semester {f.semester}</p>
                <p className="text-sm text-gray-500 mt-0.5">Due: {f.dueDate ? new Date(f.dueDate).toLocaleDateString('en-IN') : 'N/A'}</p>
              </div>
              <StatusBadge status={f.status} />
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-blue-50 rounded-lg p-3 text-center"><p className="text-lg font-bold text-blue-700">{fmt(f.totalAmount)}</p><p className="text-xs text-blue-500">Total</p></div>
              <div className="bg-green-50 rounded-lg p-3 text-center"><p className="text-lg font-bold text-green-700">{fmt(f.totalPaid)}</p><p className="text-xs text-green-500">Paid</p></div>
              <div className="bg-red-50 rounded-lg p-3 text-center"><p className="text-lg font-bold text-red-700">{fmt(f.totalDue)}</p><p className="text-xs text-red-500">Due</p></div>
            </div>
            <table className="w-full text-sm mb-4">
              <thead><tr className="bg-gray-50"><th className="text-left p-2 text-xs text-gray-500">Fee Head</th><th className="text-right p-2 text-xs text-gray-500">Amount</th><th className="text-right p-2 text-xs text-gray-500">Paid</th><th className="text-right p-2 text-xs text-gray-500">Due</th></tr></thead>
              <tbody>{f.feeHeads?.map((h, i) => <tr key={i} className="border-t border-gray-50"><td className="p-2">{h.headName}</td><td className="p-2 text-right">{fmt(h.amount)}</td><td className="p-2 text-right text-green-600">{fmt(h.paid)}</td><td className="p-2 text-right text-red-600">{fmt(h.due)}</td></tr>)}</tbody>
            </table>
            {f.status !== 'paid' && f.totalDue > 0 && (
              <button onClick={() => handlePay(f)} className="btn-primary w-full">Pay Now – {fmt(f.totalDue)}</button>
            )}
          </div>
        ))}
        {fees.length === 0 && <div className="card text-center py-12 text-gray-400"><div className="text-4xl mb-3 flex justify-center"><FiDollarSign /></div><p>No fee records found</p></div>}
      </div>
    </div>
  );
}

// ─── STUDENT LEDGER ───────────────────────────────────────────────────────────
export function StudentLedger() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = user?.studentRef?._id || user?.studentRef;
    if (!id) { setLoading(false); return; }
    api.get(`/ledger/student/${id}`).then(r => setEntries(r.data.entries)).finally(() => setLoading(false));
  }, [user]);

  if (loading) return <PageSpinner />;
  const fmt = n => '₹' + (n || 0).toLocaleString('en-IN');

  return (
    <div>
      <h1 className="page-title mb-6">My Ledger</h1>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr><th className="table-header">Date</th><th className="table-header">Category</th><th className="table-header">Description</th><th className="table-header">Debit</th><th className="table-header">Credit</th><th className="table-header">Balance</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {entries.map((e, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="table-cell">{new Date(e.date).toLocaleDateString('en-IN')}</td>
                <td className="table-cell capitalize">{e.category?.replace('_', ' ')}</td>
                <td className="table-cell text-gray-500">{e.description}</td>
                <td className="table-cell text-red-600 font-medium">{e.type === 'debit' ? fmt(e.amount) : ''}</td>
                <td className="table-cell text-green-600 font-medium">{e.type === 'credit' ? fmt(e.amount) : ''}</td>
                <td className="table-cell font-semibold">{fmt(e.runningBalance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && <EmptyState message="No ledger entries" icon={<FiBook />} />}
      </div>
    </div>
  );
}

// ─── STUDENT LEAVE ─────────────────────────────────────────────────────────────
export function StudentLeave() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ leaveType: 'personal', fromDate: '', toDate: '', reason: '' });

  const id = user?.studentRef?._id || user?.studentRef;
  const fetch = async () => {
    const r = await api.get('/leave', { params: { studentId: id } });
    setLeaves(r.data.leaves);
  };
  useEffect(() => { if (id) fetch(); }, [id]);

  const apply = async e => {
    e.preventDefault();
    await api.post('/leave', { studentId: id, ...form });
    toast.success('Leave applied'); setShow(false); fetch();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-title">Leave Requests</h1>
        <button onClick={() => setShow(true)} className="btn-primary">+ Apply Leave</button>
      </div>
      <div className="space-y-3">
        {leaves.map(l => (
          <div key={l._id} className="card flex flex-wrap justify-between items-start gap-3">
            <div>
              <p className="font-medium text-gray-800 capitalize">{l.leaveType} Leave</p>
              <p className="text-sm text-gray-500">{new Date(l.fromDate).toLocaleDateString('en-IN')} – {new Date(l.toDate).toLocaleDateString('en-IN')} ({l.noOfDays} days)</p>
              <p className="text-sm text-gray-600 mt-1">{l.reason}</p>
              {l.remarks && <p className="text-xs text-gray-400 mt-1">Remarks: {l.remarks}</p>}
            </div>
            <StatusBadge status={l.status} />
          </div>
        ))}
        {leaves.length === 0 && <EmptyState message="No leave requests" icon={<FiCalendar />} />}
      </div>
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Apply for Leave</h3>
            <form onSubmit={apply} className="space-y-3">
              <div><label className="label">Type</label>
                <select className="input" value={form.leaveType} onChange={e => setForm(f => ({ ...f, leaveType: e.target.value }))}>
                  {['sick','personal','emergency','other'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">From *</label><input type="date" className="input" value={form.fromDate} onChange={e => setForm(f => ({ ...f, fromDate: e.target.value }))} required /></div>
                <div><label className="label">To *</label><input type="date" className="input" value={form.toDate} onChange={e => setForm(f => ({ ...f, toDate: e.target.value }))} required /></div>
              </div>
              <div><label className="label">Reason *</label><textarea className="input" rows={3} value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} required /></div>
              <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShow(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Apply</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── STUDENT OUTPASS ──────────────────────────────────────────────────────────
export function StudentOutpass() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ exitDate: '', exitTime: '', expectedReturn: '', reason: '', destination: '' });
  const id = user?.studentRef?._id || user?.studentRef;

  const fetch = async () => { const r = await api.get('/outpass', { params: { studentId: id } }); setList(r.data.outpasses); };
  useEffect(() => { if (id) fetch(); }, [id]);

  const apply = async e => {
    e.preventDefault();
    await api.post('/outpass', { studentId: id, ...form });
    toast.success('Outpass requested'); setShow(false); fetch();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-title">Outpass</h1>
        <button onClick={() => setShow(true)} className="btn-primary">+ Request Outpass</button>
      </div>
      <div className="space-y-3">
        {list.map(o => (
          <div key={o._id} className="card flex flex-wrap justify-between items-start gap-3">
            <div>
              <p className="font-medium text-gray-800">{o.reason}</p>
              <p className="text-sm text-gray-500">Exit: {new Date(o.exitDate).toLocaleDateString('en-IN')} • Expected Return: {new Date(o.expectedReturn).toLocaleDateString('en-IN')}</p>
              {o.destination && <p className="text-sm text-gray-400">Destination: {o.destination}</p>}
              {o.remarks && <p className="text-xs text-gray-400">Remarks: {o.remarks}</p>}
            </div>
            <StatusBadge status={o.status} />
          </div>
        ))}
        {list.length === 0 && <EmptyState message="No outpass requests" icon={<FiLogOut />} />}
      </div>
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Request Outpass</h3>
            <form onSubmit={apply} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Exit Date *</label><input type="date" className="input" value={form.exitDate} onChange={e => setForm(f => ({ ...f, exitDate: e.target.value }))} required /></div>
                <div><label className="label">Exit Time</label><input type="time" className="input" value={form.exitTime} onChange={e => setForm(f => ({ ...f, exitTime: e.target.value }))} /></div>
                <div><label className="label">Expected Return *</label><input type="date" className="input" value={form.expectedReturn} onChange={e => setForm(f => ({ ...f, expectedReturn: e.target.value }))} required /></div>
                <div><label className="label">Destination</label><input className="input" value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} /></div>
              </div>
              <div><label className="label">Reason *</label><textarea className="input" rows={3} value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} required /></div>
              <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShow(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Request</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── STUDENT CIRCULARS ─────────────────────────────────────────────────────────
export function StudentCirculars() {
  const [circulars, setCirculars] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/circulars').then(r => setCirculars(r.data.circulars)).finally(() => setLoading(false)); }, []);

  const typeColors = { circular: 'badge-blue', announcement: 'badge-yellow', exam_schedule: 'badge-red', event: 'badge-green', holiday: 'badge-gray' };

  if (loading) return <PageSpinner />;
  return (
    <div>
      <h1 className="page-title mb-6">Circulars & Announcements</h1>
      <div className="space-y-4">
        {circulars.map(c => (
          <div key={c._id} className="card">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-800">{c.title}</h3>
              <span className={typeColors[c.type] || 'badge-gray'}>{c.type.replace('_', ' ')}</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{c.content}</p>
            <p className="text-xs text-gray-400 mt-3">{new Date(c.publishDate).toLocaleDateString('en-IN')}</p>
          </div>
        ))}
        {circulars.length === 0 && <EmptyState message="No circulars published" icon={<FiBell />} />}
      </div>
    </div>
  );
}

// ─── STUDENT PROFILE ──────────────────────────────────────────────────────────
export function StudentProfile() {
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const id = user?.studentRef?._id || user?.studentRef;
    if (!id) { setLoading(false); return; }
    api.get(`/students/${id}`).then(r => setStudent(r.data.student)).finally(() => setLoading(false));
  }, [user]);

  if (loading) return <PageSpinner />;
  if (!student) return <EmptyState message="Profile not found" />;

  const Row = ({ label, value }) => (
    <div className="flex justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value || '–'}</span>
    </div>
  );

  return (
    <div>
      <h1 className="page-title mb-6">My Profile</h1>
      <div className="flex items-center gap-5 mb-6 p-5 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="w-20 h-20 rounded-xl bg-primary-100 text-primary-700 text-3xl font-bold flex items-center justify-center shrink-0">
          {student.photo ? <img src={student.photo} alt="" className="w-20 h-20 rounded-xl object-cover" /> : student.firstName[0]}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{student.firstName} {student.lastName}</h2>
          <p className="text-gray-500 text-sm">{student.regNo}</p>
          <p className="text-gray-500 text-sm">{student.course?.name}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card"><h3 className="section-title">Personal</h3>
          <Row label="Phone" value={student.phone} /><Row label="Email" value={student.email} />
          <Row label="DOB" value={student.dob ? new Date(student.dob).toLocaleDateString('en-IN') : null} />
          <Row label="Gender" value={student.gender} /><Row label="Blood Group" value={student.bloodGroup} />
          <Row label="Category" value={student.category} />
        </div>
        <div className="card"><h3 className="section-title">Academic</h3>
          <Row label="Reg No" value={student.regNo} /><Row label="Course" value={student.course?.name} />
          <Row label="Semester" value={student.semester} /><Row label="Batch" value={student.batch} />
          <Row label="Roll No" value={student.rollNo} /><Row label="Academic Year" value={student.academicYear} />
        </div>
        <div className="card"><h3 className="section-title">Parent Details</h3>
          <Row label="Father" value={student.father?.name} /><Row label="Father Phone" value={student.father?.phone} />
          <Row label="Mother" value={student.mother?.name} /><Row label="Mother Phone" value={student.mother?.phone} />
        </div>
        <div className="card"><h3 className="section-title">Address</h3>
          <Row label="Street" value={student.address?.street} /><Row label="City" value={student.address?.city} />
          <Row label="State" value={student.address?.state} /><Row label="Pincode" value={student.address?.pincode} />
        </div>
      </div>
    </div>
  );
}
