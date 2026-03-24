import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  PageHeader, StatusBadge, EmptyState,
  FilterBar, Pagination, PageSpinner,
} from '../../components/common';
import {
  FiAlertTriangle,
  FiAward,
  FiBook,
  FiCheckCircle,
  FiClock,
  FiHome,
  FiTrendingUp,
  FiUsers,
  FiX,
} from '../../components/common/icons';
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
          <span className="inline-flex items-center gap-1"><FiHome className="shrink-0" /> {className}</span>
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
          {strength.full ? 'Full' : `${strength.remaining} left`}
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

  useEffect(() => {
    if (!open) return;
    if (courses.length === 1) {
      setSelectedCourse(courses[0]._id);
    }
  }, [courses, open]);

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
            <FiX />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Result screen */}
          {result ? (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="flex justify-center mb-3">
                  <FiCheckCircle className="text-4xl text-green-600" />
                </div>
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
                  <p className="text-xs font-semibold text-purple-700 mb-2 inline-flex items-center gap-1">
                    <FiAward className="shrink-0" />
                    Graduated Students:
                  </p>
                  <div className="space-y-1">
                    {result.graduated.map((name, i) => (
                      <p key={i} className="text-xs text-purple-600">
                        {name}
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
              {courses.length > 1 && (
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
              )}

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
                        ? 'These students will be graduated'
                        : `Semester ${currentSem} to ${nextSem}`
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
                          {' to '}
                          {willGraduate ? 'Graduated' : `Sem ${nextSem}`}
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
                  <FiAlertTriangle className="text-yellow-500 text-base mt-0.5 shrink-0" />
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
  const { user } = useAuth();

  const [students, setStudents]       = useState([]);
  const [currentCourseSection, setCurrentCourseSection] = useState(null);
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

  const isClassTeacher = user?.role === 'class_teacher';
  const teacherCourse = courses.find(c =>
    c.name === user?.department || c.code === user?.department
  );
  const visibleCourses = isClassTeacher && teacherCourse ? [teacherCourse] : courses;

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const buildParams = custom => {
        const params = { limit: 15, ...custom };
        if (filters.search) params.search = filters.search;
        if (filters.status) params.status = filters.status;
        if (filters.className) params.className = filters.className;
        return params;
      };

      if (filters.course) {
        const r = await api.get('/students', {
          params: buildParams({ page: 1, limit: 100, course: filters.course }),
        });

        setStudents(r.data.students);
        setCurrentCourseSection(null);
        setTotal(r.data.total);

        const uniqueClasses = [
          ...new Set(r.data.students.map(s => s.className).filter(Boolean)),
        ].sort();
        setClasses(prev => [...new Set([...prev, ...uniqueClasses])].sort());
        return;
      }

      if (!visibleCourses.length) {
        setStudents([]);
        setCurrentCourseSection(null);
        setTotal(0);
        setClasses([]);
        return;
      }

      const orderedCourses = [...visibleCourses].sort((a, b) =>
        (a.code || a.name || '').localeCompare(b.code || b.name || '', undefined, {
          sensitivity: 'base',
        })
      );
      const selectedCourseIndex = Math.min(Math.max(page, 1), orderedCourses.length) - 1;
      const selectedCourse = orderedCourses[selectedCourseIndex];
      const response = await api.get('/students', {
        params: buildParams({ page: 1, limit: 100, course: selectedCourse._id }),
      });

      const uniqueClasses = [
        ...new Set(
          response.data.students.map(student => student.className).filter(Boolean)
        ),
      ].sort();

      setClasses(prev => [...new Set([...prev, ...uniqueClasses])].sort());
      setCurrentCourseSection({
        key: selectedCourse._id,
        title: selectedCourse.code || selectedCourse.name,
        subtitle: selectedCourse.name,
        courseId: selectedCourse._id,
        coursePage: selectedCourseIndex + 1,
        coursePages: orderedCourses.length,
        students: response.data.students,
        total: response.data.total,
      });
      setStudents(response.data.students);
      setTotal(response.data.total);
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [page, filters, visibleCourses]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);
  useEffect(() => {
    api.get('/courses').then(r => setCourses(r.data.courses));
  }, []);
  useEffect(() => {
    if (!filters.course && visibleCourses.length > 0 && page > visibleCourses.length) {
      setPage(visibleCourses.length);
    }
  }, [filters.course, page, visibleCourses.length]);

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

  const handleGenerateRollNos = async () => {
    const selectedCourseId = isClassTeacher
      ? teacherCourse?._id
      : filters.course;

    if (!selectedCourseId) {
      toast.error('Select a course first to generate roll numbers');
      return;
    }

    const selectedCourse = visibleCourses.find(c => c._id === selectedCourseId);
    const confirmMessage =
      `Generate course-wise roll numbers for ${selectedCourse?.name || 'this course'}?\n\n` +
      `Rule: Male students first, then female students, both sorted by student name.\n` +
      `Roll numbers will restart batch-wise inside the selected course.`;

    if (!window.confirm(confirmMessage)) return;

    try {
      const r = await api.post('/students/generate-roll-nos', {
        courseId: selectedCourseId,
      });
      toast.success(r.data.message);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate roll numbers');
    }
  };

  const pendingCount = students.filter(
    s => !s.regNo || s.status === 'admission_pending'
  ).length;

  const filteredClasses = classes.filter(cls => {
    if (!filters.course) return true;
    const course = visibleCourses.find(c => c._id === filters.course);
    if (!course) return true;
    const code = course.code ||
      course.name.split(' ').filter(w => w.length > 2)
        .map(w => w[0].toUpperCase()).join('');
    return cls.startsWith(code);
  });

  const getRollNoColor = gender => {
    const normalizedGender = (gender || '').trim().toLowerCase();
    if (normalizedGender === 'male') return 'text-blue-600';
    if (normalizedGender === 'female') return 'text-red-600';
    return 'text-gray-600';
  };

  const getGenderSortRank = gender => {
    const normalizedGender = String(gender || '').trim().toLowerCase();
    if (normalizedGender === 'male') return 0;
    if (normalizedGender === 'female') return 1;
    return 2;
  };

  const compareRollNumbers = (rollNoA, rollNoB) => {
    const normalizedA = String(rollNoA || '').trim();
    const normalizedB = String(rollNoB || '').trim();

    if (!normalizedA && !normalizedB) return 0;
    if (!normalizedA) return 1;
    if (!normalizedB) return -1;

    const prefixA = normalizedA.replace(/\d+$/g, '');
    const prefixB = normalizedB.replace(/\d+$/g, '');
    const prefixDiff = prefixA.localeCompare(prefixB, undefined, {
      sensitivity: 'base',
    });
    if (prefixDiff !== 0) return prefixDiff;

    const numericA = Number.parseInt(normalizedA.match(/(\d+)$/)?.[1], 10);
    const numericB = Number.parseInt(normalizedB.match(/(\d+)$/)?.[1], 10);
    const hasNumericA = !Number.isNaN(numericA);
    const hasNumericB = !Number.isNaN(numericB);

    if (hasNumericA && hasNumericB && numericA !== numericB) {
      return numericA - numericB;
    }

    return normalizedA.localeCompare(normalizedB, undefined, {
      sensitivity: 'base',
      numeric: true,
    });
  };

  const sortedStudents = [...students].sort((a, b) => {
    const genderDiff = getGenderSortRank(a.gender) - getGenderSortRank(b.gender);
    if (genderDiff !== 0) return genderDiff;

    const rollDiff = compareRollNumbers(a.rollNo, b.rollNo);
    if (rollDiff !== 0) return rollDiff;

    const studentNameA = `${a.firstName || ''} ${a.lastName || ''}`.trim();
    const studentNameB = `${b.firstName || ''} ${b.lastName || ''}`.trim();

    const nameDiff = studentNameA.localeCompare(studentNameB, undefined, {
      sensitivity: 'base',
    });
    if (nameDiff !== 0) return nameDiff;

    return String(a.admissionNo || '').localeCompare(String(b.admissionNo || ''), undefined, {
      sensitivity: 'base',
      numeric: true,
    });
  });

  const showCourseGroups = !filters.course;
  const renderStudentRow = s => (
    <tr key={s._id}
      className="hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={() => navigate(`/admin/students/${s._id}`)}>

      <td className={`table-cell font-mono text-xs font-semibold ${
        getRollNoColor(s.gender)
      }`}>
        {s.rollNo || '-'}
      </td>

      <td className="table-cell font-mono text-xs text-gray-600">
        {s.regNo || '-'}
      </td>

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
              {s.batch || 'â€“'}
            </p>
          </div>
        </div>
      </td>

      <td className="table-cell">
        <div className="font-mono text-xs text-gray-600 mb-1">
          {s.admissionNo || 'â€“'}
        </div>
        {!s.regNo ||
          s.status === 'admission_pending'
          ? <span className="inline-flex items-center gap-1
              text-xs text-orange-600 bg-orange-50 border
              border-orange-200 px-2 py-0.5 rounded-full
              font-medium">
              Pending
            </span>
          : null
        }
      </td>

      {!s.hideCourseColumn && (
        <td className="table-cell text-gray-500 text-xs">
          {s.course?.name || 'â€“'}
        </td>
      )}

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

      <td className="table-cell text-center text-gray-500 text-xs">
        {s.semester ? `Sem ${s.semester}` : '-'}
      </td>

      <td className="table-cell font-mono text-xs text-gray-500">
        {s.phone}
      </td>

      <td className="table-cell text-center">
        {s.isHosteler
          ? <span className="text-purple-600 text-xs font-medium">
              <span className="inline-flex items-center gap-1">
                <FiHome className="shrink-0" />
                {s.hostelRoom || 'Yes'}
              </span>
            </span>
          : <span className="text-gray-300 text-xs">-</span>
        }
      </td>

      <td className="table-cell">
        {s.status === 'admission_pending'
          ? <span className="inline-flex items-center gap-1
              text-xs text-yellow-700 bg-yellow-50 border
              border-yellow-200 px-2 py-0.5 rounded-full">
              <FiClock className="shrink-0" />
              Enrollment
            </span>
          : <StatusBadge status={s.status} />
        }
      </td>

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
            onClick={() => navigate(`/admin/students/${s._id}/edit`)}
            className="text-xs text-gray-500 hover:text-gray-800
              font-medium hover:underline">
            Edit
          </button>
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
  );

  const renderStudentsTable = (courseStudents, hideCourseColumn = false) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="table-header">Roll No</th>
            <th className="table-header">Reg No</th>
            <th className="table-header">Student</th>
            <th className="table-header">Admission No</th>
            {!hideCourseColumn && <th className="table-header">Course</th>}
            <th className="table-header">Class</th>
            <th className="table-header">Semester</th>
            <th className="table-header">Phone</th>
            <th className="table-header">Hostel</th>
            <th className="table-header">Status</th>
            <th className="table-header">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {courseStudents.map(s => renderStudentRow({
            ...s,
            hideCourseColumn,
          }))}
        </tbody>
      </table>
    </div>
  );

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
              <FiTrendingUp />
              Promote Class
            </button>
            <button
              onClick={handleGenerateRollNos}
              className="btn-secondary"
            >
              Generate Roll No
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
            icon: FiUsers, color: 'bg-blue-50 text-blue-700' },
          { label: 'Active',   value: students.filter(s => s.status === 'active').length,
            icon: FiCheckCircle, color: 'bg-green-50 text-green-700' },
          { label: 'Pending',  value: pendingCount,
            icon: FiClock, color: 'bg-yellow-50 text-yellow-700' },
          { label: 'Hostel',   value: students.filter(s => s.isHosteler).length,
            icon: FiHome, color: 'bg-purple-50 text-purple-700' },
        ].map(stat => (
          <div key={stat.label}
            className={`rounded-xl p-4 flex items-center gap-3 ${stat.color}`}>
            <span className="text-2xl"><stat.icon /></span>
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

          {!isClassTeacher && (
            <select className="input w-48" value={filters.course}
              onChange={e => handleCourseFilter(e.target.value)}>
              <option value="">All Courses</option>
              {visibleCourses.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          )}

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
              <span className="inline-flex items-center gap-1">
                Clear <FiX />
              </span>
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
                <FiBook className="shrink-0" /> {visibleCourses.find(c => c._id === filters.course)?.name}
                <button onClick={() => handleCourseFilter('')}
                  className="hover:text-blue-900"><FiX /></button>
              </span>
            )}
            {filters.className && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1
                bg-green-50 text-green-700 text-xs font-medium rounded-full
                border border-green-200">
                <FiHome className="shrink-0" /> Class {filters.className}
                <button onClick={() => setFilter('className', '')}
                  className="hover:text-green-900"><FiX /></button>
              </span>
            )}
          </div>
        )}

        {/* ── Class Strength Bar ── */}
        {filters.className && (
          <ClassStrengthBar
            className={filters.className}
            courseId={isClassTeacher ? teacherCourse?._id : filters.course}
          />
        )}

        {/* ── Pending Banner ── */}
        {pendingCount > 0 && !filters.status && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50
            border border-yellow-200 rounded-xl mb-4">
            <FiClock className="text-yellow-500 text-lg shrink-0" />
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
            {showCourseGroups ? (
              <>
                {currentCourseSection && (
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-slate-50 px-4 py-3">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">{currentCourseSection.title}</h2>
                      <p className="text-sm text-slate-500">{currentCourseSection.subtitle}</p>
                    </div>
                    <div className="text-sm text-slate-500">
                      {currentCourseSection.total} students
                    </div>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="table-header">Roll No</th>
                        <th className="table-header">Reg No</th>
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
                      {sortedStudents.map(s => renderStudentRow(s))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-header">Roll No</th>
                    <th className="table-header">Reg No</th>
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
                  {sortedStudents.map(s => renderStudentRow(s))}
                </tbody>
              </table>
            </div>
            )}

            {((showCourseGroups && (!currentCourseSection || currentCourseSection.total === 0)) ||
              (!showCourseGroups && students.length === 0)) && (
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

            {showCourseGroups ? (
              <Pagination
                page={currentCourseSection?.coursePage || page}
                pages={visibleCourses.length}
                onPage={setPage}
              />
            ) : (
              <Pagination
                page={page}
                pages={1}
                onPage={setPage}
              />
            )}
          </>
        )}
      </div>

      {/* ── Promote Modal ── */}
      <PromoteModal
        open={showPromote}
        onClose={() => setShowPromote(false)}
        onDone={() => { setShowPromote(false); fetchStudents(); }}
        courses={visibleCourses}
      />
    </div>
  );
}
