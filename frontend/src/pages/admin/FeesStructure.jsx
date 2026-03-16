import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { PageHeader, Modal, EmptyState, PageSpinner } from '../../components/common';
import toast from 'react-hot-toast';

export default function FeesStructure() {
  const [structures, setStructures] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', course: '', academicYear: '', semester: '', feeHeads: [{ headName: '', amount: '' }], hasInstallments: false, fineEnabled: false, fineAmount: 0 });

  useEffect(() => {
    Promise.all([api.get('/fees/structure'), api.get('/courses')])
      .then(([s, c]) => { setStructures(s.data.structures); setCourses(c.data.courses); })
      .finally(() => setLoading(false));
  }, []);

  const addHead = () => setForm(f => ({ ...f, feeHeads: [...f.feeHeads, { headName: '', amount: '' }] }));
  const removeHead = i => setForm(f => ({ ...f, feeHeads: f.feeHeads.filter((_, idx) => idx !== i) }));
  const updateHead = (i, k, v) => setForm(f => ({ ...f, feeHeads: f.feeHeads.map((h, idx) => idx === i ? { ...h, [k]: v } : h) }));
  const total = form.feeHeads.reduce((s, h) => s + (Number(h.amount) || 0), 0);

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const r = await api.post('/fees/structure', form);
      setStructures(p => [r.data.structure, ...p]);
      setShowModal(false);
      toast.success('Fee structure created');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div>
      <PageHeader title="Fee Structures" action={<button className="btn-primary" onClick={() => setShowModal(true)}>+ New Structure</button>} />
      {loading ? <PageSpinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {structures.map(s => (
            <div key={s._id} className="card hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-800">{s.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{s.isActive ? 'Active' : 'Inactive'}</span>
              </div>
              <p className="text-sm text-gray-500 mb-1">{s.course?.name || 'All Courses'} • {s.academicYear}</p>
              <p className="text-sm text-gray-500 mb-3">Semester {s.semester || 'All'}</p>
              <div className="space-y-1 mb-3">
                {s.feeHeads?.map((h, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-600">{h.headName}</span>
                    <span className="font-medium">₹{h.amount?.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-2 flex justify-between">
                <span className="text-sm font-semibold text-gray-700">Total</span>
                <span className="text-base font-bold text-primary-700">₹{s.totalAmount?.toLocaleString('en-IN')}</span>
              </div>
            </div>
          ))}
          {structures.length === 0 && <div className="col-span-3"><EmptyState message="No fee structures yet" icon="📋" /></div>}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create Fee Structure" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Name *</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
            <div><label className="label">Course</label>
              <select className="input" value={form.course} onChange={e => setForm(f => ({ ...f, course: e.target.value }))}>
                <option value="">All Courses</option>
                {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div><label className="label">Academic Year *</label><input className="input" placeholder="2024-25" value={form.academicYear} onChange={e => setForm(f => ({ ...f, academicYear: e.target.value }))} required /></div>
            <div><label className="label">Semester</label><input type="number" className="input" min="1" max="10" value={form.semester} onChange={e => setForm(f => ({ ...f, semester: e.target.value }))} /></div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="label mb-0">Fee Heads</label>
              <button type="button" onClick={addHead} className="text-primary-600 text-sm hover:underline">+ Add Head</button>
            </div>
            <div className="space-y-2">
              {form.feeHeads.map((h, i) => (
                <div key={i} className="flex gap-2">
                  <input className="input flex-1" placeholder="Head name (e.g. Tuition)" value={h.headName} onChange={e => updateHead(i, 'headName', e.target.value)} />
                  <input type="number" className="input w-32" placeholder="Amount" value={h.amount} onChange={e => updateHead(i, 'amount', e.target.value)} />
                  {form.feeHeads.length > 1 && <button type="button" onClick={() => removeHead(i)} className="text-red-500 hover:text-red-700 px-2">×</button>}
                </div>
              ))}
            </div>
            <div className="mt-2 text-right text-sm font-semibold text-primary-700">Total: ₹{total.toLocaleString('en-IN')}</div>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.fineEnabled} onChange={e => setForm(f => ({ ...f, fineEnabled: e.target.checked }))} className="rounded" />
              Enable Late Fine
            </label>
            {form.fineEnabled && <input type="number" className="input w-32" placeholder="Fine/day ₹" value={form.fineAmount} onChange={e => setForm(f => ({ ...f, fineAmount: e.target.value }))} />}
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create Structure</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
