import React, { useState } from 'react';
import api from '../../api/axios';

export default function ParentRegister() {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', password: '',
    studentRegNo: '', relation: 'father',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await api.post('/parent/register', form);
      localStorage.setItem('token', r.data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${r.data.token}`;
      window.location.href = '/parent';
    } catch (err) {
      alert(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 to-green-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-green-700 text-2xl font-bold mx-auto mb-3 shadow-xl">P</div>
          <h1 className="text-2xl font-bold text-white">Parent Registration</h1>
          <p className="text-green-300 text-sm mt-1">Link your account to your child</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name *</label>
              <input className="input" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Phone Number *</label>
              <input type="tel" className="input" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="label">Password *</label>
              <input type="password" className="input" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Student Registration No *</label>
              <input className="input font-mono" placeholder="e.g. REG12345678"
                value={form.studentRegNo}
                onChange={e => setForm(f => ({ ...f, studentRegNo: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Relation</label>
              <select className="input" value={form.relation}
                onChange={e => setForm(f => ({ ...f, relation: e.target.value }))}>
                <option value="father">Father</option>
                <option value="mother">Mother</option>
                <option value="guardian">Guardian</option>
              </select>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Registering...' : 'Register'}
            </button>
            <p className="text-center text-sm text-gray-500">
              Already registered?{' '}
              <a href="/login" className="text-green-600 hover:underline">Login here</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}