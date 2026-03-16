import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { PageHeader, Table, StatusBadge, EmptyState, FilterBar, Pagination, PageSpinner } from '../../components/common';
import toast from 'react-hot-toast';

export default function Students() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', course: '', status: '' });

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, ...filters };
      const r = await api.get('/students', { params });
      setStudents(r.data.students);
      setTotal(r.data.total);
    } catch (err) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { api.get('/courses').then(r => setCourses(r.data.courses)); }, []);

  const setFilter = (k, v) => { setFilters(f => ({ ...f, [k]: v })); setPage(1); };

  return (
    <div>
      <PageHeader title="Students" subtitle={`${total} students total`}
        action={<button className="btn-primary" onClick={() => navigate('/admin/students/add')}>+ Add Student</button>} />

      <div className="card">
        <FilterBar>
          <input className="input w-56" placeholder="Search name / reg no / phone..."
            value={filters.search} onChange={e => setFilter('search', e.target.value)} />
          <select className="input w-44" value={filters.course} onChange={e => setFilter('course', e.target.value)}>
            <option value="">All Courses</option>
            {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select className="input w-36" value={filters.status} onChange={e => setFilter('status', e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="graduated">Graduated</option>
          </select>
        </FilterBar>

        {loading ? <PageSpinner /> : (
          <>
            <Table headers={['Reg No', 'Name', 'Course', 'Phone', 'Admission Date', 'Status', 'Actions']}>
              {students.map(s => (
                <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-cell font-mono text-xs text-gray-500">{s.regNo}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      {s.photo ? <img src={s.photo} alt="" className="w-7 h-7 rounded-full object-cover" /> :
                        <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">{s.firstName[0]}</div>}
                      <div>
                        <p className="font-medium text-gray-800">{s.firstName} {s.lastName}</p>
                        {s.email && <p className="text-xs text-gray-400">{s.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell text-gray-500">{s.course?.name || '–'}</td>
                  <td className="table-cell">{s.phone}</td>
                  <td className="table-cell text-gray-500">{new Date(s.admissionDate).toLocaleDateString('en-IN')}</td>
                  <td className="table-cell"><StatusBadge status={s.status} /></td>
                  <td className="table-cell">
                    <button onClick={() => navigate(`/admin/students/${s._id}`)}
                      className="text-primary-600 hover:text-primary-800 text-sm font-medium">View</button>
                  </td>
                </tr>
              ))}
            </Table>
            {students.length === 0 && <EmptyState message="No students found" icon="🎓" />}
            <Pagination page={page} pages={Math.ceil(total / 15)} onPage={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
