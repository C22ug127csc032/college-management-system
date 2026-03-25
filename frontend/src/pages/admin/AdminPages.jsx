import React, { useState, useEffect, useCallback } from 'react';
import api, { downloadPaymentReceipt } from '../../api/axios';
import { PageHeader, Table, StatusBadge, FilterBar, EmptyState, Modal, PageSpinner, StatCard, Pagination } from '../../components/common';
import { FiAlertOctagon, FiBell, FiCheckCircle, FiClock, FiCreditCard, FiDollarSign, FiLogOut, FiPackage, FiTarget, FiTrendingDown, FiUsers } from '../../components/common/icons';
import toast from 'react-hot-toast';
import { isValidIndianPhone, sanitizePhoneField } from '../../utils/phone';
import { useAuth } from '../../context/AuthContext';

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
      <PageHeader
        title="Library"
        subtitle={tab === 'books' ? 'Catalog and stock overview' : 'Issued and returned books'}
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              onClick={() => { setEditingBookId(''); setBookForm(initialBookForm); setShowAdd(true); }}
              className="btn-secondary min-h-[42px] px-5 text-sm font-medium whitespace-nowrap"
            >
              + Add Book
            </button>
            <button
              onClick={() => { setIssueForm(initialIssueForm); setShowIssue(true); }}
              className="btn-primary min-h-[42px] px-5 text-sm font-medium whitespace-nowrap"
            >
              Issue Book
            </button>
          </div>
        }
      />
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {['books', 'issues'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`min-w-[96px] rounded-full px-4 py-2 text-sm font-semibold capitalize transition-colors ${tab === t ? 'bg-primary-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="card overflow-hidden p-0">
        {tab === 'books' ? (
          <div className="overflow-x-auto">
            <Table headers={['Title', 'Author', 'ISBN', 'Category', 'Total', 'Available', 'Actions']}>
              {books.map(b => (
                <tr key={b._id} className="align-middle hover:bg-gray-50/80">
                  <td className="table-cell font-semibold text-gray-900">{b.title}</td>
                  <td className="table-cell text-gray-700">{b.author}</td>
                  <td className="table-cell font-mono text-xs text-gray-500">{b.isbn || '?'}</td>
                  <td className="table-cell text-gray-700">{b.category || '?'}</td>
                  <td className="table-cell text-center font-medium text-gray-800">{b.totalCopies}</td>
                  <td className="table-cell text-center">
                    <span className={b.availableCopies > 0 ? 'font-semibold text-green-600' : 'font-semibold text-red-600'}>{b.availableCopies}</span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center justify-end gap-4 whitespace-nowrap text-sm font-medium">
                      <button type="button" onClick={() => editBook(b)} className="text-primary-600 hover:underline">Edit</button>
                      <button type="button" onClick={() => markBookUnavailable(b._id)} className="text-red-600 hover:underline">Mark Unavailable</button>
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table headers={['Student', 'Book', 'Issue Date', 'Due Date', 'Status', 'Fine', 'Actions']}>
              {issues.map(i => (
                <tr key={i._id} className="align-middle hover:bg-gray-50/80">
                  <td className="table-cell">
                    <p className="font-semibold text-gray-900">{i.student?.firstName} {i.student?.lastName}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{getStudentIdentifier(i.student)}</p>
                  </td>
                  <td className="table-cell text-gray-700">{i.book?.title}</td>
                  <td className="table-cell text-gray-600">{new Date(i.issueDate).toLocaleDateString('en-IN')}</td>
                  <td className="table-cell text-gray-600">{new Date(i.dueDate).toLocaleDateString('en-IN')}</td>
                  <td className="table-cell text-center"><StatusBadge status={i.status} /></td>
                  <td className="table-cell text-center">{i.fine > 0 ? <span className="font-semibold text-red-600">?{i.fine}</span> : '?'}</td>
                  <td className="table-cell">
                    <div className="flex items-center justify-end whitespace-nowrap">
                      {i.status === 'issued' ? (
                        <button onClick={() => returnBook(i._id)} className="text-green-600 text-sm font-medium hover:underline">Return</button>
                      ) : (
                        <span className="text-sm text-gray-300">?</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          </div>
        )}
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
  const { user } = useAuth();
  const isClassTeacher = user?.role === 'class_teacher';
  const initialCircularForm = {
    title: '',
    content: '',
    type: 'circular',
    audience: isClassTeacher ? ['students', 'parents'] : ['all'],
    course: '',
  };
  const [circulars, setCirculars] = useState([]);
  const [courses, setCourses] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState(initialCircularForm);
  const [editingId, setEditingId] = useState('');

  const teacherCourse = courses.find(course =>
    course.name === user?.department || course.code === user?.department || course._id === user?.department
  );
  const visibleCourses = isClassTeacher && teacherCourse ? [teacherCourse] : courses;
  const audienceOptions = isClassTeacher
    ? [
        { value: 'students', label: 'Students' },
        { value: 'parents', label: 'Parents' },
      ]
    : [
        { value: 'all', label: 'All Recipients' },
        { value: 'students', label: 'Students' },
        { value: 'parents', label: 'Parents' },
        { value: 'staff', label: 'Staff' },
      ];

  useEffect(() => {
    api.get('/circulars').then(r => setCirculars(r.data.circulars));
    api.get('/courses').then(r => setCourses(r.data.courses || []));
  }, []);

  useEffect(() => {
    setForm(current => {
      if (!isClassTeacher) return current;
      return {
        ...current,
        course: teacherCourse?._id || current.course,
        audience: current.audience?.length ? current.audience.filter(value => ['students', 'parents'].includes(value)) : ['students', 'parents'],
      };
    });
  }, [isClassTeacher, teacherCourse?._id]);

  const toggleAudience = value => {
    setForm(current => {
      const currentAudience = current.audience || [];
      if (value === 'all') {
        return { ...current, audience: ['all'] };
      }

      const withoutAll = currentAudience.filter(item => item !== 'all');
      const nextAudience = withoutAll.includes(value)
        ? withoutAll.filter(item => item !== value)
        : [...withoutAll, value];

      return { ...current, audience: nextAudience };
    });
  };

  const openCreateModal = () => {
    setEditingId('');
    setForm({
      ...initialCircularForm,
      course: isClassTeacher ? (teacherCourse?._id || '') : '',
    });
    setShow(true);
  };

  const add = async e => {
    e.preventDefault();
    const payload = {
      ...form,
      audience: form.audience || [],
      course: form.course || undefined,
    };

    if (isClassTeacher) {
      payload.course = teacherCourse?._id || payload.course;
      payload.audience = (payload.audience || []).filter(value => ['students', 'parents'].includes(value));
    }

    if (!payload.audience?.length) {
      toast.error('Select at least one audience');
      return;
    }

    try {
      const r = editingId
        ? await api.put(`/circulars/${editingId}`, payload)
        : await api.post('/circulars', payload);
      setCirculars(p => (
        editingId
          ? p.map(circular => circular._id === editingId ? r.data.circular : circular)
          : [r.data.circular, ...p]
      ));
      setShow(false);
      setEditingId('');
      setForm(initialCircularForm);
      toast.success(editingId ? 'Circular updated' : 'Published');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish circular');
    }
  };

  const editCircular = circular => {
    setEditingId(circular._id);
    setForm({
      title: circular.title || '',
      content: circular.content || '',
      type: circular.type || 'circular',
      audience: circular.audience?.length ? circular.audience : ['all'],
      course: circular.course?._id || circular.course || '',
    });
    setShow(true);
  };

  const unpublishCircular = async id => {
    try {
      await api.delete(`/circulars/${id}`);
      setCirculars(p => p.filter(circular => circular._id !== id));
      toast.success('Circular unpublished');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unpublish circular');
    }
  };

  const closeCircularModal = () => {
    setShow(false);
    setEditingId('');
    setForm({
      ...initialCircularForm,
      course: isClassTeacher ? (teacherCourse?._id || '') : '',
    });
  };

  const typeColors = { circular: 'badge-blue', announcement: 'badge-yellow', exam_schedule: 'badge-red', event: 'badge-green', holiday: 'badge-gray' };
  const canManageCircular = circular => !isClassTeacher || String(circular.publishedBy?._id || circular.publishedBy) === String(user?._id);

  return (
    <div>
      <PageHeader
        title="Circulars & Announcements"
        action={<button onClick={openCreateModal} className="btn-primary">+ Publish</button>}
      />
      <div className="space-y-4">
        {circulars.map(c => (
          <div key={c._id} className="card">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-800">{c.title}</h3>
              <span className={typeColors[c.type] || 'badge-gray'}>{c.type.replace('_', ' ')}</span>
            </div>
            <p className="text-sm text-gray-600 mb-2 line-clamp-3">{c.content}</p>
            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
              <span>{new Date(c.publishDate).toLocaleDateString('en-IN')}</span>
              <span>•</span>
              <span>{c.audience?.join(', ')}</span>
              <span>•</span>
              <span>{c.course?.name || 'All courses'}</span>
            </div>
            {canManageCircular(c) && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex gap-3 text-sm">
                <button type="button" onClick={() => editCircular(c)} className="text-primary-600 hover:underline">Edit</button>
                <button type="button" onClick={() => unpublishCircular(c._id)} className="text-red-600 hover:underline">Unpublish</button>
              </div>
            )}
          </div>
        ))}
        {circulars.length === 0 && <EmptyState message="No circulars published" icon={<FiBell />} />}
      </div>
      <Modal open={show} onClose={closeCircularModal} title={editingId ? 'Edit Circular' : 'Publish Circular'} size="lg">
        <form onSubmit={add} className="space-y-4">
          <div><label className="label">Title *</label><input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required /></div>
          <div><label className="label">Type</label>
            <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {['circular','announcement','exam_schedule','event','holiday'].map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{isClassTeacher ? 'Assigned Course' : 'Course Scope'}</label>
            {isClassTeacher ? (
              <input className="input bg-gray-50" value={teacherCourse?.name || 'No course assigned'} readOnly />
            ) : (
              <select className="input" value={form.course} onChange={e => setForm(f => ({ ...f, course: e.target.value }))}>
                <option value="">All Courses</option>
                {visibleCourses.map(course => (
                  <option key={course._id} value={course._id}>{course.name}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="label">Audience</label>
            <div className="grid grid-cols-2 gap-2">
              {audienceOptions.map(option => (
                <label key={option.value} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={(form.audience || []).includes(option.value)}
                    onChange={() => toggleAudience(option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            {isClassTeacher && (
              <p className="mt-2 text-xs text-gray-500">
                Class teacher circulars are restricted to your assigned course and can be sent only to students and parents.
              </p>
            )}
          </div>
          <div><label className="label">Content *</label><textarea className="input" rows={5} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} required /></div>
          <div className="flex gap-3 justify-end"><button type="button" onClick={closeCircularModal} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">{editingId ? 'Save Changes' : 'Publish'}</button></div>
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
  const [editingBookId, setEditingBookId] = useState('');
  const getStudentIdentifier = student => student?.rollNo || student?.admissionNo || student?.regNo || '?';

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
    const payload = { ...bookForm, totalCopies: Number(bookForm.totalCopies) || 1 };
    const r = editingBookId
      ? await api.put(`/library/books/${editingBookId}`, payload)
      : await api.post('/library/books', payload);
    setBooks(p => (
      editingBookId
        ? p.map(book => book._id === editingBookId ? r.data.book : book)
        : [r.data.book, ...p]
    ));
    setShowAdd(false);
    setEditingBookId('');
    setBookForm(initialBookForm);
    toast.success(editingBookId ? 'Book updated' : 'Book added');
  };

  const issueBook = async e => {
    e.preventDefault();
    await api.post('/library/issue', issueForm);
    toast.success('Book issued');
    setShowIssue(false);
    setIssueForm(initialIssueForm);
    const [booksResponse, issuesResponse] = await Promise.all([
      api.get('/library/books'),
      api.get('/library/issues'),
    ]);
    setBooks(booksResponse.data.books);
    setIssues(issuesResponse.data.issues);
  };

  const editBook = book => {
    setEditingBookId(book._id);
    setBookForm({
      title: book.title || '',
      author: book.author || '',
      isbn: book.isbn || '',
      publisher: book.publisher || '',
      category: book.category || '',
      totalCopies: book.totalCopies || 1,
    });
    setShowAdd(true);
  };

  const markBookUnavailable = async id => {
    try {
      await api.delete(`/library/books/${id}`);
      setBooks(p => p.filter(book => book._id !== id));
      toast.success('Book marked unavailable');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update book');
    }
  };

  const closeBookModal = () => {
    setShowAdd(false);
    setEditingBookId('');
    setBookForm(initialBookForm);
  };

  const returnBook = async id => {
    const response = await api.put(`/library/return/${id}`);
    const fine = Number(response.data.fine || 0);
    toast.success(
      fine > 0
        ? `Returned. Fine added to fees ledger: Rs ${fine}`
        : 'Book returned'
    );
    const [booksResponse, issuesResponse] = await Promise.all([
      api.get('/library/books'),
      api.get('/library/issues'),
    ]);
    setBooks(booksResponse.data.books);
    setIssues(issuesResponse.data.issues);
  };

  return (
    <div>
      <PageHeader
        title="Library"
        subtitle={tab === 'books' ? 'Catalog and stock overview' : 'Issued and returned books'}
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              onClick={() => {
                setEditingBookId('');
                setBookForm(initialBookForm);
                setShowAdd(true);
              }}
              className="btn-secondary min-h-[42px] px-5 text-sm font-medium whitespace-nowrap"
            >
              + Add Book
            </button>
            <button
              onClick={() => {
                setIssueForm(initialIssueForm);
                setShowIssue(true);
              }}
              className="btn-primary min-h-[42px] px-5 text-sm font-medium whitespace-nowrap"
            >
              Issue Book
            </button>
          </div>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {['books', 'issues'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`min-w-[96px] rounded-full px-4 py-2 text-sm font-semibold capitalize transition-colors ${tab === t ? 'bg-primary-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden p-0">
        {tab === 'books' ? (
          <div className="overflow-x-auto">
            <Table headers={['Title', 'Author', 'ISBN', 'Category', 'Total', 'Available', 'Actions']}>
              {books.map(b => (
                <tr key={b._id} className="align-middle hover:bg-gray-50/80">
                  <td className="table-cell min-w-[180px] font-semibold text-gray-900">{b.title}</td>
                  <td className="table-cell min-w-[160px] text-gray-700">{b.author}</td>
                  <td className="table-cell min-w-[140px] font-mono text-xs text-gray-500">{b.isbn || '?'}</td>
                  <td className="table-cell min-w-[160px] text-gray-700">{b.category || '?'}</td>
                  <td className="table-cell text-center font-medium text-gray-800">{b.totalCopies}</td>
                  <td className="table-cell text-center">
                    <span className={b.availableCopies > 0 ? 'font-semibold text-green-600' : 'font-semibold text-red-600'}>{b.availableCopies}</span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center justify-end gap-4 whitespace-nowrap text-sm font-medium">
                      <button type="button" onClick={() => editBook(b)} className="text-primary-600 hover:underline">Edit</button>
                      <button type="button" onClick={() => markBookUnavailable(b._id)} className="text-red-600 hover:underline">Mark Unavailable</button>
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
            {books.length === 0 && <EmptyState message="No books added yet" icon={<FiPackage />} />}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table headers={['Student', 'Book', 'Issue Date', 'Due Date', 'Status', 'Fine', 'Actions']}>
              {issues.map(i => (
                <tr key={i._id} className="align-middle hover:bg-gray-50/80">
                  <td className="table-cell min-w-[220px]">
                    <p className="font-semibold text-gray-900">{i.student?.firstName} {i.student?.lastName}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{getStudentIdentifier(i.student)}</p>
                  </td>
                  <td className="table-cell min-w-[180px] text-gray-700">{i.book?.title}</td>
                  <td className="table-cell whitespace-nowrap text-gray-600">{new Date(i.issueDate).toLocaleDateString('en-IN')}</td>
                  <td className="table-cell whitespace-nowrap text-gray-600">{new Date(i.dueDate).toLocaleDateString('en-IN')}</td>
                  <td className="table-cell text-center"><StatusBadge status={i.status} /></td>
                  <td className="table-cell text-center">{i.fine > 0 ? <span className="font-semibold text-red-600">?{i.fine}</span> : '?'}</td>
                  <td className="table-cell">
                    <div className="flex items-center justify-end whitespace-nowrap">
                      {i.status === 'issued' ? (
                        <button onClick={() => returnBook(i._id)} className="text-sm font-medium text-green-600 hover:underline">Return</button>
                      ) : (
                        <span className="text-sm text-gray-300">?</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
            {issues.length === 0 && <EmptyState message="No issue records found" icon={<FiPackage />} />}
          </div>
        )}
      </div>

      <Modal open={showAdd} onClose={closeBookModal} title={editingBookId ? 'Edit Book' : 'Add Book'}>
        <form onSubmit={addBook} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Title *</label><input className="input" value={bookForm.title} onChange={e => setBookForm(f => ({ ...f, title: e.target.value }))} required /></div>
            <div><label className="label">Author *</label><input className="input" value={bookForm.author} onChange={e => setBookForm(f => ({ ...f, author: e.target.value }))} required /></div>
            <div><label className="label">ISBN</label><input className="input" value={bookForm.isbn} onChange={e => setBookForm(f => ({ ...f, isbn: e.target.value }))} /></div>
            <div><label className="label">Category</label><input className="input" value={bookForm.category} onChange={e => setBookForm(f => ({ ...f, category: e.target.value }))} /></div>
            <div><label className="label">Publisher</label><input className="input" value={bookForm.publisher} onChange={e => setBookForm(f => ({ ...f, publisher: e.target.value }))} /></div>
            <div><label className="label">Copies</label><input type="number" className="input" min="1" value={bookForm.totalCopies} onChange={e => setBookForm(f => ({ ...f, totalCopies: e.target.value }))} /></div>
          </div>
          <div className="flex justify-end gap-3"><button type="button" onClick={closeBookModal} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">{editingBookId ? 'Save Changes' : 'Add'}</button></div>
        </form>
      </Modal>

      <Modal open={showIssue} onClose={() => { setShowIssue(false); setIssueForm(initialIssueForm); }} title="Issue Book">
        <form onSubmit={issueBook} className="space-y-3">
          <div><label className="label">Student *</label>
            <select className="input" value={issueForm.studentId} onChange={e => setIssueForm(f => ({ ...f, studentId: e.target.value }))} required>
              <option value="">Select Student</option>
              {students.map(s => <option key={s._id} value={s._id}>{s.firstName} {s.lastName} ({getStudentIdentifier(s)})</option>)}
            </select>
          </div>
          <div><label className="label">Book *</label>
            <select className="input" value={issueForm.bookId} onChange={e => setIssueForm(f => ({ ...f, bookId: e.target.value }))} required>
              <option value="">Select Book</option>
              {books.filter(b => b.availableCopies > 0).map(b => <option key={b._id} value={b._id}>{b.title} - {b.author}</option>)}
            </select>
          </div>
          <div><label className="label">Due Date *</label><input type="date" className="input" value={issueForm.dueDate} onChange={e => setIssueForm(f => ({ ...f, dueDate: e.target.value }))} required /></div>
          <div className="flex justify-end gap-3"><button type="button" onClick={() => { setShowIssue(false); setIssueForm(initialIssueForm); }} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Issue</button></div>
        </form>
      </Modal>
    </div>
  );
}

// ??? SHOP ─────────────────────────────────────────────────────────────────────
export function ShopAdmin() {
  const initialItemForm = { name: '', price: '', stock: '', unit: '', type: 'shop', isAvailable: true };
  const [items, setItems] = useState([]);
  const [sales, setSales] = useState([]);
  const [tab, setTab] = useState('items');
  const [shopType, setShopType] = useState('shop');
  const [showItemModal, setShowItemModal] = useState(false);
  const [itemForm, setItemForm] = useState(initialItemForm);
  const [editingItemId, setEditingItemId] = useState('');

  const fetchShopData = () => {
    api.get(`/shop/items?type=${shopType}`).then(r => setItems(r.data.items));
    api.get(`/shop/sales?type=${shopType}`).then(r => setSales(r.data.sales));
  };

  useEffect(() => {
    fetchShopData();
  }, [shopType]);

  const editItem = item => {
    setEditingItemId(item._id);
    setItemForm({
      name: item.name || '',
      price: item.price || '',
      stock: item.stock || '',
      unit: item.unit || '',
      type: item.type || shopType,
      isAvailable: item.isAvailable !== false,
    });
    setShowItemModal(true);
  };

  const saveItem = async e => {
    e.preventDefault();
    try {
      await api.put(`/shop/items/${editingItemId}`, {
        ...itemForm,
        type: shopType,
        price: Number(itemForm.price) || 0,
        stock: Number(itemForm.stock) || 0,
      });
      fetchShopData();
      setShowItemModal(false);
      setEditingItemId('');
      setItemForm(initialItemForm);
      toast.success('Item updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update item');
    }
  };

  const markItemUnavailable = async id => {
    try {
      await api.delete(`/shop/items/${id}`);
      fetchShopData();
      toast.success('Item marked unavailable');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update item');
    }
  };

  const closeItemModal = () => {
    setShowItemModal(false);
    setEditingItemId('');
    setItemForm(initialItemForm);
  };

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
          <Table headers={['Name', 'Price', 'Stock', 'Available', 'Actions']}>
            {items.map(i => <tr key={i._id} className="hover:bg-gray-50">
              <td className="table-cell font-medium">{i.name}</td>
              <td className="table-cell">₹{i.price}</td>
              <td className="table-cell">{i.stock} {i.unit}</td>
	              <td className="table-cell"><span className={i.isAvailable ? 'badge-green' : 'badge-red'}>{i.isAvailable ? 'Yes' : 'No'}</span></td>
	              <td className="table-cell">
	                <div className="flex gap-3 text-sm">
	                  <button type="button" onClick={() => editItem(i)} className="text-primary-600 hover:underline">Edit</button>
	                  <button type="button" onClick={() => markItemUnavailable(i._id)} className="text-red-600 hover:underline">Mark Unavailable</button>
	                </div>
	              </td>
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
      <Modal open={showItemModal} onClose={closeItemModal} title="Edit Item">
        <form onSubmit={saveItem} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Name *</label><input className="input" value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} required /></div>
            <div><label className="label">Unit</label><input className="input" value={itemForm.unit} onChange={e => setItemForm(f => ({ ...f, unit: e.target.value }))} /></div>
            <div><label className="label">Price *</label><input type="number" className="input" value={itemForm.price} onChange={e => setItemForm(f => ({ ...f, price: e.target.value }))} required /></div>
            <div><label className="label">Stock *</label><input type="number" className="input" value={itemForm.stock} onChange={e => setItemForm(f => ({ ...f, stock: e.target.value }))} required /></div>
          </div>
          <div className="flex gap-3 justify-end"><button type="button" onClick={closeItemModal} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Save Changes</button></div>
        </form>
      </Modal>
    </div>
  );
}

// ─── STAFF ────────────────────────────────────────────────────────────────────
export function StaffManagement() {
  const initialStaffForm = { name: '', phone: '', email: '', password: '', role: 'class_teacher', department: '' };
  const [staff, setStaff] = useState([]);
  const [courses, setCourses] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState(initialStaffForm);
  const [editingStaffId, setEditingStaffId] = useState('');

  const fetchStaff = () => api.get('/staff').then(r => setStaff(r.data.staff));

  useEffect(() => {
    fetchStaff();
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
        department: form.department.trim(),
      };
      if (form.password) payload.password = form.password;

      if (editingStaffId) {
        await api.put(`/staff/${editingStaffId}`, payload);
      } else {
        await api.post('/auth/register', payload);
      }
      toast.success(editingStaffId ? 'Staff updated' : 'Staff added');
      setShow(false);
      setEditingStaffId('');
      setForm(initialStaffForm);
      fetchStaff();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save staff');
    }
  };

  const editStaff = member => {
    setEditingStaffId(member._id);
    setForm({
      name: member.name || '',
      phone: member.phone || '',
      email: member.email || '',
      password: '',
      role: member.role || 'class_teacher',
      department: member.department || '',
    });
    setShow(true);
  };

  const toggleStaffStatus = async member => {
    try {
      await api.put(`/auth/users/${member._id}/toggle`);
      fetchStaff();
      toast.success(`Staff ${member.isActive ? 'deactivated' : 'activated'}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update staff status');
    }
  };

  const closeStaffModal = () => {
    setShow(false);
    setEditingStaffId('');
    setForm(initialStaffForm);
  };

  const roleColors = { admin: 'badge-red', class_teacher: 'badge-blue', hostel_warden: 'badge-green', shop_operator: 'badge-yellow', librarian: 'badge-purple', super_admin: 'badge-red' };
  const roleLabels = { shop_operator: 'operator', canteen_operator: 'operator' };

  return (
    <div>
      <PageHeader title="Staff Management" action={<button onClick={() => { setEditingStaffId(''); setForm(initialStaffForm); setShow(true); }} className="btn-primary">+ Add Staff</button>} />
      <div className="card">
        <Table headers={['Name', 'Phone', 'Email', 'Role', 'Department', 'Status', 'Actions']}>
          {staff.map(s => <tr key={s._id} className="hover:bg-gray-50">
            <td className="table-cell font-medium">{s.name}</td>
            <td className="table-cell">{s.phone}</td>
            <td className="table-cell text-gray-500">{s.email || '–'}</td>
            <td className="table-cell"><span className={roleColors[s.role] || 'badge-gray'}>{roleLabels[s.role] || s.role?.replace(/_/g, ' ')}</span></td>
            <td className="table-cell">{s.department || '–'}</td>
            <td className="table-cell"><span className={s.isActive ? 'badge-green' : 'badge-red'}>{s.isActive ? 'Active' : 'Inactive'}</span></td>
            <td className="table-cell">
              <div className="flex gap-3 text-sm">
                <button type="button" onClick={() => editStaff(s)} className="text-primary-600 hover:underline">Edit</button>
                <button type="button" onClick={() => toggleStaffStatus(s)} className={`${s.isActive ? 'text-red-600' : 'text-green-600'} hover:underline`}>{s.isActive ? 'Deactivate' : 'Activate'}</button>
              </div>
            </td>
          </tr>)}
        </Table>
        {staff.length === 0 && <EmptyState message="No staff members" icon={<FiUsers />} />}
      </div>
      <Modal open={show} onClose={closeStaffModal} title={editingStaffId ? 'Edit Staff Member' : 'Add Staff Member'}>
        <form onSubmit={add} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Name *</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
            <div><label className="label">Phone *</label><input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: sanitizePhoneField(e.target.value) }))} inputMode="numeric" maxLength={10} required /></div>
            <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div><label className="label">{editingStaffId ? 'New Password' : 'Password *'}</label><input type="password" className="input" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required={!editingStaffId} placeholder={editingStaffId ? 'Leave blank to keep current password' : ''} /></div>
            <div><label className="label">Role</label>
              <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                {['admin','class_teacher','hostel_warden','shop_operator','librarian','super_admin'].map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
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
          <div className="flex gap-3 justify-end"><button type="button" onClick={closeStaffModal} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">{editingStaffId ? 'Save Changes' : 'Add Staff'}</button></div>
        </form>
      </Modal>
    </div>
  );
}

// ─── COURSES ──────────────────────────────────────────────────────────────────
export function CoursesPage() {
  const initialCourseForm = { name: '', code: '', department: '', duration: 3, semesters: 6 };
  const [courses, setCourses] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState(initialCourseForm);
  const [editingCourseId, setEditingCourseId] = useState('');

  useEffect(() => { api.get('/courses').then(r => setCourses(r.data.courses)); }, []);

  const add = async e => {
    e.preventDefault();
    const payload = {
      ...form,
      duration: Number(form.duration) || 0,
      semesters: Number(form.semesters) || 0,
    };
    const r = editingCourseId
      ? await api.put(`/courses/${editingCourseId}`, payload)
      : await api.post('/courses', payload);
    setCourses(p => (
      editingCourseId
        ? p.map(course => course._id === editingCourseId ? r.data.course : course)
        : [r.data.course, ...p]
    ));
    setShow(false);
    setEditingCourseId('');
    setForm(initialCourseForm);
    toast.success(editingCourseId ? 'Course updated' : 'Course added');
  };

  const editCourse = course => {
    setEditingCourseId(course._id);
    setForm({
      name: course.name || '',
      code: course.code || '',
      department: course.department || '',
      duration: course.duration || 0,
      semesters: course.semesters || 0,
    });
    setShow(true);
  };

  const deactivateCourse = async id => {
    try {
      await api.delete(`/courses/${id}`);
      setCourses(p => p.filter(course => course._id !== id));
      toast.success('Course deactivated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deactivate course');
    }
  };

  const closeCourseModal = () => {
    setShow(false);
    setEditingCourseId('');
    setForm(initialCourseForm);
  };

  return (
    <div>
      <PageHeader title="Courses" action={<button onClick={() => { setEditingCourseId(''); setForm(initialCourseForm); setShow(true); }} className="btn-primary">+ Add Course</button>} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map(c => (
          <div key={c._id} className="card">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-800">{c.name}</h3>
              <span className="badge-blue">{c.code}</span>
            </div>
            <p className="text-sm text-gray-500">{c.department}</p>
            <div className="mt-3 pt-3 border-t border-gray-100 flex gap-3 text-sm">
              <button type="button" onClick={() => editCourse(c)} className="text-primary-600 hover:underline">Edit</button>
              <button type="button" onClick={() => deactivateCourse(c._id)} className="text-red-600 hover:underline">Deactivate</button>
            </div>
            <p className="text-sm text-gray-400 mt-1">{c.duration} years • {c.semesters} semesters</p>
          </div>
        ))}
        {courses.length === 0 && <EmptyState message="No courses yet" icon={<FiTarget />} />}
      </div>
      <Modal open={show} onClose={closeCourseModal} title={editingCourseId ? 'Edit Course' : 'Add Course'}>
        <form onSubmit={add} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Name *</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
            <div><label className="label">Code *</label><input className="input" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} required /></div>
            <div><label className="label">Department</label><input className="input" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} /></div>
            <div><label className="label">Duration (yrs)</label><input type="number" className="input" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} /></div>
            <div><label className="label">Semesters</label><input type="number" className="input" value={form.semesters} onChange={e => setForm(f => ({ ...f, semesters: e.target.value }))} /></div>
          </div>
          <div className="flex gap-3 justify-end"><button type="button" onClick={closeCourseModal} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">{editingCourseId ? 'Save Changes' : 'Add'}</button></div>
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
