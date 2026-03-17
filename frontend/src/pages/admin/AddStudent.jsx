import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { PageHeader } from '../../components/common';
import { FiArrowLeft, FiAward, FiCamera, FiClipboard, FiHome, FiUsers } from '../../components/common/icons';
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
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEdit);
  const [photo, setPhoto] = useState(null);
  const [form, setForm] = useState({
    firstName: '', lastName: '', dob: '', gender: '', bloodGroup: '', phone: '', email: '',
    aadharNo: '', religion: '', category: '',
    'address.street': '', 'address.city': '', 'address.state': '', 'address.pincode': '',
    'father.name': '', 'father.phone': '', 'father.occupation': '',
    'mother.name': '', 'mother.phone': '', 'mother.occupation': '',
    'guardian.name': '', 'guardian.relation': '', 'guardian.phone': '',
    course: '', className: '', section: '', semester: '', rollNo: '', academicYear: '', batch: '',
    admissionDate: new Date().toISOString().slice(0, 10), isHosteler: false, hostelRoom: '',
  });

  useEffect(() => { api.get('/courses').then(r => setCourses(r.data.courses)); }, []);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/students/${id}`)
      .then(r => {
        const s = r.data.student;
        setForm(f => ({
          ...f,
          firstName: s.firstName || '',
          lastName: s.lastName || '',
          dob: s.dob ? new Date(s.dob).toISOString().slice(0, 10) : '',
          gender: s.gender || '',
          bloodGroup: s.bloodGroup || '',
          phone: s.phone || '',
          email: s.email || '',
          aadharNo: s.aadharNo || '',
          religion: s.religion || '',
          category: s.category || '',
          'address.street': s.address?.street || '',
          'address.city': s.address?.city || '',
          'address.state': s.address?.state || '',
          'address.pincode': s.address?.pincode || '',
          'father.name': s.father?.name || '',
          'father.phone': s.father?.phone || '',
          'father.occupation': s.father?.occupation || '',
          'mother.name': s.mother?.name || '',
          'mother.phone': s.mother?.phone || '',
          'mother.occupation': s.mother?.occupation || '',
          'guardian.name': s.guardian?.name || '',
          'guardian.relation': s.guardian?.relation || '',
          'guardian.phone': s.guardian?.phone || '',
          course: s.course?._id || s.course || '',
          className: s.className || '',
          section: s.section || '',
          semester: s.semester || '',
          rollNo: s.rollNo || '',
          academicYear: s.academicYear || '',
          batch: s.batch || '',
          admissionDate: s.admissionDate ? new Date(s.admissionDate).toISOString().slice(0, 10) : '',
          isHosteler: Boolean(s.isHosteler),
          hostelRoom: s.hostelRoom || '',
        }));
      })
      .catch(() => {
        toast.error('Failed to load student details');
        navigate('/admin/students');
      })
      .finally(() => setPageLoading(false));
  }, [id, isEdit, navigate]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
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
      if (isEdit) {
        await api.put(`/students/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Student updated successfully!');
        navigate(`/admin/students/${id}`);
      } else {
        await api.post('/students', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Student added successfully!');
        navigate('/admin/students');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'add'} student`);
    } finally {
      setLoading(false);
    }
  };

  const genders = ['Male', 'Female', 'Other'];
  const bloodGroups = ['A+','A-','B+','B-','O+','O-','AB+','AB-'];
  const courseOpts = courses.map(c => ({ value: c._id, label: c.name }));

  if (pageLoading) {
    return <div className="card text-center py-10 text-gray-400">Loading student form...</div>;
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Student' : 'Add Student'}
        subtitle={isEdit ? 'Update the student profile' : 'Create a new student profile'}
        action={<button onClick={() => navigate(-1)} className="btn-secondary flex items-center gap-2"><FiArrowLeft /> Back</button>}
      />
      <form onSubmit={handleSubmit}>
        <Section title={<span className="flex items-center gap-2"><FiClipboard /> Personal Details</span>}>
          <Field label="First Name" name="firstName" value={form.firstName} onChange={handleChange} required />
          <Field label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} required />
          <Field label="Date of Birth" name="dob" type="date" value={form.dob} onChange={handleChange} />
          <Field label="Gender" name="gender" value={form.gender} onChange={handleChange} options={genders} />
          <Field label="Blood Group" name="bloodGroup" value={form.bloodGroup} onChange={handleChange} options={bloodGroups} />
          <Field label="Phone" name="phone" value={form.phone} onChange={handleChange} required />
          <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} />
          <Field label="Aadhar No" name="aadharNo" value={form.aadharNo} onChange={handleChange} />
          <Field label="Religion" name="religion" value={form.religion} onChange={handleChange} />
          <Field label="Category" name="category" value={form.category} onChange={handleChange} options={['General', 'OBC', 'SC', 'ST', 'EWS']} />
        </Section>

        <Section title={<span className="flex items-center gap-2"><FiHome /> Address</span>}>
          <Field label="Street" name="address.street" value={form['address.street']} onChange={handleChange} />
          <Field label="City" name="address.city" value={form['address.city']} onChange={handleChange} />
          <Field label="State" name="address.state" value={form['address.state']} onChange={handleChange} />
          <Field label="Pincode" name="address.pincode" value={form['address.pincode']} onChange={handleChange} />
        </Section>

        <Section title={<span className="flex items-center gap-2"><FiUsers /> Parent Details</span>}>
          <Field label="Father Name" name="father.name" value={form['father.name']} onChange={handleChange} />
          <Field label="Father Phone" name="father.phone" value={form['father.phone']} onChange={handleChange} />
          <Field label="Father Occupation" name="father.occupation" value={form['father.occupation']} onChange={handleChange} />
          <Field label="Mother Name" name="mother.name" value={form['mother.name']} onChange={handleChange} />
          <Field label="Mother Phone" name="mother.phone" value={form['mother.phone']} onChange={handleChange} />
          <Field label="Mother Occupation" name="mother.occupation" value={form['mother.occupation']} onChange={handleChange} />
          <Field label="Guardian Name" name="guardian.name" value={form['guardian.name']} onChange={handleChange} />
          <Field label="Guardian Relation" name="guardian.relation" value={form['guardian.relation']} onChange={handleChange} />
          <Field label="Guardian Phone" name="guardian.phone" value={form['guardian.phone']} onChange={handleChange} />
        </Section>

        <Section title={<span className="flex items-center gap-2"><FiAward /> Academic Details</span>}>
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
          <h3 className="section-title border-b border-gray-100 pb-3 mb-4 flex items-center gap-2"><FiCamera /> Photo & Hostel</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Student Photo</label>
              <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files[0])} className="input" />
            </div>
            <div className="flex items-center gap-2 mt-5">
              <input type="checkbox" id="hostel" name="isHosteler" checked={form.isHosteler} onChange={handleChange} className="rounded" />
              <label htmlFor="hostel" className="label mb-0 cursor-pointer">Is Hostel Student?</label>
            </div>
            {form.isHosteler && (
              <div>
                <label className="label">Hostel Room</label>
                <input className="input" name="hostelRoom" value={form.hostelRoom} onChange={handleChange} />
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary px-8">
            {loading ? 'Saving...' : isEdit ? 'Update Student' : 'Create Student'}
          </button>
        </div>
      </form>
    </div>
  );
}
