import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import {
  PageHeader, StatusBadge, EmptyState,
  FilterBar, Pagination, PageSpinner,
} from '../../components/common';
import { FiUsers } from '../../components/common/icons';
import toast from 'react-hot-toast';

// ── Class Strength Bar ────────────────────────────────────────────────────────
function ClassStrengthBar({ className, courseId }) {
  const [strength, setStrength] = useState(null);

  useEffect(() => {
    if (!className) return;
    api.get(`/students/class-strength/${className}`, {
      params: { courseId },
    }).then(r => setStrength(r.data)).catch(() => {});
  }, [className, courseId]);

  if (!strength) return null;

  return (
    <div className={`flex items-center gap-4 p-3 rounded-xl border mb-4 ${
      strength.full
        ? 'bg-red-50 border-red-200'
        : strength.percentage >= 80
          ? 'bg-yellow-50 border-yellow-200'
          : 'bg-green-50 border-green-200'
    }`}>
      <div className="shrink-0">
        <p className={`text-sm font-bold ${
          strength.full ? 'text-red-700'
          : strength.percentage >= 80 ? 'text-yellow-700'
          : 'text-green-700'}`}>
          🏫 {className}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">Class Strength</p>
      </div>
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-500">
            {strength.count} students enrolled
          </span>
          <span className="font-semibold text-gray-700">
            {strength.count} / {strength.max}
          </span>
        </div>
        <div className="w-full bg-white rounded-full h-2.5
          overflow-hidden border border-gray-100">
          <div
            className={`h-2.5 rounded-full transition-all duration-700 ${
              strength.full ? 'bg-red-500'
              : strength.percentage >= 80 ? 'bg-yellow-500'
              : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(strength.percentage, 100)}%` }}
          />
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className={`text-lg font-bold ${
          strength.full ? 'text-red-600'
          : strength.percentage >= 80 ? 'text-yellow-600'
          : 'text-green-600'}`}>
          {strength.percentage}%
        </p>
        <p className="text-xs text-gray-400">
          {strength.full ? '🚫 Full' : `${strength.remaining} left`}
        </p>
      </div>
    </div>
  );
}

// ── Promote Class Modal ───────────────────────────────────────────────────────
function PromoteModal({ open, onClose, onDone, courses }) {
  const [selectedClass, setSelectedClass]   = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [classes, setClasses]               = useState([]);
  const [preview, setPreview]               = useState(null);
  const [loading, setLoading]               = useState(false);
  const [result, setResult]                 = useState(null);

  // Load classes when modal opens
  useEffect(() => {
    if (!open) { setResult(null); setPreview(null); setSelectedClass(''); return; }
    api.get('/students', { params: { limit: 200, status: 'active' } })
      .then(r => {
        const unique = [...new Set(
          r.data.students.map(s => s.className).filter(Boolean)
        )].sort();
        setClasses(unique);
      });
  }, [open]);

  // Preview students when class selected
  useEffect(() => {
    if (!selectedClass) { setPreview(null); return; }
    api.get('/students', {
      params: { className: selectedClass, limit: 100, status: 'active' },
    }).then(r => setPreview(r.data));
  }, [selectedClass]);

  const handlePromote = async () => {
    if (!selectedClass) { toast.error('Select a class first'); return; }
    if (!window.confirm(
      `Promote ALL students in ${selectedClass} to next semester?\n\nThis cannot be undone.`
    )) return;

    setLoading(true);
    try {
      const r = await api.post('/students/promote', {
        className: selectedClass,
        courseId:  selectedCourse,
      });
      setResult(r.data);
      toast.success(r.data.message);
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Promotion failed');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  // Get current semester from preview
  const currentSem  = preview?.students?.[0]?.semester || 1;
  const nextSem     = currentSem + 1;
  const course      = courses.find(c => c._id === selectedCourse);
  const maxSem      = course?.semesters || 6;
  const willGraduate = currentSem >= maxSem;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center
      p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg
        max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-5
          border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              Semester Promotion
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Promote all students of a class to next semester
            </p>
          </div>
          <button onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Result screen */}
          {result ? (
            <div className="space-y-4">
              <div className="text-center py-4">
                <p className="text-4xl mb-3">🎉</p>
                <p className="text-lg font-bold text-gray-800">
                  Promotion Complete!
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedClass}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-green-700">
                    {result.summary.promoted}
                  </p>
                  <p className="text-xs text-green-600 mt-0.5">Promoted</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-purple-700">
                    {result.summary.graduated}
                  </p>
                  <p className="text-xs text-purple-600 mt-0.5">Graduated</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-blue-700">
                    {result.summary.total}
                  </p>
                  <p className="text-xs text-blue-600 mt-0.5">Total</p>
                </div>
              </div>

              {result.graduated.length > 0 && (
                <div className="p-3 bg-purple-50 rounded-xl border
                  border-purple-200">
                  <p className="text-xs font-semibold text-purple-700 mb-2">
                    🎓 Graduated Students:
                  </p>
                  <div className="space-y-1">
                    {result.graduated.map((name, i) => (
                      <p key={i} className="text-xs text-purple-600">
                        • {name}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={onClose} className="btn-primary w-full">
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Course select */}
              <div>
                <label className="label">Course</label>
                <select className="input" value={selectedCourse}
                  onChange={e => {
                    setSelectedCourse(e.target.value);
                    setSelectedClass('');
                    setPreview(null);
                  }}>
                  <option value="">Select course...</option>
                  {courses.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Class select */}
              <div>
                <label className="label">Class to Promote</label>
                <select className="input" value={selectedClass}
                  onChange={e => setSelectedClass(e.target.value)}>
                  <option value="">Select class...</option>
                  {classes
                    .filter(cls => {
                      if (!selectedCourse) return true;
                      const c = courses.find(x => x._id === selectedCourse);
                      if (!c) return true;
                      const code = c.code ||
                        c.name.split(' ').filter(w => w.length > 2)
                          .map(w => w[0].toUpperCase()).join('');
                      return cls.startsWith(code);
                    })
                    .map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))
                  }
                </select>
              </div>

              {/* Preview */}
              {preview && selectedClass && (
                <div className={`p-4 rounded-xl border ${
                  willGraduate
                    ? 'bg-purple-50 border-purple-200'
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <p className={`text-sm font-semibold ${
                      willGraduate ? 'text-purple-800' : 'text-blue-800'
                    }`}>
                      {willGraduate
                        ? '🎓 These students will be GRADUATED'
                        : `📈 Semester ${currentSem} → ${nextSem}`
                      }
                    </p>
                    <span className={`text-xs font-bold px-2 py-0.5
                      rounded-full ${
                      willGraduate
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {preview.total} students
                    </span>
                  </div>

                  {/* Student list preview */}
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {preview.students?.map(s => (
                      <div key={s._id}
                        className="flex items-center justify-between
                          py-1 border-b border-white/50 last:border-0">
                        <span className={`text-xs ${
                          willGraduate ? 'text-purple-700' : 'text-blue-700'
                        }`}>
                          {s.firstName} {s.lastName}
                        </span>
                        <span className={`text-xs font-medium ${
                          willGraduate ? 'text-purple-500' : 'text-blue-500'
                        }`}>
                          Sem {s.semester}
                          {' → '}
                          {willGraduate ? '🎓' : `Sem ${nextSem}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warning */}
              {selectedClass && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50
                  border border-yellow-200 rounded-xl">
                  <span className="text-yellow-500 text-base mt-0.5">⚠️</span>
                  <p className="text-xs text-yellow-700">
                    This will update ALL active students in{' '}
                    <strong>{selectedClass}</strong>.
                    This action cannot be undone.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!result && (
          <div className="p-5 border-t border-gray-100 flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              onClick={handlePromote}
              disabled={loading || !selectedClass}
              className={`flex-1 py-2.5 rounded-lg font-semibold text-sm
                text-white transition-colors disabled:opacity-50
                ${willGraduate
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'bg-primary-600 hover:bg-primary-700'
                }`}
            >
              {loading
                ? 'Promoting...'
                : willGraduate
                  ? `Graduate ${selectedClass}`
                  : `Promote to Semester ${nextSem}`
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Students Component ───────────────────────────────────────────────────
export default function Students() {
  const navigate = useNavigate();

  const [students, setStudents]       = useState([]);
  const [courses, setCourses]         = useState([]);
  const [classes, setClasses]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [showPromote, setShowPromote] = useState(false);
  const [filters, setFilters]         = useState({
    search: '', course: '', status: '', className: '',
  });

  const setFilter = (k, v) => {
    setFilters(f => ({ ...f, [k]: v }));
    setPage(1);
  };

  const handleCourseFilter = v => {
    setFilters(f => ({ ...f, course: v, className: '' }));
    setPage(1);
  };

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (filters.search)    params.search    = filters.search;
      if (filters.course)    params.course    = filters.course;
      if (filters.status)    params.status    = filters.status;
      if (filters.className) params.className = filters.className;

      const r = await api.get('/students', { params });
      setStudents(r.data.students);
      setTotal(r.data.total);

      const uniqueClasses = [
        ...new Set(
          r.data.students.map(s => s.className).filter(Boolean)
        ),
      ].sort();
      setClasses(prev => [
        ...new Set([...prev, ...uniqueClasses])
      ].sort());
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);
  useEffect(() => {
    api.get('/courses').then(r => setCourses(r.data.courses));
  }, []);

  const handleDeactivate = async (e, id, name) => {
    e.stopPropagation();
    if (!window.confirm(`Deactivate ${name}?`)) return;
    try {
      await api.delete(`/students/${id}`);
      toast.success(`${name} deactivated`);
      fetchStudents();
    } catch {
      toast.error('Failed to deactivate');
    }
  };

  const handlePromoteSingle = async (e, studentId, name, semester) => {
    e.stopPropagation();
    if (!window.confirm(`Promote ${name} to Semester ${semester + 1}?`)) return;
    try {
      const r = await api.post('/students/promote-single', { studentId });
      toast.success(r.data.message);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Promotion failed');
    }
  };

  const pendingCount = students.filter(
    s => !s.regNo || s.status === 'admission_pending'
  ).length;

  const filteredClasses = classes.filter(cls => {
    if (!filters.course) return true;
    const course = courses.find(c => c._id === filters.course);
    if (!course) return true;
    const code = course.code ||
      course.name.split(' ').filter(w => w.length > 2)
        .map(w => w[0].toUpperCase()).join('');
    return cls.startsWith(code);
  });

  return (
    <div>
      <PageHeader
        title="Students"
        subtitle={`${total} students total`}
        action={
          <div className="flex gap-2">
            <button
              onClick={() => setShowPromote(true)}
              className="btn-secondary flex items-center gap-2"
            >
              📈 Promote Class
            </button>
            <button
              className="btn-primary"
              onClick={() => navigate('/admin/students/add')}
            >
              + Add Student
            </button>
          </div>
        }
      />

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total',    value: total,
            icon: '🎓', color: 'bg-blue-50 text-blue-700' },
          { label: 'Active',   value: students.filter(s => s.status === 'active').length,
            icon: '✅', color: 'bg-green-50 text-green-700' },
          { label: 'Pending',  value: pendingCount,
            icon: '⏳', color: 'bg-yellow-50 text-yellow-700' },
          { label: 'Hostel',   value: students.filter(s => s.isHosteler).length,
            icon: '🏠', color: 'bg-purple-50 text-purple-700' },
        ].map(stat => (
          <div key={stat.label}
            className={`rounded-xl p-4 flex items-center gap-3 ${stat.color}`}>
            <span className="text-2xl">{stat.icon}</span>
            <div>
              <p className="text-2xl font-bold leading-none">{stat.value}</p>
              <p className="text-xs font-medium opacity-75 mt-0.5">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="card">

        {/* ── Filters ── */}
        <FilterBar>
          <input className="input w-52"
            placeholder="Search name / admission no / reg no / phone..."
            value={filters.search}
            onChange={e => setFilter('search', e.target.value)} />

          <select className="input w-48" value={filters.course}
            onChange={e => handleCourseFilter(e.target.value)}>
            <option value="">All Courses</option>
            {courses.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>

          {classes.length > 0 && (
            <select className="input w-36" value={filters.className}
              onChange={e => setFilter('className', e.target.value)}>
              <option value="">All Classes</option>
              {filteredClasses.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          )}

          <select className="input w-44" value={filters.status}
            onChange={e => setFilter('status', e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="admission_pending">Enrollment Pending</option>
            <option value="inactive">Inactive</option>
            <option value="graduated">Graduated</option>
          </select>

          {(filters.search || filters.course ||
            filters.className || filters.status) && (
            <button
              onClick={() => setFilters({
                search: '', course: '', status: '', className: '',
              })}
              className="btn-secondary text-sm px-3">
              Clear ✕
            </button>
          )}
        </FilterBar>

        {/* ── Active Filter Pills ── */}
        {(filters.course || filters.className) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.course && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1
                bg-blue-50 text-blue-700 text-xs font-medium rounded-full
                border border-blue-200">
                📚 {courses.find(c => c._id === filters.course)?.name}
                <button onClick={() => handleCourseFilter('')}
                  className="hover:text-blue-900">✕</button>
              </span>
            )}
            {filters.className && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1
                bg-green-50 text-green-700 text-xs font-medium rounded-full
                border border-green-200">
                🏫 Class {filters.className}
                <button onClick={() => setFilter('className', '')}
                  className="hover:text-green-900">✕</button>
              </span>
            )}
          </div>
        )}

        {/* ── Class Strength Bar ── */}
        {filters.className && (
          <ClassStrengthBar
            className={filters.className}
            courseId={filters.course}
          />
        )}

        {/* ── Pending Banner ── */}
        {pendingCount > 0 && !filters.status && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50
            border border-yellow-200 rounded-xl mb-4">
            <span className="text-yellow-500 text-lg">⏳</span>
            <p className="text-sm text-yellow-800 flex-1">
              <strong>{pendingCount} student{pendingCount > 1 ? 's' : ''}</strong>{' '}
              have admission numbers only — assign Register Number after enrollment.
            </p>
            <button
              onClick={() => setFilter('status', 'admission_pending')}
              className="text-xs text-yellow-700 font-medium underline
                whitespace-nowrap">
              View →
            </button>
          </div>
        )}

        {/* ── Table ── */}
        {loading ? <PageSpinner /> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-header">Student</th>
                    <th className="table-header">Admission No</th>
                    <th className="table-header">Course</th>
                    <th className="table-header">Class</th>
                    <th className="table-header">Semester</th>
                    <th className="table-header">Phone</th>
                    <th className="table-header">Hostel</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {students.map(s => (
                    <tr key={s._id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin/students/${s._id}`)}>

                      {/* Student */}
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary-100
                            text-primary-700 font-bold text-xs flex items-center
                            justify-center shrink-0 overflow-hidden">
                            {s.photo
                              ? <img src={s.photo} alt=""
                                  className="w-8 h-8 object-cover" />
                              : s.firstName?.[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">
                              {s.firstName} {s.lastName}
                            </p>
                            <p className="text-xs text-gray-400">
                              {s.batch || '–'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Admission No */}
                      <td className="table-cell">
                        <div className="font-mono text-xs text-gray-600 mb-1">
                          {s.admissionNo || '–'}
                        </div>
                        {!s.regNo ||
                          s.status === 'admission_pending'
                          ? <span className="inline-flex items-center gap-1
                              text-xs text-orange-600 bg-orange-50 border
                              border-orange-200 px-2 py-0.5 rounded-full
                              font-medium">
                              ⏳ Pending
                            </span>
                          : <span className="font-mono text-xs text-gray-600">
                              {s.regNo || '–'}
                            </span>
                        }
                      </td>

                      {/* Course */}
                      <td className="table-cell text-gray-500 text-xs">
                        {s.course?.name || '–'}
                      </td>

                      {/* Class — clickable */}
                      <td className="table-cell">
                        {s.className
                          ? <button
                              onClick={e => {
                                e.stopPropagation();
                                setFilter('className', s.className);
                              }}
                              className="inline-flex items-center px-2 py-0.5
                                bg-blue-50 text-blue-700 text-xs font-semibold
                                rounded-md border border-blue-100
                                hover:bg-blue-100 transition-colors">
                              {s.className}
                            </button>
                          : <span className="text-gray-300 text-xs">
                              Not assigned
                            </span>
                        }
                      </td>

                      {/* Semester */}
                      <td className="table-cell text-center text-gray-500 text-xs">
                        {s.semester ? `Sem ${s.semester}` : '–'}
                      </td>

                      {/* Phone */}
                      <td className="table-cell font-mono text-xs text-gray-500">
                        {s.phone}
                      </td>

                      {/* Hostel */}
                      <td className="table-cell text-center">
                        {s.isHosteler
                          ? <span className="text-purple-600 text-xs font-medium">
                              🏠 {s.hostelRoom || 'Yes'}
                            </span>
                          : <span className="text-gray-300 text-xs">–</span>
                        }
                      </td>

                      {/* Status */}
                      <td className="table-cell">
                        {s.status === 'admission_pending'
                          ? <span className="inline-flex items-center gap-1
                              text-xs text-yellow-700 bg-yellow-50 border
                              border-yellow-200 px-2 py-0.5 rounded-full">
                              ⏳ Enrollment
                            </span>
                          : <StatusBadge status={s.status} />
                        }
                      </td>

                      {/* Actions */}
                      <td className="table-cell"
                        onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <button
                            onClick={() => navigate(`/admin/students/${s._id}`)}
                            className="text-xs text-primary-600
                              hover:text-primary-800 font-medium hover:underline">
                            View
                          </button>
                          <span className="text-gray-200">|</span>
                          <button
                            onClick={() => navigate(
                              `/admin/students/${s._id}/edit`
                            )}
                            className="text-xs text-gray-500 hover:text-gray-800
                              font-medium hover:underline">
                            Edit
                          </button>
                          {s.status === 'active' && s.semester && (
                            <>
                              <span className="text-gray-200">|</span>
                              <button
                                onClick={e => handlePromoteSingle(
                                  e, s._id,
                                  `${s.firstName} ${s.lastName}`,
                                  s.semester
                                )}
                                className="text-xs text-green-600
                                  hover:text-green-800 font-medium
                                  hover:underline">
                                +Sem
                              </button>
                            </>
                          )}
                          {s.status !== 'inactive' && (
                            <>
                              <span className="text-gray-200">|</span>
                              <button
                                onClick={e => handleDeactivate(
                                  e, s._id,
                                  `${s.firstName} ${s.lastName}`
                                )}
                                className="text-xs text-red-500
                                  hover:text-red-700 font-medium hover:underline">
                                Deactivate
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {students.length === 0 && (
              <EmptyState
                message={
                  filters.search || filters.course ||
                  filters.status || filters.className
                    ? 'No students match your filters'
                    : 'No students added yet'
                }
                icon={<FiUsers />}
              />
            )}

            <Pagination
              page={page}
              pages={Math.ceil(total / 15)}
              onPage={setPage}
            />
          </>
        )}
      </div>

      {/* ── Promote Modal ── */}
      <PromoteModal
        open={showPromote}
        onClose={() => setShowPromote(false)}
        onDone={() => { setShowPromote(false); fetchStudents(); }}
        courses={courses}
      />
    </div>
  );
}
