import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { PageHeader, Table, FilterBar, EmptyState, PageSpinner } from '../../components/common';
import toast from 'react-hot-toast';
import { FiCheck, FiClock } from '../../components/common/icons';

export default function CheckInOut() {
  const [records, setRecords]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [studentId, setStudentId]     = useState('');
  const [studentName, setStudentName] = useState('');
  const [form, setForm]               = useState({
    studentRegNo: '', type: 'check_in', location: 'gate', remarks: '',
  });
  const [filters, setFilters] = useState({
    startDate: '', endDate: '', type: '', location: '',
  });

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const params = {};
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate)   params.endDate   = filters.endDate;
    if (filters.type)      params.type      = filters.type;
    if (filters.location)  params.location  = filters.location;
    const r = await api.get('/checkin', { params });
    setRecords(r.data.records);
    setLoading(false);
  }, [filters]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const findStudent = async () => {
    if (!form.studentRegNo) return;
    try {
      const r = await api.get(`/students/reg/${form.studentRegNo}`);
      setStudentId(r.data.student._id);
      setStudentName(`${r.data.student.firstName} ${r.data.student.lastName}`);
      toast.success(`Found: ${r.data.student.firstName} ${r.data.student.lastName}`);
    } catch {
      toast.error('Student not found');
      setStudentId('');
      setStudentName('');
    }
  };

  const handleRecord = async () => {
    if (!studentId) { toast.error('Find student first'); return; }
    try {
      await api.post('/checkin', {
        studentId,
        type:     form.type,
        location: form.location,
        remarks:  form.remarks,
      });
      toast.success(
        `${form.type === 'check_in' ? 'Check-in' : 'Check-out'} recorded — parent notified`
      );
      setForm(f => ({ ...f, studentRegNo: '', remarks: '' }));
      setStudentId('');
      setStudentName('');
      fetchRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record');
    }
  };

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  const todayIn  = records.filter(r => r.type === 'check_in').length;
  const todayOut = records.filter(r => r.type === 'check_out').length;

  return (
    <div>
      <PageHeader
        title="Check-In / Check-Out"
        subtitle="Record and track student movement"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card bg-green-50 border-green-200">
          <p className="text-2xl font-bold text-green-700">{todayIn}</p>
          <p className="text-sm text-green-600">Check-ins shown</p>
        </div>
        <div className="card bg-yellow-50 border-yellow-200">
          <p className="text-2xl font-bold text-yellow-700">{todayOut}</p>
          <p className="text-sm text-yellow-600">Check-outs shown</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Record Form */}
        <div className="card">
          <h3 className="section-title">Record Entry</h3>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="Reg No e.g. REG12345"
                value={form.studentRegNo}
                onChange={e => setForm(f => ({ ...f, studentRegNo: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && findStudent()}
              />
              <button onClick={findStudent} className="btn-secondary text-sm px-3">
                Find
              </button>
            </div>

            {studentName && (
              <p className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
                <span className="inline-flex items-center gap-1"><FiCheck /> {studentName}</span>
              </p>
            )}

            <select
              className="input"
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            >
              <option value="check_in">Check In</option>
              <option value="check_out">Check Out</option>
            </select>

            <select
              className="input"
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
            >
              <option value="gate">Main Gate</option>
              <option value="hostel">Hostel</option>
              <option value="campus">Campus</option>
            </select>

            <input
              className="input"
              placeholder="Remarks (optional)"
              value={form.remarks}
              onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
            />

            <button onClick={handleRecord} className="btn-primary w-full">
              Record & Notify Parent
            </button>
          </div>
        </div>

        {/* Records Table */}
        <div className="lg:col-span-2 card overflow-x-auto">
          <h3 className="section-title">Movement Records</h3>

          <FilterBar>
            <input type="date" className="input w-36" value={filters.startDate}
              onChange={e => setFilter('startDate', e.target.value)} />
            <input type="date" className="input w-36" value={filters.endDate}
              onChange={e => setFilter('endDate', e.target.value)} />
            <select className="input w-32" value={filters.type}
              onChange={e => setFilter('type', e.target.value)}>
              <option value="">All Types</option>
              <option value="check_in">Check In</option>
              <option value="check_out">Check Out</option>
            </select>
            <select className="input w-32" value={filters.location}
              onChange={e => setFilter('location', e.target.value)}>
              <option value="">All Locations</option>
              <option value="gate">Gate</option>
              <option value="hostel">Hostel</option>
              <option value="campus">Campus</option>
            </select>
          </FilterBar>

          {loading ? <PageSpinner /> : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Student</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">Location</th>
                  <th className="table-header">Time</th>
                  <th className="table-header">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {records.slice(0, 30).map(r => (
                  <tr key={r._id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <p className="font-medium">
                        {r.student?.firstName} {r.student?.lastName}
                      </p>
                      <p className="text-xs text-gray-400">{r.student?.regNo}</p>
                    </td>
                    <td className="table-cell">
                      <span className={`badge-${r.type === 'check_in' ? 'green' : 'yellow'}`}>
                        {r.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="table-cell capitalize">{r.location}</td>
                    <td className="table-cell text-gray-500 text-xs">
                      {new Date(r.timestamp).toLocaleString('en-IN')}
                    </td>
                    <td className="table-cell text-gray-400">{r.remarks || '–'}</td>
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
