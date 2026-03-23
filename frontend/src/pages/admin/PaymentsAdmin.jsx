import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api, { downloadPaymentReceipt } from '../../api/axios';
import {
  EmptyState,
  FilterBar,
  Modal,
  PageHeader,
  PageSpinner,
  Pagination,
  StatusBadge,
  Table,
} from '../../components/common';
import { FiCreditCard } from '../../components/common/icons';
import toast from 'react-hot-toast';

function SearchableStudentSelect({ students, value, onChange, placeholder = 'Select Student...' }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const selectedStudent = students.find(student => student._id === value);

  useEffect(() => {
    setQuery(
      selectedStudent
        ? `${selectedStudent.firstName} ${selectedStudent.lastName} (${selectedStudent.regNo})`
        : ''
    );
  }, [selectedStudent]);

  const filteredStudents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return students.slice(0, 20);

    return students.filter(student =>
      `${student.firstName} ${student.lastName} ${student.regNo} ${student.phone || ''}`
        .toLowerCase()
        .includes(normalizedQuery)
    ).slice(0, 20);
  }, [query, students]);

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
            setQuery(
              selectedStudent
                ? `${selectedStudent.firstName} ${selectedStudent.lastName} (${selectedStudent.regNo})`
                : ''
            );
          }, 150);
        }}
      />
      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-56 overflow-auto">
          {filteredStudents.length ? filteredStudents.map(student => (
            <button
              key={student._id}
              type="button"
              className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm"
              onMouseDown={() => {
                onChange(student._id);
                setQuery(`${student.firstName} ${student.lastName} (${student.regNo})`);
                setOpen(false);
              }}
            >
              {student.firstName} {student.lastName} ({student.regNo})
            </button>
          )) : (
            <div className="px-3 py-2 text-sm text-gray-400">No students found</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PaymentsAdmin() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    mode: '',
    search: '',
    department: '',
  });
  const [showManual, setShowManual] = useState(false);
  const [students, setStudents] = useState([]);
  const [studentFeesOptions, setStudentFeesOptions] = useState([]);
  const [manualForm, setManualForm] = useState({
    studentId: '',
    studentFeesId: '',
    amount: '',
    paymentMode: 'cash',
    description: '',
  });

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    const response = await api.get('/payments', {
      params: {
        page,
        limit: 20,
        ...filters,
      },
    });
    setPayments(response.data.payments || []);
    setTotal(response.data.total || 0);
    setLoading(false);
  }, [filters, page]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    api.get('/students?limit=500').then(response => {
      setStudents(response.data.students || []);
    });
  }, []);

  useEffect(() => {
    if (!manualForm.studentId) {
      setStudentFeesOptions([]);
      return;
    }

    api.get(`/fees/student/${manualForm.studentId}`)
      .then(response => {
        setStudentFeesOptions((response.data.fees || []).filter(fee => fee.totalDue > 0));
      })
      .catch(() => setStudentFeesOptions([]));
  }, [manualForm.studentId]);

  const selectedFee = studentFeesOptions.find(fee => fee._id === manualForm.studentFeesId);

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

  const handleReceiptDownload = async paymentId => {
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
    toast.success('Payment recorded');
    setShowManual(false);
    setManualForm({ studentId: '', studentFeesId: '', amount: '', paymentMode: 'cash', description: '' });
    fetchPayments();
  };

  const renderPaymentsTable = paymentRows => (
    <Table headers={['Receipt No', 'Student', 'Date', 'Amount', 'Mode', 'Status', 'Receipt']}>
      {paymentRows.map(payment => (
        <tr key={payment._id} className="hover:bg-gray-50">
          <td className="table-cell font-mono text-xs">{payment.receiptNo}</td>
          <td className="table-cell">
            <p className="font-medium">{payment.student?.firstName} {payment.student?.lastName}</p>
            <p className="text-xs text-gray-400">{payment.student?.regNo}</p>
            <p className="text-xs text-gray-400 mt-0.5">{payment.student?.course?.name || 'No Course'}</p>
          </td>
          <td className="table-cell">{new Date(payment.paymentDate).toLocaleDateString('en-IN')}</td>
          <td className="table-cell font-semibold text-green-600">Rs. {payment.amount?.toLocaleString('en-IN')}</td>
          <td className="table-cell uppercase text-xs">{payment.paymentMode}</td>
          <td className="table-cell"><StatusBadge status={payment.status} /></td>
          <td className="table-cell">
            <button
              type="button"
              onClick={() => handleReceiptDownload(payment._id)}
              className="text-primary-600 text-xs hover:underline"
            >
              PDF
            </button>
          </td>
        </tr>
      ))}
    </Table>
  );

  return (
    <div>
      <PageHeader
        title="Payments"
        action={
          <button onClick={() => setShowManual(true)} className="btn-primary">
            + Manual Payment
          </button>
        }
      />

      <div className="card">
        <FilterBar>
          <input
            className="input w-56"
            placeholder="Search student / reg no / phone"
            value={filters.search}
            onChange={e => {
              setFilters(current => ({ ...current, search: e.target.value }));
              setPage(1);
            }}
          />
          <input
            type="date"
            className="input w-40"
            value={filters.startDate}
            onChange={e => {
              setFilters(current => ({ ...current, startDate: e.target.value }));
              setPage(1);
            }}
          />
          <input
            type="date"
            className="input w-40"
            value={filters.endDate}
            onChange={e => {
              setFilters(current => ({ ...current, endDate: e.target.value }));
              setPage(1);
            }}
          />
          <select
            className="input w-36"
            value={filters.mode}
            onChange={e => {
              setFilters(current => ({ ...current, mode: e.target.value }));
              setPage(1);
            }}
          >
            <option value="">All Modes</option>
            {['online', 'cash', 'cheque', 'dd', 'neft'].map(mode => (
              <option key={mode} value={mode}>{mode.toUpperCase()}</option>
            ))}
          </select>
          <select
            className="input w-48"
            value={filters.department}
            onChange={e => {
              setFilters(current => ({ ...current, department: e.target.value }));
              setPage(1);
            }}
          >
            <option value="">All Departments</option>
            {departments.map(department => (
              <option key={department} value={department}>{department}</option>
            ))}
          </select>
        </FilterBar>

        {loading ? (
          <PageSpinner />
        ) : (
          <div className="space-y-8">
            {groupedPayments.map(group => (
              <section key={group.key} className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-slate-50">
                  <h2 className="text-xl font-bold text-slate-900">{group.title}</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {group.payments.length} payment{group.payments.length !== 1 ? 's' : ''}
                  </p>
                </div>
                {renderPaymentsTable(group.payments)}
              </section>
            ))}
          </div>
        )}

        {!loading && payments.length === 0 && (
          <EmptyState message="No payments found" icon={<FiCreditCard />} />
        )}

        <Pagination page={page} pages={Math.ceil(total / 20)} onPage={setPage} />
      </div>

      <Modal open={showManual} onClose={() => setShowManual(false)} title="Manual Payment Entry">
        <form onSubmit={handleManual} className="space-y-4">
          <div>
            <label className="label">Student *</label>
            <SearchableStudentSelect
              students={students}
              value={manualForm.studentId}
              onChange={studentId => setManualForm(current => ({ ...current, studentId, studentFeesId: '' }))}
            />
          </div>
          <div>
            <label className="label">Assigned Fees *</label>
            <select
              className="input"
              value={manualForm.studentFeesId}
              onChange={e => setManualForm(current => ({ ...current, studentFeesId: e.target.value }))}
              required
              disabled={!manualForm.studentId}
            >
              <option value="">{manualForm.studentId ? 'Select assigned fee' : 'Select student first'}</option>
              {studentFeesOptions.map(fee => (
                <option key={fee._id} value={fee._id}>
                  {fee.academicYear} / Sem {fee.semester} - Due Rs. {(fee.totalDue || 0).toLocaleString('en-IN')}
                </option>
              ))}
            </select>
          </div>
          {selectedFee && (
            <div className="bg-blue-50 rounded-lg p-3 text-sm space-y-1">
              <p className="text-blue-800 font-medium">Total Fees: Rs. {(selectedFee.totalAmount || 0).toLocaleString('en-IN')}</p>
              <p className="text-green-700">Paid: Rs. {(selectedFee.totalPaid || 0).toLocaleString('en-IN')}</p>
              <p className="text-red-700">Remaining: Rs. {(selectedFee.totalDue || 0).toLocaleString('en-IN')}</p>
            </div>
          )}
          <div>
            <label className="label">Amount *</label>
            <input
              type="number"
              className="input"
              value={manualForm.amount}
              onChange={e => setManualForm(current => ({ ...current, amount: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">Mode</label>
            <select
              className="input"
              value={manualForm.paymentMode}
              onChange={e => setManualForm(current => ({ ...current, paymentMode: e.target.value }))}
            >
              {['cash', 'cheque', 'dd', 'neft'].map(mode => (
                <option key={mode} value={mode}>{mode.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Description</label>
            <input
              className="input"
              value={manualForm.description}
              onChange={e => setManualForm(current => ({ ...current, description: e.target.value }))}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowManual(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Record Payment</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
