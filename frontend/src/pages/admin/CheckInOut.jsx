import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import { EmptyState, FilterBar, PageHeader, PageSpinner } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { FiCheck, FiClock } from '../../components/common/icons';

export default function CheckInOut() {
  const { user } = useAuth();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentRollNo, setStudentRollNo] = useState('');
  const [studentHostelRoom, setStudentHostelRoom] = useState('');
  const [form, setForm] = useState({
    studentIdentifier: '',
    type: 'check_in',
    location: 'campus',
    remarks: '',
  });
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    type: '',
    location: '',
    department: '',
  });

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.type) params.type = filters.type;
      if (filters.location) params.location = filters.location;
      if (filters.department) params.department = filters.department;
      const response = await api.get('/checkin', { params });
      setRecords(response.data.records || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load movement records');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    api.get('/courses')
      .then(response => setCourses(response.data.courses || []))
      .catch(() => {});
  }, []);

  const today = new Date().toDateString();
  const todaysRecords = useMemo(
    () => records.filter(record => new Date(record.timestamp).toDateString() === today),
    [records, today]
  );
  const todayIn = todaysRecords.filter(record => record.type === 'check_in').length;
  const todayOut = todaysRecords.filter(record => record.type === 'check_out').length;

  const findStudent = async () => {
    if (!form.studentIdentifier.trim()) return;
    try {
      const response = await api.get(
        `/students/lookup/${encodeURIComponent(form.studentIdentifier.trim())}`
      );
      const student = response.data.student;
      setStudentId(student._id);
      setStudentName(`${student.firstName} ${student.lastName}`);
      setStudentRollNo(student.rollNo || student.admissionNo || student.regNo || '');
      setStudentHostelRoom(student.hostelRoom || '');
      toast.success(`Found: ${student.firstName} ${student.lastName}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Student not found');
      setStudentId('');
      setStudentName('');
      setStudentRollNo('');
      setStudentHostelRoom('');
    }
  };

  const handleRecord = async () => {
    if (!studentId) {
      toast.error('Find student first');
      return;
    }

    try {
      await api.post('/checkin', {
        studentId,
        type: form.type,
        location: form.location,
        remarks: form.remarks,
      });
      toast.success(
        `${form.type === 'check_in' ? 'Check-in' : 'Check-out'} recorded and portals updated`
      );
      setForm({
        studentIdentifier: '',
        type: 'check_in',
        location: 'campus',
        remarks: '',
      });
      setStudentId('');
      setStudentName('');
      setStudentRollNo('');
      setStudentHostelRoom('');
      fetchRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record movement');
    }
  };

  const setFilter = (key, value) => setFilters(current => ({ ...current, [key]: value }));
  const departments = [...new Set(
    courses.map(course => course.department?.trim()).filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

  return (
    <div>
      <PageHeader
        title="Check-In / Check-Out"
        subtitle="Class teacher, admin, super admin, and hostel warden can record movement. A student must check out from the current place before checking in anywhere else."
      />

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card bg-green-50 border-green-200">
          <p className="text-2xl font-bold text-green-700">{todayIn}</p>
          <p className="text-sm text-green-600">Today's check-ins shown</p>
        </div>
        <div className="card bg-yellow-50 border-yellow-200">
          <p className="text-2xl font-bold text-yellow-700">{todayOut}</p>
          <p className="text-sm text-yellow-600">Today's check-outs shown</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
            <h3 className="section-title">Record Entry</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="Roll / Reg / Admission No"
                  value={form.studentIdentifier}
                  onChange={event => setForm(current => ({
                    ...current,
                    studentIdentifier: event.target.value,
                  }))}
                  onKeyDown={event => event.key === 'Enter' && findStudent()}
                />
                <button onClick={findStudent} className="btn-secondary text-sm px-3">
                  Find
                </button>
              </div>

              {studentName && (
                <p className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
                  <span className="inline-flex items-center gap-1">
                    <FiCheck />
                    {studentName}
                    {studentRollNo ? ` (${studentRollNo})` : ''}
                    {studentHostelRoom ? ` - Room ${studentHostelRoom}` : ''}
                  </span>
                </p>
              )}

              <select
                className="input"
                value={form.type}
                onChange={event => setForm(current => ({ ...current, type: event.target.value }))}
              >
                <option value="check_in">Check In</option>
                <option value="check_out">Check Out</option>
              </select>

              <select
                className="input"
                value={form.location}
                onChange={event => setForm(current => ({ ...current, location: event.target.value }))}
              >
                <option value="hostel">Hostel</option>
                <option value="campus">Campus</option>
              </select>

              <input
                className="input"
                placeholder="Remarks (optional)"
                value={form.remarks}
                onChange={event => setForm(current => ({ ...current, remarks: event.target.value }))}
              />

              <button onClick={handleRecord} className="btn-primary w-full">
                Record Movement
              </button>

              <p className="text-xs text-gray-500 leading-relaxed">
                Students must alternate movement: check in, then check out, then check in again.
                The next action must happen at the same place as the last movement record.
              </p>
            </div>
          </div>

        <div className="lg:col-span-2 card overflow-x-auto">
          <h3 className="section-title">Movement Records</h3>

          <FilterBar>
            <input
              type="date"
              className="input w-36"
              value={filters.startDate}
              onChange={event => setFilter('startDate', event.target.value)}
            />
            <input
              type="date"
              className="input w-36"
              value={filters.endDate}
              onChange={event => setFilter('endDate', event.target.value)}
            />
            <select
              className="input w-32"
              value={filters.type}
              onChange={event => setFilter('type', event.target.value)}
            >
              <option value="">All Types</option>
              <option value="check_in">Check In</option>
              <option value="check_out">Check Out</option>
            </select>
            <select
              className="input w-40"
              value={filters.location}
              onChange={event => setFilter('location', event.target.value)}
            >
              <option value="">All Locations</option>
              <option value="hostel">Hostel</option>
              <option value="campus">Campus</option>
            </select>
            <select
              className="input w-48"
              value={filters.department}
              onChange={event => setFilter('department', event.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map(department => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </FilterBar>

          {loading ? <PageSpinner /> : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Student</th>
                  <th className="table-header">Class / Department</th>
                  <th className="table-header">Room</th>
                  <th className="table-header">Reg No</th>
                  <th className="table-header">Roll No</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">Location</th>
                  <th className="table-header">Time</th>
                  <th className="table-header">Recorded By</th>
                  <th className="table-header">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {records.map(record => (
                  <tr key={record._id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <p className="font-medium">
                        {record.student?.firstName} {record.student?.lastName}
                      </p>
                    </td>
                    <td className="table-cell text-xs text-gray-500">
                      {record.student?.className || record.student?.course?.department || '-'}
                    </td>
                    <td className="table-cell text-xs text-gray-500">
                      {record.student?.hostelRoom || '-'}
                    </td>
                    <td className="table-cell font-mono text-xs text-gray-500">
                      {record.student?.regNo || '-'}
                    </td>
                    <td className="table-cell font-mono text-xs text-gray-500">
                      {record.student?.rollNo || record.student?.admissionNo || '-'}
                    </td>
                    <td className="table-cell">
                      <span className={`badge-${record.type === 'check_in' ? 'green' : 'yellow'}`}>
                        {record.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="table-cell capitalize">
                      {record.location || '-'}
                    </td>
                    <td className="table-cell text-gray-500 text-xs">
                      {new Date(record.timestamp).toLocaleString('en-IN')}
                    </td>
                    <td className="table-cell text-xs text-gray-500">
                      {record.recordedBy?.name || '-'}
                    </td>
                    <td className="table-cell text-gray-400">{record.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && records.length === 0 && (
            <EmptyState message="No records found" icon={<FiClock />} />
          )}
        </div>
      </div>
    </div>
  );
}
