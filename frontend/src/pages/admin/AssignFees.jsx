import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import { PageHeader } from '../../components/common';
import toast from 'react-hot-toast';

const getStudentLabel = student => {
  if (!student) return '';
  const name = `${student.firstName || ''} ${student.lastName || ''}`.trim();
  const identifier = student.regNo || student.rollNo || student.admissionNo || '';
  return identifier ? `${name} (${identifier})` : name;
};

const SearchableStudentSelect = ({ students, value, onChange, placeholder = 'Select Student...' }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const selectedStudent = students.find(s => s._id === value);

  useEffect(() => {
    setQuery(getStudentLabel(selectedStudent));
  }, [selectedStudent]);

  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students.slice(0, 20);
    return students.filter(s =>
      `${s.firstName || ''} ${s.lastName || ''} ${s.regNo || ''} ${s.rollNo || ''} ${s.admissionNo || ''}`
        .toLowerCase()
        .includes(q)
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
            setQuery(getStudentLabel(selectedStudent));
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
                setQuery(getStudentLabel(student));
                setOpen(false);
              }}
            >
              {getStudentLabel(student)}
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
  const [courses, setCourses] = useState([]);
  const [structures, setStructures] = useState([]);
  const [existingFees, setExistingFees] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [form, setForm] = useState({
    studentId: '',
    structureId: '',
    academicYear: '',
    semester: '',
    dueDate: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/students?limit=500'),
      api.get('/fees/structure'),
      api.get('/courses'),
    ]).then(([studentsResponse, structuresResponse, coursesResponse]) => {
      setStudents(studentsResponse.data.students || []);
      setStructures(structuresResponse.data.structures || []);
      setCourses(coursesResponse.data.courses || []);
    });
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

  const filteredStudents = useMemo(() => {
    if (!selectedCourseId) return students;
    return students.filter(student => {
      const studentCourseId = student.course?._id || student.course;
      return String(studentCourseId || '') === String(selectedCourseId);
    });
  }, [selectedCourseId, students]);

  useEffect(() => {
    if (!form.studentId) return;
    const studentInFilter = filteredStudents.some(student => student._id === form.studentId);
    if (!studentInFilter) {
      setForm(current => ({
        ...current,
        studentId: '',
        structureId: '',
      }));
      setExistingFees([]);
    }
  }, [filteredStudents, form.studentId]);

  const selectedStudent = students.find(student => student._id === form.studentId);
  const filteredStructures = useMemo(() => {
    if (!selectedStudent?.course?._id) return [];
    return structures.filter(structure => structure.course?._id === selectedStudent.course._id);
  }, [selectedStudent, structures]);

  useEffect(() => {
    if (!selectedStudent) return;
    setForm(current => ({
      ...current,
      structureId: filteredStructures.some(structure => structure._id === current.structureId)
        ? current.structureId
        : '',
      academicYear: current.academicYear || selectedStudent.academicYear || '',
      semester: current.semester || selectedStudent.semester || '',
    }));
  }, [filteredStructures, selectedStudent]);

  const selectedStructure = filteredStructures.find(structure => structure._id === form.structureId);
  const normalizedAcademicYear = form.academicYear.trim().toLowerCase();
  const normalizedSemester = form.semester ? Number(form.semester) : undefined;
  const alreadyAssigned = existingFees.find(fee =>
    fee.academicYear?.trim().toLowerCase() === normalizedAcademicYear &&
    (normalizedSemester ? Number(fee.semester) === normalizedSemester : true)
  );

  const handleSubmit = async event => {
    event.preventDefault();
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
            <label className="label">Course Filter</label>
            <select
              className="input"
              value={selectedCourseId}
              onChange={event => setSelectedCourseId(event.target.value)}
            >
              <option value="">All Courses</option>
              {courses.map(course => (
                <option key={course._id} value={course._id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Student *</label>
            <SearchableStudentSelect
              students={filteredStudents}
              value={form.studentId}
              onChange={studentId => setForm(current => ({ ...current, studentId }))}
            />
            {selectedCourseId && filteredStudents.length === 0 && (
              <p className="text-xs text-red-500 mt-1">No students found for selected course.</p>
            )}
          </div>

          <div>
            <label className="label">Fee Structure *</label>
            <select
              className="input"
              value={form.structureId}
              onChange={event => setForm(current => ({ ...current, structureId: event.target.value }))}
              required
              disabled={!selectedStudent}
            >
              <option value="">
                {selectedStudent ? 'Select Structure...' : 'Select student first'}
              </option>
              {filteredStructures.map(structure => (
                <option key={structure._id} value={structure._id}>
                  {structure.name} - {structure.academicYear}
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
                Total: Rs {selectedStructure.totalAmount?.toLocaleString('en-IN')}
              </p>
              <p className="text-blue-600 mt-1">
                {selectedStructure.feeHeads?.map(head => `${head.headName}: Rs ${head.amount}`).join(' | ')}
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
                onChange={event => setForm(current => ({ ...current, academicYear: event.target.value }))}
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
                onChange={event => setForm(current => ({ ...current, semester: event.target.value }))}
              />
            </div>
            <div>
              <label className="label">Due Date</label>
              <input
                type="date"
                className="input"
                value={form.dueDate}
                onChange={event => setForm(current => ({ ...current, dueDate: event.target.value }))}
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