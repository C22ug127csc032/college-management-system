import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import { PageHeader } from '../../components/common';
import toast from 'react-hot-toast';

const SearchableStudentSelect = ({ students, value, onChange, placeholder = 'Select Student...' }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const selectedStudent = students.find(s => s._id === value);

  useEffect(() => {
    setQuery(selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName} (${selectedStudent.regNo})` : '');
  }, [selectedStudent]);

  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students.slice(0, 20);
    return students.filter(s =>
      `${s.firstName} ${s.lastName} ${s.regNo}`.toLowerCase().includes(q)
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

export function AssignFees() {
  const [students, setStudents] = useState([]);
  const [structures, setStructures] = useState([]);
  const [existingFees, setExistingFees] = useState([]);
  const [form, setForm] = useState({
    studentId: '',
    structureId: '',
    academicYear: '',
    semester: '',
    dueDate: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/students?limit=500').then(r => setStudents(r.data.students));
    api.get('/fees/structure').then(r => setStructures(r.data.structures));
  }, []);

  useEffect(() => {
    if (!form.studentId) {
      setExistingFees([]);
      return;
    }
    api.get(`/fees/student/${form.studentId}`)
      .then(r => setExistingFees(r.data.fees || []))
      .catch(() => setExistingFees([]));
  }, [form.studentId]);

  const selectedStudent = students.find(s => s._id === form.studentId);
  const filteredStructures = useMemo(() => {
    if (!selectedStudent?.course?._id) return [];
    return structures.filter(s => s.course?._id === selectedStudent.course._id);
  }, [selectedStudent, structures]);

  useEffect(() => {
    if (!selectedStudent) return;
    setForm(f => ({
      ...f,
      structureId: filteredStructures.some(s => s._id === f.structureId) ? f.structureId : '',
      academicYear: f.academicYear || selectedStudent.academicYear || '',
      semester: f.semester || selectedStudent.semester || '',
    }));
  }, [filteredStructures, selectedStudent]);

  const selectedStructure = filteredStructures.find(s => s._id === form.structureId);
  const normalizedAcademicYear = form.academicYear.trim().toLowerCase();
  const normalizedSemester = form.semester ? Number(form.semester) : undefined;
  const alreadyAssigned = existingFees.find(f =>
    f.academicYear?.trim().toLowerCase() === normalizedAcademicYear &&
    (normalizedSemester ? Number(f.semester) === normalizedSemester : true)
  );

  const handleSubmit = async e => {
    e.preventDefault();
    if (alreadyAssigned) {
      toast.error('Fees already assigned for this academic year and semester');
      return;
    }
    setLoading(true);
    try {
      await api.post('/fees/assign', form);
      toast.success('Fees assigned successfully');
      setForm({ studentId: '', structureId: '', academicYear: '', semester: '', dueDate: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Assign Fees" subtitle="Assign a fee structure to a student" />
      <div className="card max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Student *</label>
            <SearchableStudentSelect
              students={students}
              value={form.studentId}
              onChange={studentId => setForm(f => ({ ...f, studentId }))}
            />
          </div>

          <div>
            <label className="label">Fee Structure *</label>
            <select
              className="input"
              value={form.structureId}
              onChange={e => setForm(f => ({ ...f, structureId: e.target.value }))}
              required
              disabled={!selectedStudent}
            >
              <option value="">
                {selectedStudent ? 'Select Structure...' : 'Select student first'}
              </option>
              {filteredStructures.map(s => (
                <option key={s._id} value={s._id}>
                  {s.name} - {s.academicYear}
                </option>
              ))}
            </select>
            {selectedStudent && filteredStructures.length === 0 && (
              <p className="text-xs text-red-500 mt-1">
                No fee structures found for {selectedStudent.course?.name}.
              </p>
            )}
            {alreadyAssigned && (
              <p className="text-xs text-red-500 mt-1">
                Fees already assigned for {alreadyAssigned.academicYear}
                {alreadyAssigned.semester ? ` semester ${alreadyAssigned.semester}` : ''}.
              </p>
            )}
          </div>

          {selectedStructure && (
            <div className="bg-blue-50 p-3 rounded-lg text-sm">
              <p className="font-medium text-blue-800">
                Total: ₹{selectedStructure.totalAmount?.toLocaleString('en-IN')}
              </p>
              <p className="text-blue-600 mt-1">
                {selectedStructure.feeHeads?.map(h => `${h.headName}: ₹${h.amount}`).join(' | ')}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Academic Year *</label>
              <input
                className="input"
                placeholder="2024-25"
                value={form.academicYear}
                onChange={e => setForm(f => ({ ...f, academicYear: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Semester</label>
              <input
                type="number"
                className="input"
                min="1"
                value={form.semester}
                onChange={e => setForm(f => ({ ...f, semester: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Due Date</label>
              <input
                type="date"
                className="input"
                value={form.dueDate}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
          </div>

          <button type="submit" disabled={loading || !!alreadyAssigned} className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? 'Assigning...' : 'Assign Fees'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AssignFees;
