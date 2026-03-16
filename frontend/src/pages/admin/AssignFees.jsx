// AssignFees.jsx
import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { PageHeader } from '../../components/common';
import toast from 'react-hot-toast';

export function AssignFees() {
  const [students, setStudents] = useState([]);
  const [structures, setStructures] = useState([]);
  const [form, setForm] = useState({ studentId: '', structureId: '', academicYear: '', semester: '', dueDate: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/students?limit=500').then(r => setStudents(r.data.students));
    api.get('/fees/structure').then(r => setStructures(r.data.structures));
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/fees/assign', form);
      toast.success('Fees assigned successfully!');
      setForm({ studentId: '', structureId: '', academicYear: '', semester: '', dueDate: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const selectedStructure = structures.find(s => s._id === form.structureId);

  return (
    <div>
      <PageHeader title="Assign Fees" subtitle="Assign a fee structure to a student" />
      <div className="card max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Student *</label>
            <select className="input" value={form.studentId} onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))} required>
              <option value="">Select Student...</option>
              {students.map(s => <option key={s._id} value={s._id}>{s.firstName} {s.lastName} ({s.regNo})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Fee Structure *</label>
            <select className="input" value={form.structureId} onChange={e => setForm(f => ({ ...f, structureId: e.target.value }))} required>
              <option value="">Select Structure...</option>
              {structures.map(s => <option key={s._id} value={s._id}>{s.name} – {s.academicYear}</option>)}
            </select>
          </div>
          {selectedStructure && (
            <div className="bg-blue-50 p-3 rounded-lg text-sm">
              <p className="font-medium text-blue-800">Total: ₹{selectedStructure.totalAmount?.toLocaleString('en-IN')}</p>
              <p className="text-blue-600 mt-1">{selectedStructure.feeHeads?.map(h => `${h.headName}: ₹${h.amount}`).join(' | ')}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Academic Year *</label><input className="input" placeholder="2024-25" value={form.academicYear} onChange={e => setForm(f => ({ ...f, academicYear: e.target.value }))} required /></div>
            <div><label className="label">Semester</label><input type="number" className="input" min="1" value={form.semester} onChange={e => setForm(f => ({ ...f, semester: e.target.value }))} /></div>
            <div><label className="label">Due Date</label><input type="date" className="input" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} /></div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Assigning...' : 'Assign Fees'}</button>
        </form>
      </div>
    </div>
  );
}
export default AssignFees;
