import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { PageHeader } from '../../components/common';
import toast from 'react-hot-toast';

const Section = ({ title, children }) => (
  <div className="card mb-4">
    <h3 className="section-title border-b border-gray-100 pb-3 mb-4">{title}</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>
  </div>
);

const Field = ({ label, name, type = 'text', value, onChange, options, required }) => (
  <div>
    <label className="label">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
    {options ? (
      <select className="input" name={name} value={value} onChange={onChange}>
        <option value="">Select...</option>
        {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
      </select>
    ) : (
      <input className="input" type={type} name={name} value={value} onChange={onChange} required={required} />
    )}
  </div>
);

export default function AddStudent() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [form, setForm] = useState({
    firstName: '', lastName: '', dob: '', gender: '', bloodGroup: '', phone: '', email: '',
    aadharNo: '', religion: '', category: '',
    'address.street': '', 'address.city': '', 'address.state': '', 'address.pincode': '',
    'father.name': '', 'father.phone': '', 'father.email': '', 'father.occupation': '',
    'mother.name': '', 'mother.phone': '', 'mother.email': '',
    course: '', className: '', section: '', semester: '', rollNo: '', academicYear: '', batch: '',
    admissionDate: new Date().toISOString().slice(0, 10), isHosteler: false,
  });

  useEffect(() => { api.get('/courses').then(r => setCourses(r.data.courses)); }, []);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      // Expand dot-notation keys into nested object
      const nested = {};
      Object.entries(form).forEach(([k, v]) => {
        if (k.includes('.')) {
          const [a, b] = k.split('.');
          if (!nested[a]) nested[a] = {};
          nested[a][b] = v;
        } else nested[k] = v;
      });
      Object.entries(nested).forEach(([k, v]) => {
        if (typeof v === 'object' && !(v instanceof File)) fd.append(k, JSON.stringify(v));
        else fd.append(k, v);
      });
      if (photo) fd.append('photo', photo);
      await api.post('/students', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Student added successfully!');
      navigate('/admin/students');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add student');
    } finally {
      setLoading(false);
    }
  };

  const genders = ['Male', 'Female', 'Other'];
  const bloodGroups = ['A+','A-','B+','B-','O+','O-','AB+','AB-'];
  const courseOpts = courses.map(c => ({ value: c._id, label: c.name }));

  return (
    <div>
      <PageHeader title="Add Student" subtitle="Create a new student profile"
        action={<button onClick={() => navigate(-1)} className="btn-secondary">← Back</button>} />
      <form onSubmit={handleSubmit}>
        <Section title="📋 Personal Details">
          <Field label="First Name" name="firstName" value={form.firstName} onChange={handleChange} required />
          <Field label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} required />
          <Field label="Date of Birth" name="dob" type="date" value={form.dob} onChange={handleChange} />
          <Field label="Gender" name="gender" value={form.gender} onChange={handleChange} options={genders} />
          <Field label="Blood Group" name="bloodGroup" value={form.bloodGroup} onChange={handleChange} options={bloodGroups} />
          <Field label="Phone" name="phone" value={form.phone} onChange={handleChange} required />
          <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} />
          <Field label="Aadhar No" name="aadharNo" value={form.aadharNo} onChange={handleChange} />
          <Field label="Religion" name="religion" value={form.religion} onChange={handleChange} />
          <Field label="Category" name="category" value={form.category} onChange={handleChange}
            options={['General','OBC','SC','ST','EWS']} />
        </Section>

        <Section title="🏠 Address">
          <Field label="Street" name="address.street" value={form['address.street']} onChange={handleChange} />
          <Field label="City" name="address.city" value={form['address.city']} onChange={handleChange} />
          <Field label="State" name="address.state" value={form['address.state']} onChange={handleChange} />
          <Field label="Pincode" name="address.pincode" value={form['address.pincode']} onChange={handleChange} />
        </Section>

        <Section title="👨‍👩 Parent Details">
          <Field label="Father Name" name="father.name" value={form['father.name']} onChange={handleChange} />
          <Field label="Father Phone" name="father.phone" value={form['father.phone']} onChange={handleChange} />
          <Field label="Father Email" name="father.email" type="email" value={form['father.email']} onChange={handleChange} />
          <Field label="Father Occupation" name="father.occupation" value={form['father.occupation']} onChange={handleChange} />
          <Field label="Mother Name" name="mother.name" value={form['mother.name']} onChange={handleChange} />
          <Field label="Mother Phone" name="mother.phone" value={form['mother.phone']} onChange={handleChange} />
        </Section>

        <Section title="🎓 Academic Details">
          <Field label="Course" name="course" value={form.course} onChange={handleChange} options={courseOpts} required />
          <Field label="Class" name="className" value={form.className} onChange={handleChange} />
          <Field label="Section" name="section" value={form.section} onChange={handleChange} />
          <Field label="Semester" name="semester" type="number" value={form.semester} onChange={handleChange} />
          <Field label="Roll No" name="rollNo" value={form.rollNo} onChange={handleChange} />
          <Field label="Academic Year" name="academicYear" value={form.academicYear} onChange={handleChange} />
          <Field label="Batch" name="batch" value={form.batch} onChange={handleChange} />
          <Field label="Admission Date" name="admissionDate" type="date" value={form.admissionDate} onChange={handleChange} required />
        </Section>

        <div className="card mb-4">
          <h3 className="section-title border-b border-gray-100 pb-3 mb-4">📸 Photo & Hostel</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Student Photo</label>
              <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files[0])} className="input" />
            </div>
            <div className="flex items-center gap-2 mt-5">
              <input type="checkbox" id="hostel" name="isHosteler" checked={form.isHosteler} onChange={handleChange} className="rounded" />
              <label htmlFor="hostel" className="label mb-0 cursor-pointer">Is Hostel Student?</label>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary px-8">
            {loading ? 'Saving...' : 'Create Student'}
          </button>
        </div>
      </form>
    </div>
  );
}
