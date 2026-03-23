import React, { useState, useEffect, useCallback } from 'react';
import api, { downloadPaymentReceipt } from '../../api/axios';
import { PageHeader, Table, StatusBadge, FilterBar, EmptyState, Modal, PageSpinner, StatCard, Pagination } from '../../components/common';
import { FiAlertOctagon, FiBell, FiCheckCircle, FiClock, FiCreditCard, FiDollarSign, FiLogOut, FiPackage, FiTarget, FiTrendingDown, FiUsers } from '../../components/common/icons';
import toast from 'react-hot-toast';
import { isValidIndianPhone, sanitizePhoneField } from '../../utils/phone';

const SearchableStudentSelect = ({ students, value, onChange, placeholder = 'Select Student...' }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const selectedStudent = students.find(s => s._id === value);

  useEffect(() => {
    setQuery(selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName} (${selectedStudent.regNo})` : '');
  }, [selectedStudent]);

  const filteredStudents = (() => {
    const q = query.trim().toLowerCase();
    if (!q) return students.slice(0, 20);
    return students.filter(s =>
      `${s.firstName} ${s.lastName} ${s.regNo}`.toLowerCase().includes(q)
    ).slice(0, 20);
  })();

  return (
    <div className="relative">
      <input
        className="input"
        value={query}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={e => {
          setQuery(e.target.value);
          setOpen(true);
          if (!e.target.value) onChange('');
        }}
        onBlur={() => {
          setTimeout(() => {
            setOpen(false);
            setQuery(selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName} (${selectedStudent.regNo})` : '');
          }, 150);
        }}
      />
      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-56 overflow-auto">
          {filteredStudents.length ? filteredStudents.map(s => (
            <button
              key={s._id}
              type="button"
              className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm"
              onMouseDown={() => {
                onChange(s._id);
                setQuery(`${s.firstName} ${s.lastName} (${s.regNo})`);
                setOpen(false);
              }}
            >
              {s.firstName} {s.lastName} ({s.regNo})
            </button>
          )) : (
            <div className="px-3 py-2 text-sm text-gray-400">No students found</div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── OUTPASS ──────────────────────────────────────────────────────────────────
export function OutpassManagement() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selected, setSelected] = useState(null);
  const [remark, setRemark] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    const r = await api.get('/outpass', { params: { status: filter || undefined } });
    setList(r.data.outpasses); setLoading(false);
  }, [filter]);
  useEffect(() => { fetch(); }, [fetch]);

  const action = async (id, status) => {
    await api.put(`/outpass/${id}/status`, { status, remarks: remark });
    toast.success(`Outpass ${status}`); setSelected(null); fetch();
  };
  const markReturned = async id => {
    await api.put(`/outpass/${id}/return`); toast.success('Marked as returned'); fetch();
  };

  return (
    <div>
      <PageHeader title="Outpass Management" />
      <div className="card">
        <FilterBar>
          {['', 'pending', 'approved', 'returned', 'rejected'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium ${filter === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s || 'All'}
            </button>
          ))}
        </FilterBar>
        {loading ? <PageSpinner /> : (
          <Table headers={['Student', 'Exit Date', 'Return Date', 'Destination', 'Reason', 'Status', 'Actions']}>
            {list.map(o => (
              <tr key={o._id} className="hover:bg-gray-50">
                <td className="table-cell"><p className="font-medium">{o.student?.firstName} {o.student?.lastName}</p><p className="text-xs text-gray-400">{o.student?.regNo}</p></td>
                <td className="table-cell">{new Date(o.exitDate).toLocaleDateString('en-IN')}</td>
                <td className="table-cell">{new Date(o.expectedReturn).toLocaleDateString('en-IN')}</td>
                <td className="table-cell">{o.destination || '–'}</td>
                <td className="table-cell max-w-xs truncate">{o.reason}</td>
                <td className="table-cell"><StatusBadge status={o.status} /></td>
                <td className="table-cell flex gap-1">
                  {o.status === 'pending' && <button onClick={() => { setSelected(o); setRemark(''); }} className="text-primary-600 text-sm hover:underline">Review</button>}
                  {o.status === 'approved' && <button onClick={() => markReturned(o._id)} className="text-green-600 text-sm hover:underline">Return</button>}
                </td>
              </tr>
            ))}
          </Table>
        )}
        {!loading && list.length === 0 && <EmptyState message="No outpass requests" icon={<FiLogOut />} />}
      </div>
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Review Outpass">
        {selected && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
              <p><strong>{selected.student?.firstName} {selected.student?.lastName}</strong></p>
              <p>Exit: {new Date(selected.exitDate).toLocaleDateString('en-IN')} | Return: {new Date(selected.expectedReturn).toLocaleDateString('en-IN')}</p>
              <p>Reason: {selected.reason}</p>
            </div>
            <textarea className="input" rows={2} value={remark} onChange={e => setRemark(e.target.value)} placeholder="Remarks..." />
            <div className="flex gap-3">
              <button onClick={() => action(selected._id, 'approved')} className="btn-success flex-1">Approve</button>
              <button onClick={() => action(selected._id, 'rejected')} className="btn-danger flex-1">Reject</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── CHECK-IN / OUT ───────────────────────────────────────────────────────────
export function CheckInOut() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ studentRegNo: '', type: 'check_in', location: 'gate', remarks: '' });
  const [studentId, setStudentId] = useState('');

  useEffect(() => {
    api.get('/checkin').then(r => setRecords(r.data.records)).finally(() => setLoading(false));
  }, []);

  const findStudent = async () => {
    try {
      const r = await api.get(`/students/reg/${form.studentRegNo}`);
      setStudentId(r.data.student._id);
      toast.success(`Student found: ${r.data.student.firstName} ${r.data.student.lastName}`);
    } catch { toast.error('Student not found'); setStudentId(''); }
  };

  const handleRecord = async () => {
    if (!studentId) { toast.error('Find student first'); return; }
    await api.post('/checkin', { studentId, type: form.type, location: form.location, remarks: form.remarks });
    toast.success('Check-in/out recorded');
    const r = await api.get('/checkin');
    setRecords(r.data.records);
    setForm(f => ({ ...f, studentRegNo: '', remarks: '' })); setStudentId('');
  };

  return (
    <div>
      <PageHeader title="Check-In / Check-Out" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="card">
          <h3 className="section-title">Record Entry</h3>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input className="input flex-1" placeholder="Registration No" value={form.studentRegNo} onChange={e => setForm(f => ({ ...f, studentRegNo: e.target.value }))} />
              <button onClick={findStudent} className="btn-secondary text-sm px-3">Find</button>
            </div>
            {studentId && <p className="text-xs text-green-600 font-medium flex items-center gap-1"><FiCheckCircle /> Student found</p>}
            <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              <option value="check_in">Check In</option>
              <option value="check_out">Check Out</option>
            </select>
            <select className="input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}>
              <option value="gate">Main Gate</option>
              <option value="hostel">Hostel</option>
              <option value="campus">Campus</option>
            </select>
            <input className="input" placeholder="Remarks (optional)" value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} />
            <button onClick={handleRecord} className="btn-primary w-full">Record</button>
          </div>
        </div>
        <div className="lg:col-span-2 card overflow-x-auto">
          <h3 className="section-title">Recent Records</h3>
          {loading ? <PageSpinner /> : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr><th className="table-header">Student</th><th className="table-header">Type</th><th className="table-header">Location</th><th className="table-header">Time</th></tr></thead>
              <tbody className="divide-y divide-gray-50">
                {records.slice(0, 20).map(r => (
                  <tr key={r._id}>
                    <td className="table-cell font-medium">{r.student?.firstName} {r.student?.lastName}</td>
                    <td className="table-cell"><span className={`badge-${r.type === 'check_in' ? 'green' : 'yellow'}`}>{r.type.replace('_', ' ')}</span></td>
                    <td className="table-cell capitalize">{r.location}</td>
                    <td className="table-cell text-gray-500">{new Date(r.timestamp).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PAYMENTS ADMIN ───────────────────────────────────────────────────────────
export function PaymentsAdmin() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', mode: '', search: '', department: '' });
  const [showManual, setShowManual] = useState(false);
  const [students, setStudents] = useState([]);
  const [studentFeesOptions, setStudentFeesOptions] = useState([]);
  const [manualForm, setManualForm] = useState({ studentId: '', studentFeesId: '', amount: '', paymentMode: 'cash', description: '' });

  const fetch = useCallback(async () => {
    setLoading(true);
    const r = await api.get('/payments', { params: { page, limit: 20, ...filters } });
    setPayments(r.data.payments); setTotal(r.data.total); setLoading(false);
  }, [page, filters]);
  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { api.get('/students?limit=500').then(r => setStudents(r.data.students)); }, []);
  useEffect(() => {
    if (!manualForm.studentId) {
      setStudentFeesOptions([]);
      return;
    }
    api.get(`/fees/student/${manualForm.studentId}`)
      .then(r => setStudentFeesOptions((r.data.fees || []).filter(f => f.totalDue > 0)))
      .catch(() => setStudentFeesOptions([]));
  }, [manualForm.studentId]);
  const selectedFee = studentFeesOptions.find(f => f._id === manualForm.studentFeesId);
  const departments = [...new Set(
    students
      .map(student => student.course?.department?.trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

  const groupedPayments = payments.reduce((groups, payment) => {
    const department = payment.student?.course?.department || 'Unassigned Department';
    const existingGroup = groups.find(group => group.key === department);

    if (existingGroup) {
      existingGroup.payments.push(payment);
      return groups;
    }

    groups.push({
      key: department,
      title: department,
      payments: [payment],
    });
    return groups;
  }, []);

  const renderPaymentsTable = paymentRows => (
    <Table headers={['Receipt No', 'Student', 'Date', 'Amount', 'Mode', 'Status', 'Receipt']}>
      {paymentRows.map(p => (
        <tr key={p._id} className="hover:bg-gray-50">
          <td className="table-cell font-mono text-xs">{p.receiptNo}</td>
          <td className="table-cell"><p className="font-medium">{p.student?.firstName} {p.student?.lastName}</p><p className="text-xs text-gray-400">{p.student?.regNo}</p><p className="text-xs text-gray-400 mt-0.5">{p.student?.course?.name || 'No Course'}</p></td>
          <td className="table-cell">{new Date(p.paymentDate).toLocaleDateString('en-IN')}</td>
          <td className="table-cell font-semibold text-green-600">â‚¹{p.amount?.toLocaleString('en-IN')}</td>
          <td className="table-cell uppercase text-xs">{p.paymentMode}</td>
          <td className="table-cell"><StatusBadge status={p.status} /></td>
          <td className="table-cell">
            <button type="button" onClick={() => handleReceiptDownload(p._id)} className="text-primary-600 text-xs hover:underline">
              PDF
            </button>
          </td>
        </tr>
      ))}
    </Table>
  );
  const handleReceiptDownload = async (paymentId) => {
    try {
      await downloadPaymentReceipt(paymentId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to download receipt');
    }
  };

  const handleManual = async e => {
    e.preventDefault();
    if (!manualForm.studentFeesId) {
      toast.error('Select the assigned fee record');
      return;
    }
    await api.post('/payments/manual', manualForm);
    toast.success('Payment recorded'); setShowManual(false); fetch();
    setManualForm({ studentId: '', studentFeesId: '', amount: '', paymentMode: 'cash', description: '' });
  };

  return (
    <div>
      <PageHeader title="Payments" action={<button onClick={() => setShowManual(true)} className="btn-primary">+ Manual Payment</button>} />
      <div className="card">
        <FilterBar>
          <input className="input w-56" placeholder="Search student / reg no / phone" value={filters.search} onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }} />
          <input type="date" className="input w-40" value={filters.startDate} onChange={e => { setFilters(f => ({ ...f, startDate: e.target.value })); setPage(1); }} />
          <input type="date" className="input w-40" value={filters.endDate} onChange={e => { setFilters(f => ({ ...f, endDate: e.target.value })); setPage(1); }} />
          <select className="input w-36" value={filters.mode} onChange={e => { setFilters(f => ({ ...f, mode: e.target.value })); setPage(1); }}>
            <option value="">All Modes</option>
            {['online','cash','cheque','dd','neft'].map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
          </select>
          <select className="input w-48" value={filters.department} onChange={e => { setFilters(f => ({ ...f, department: e.target.value })); setPage(1); }}>
            <option value="">All Departments</option>
            {departments.map(department => <option key={department} value={department}>{department}</option>)}
          </select>
        </FilterBar>
        {loading ? <PageSpinner /> : (
          <Table headers={['Receipt No', 'Student', 'Date', 'Amount', 'Mode', 'Status', 'Receipt']}>
            {payments.map(p => (
              <tr key={p._id} className="hover:bg-gray-50">
                <td className="table-cell font-mono text-xs">{p.receiptNo}</td>
                <td className="table-cell"><p className="font-medium">{p.student?.firstName} {p.student?.lastName}</p><p className="text-xs text-gray-400">{p.student?.regNo}</p></td>
                <td className="table-cell">{new Date(p.paymentDate).toLocaleDateString('en-IN')}</td>
                <td className="table-cell font-semibold text-green-600">₹{p.amount?.toLocaleString('en-IN')}</td>
                <td className="table-cell uppercase text-xs">{p.paymentMode}</td>
                <td className="table-cell"><StatusBadge status={p.status} /></td>
                <td className="table-cell">
                  <button type="button" onClick={() => handleReceiptDownload(p._id)} className="text-primary-600 text-xs hover:underline">
                    PDF
                  </button>
                </td>
              </tr>
            ))}
          </Table>
        )}
        {!loading && payments.length === 0 && <EmptyState message="No payments found" icon={<FiCreditCard />} />}
        <Pagination page={page} pages={Math.ceil(total / 20)} onPage={setPage} />
      </div>
      <Modal open={showManual} onClose={() => setShowManual(false)} title="Manual Payment Entry">
        <form onSubmit={handleManual} className="space-y-4">
          <div><label className="label">Student *</label>
            <SearchableStudentSelect
              students={students}
              value={manualForm.studentId}
              onChange={studentId => setManualForm(f => ({ ...f, studentId, studentFeesId: '' }))}
            />
          </div>
          <div><label className="label">Assigned Fees *</label>
            <select className="input" value={manualForm.studentFeesId} onChange={e => setManualForm(f => ({ ...f, studentFeesId: e.target.value }))} required disabled={!manualForm.studentId}>
              <option value="">{manualForm.studentId ? 'Select assigned fee' : 'Select student first'}</option>
              {studentFeesOptions.map(f => <option key={f._id} value={f._id}>{f.academicYear} / Sem {f.semester} - Due ₹{(f.totalDue || 0).toLocaleString('en-IN')}</option>)}
            </select>
          </div>
          {selectedFee && (
            <div className="bg-blue-50 rounded-lg p-3 text-sm space-y-1">
              <p className="text-blue-800 font-medium">Total Fees: ₹{(selectedFee.totalAmount || 0).toLocaleString('en-IN')}</p>
              <p className="text-green-700">Paid: ₹{(selectedFee.totalPaid || 0).toLocaleString('en-IN')}</p>
              <p className="text-red-700">Remaining: ₹{(selectedFee.totalDue || 0).toLocaleString('en-IN')}</p>
            </div>
          )}
          <div><label className="label">Amount *</label><input type="number" className="input" value={manualForm.amount} onChange={e => setManualForm(f => ({ ...f, amount: e.target.value }))} required /></div>
          <div><label className="label">Mode</label>
            <select className="input" value={manualForm.paymentMode} onChange={e => setManualForm(f => ({ ...f, paymentMode: e.target.value }))}>
              {['cash','cheque','dd','neft'].map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
            </select>
          </div>
          <div><label className="label">Description</label><input className="input" value={manualForm.description} onChange={e => setManualForm(f => ({ ...f, description: e.target.value }))} /></div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowManual(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Record Payment</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ─── FEES LIST ────────────────────────────────────────────────────────────────
export function FeesList() {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({});
  const [filters, setFilters] = useState({ status: '', academicYear: '', department: '' });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/fees/all', { params: { status: filters.status, academicYear: filters.academicYear } }),
      api.get('/fees/summary', { params: { status: filters.status, academicYear: filters.academicYear } }),
    ]).then(([f, s]) => { setFees(f.data.fees); setSummary(s.data.summary); }).finally(() => setLoading(false));
  }, [filters.status, filters.academicYear]);

  const fmt = n => '₹' + (n || 0).toLocaleString('en-IN');

  return (
    <div>
      <PageHeader title="Fees List" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<FiDollarSign />} label="Total Billed" value={fmt(summary.totalBilled)} color="blue" />
        <StatCard icon={<FiCheckCircle />} label="Collected" value={fmt(summary.totalCollected)} color="green" />
        <StatCard icon={<FiClock />} label="Pending Dues" value={fmt(summary.totalDue)} color="yellow" />
        <StatCard icon={<FiAlertOctagon />} label="Overdue" value={summary.overdueCount || 0} color="red" />
      </div>
      <div className="card">
        <FilterBar>
          <select className="input w-36" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            <option value="">All Status</option>
            {['pending','partial','paid','overdue'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input className="input w-48" placeholder="Search Academic Year" value={filters.academicYear} onChange={e => setFilters(f => ({ ...f, academicYear: e.target.value }))} />
        </FilterBar>
        {loading ? <PageSpinner /> : (
          <Table headers={['Student', 'Course', 'Year/Sem', 'Total', 'Paid', 'Balance', 'Status']}>
            {fees.map(f => (
              <tr key={f._id} className="hover:bg-gray-50">
                <td className="table-cell"><p className="font-medium">{f.student?.firstName} {f.student?.lastName}</p><p className="text-xs text-gray-400">{f.student?.regNo}</p></td>
                <td className="table-cell text-sm text-gray-500">{f.student?.course?.name}</td>
                <td className="table-cell text-sm">{f.academicYear} / Sem {f.semester}</td>
                <td className="table-cell font-medium">{fmt(f.totalAmount)}</td>
                <td className="table-cell text-green-600">{fmt(f.totalPaid)}</td>
                <td className="table-cell text-red-600 font-medium">{fmt(f.totalDue)}</td>
                <td className="table-cell"><StatusBadge status={f.status} /></td>
              </tr>
            ))}
          </Table>
        )}
        {!loading && fees.length === 0 && <EmptyState message="No fees records found" />}
      </div>
    </div>
  );
}

// ─── INVENTORY ───────────────────────────────────────────────────────────────
export function InventoryPage() {
  const initialInventoryForm = { name: '', category: 'general', unit: 'pcs', currentStock: 0, minStockAlert: 5, purchasePrice: 0 };
  const initialTxnForm = { type: 'purchase', quantity: '', unitPrice: '', remarks: '' };
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showTxn, setShowTxn] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState(initialInventoryForm);
  const [txnForm, setTxnForm] = useState(initialTxnForm);

  const fetch = async () => {
    const [itemsRes, txnsRes] = await Promise.all([
      api.get('/inventory'),
      api.get('/inventory/transactions'),
    ]);
    setItems(itemsRes.data.items);
    setTransactions(txnsRes.data.transactions || []);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);

  const addItem = async e => {
    e.preventDefault();
    await api.post('/inventory', form); toast.success('Item added'); setShowAdd(false); setForm(initialInventoryForm); fetch();
  };
  const addTxn = async e => {
    e.preventDefault();
    await api.post('/inventory/transactions', { inventoryId: showTxn._id, ...txnForm });
    toast.success('Transaction recorded'); setShowTxn(null); setTxnForm(initialTxnForm); fetch();
  };
  return (
    <div>
      <PageHeader title="Inventory" action={<button onClick={() => { setForm(initialInventoryForm); setShowAdd(true); }} className="btn-primary">+ Add Item</button>} />
      <div className="card">
        {loading ? <PageSpinner /> : (
          <Table headers={['Name', 'Category', 'Stock', 'Min Alert', 'Unit Price', 'Actions']}>
            {items.map(item => (
              <tr key={item._id} className={`hover:bg-gray-50 ${item.currentStock <= item.minStockAlert ? 'bg-red-50' : ''}`}>
                <td className="table-cell font-medium">{item.name}</td>
                <td className="table-cell capitalize">{item.category}</td>
                <td className="table-cell">
                  <span className={`font-semibold ${item.currentStock <= item.minStockAlert ? 'text-red-600' : 'text-gray-800'}`}>{item.currentStock} {item.unit}</span>
                  <p className="text-xs text-gray-400 mt-1">Opening: {item.openingStock || 0} {item.unit}</p>
                </td>
                <td className="table-cell text-gray-500">{item.minStockAlert}</td>
                <td className="table-cell">₹{item.purchasePrice}</td>
                <td className="table-cell">
                  <div className="flex flex-col items-start gap-1">
                    <button onClick={() => { setShowTxn(item); setTxnForm(initialTxnForm); }} className="text-primary-600 text-sm hover:underline">+ Transaction</button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
        {!loading && items.length === 0 && <EmptyState message="No inventory items" icon={<FiPackage />} />}
      </div>
      <div className="card mt-6">
        <div className="mb-4">
          <h3 className="section-title">Inventory Transactions</h3>
          <p className="text-sm text-gray-500">All purchase, usage, adjustment, and return entries are listed below.</p>
        </div>
        {loading ? <PageSpinner /> : (
          <Table headers={['Date', 'Item', 'Type', 'Quantity', 'Unit Price', 'Total', 'Remarks']}>
            {transactions.map(txn => (
              <tr key={txn._id} className="hover:bg-gray-50">
                <td className="table-cell">{new Date(txn.date || txn.createdAt).toLocaleString('en-IN')}</td>
                <td className="table-cell font-medium">{txn.inventory?.name || '-'}</td>
                <td className="table-cell capitalize">{txn.type}</td>
                <td className="table-cell">{txn.quantity} {txn.inventory?.unit || ''}</td>
                <td className="table-cell">{txn.unitPrice ? `₹${Number(txn.unitPrice).toLocaleString('en-IN')}` : '-'}</td>
                <td className="table-cell">{txn.totalAmount ? `₹${Number(txn.totalAmount).toLocaleString('en-IN')}` : '-'}</td>
                <td className="table-cell text-gray-600">{txn.remarks || '-'}</td>
              </tr>
            ))}
          </Table>
        )}
        {!loading && transactions.length === 0 && <EmptyState message="No inventory transactions recorded yet" icon={<FiClock />} />}
      </div>
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setForm(initialInventoryForm); }} title="Add Inventory Item">
        <form onSubmit={addItem} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Name *</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
            <div><label className="label">Category</label>
              <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {['academic','hostel','general','lab','sports'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="label">Opening Stock</label><input type="number" className="input" value={form.currentStock} onChange={e => setForm(f => ({ ...f, currentStock: e.target.value }))} /></div>
            <div><label className="label">Unit</label><input className="input" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} /></div>
            <div><label className="label">Min Alert</label><input type="number" className="input" value={form.minStockAlert} onChange={e => setForm(f => ({ ...f, minStockAlert: e.target.value }))} /></div>
            <div><label className="label">Purchase Price</label><input type="number" className="input" value={form.purchasePrice} onChange={e => setForm(f => ({ ...f, purchasePrice: e.target.value }))} /></div>
          </div>
          <div className="flex gap-3 justify-end"><button type="button" onClick={() => { setShowAdd(false); setForm(initialInventoryForm); }} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Add Item</button></div>
        </form>
      </Modal>
      <Modal open={!!showTxn} onClose={() => setShowTxn(null)} title={`Transaction – ${showTxn?.name}`}>
        <form onSubmit={addTxn} className="space-y-3">
          <div><label className="label">Type</label>
            <select className="input" value={txnForm.type} onChange={e => setTxnForm(f => ({ ...f, type: e.target.value }))}>
              {['purchase','usage','adjustment','return'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div><label className="label">Quantity *</label><input type="number" className="input" value={txnForm.quantity} onChange={e => setTxnForm(f => ({ ...f, quantity: e.target.value }))} required /></div>
          {txnForm.type === 'purchase' && (
            <div><label className="label">Unit Price</label><input type="number" className="input" value={txnForm.unitPrice} onChange={e => setTxnForm(f => ({ ...f, unitPrice: e.target.value }))} /></div>
          )}
          <div><label className="label">Remarks</label><input className="input" value={txnForm.remarks} onChange={e => setTxnForm(f => ({ ...f, remarks: e.target.value }))} /></div>
          <div className="flex gap-3 justify-end"><button type="button" onClick={() => { setShowTxn(null); setTxnForm(initialTxnForm); }} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Record</button></div>
        </form>
      </Modal>
    </div>
  );
}

// ─── EXPENSE ──────────────────────────────────────────────────────────────────
export function ExpensePage() {
  const initialExpenseForm = { title: '', category: 'miscellaneous', amount: '', date: new Date().toISOString().slice(0, 10), paymentMode: 'cash', description: '' };
  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState(initialExpenseForm);

  const fetch = async () => {
    const r = await api.get('/expense');
    setExpenses(r.data.expenses); setTotal(r.data.totalAmount); setLoading(false);
  };
  useEffect(() => { fetch(); }, []);

  const add = async e => {
    e.preventDefault();
    await api.post('/expense', form); toast.success('Expense added'); setShow(false); setForm(initialExpenseForm); fetch();
  };

  return (
    <div>
      <PageHeader title="Expense Management" action={<button onClick={() => { setForm(initialExpenseForm); setShow(true); }} className="btn-primary">+ Add Expense</button>} />
      <div className="card mb-4 flex gap-4 items-center">
        <div className="text-2xl font-bold text-gray-800">₹{total.toLocaleString('en-IN')}</div>
        <div className="text-sm text-gray-500">Total Expenses</div>
      </div>
      <div className="card">
        {loading ? <PageSpinner /> : (
          <Table headers={['Title', 'Category', 'Date', 'Mode', 'Amount']}>
            {expenses.map(e => (
              <tr key={e._id} className="hover:bg-gray-50">
                <td className="table-cell font-medium">{e.title}</td>
                <td className="table-cell capitalize">{e.category}</td>
                <td className="table-cell">{new Date(e.date).toLocaleDateString('en-IN')}</td>
                <td className="table-cell uppercase text-xs">{e.paymentMode}</td>
                <td className="table-cell font-semibold text-red-600">₹{e.amount?.toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </Table>
        )}
        {!loading && expenses.length === 0 && <EmptyState message="No expenses recorded" icon={<FiTrendingDown />} />}
      </div>
      <Modal open={show} onClose={() => { setShow(false); setForm(initialExpenseForm); }} title="Add Expense">
        <form onSubmit={add} className="space-y-3">
          <div><label className="label">Title *</label><input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Category</label>
              <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {['salary','maintenance','utilities','stationery','transport','events','miscellaneous'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="label">Amount *</label><input type="number" className="input" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required /></div>
            <div><label className="label">Date</label><input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
            <div><label className="label">Payment Mode</label>
              <select className="input" value={form.paymentMode} onChange={e => setForm(f => ({ ...f, paymentMode: e.target.value }))}>
                {['cash','bank','cheque','online'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div><label className="label">Description</label><textarea className="input" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          <div className="flex gap-3 justify-end"><button type="button" onClick={() => { setShow(false); setForm(initialExpenseForm); }} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Add</button></div>
        </form>
      </Modal>
    </div>
  );
}

// ─── CIRCULARS ─────────────────────────────────────────────────────────────────
export function CircularsAdmin() {
  const initialCircularForm = { title: '', content: '', type: 'circular', audience: ['all'] };
  const [circulars, setCirculars] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState(initialCircularForm);

  useEffect(() => { api.get('/circulars').then(r => setCirculars(r.data.circulars)); }, []);

  const add = async e => {
    e.preventDefault();
    const r = await api.post('/circulars', form);
    setCirculars(p => [r.data.circular, ...p]); setShow(false); setForm(initialCircularForm); toast.success('Published');
  };

  const typeColors = { circular: 'badge-blue', announcement: 'badge-yellow', exam_schedule: 'badge-red', event: 'badge-green', holiday: 'badge-gray' };

  return (
    <div>
      <PageHeader title="Circulars & Announcements" action={<button onClick={() => { setForm(initialCircularForm); setShow(true); }} className="btn-primary">+ Publish</button>} />
      <div className="space-y-4">
        {circulars.map(c => (
          <div key={c._id} className="card">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-800">{c.title}</h3>
              <span className={typeColors[c.type] || 'badge-gray'}>{c.type.replace('_', ' ')}</span>
            </div>
            <p className="text-sm text-gray-600 mb-2 line-clamp-3">{c.content}</p>
            <p className="text-xs text-gray-400">{new Date(c.publishDate).toLocaleDateString('en-IN')} • {c.audience?.join(', ')}</p>
          </div>
        ))}
        {circulars.length === 0 && <EmptyState message="No circulars published" icon={<FiBell />} />}
      </div>
      <Modal open={show} onClose={() => { setShow(false); setForm(initialCircularForm); }} title="Publish Circular" size="lg">
        <form onSubmit={add} className="space-y-4">
          <div><label className="label">Title *</label><input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required /></div>
          <div><label className="label">Type</label>
            <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {['circular','announcement','exam_schedule','event','holiday'].map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div><label className="label">Content *</label><textarea className="input" rows={5} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} required /></div>
          <div className="flex gap-3 justify-end"><button type="button" onClick={() => { setShow(false); setForm(initialCircularForm); }} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Publish</button></div>
        </form>
      </Modal>
    </div>
  );
}

// ─── LIBRARY ──────────────────────────────────────────────────────────────────
export function LibraryAdmin() {
  const initialBookForm = { title: '', author: '', isbn: '', publisher: '', category: '', totalCopies: 1 };
  const initialIssueForm = { bookId: '', studentId: '', dueDate: '' };
  const [books, setBooks] = useState([]);
  const [issues, setIssues] = useState([]);
  const [tab, setTab] = useState('books');
  const [showAdd, setShowAdd] = useState(false);
  const [showIssue, setShowIssue] = useState(false);
  const [students, setStudents] = useState([]);
  const [bookForm, setBookForm] = useState(initialBookForm);
  const [issueForm, setIssueForm] = useState(initialIssueForm);

  useEffect(() => {
    api.get('/library/books')
      .then(r => setBooks(r.data.books))
      .catch(() => toast.error('Failed to load books'));
    api.get('/library/issues')
      .then(r => setIssues(r.data.issues))
      .catch(() => toast.error('Failed to load issues'));
    api.get('/library/students?limit=500')
      .then(r => setStudents(r.data.students))
      .catch(() => toast.error('Failed to load students'));
  }, []);

  const addBook = async e => {
    e.preventDefault();
    const r = await api.post('/library/books', bookForm);
    setBooks(p => [r.data.book, ...p]); setShowAdd(false); setBookForm(initialBookForm); toast.success('Book added');
  };
  const issueBook = async e => {
    e.preventDefault();
    await api.post('/library/issue', issueForm);
    toast.success('Book issued'); setShowIssue(false); setIssueForm(initialIssueForm);
    const r = await api.get('/library/issues'); setIssues(r.data.issues);
  };
  const returnBook = async id => {
    const r = await api.put(`/library/return/${id}`);
    toast.success(`Returned. Fine: ₹${r.data.fine}`);
    const r2 = await api.get('/library/issues'); setIssues(r2.data.issues);
  };

  return (
    <div>
      <PageHeader title="Library" action={
        <div className="flex gap-2">
          <button onClick={() => { setBookForm(initialBookForm); setShowAdd(true); }} className="btn-secondary text-sm">+ Add Book</button>
          <button onClick={() => { setIssueForm(initialIssueForm); setShowIssue(true); }} className="btn-primary">Issue Book</button>
        </div>
      } />
      <div className="flex gap-2 mb-4">
        {['books', 'issues'].map(t => <button key={t} onClick={() => setTab(t)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium ${tab === t ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{t}</button>)}
      </div>
      <div className="card">
        {tab === 'books' ? (
          <Table headers={['Title', 'Author', 'ISBN', 'Category', 'Total', 'Available']}>
            {books.map(b => (
              <tr key={b._id} className="hover:bg-gray-50">
                <td className="table-cell font-medium">{b.title}</td>
                <td className="table-cell">{b.author}</td>
                <td className="table-cell font-mono text-xs">{b.isbn || '–'}</td>
                <td className="table-cell">{b.category || '–'}</td>
                <td className="table-cell text-center">{b.totalCopies}</td>
                <td className="table-cell text-center"><span className={b.availableCopies > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>{b.availableCopies}</span></td>
              </tr>
            ))}
          </Table>
        ) : (
          <Table headers={['Student', 'Book', 'Issue Date', 'Due Date', 'Status', 'Fine', 'Actions']}>
            {issues.map(i => (
              <tr key={i._id} className="hover:bg-gray-50">
                <td className="table-cell">{i.student?.firstName} {i.student?.lastName}</td>
                <td className="table-cell">{i.book?.title}</td>
                <td className="table-cell">{new Date(i.issueDate).toLocaleDateString('en-IN')}</td>
                <td className="table-cell">{new Date(i.dueDate).toLocaleDateString('en-IN')}</td>
                <td className="table-cell"><StatusBadge status={i.status} /></td>
                <td className="table-cell">{i.fine > 0 ? <span className="text-red-600">₹{i.fine}</span> : '–'}</td>
                <td className="table-cell">{i.status === 'issued' && <button onClick={() => returnBook(i._id)} className="text-green-600 text-sm hover:underline">Return</button>}</td>
              </tr>
            ))}
          </Table>
        )}
      </div>
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setBookForm(initialBookForm); }} title="Add Book">
        <form onSubmit={addBook} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Title *</label><input className="input" value={bookForm.title} onChange={e => setBookForm(f => ({ ...f, title: e.target.value }))} required /></div>
            <div><label className="label">Author *</label><input className="input" value={bookForm.author} onChange={e => setBookForm(f => ({ ...f, author: e.target.value }))} required /></div>
            <div><label className="label">ISBN</label><input className="input" value={bookForm.isbn} onChange={e => setBookForm(f => ({ ...f, isbn: e.target.value }))} /></div>
            <div><label className="label">Category</label><input className="input" value={bookForm.category} onChange={e => setBookForm(f => ({ ...f, category: e.target.value }))} /></div>
            <div><label className="label">Publisher</label><input className="input" value={bookForm.publisher} onChange={e => setBookForm(f => ({ ...f, publisher: e.target.value }))} /></div>
            <div><label className="label">Copies</label><input type="number" className="input" min="1" value={bookForm.totalCopies} onChange={e => setBookForm(f => ({ ...f, totalCopies: e.target.value }))} /></div>
          </div>
          <div className="flex gap-3 justify-end"><button type="button" onClick={() => { setShowAdd(false); setBookForm(initialBookForm); }} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Add</button></div>
        </form>
      </Modal>
      <Modal open={showIssue} onClose={() => { setShowIssue(false); setIssueForm(initialIssueForm); }} title="Issue Book">
        <form onSubmit={issueBook} className="space-y-3">
          <div><label className="label">Student *</label>
            <select className="input" value={issueForm.studentId} onChange={e => setIssueForm(f => ({ ...f, studentId: e.target.value }))} required>
              <option value="">Select Student</option>
              {students.map(s => <option key={s._id} value={s._id}>{s.firstName} {s.lastName} ({s.regNo})</option>)}
            </select>
          </div>
          <div><label className="label">Book *</label>
            <select className="input" value={issueForm.bookId} onChange={e => setIssueForm(f => ({ ...f, bookId: e.target.value }))} required>
              <option value="">Select Book</option>
              {books.filter(b => b.availableCopies > 0).map(b => <option key={b._id} value={b._id}>{b.title} – {b.author}</option>)}
            </select>
          </div>
          <div><label className="label">Due Date *</label><input type="date" className="input" value={issueForm.dueDate} onChange={e => setIssueForm(f => ({ ...f, dueDate: e.target.value }))} required /></div>
          <div className="flex gap-3 justify-end"><button type="button" onClick={() => { setShowIssue(false); setIssueForm(initialIssueForm); }} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Issue</button></div>
        </form>
      </Modal>
    </div>
  );
}

// ─── SHOP ─────────────────────────────────────────────────────────────────────
export function ShopAdmin() {
  const [items, setItems] = useState([]);
  const [sales, setSales] = useState([]);
  const [tab, setTab] = useState('items');
  const [shopType, setShopType] = useState('shop');

  useEffect(() => {
    api.get(`/shop/items?type=${shopType}`).then(r => setItems(r.data.items));
    api.get(`/shop/sales?type=${shopType}`).then(r => setSales(r.data.sales));
  }, [shopType]);

  return (
    <div>
      <PageHeader title="Shop & Canteen" />
      <div className="flex gap-2 mb-4">
        {['shop', 'canteen'].map(t => <button key={t} onClick={() => setShopType(t)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize ${shopType === t ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{t}</button>)}
      </div>
      <div className="flex gap-2 mb-4">
        {['items', 'sales'].map(t => <button key={t} onClick={() => setTab(t)}
          className={`px-3 py-1 rounded text-sm ${tab === t ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}>{t}</button>)}
      </div>
      <div className="card">
        {tab === 'items' ? (
          <Table headers={['Name', 'Price', 'Stock', 'Available']}>
            {items.map(i => <tr key={i._id} className="hover:bg-gray-50">
              <td className="table-cell font-medium">{i.name}</td>
              <td className="table-cell">₹{i.price}</td>
              <td className="table-cell">{i.stock} {i.unit}</td>
              <td className="table-cell"><span className={i.isAvailable ? 'badge-green' : 'badge-red'}>{i.isAvailable ? 'Yes' : 'No'}</span></td>
            </tr>)}
          </Table>
        ) : (
          <Table headers={['Bill No', 'Student', 'Date', 'Amount', 'Mode', 'Status']}>
            {sales.map(s => <tr key={s._id} className="hover:bg-gray-50">
              <td className="table-cell font-mono text-xs">{s.billNo}</td>
              <td className="table-cell">{s.student?.firstName} {s.student?.lastName}</td>
              <td className="table-cell">{new Date(s.date).toLocaleDateString('en-IN')}</td>
              <td className="table-cell font-medium">₹{s.totalAmount}</td>
              <td className="table-cell capitalize">{s.paymentMode}</td>
              <td className="table-cell"><StatusBadge status={s.status} /></td>
            </tr>)}
          </Table>
        )}
      </div>
    </div>
  );
}

// ─── STAFF ────────────────────────────────────────────────────────────────────
export function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [courses, setCourses] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', role: 'class_teacher', department: '' });

  useEffect(() => {
    api.get('/staff').then(r => setStaff(r.data.staff));
    api.get('/courses').then(r => setCourses(r.data.courses || []));
  }, []);

  const add = async e => {
    e.preventDefault();
    try {
      const phone = sanitizePhoneField(form.phone);
      if (!isValidIndianPhone(phone)) {
        toast.error('Phone number must be a valid 10-digit Indian mobile number');
        return;
      }

      const payload = {
        ...form,
        name: form.name.trim(),
        phone,
        email: form.email.trim(),
        password: form.password,
        department: form.department.trim(),
      };

      await api.post('/auth/register', payload);
      toast.success('Staff added');
      setShow(false);
      setForm({
        name: '',
        phone: '',
        email: '',
        password: '',
        role: 'class_teacher',
        department: '',
      });
      api.get('/staff').then(r => setStaff(r.data.staff));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add staff');
    }
  };

  const roleColors = { class_teacher: 'badge-blue', hostel_warden: 'badge-green', shop_operator: 'badge-yellow', librarian: 'badge-purple', super_admin: 'badge-red' };
  const roleLabels = { shop_operator: 'operator', canteen_operator: 'operator' };

  return (
    <div>
      <PageHeader title="Staff Management" action={<button onClick={() => setShow(true)} className="btn-primary">+ Add Staff</button>} />
      <div className="card">
        <Table headers={['Name', 'Phone', 'Email', 'Role', 'Department', 'Status']}>
          {staff.map(s => <tr key={s._id} className="hover:bg-gray-50">
            <td className="table-cell font-medium">{s.name}</td>
            <td className="table-cell">{s.phone}</td>
            <td className="table-cell text-gray-500">{s.email || '–'}</td>
            <td className="table-cell"><span className={roleColors[s.role] || 'badge-gray'}>{roleLabels[s.role] || s.role?.replace(/_/g, ' ')}</span></td>
            <td className="table-cell">{s.department || '–'}</td>
            <td className="table-cell"><span className={s.isActive ? 'badge-green' : 'badge-red'}>{s.isActive ? 'Active' : 'Inactive'}</span></td>
          </tr>)}
        </Table>
        {staff.length === 0 && <EmptyState message="No staff members" icon={<FiUsers />} />}
      </div>
      <Modal open={show} onClose={() => setShow(false)} title="Add Staff Member">
        <form onSubmit={add} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Name *</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
            <div><label className="label">Phone *</label><input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: sanitizePhoneField(e.target.value) }))} inputMode="numeric" maxLength={10} required /></div>
            <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div><label className="label">Password *</label><input type="password" className="input" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required /></div>
            <div><label className="label">Role</label>
              <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                {['class_teacher','hostel_warden','shop_operator','librarian','super_admin'].map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{form.role === 'class_teacher' ? 'Course' : 'Department'}</label>
              {form.role === 'class_teacher' ? (
                <select className="input" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                  <option value="">Select course</option>
                  {courses.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                </select>
              ) : (
                <input className="input" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
              )}
            </div>
          </div>
          <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShow(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Add Staff</button></div>
        </form>
      </Modal>
    </div>
  );
}

// ─── COURSES ──────────────────────────────────────────────────────────────────
export function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', department: '', duration: 3, semesters: 6 });

  useEffect(() => { api.get('/courses').then(r => setCourses(r.data.courses)); }, []);

  const add = async e => {
    e.preventDefault();
    const r = await api.post('/courses', form);
    setCourses(p => [r.data.course, ...p]); setShow(false); toast.success('Course added');
  };

  return (
    <div>
      <PageHeader title="Courses" action={<button onClick={() => setShow(true)} className="btn-primary">+ Add Course</button>} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map(c => (
          <div key={c._id} className="card">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-800">{c.name}</h3>
              <span className="badge-blue">{c.code}</span>
            </div>
            <p className="text-sm text-gray-500">{c.department}</p>
            <p className="text-sm text-gray-400 mt-1">{c.duration} years • {c.semesters} semesters</p>
          </div>
        ))}
        {courses.length === 0 && <EmptyState message="No courses yet" icon={<FiTarget />} />}
      </div>
      <Modal open={show} onClose={() => setShow(false)} title="Add Course">
        <form onSubmit={add} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Name *</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
            <div><label className="label">Code *</label><input className="input" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} required /></div>
            <div><label className="label">Department</label><input className="input" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} /></div>
            <div><label className="label">Duration (yrs)</label><input type="number" className="input" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} /></div>
            <div><label className="label">Semesters</label><input type="number" className="input" value={form.semesters} onChange={e => setForm(f => ({ ...f, semesters: e.target.value }))} /></div>
          </div>
          <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShow(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Add</button></div>
        </form>
      </Modal>
    </div>
  );
}

// ─── REPORTS ──────────────────────────────────────────────────────────────────
export function ReportsPage() {
  const [feesReport, setFeesReport] = useState(null);
  const [payReport, setPayReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/reports/fees'), api.get('/reports/payments')])
      .then(([f, p]) => { setFeesReport(f.data); setPayReport(p.data); }).finally(() => setLoading(false));
  }, []);

  const fmt = n => '₹' + (n || 0).toLocaleString('en-IN');

  if (loading) return <PageSpinner />;

  return (
    <div>
      <PageHeader title="Reports & Analytics" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="section-title">Fees Summary</h3>
          {feesReport && (
            <div className="space-y-3">
              {[['Total Billed', feesReport.summary?.totalBilled, 'text-blue-700'], ['Collected', feesReport.summary?.totalCollected, 'text-green-700'], ['Pending Dues', feesReport.summary?.totalDue, 'text-red-700']].map(([label, val, cls]) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-600">{label}</span>
                  <span className={`text-base font-bold ${cls}`}>{fmt(val)}</span>
                </div>
              ))}
              <div className="grid grid-cols-4 gap-2 mt-4">
                {['paid', 'partial', 'pending', 'overdue'].map(s => (
                  <div key={s} className="text-center p-2 bg-gray-50 rounded">
                    <p className="text-lg font-bold text-gray-800">{feesReport.summary?.[s] || 0}</p>
                    <p className="text-xs text-gray-500 capitalize">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="card">
          <h3 className="section-title">Payment Summary</h3>
          {payReport && (
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-600">Total Collected</span>
                <span className="text-base font-bold text-green-700">{fmt(payReport.totalAmount)}</span>
              </div>
              <h4 className="text-sm font-semibold text-gray-600 mt-3">By Payment Mode</h4>
              {Object.entries(payReport.byMode || {}).map(([mode, amt]) => (
                <div key={mode} className="flex justify-between items-center py-1.5">
                  <span className="text-sm text-gray-500 uppercase">{mode}</span>
                  <span className="text-sm font-medium">{fmt(amt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
