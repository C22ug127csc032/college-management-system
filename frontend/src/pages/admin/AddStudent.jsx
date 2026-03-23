import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { PageHeader } from '../../components/common';
import {
  FiAlertCircle,
  FiAlertTriangle,
  FiArrowLeft, FiAward, FiCamera,
  FiCheckCircle,
  FiClipboard, FiHome, FiUsers,
} from '../../components/common/icons';
import toast from 'react-hot-toast';
import { isValidIndianPhone, sanitizePhoneField } from '../../utils/phone';

const Section = ({ title, children }) => (
  <div className="card mb-4">
    <h3 className="section-title border-b border-gray-100 pb-3 mb-4">
      {title}
    </h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {children}
    </div>
  </div>
);

const Field = ({
  label, name, type = 'text',
  value, onChange, options, required, readOnly,
}) => (
  <div>
    <label className="label">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {options ? (
      <select
        className="input"
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={readOnly}
      >
        <option value="">Select...</option>
        {options.map(o => (
          <option key={o.value || o} value={o.value || o}>
            {o.label || o}
          </option>
        ))}
      </select>
    ) : (
      <input
        className={`input ${readOnly
          ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
          : ''}`}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        readOnly={readOnly}
      />
    )}
  </div>
);

export default function AddStudent() {
  const { id }       = useParams();
  const isEdit       = Boolean(id);
  const navigate     = useNavigate();

  const [courses, setCourses]               = useState([]);
  const [loading, setLoading]               = useState(false);
  const [pageLoading, setPageLoading]       = useState(isEdit);
  const [photo, setPhoto]                   = useState(null);
  const [photoPreview, setPhotoPreview]     = useState(null);
  const [classStrength, setClassStrength]   = useState(null);
  const [checkingStrength, setCheckingStrength] = useState(false);

  const [form, setForm] = useState({
    // -- Personal --
    firstName: '', lastName: '', dob: '',
    gender: '', bloodGroup: '', phone: '', email: '',
    aadharNo: '', religion: '', category: '',
    // -- Address --
    'address.street': '', 'address.city': '',
    'address.state': '', 'address.pincode': '',
    // -- Father --
    'father.name': '', 'father.phone': '', 'father.occupation': '',
    // -- Mother --
    'mother.name': '', 'mother.phone': '', 'mother.occupation': '',
    // -- Guardian --
    'guardian.name': '', 'guardian.relation': '', 'guardian.phone': '',
    // -- Annual income --
    annualIncome: '',
    // -- Academic — fill on admission day --
    course: '', academicYear: '', batch: '',
    semester: '', admissionDate: new Date().toISOString().slice(0, 10),
    admissionType: 'management',
    // -- Academic — fill AFTER enrollment --
    regNo: '', rollNo: '', section: '', className: '',
    // -- Hostel --
    isHosteler: false, hostelRoom: '',
  });

  // Load courses
  useEffect(() => {
    api.get('/courses').then(r => setCourses(r.data.courses));
  }, []);

  // -- Auto fill className from batch + section ------------------------------
  // Uses BATCH YEAR (not semester) — all students in same batch = same class
  useEffect(() => {
    if (form.course && form.batch && form.section) {
      const selectedCourse = courses.find(c => c._id === form.course);
      if (selectedCourse) {
        // Get course code
        const code = selectedCourse.code ||
          selectedCourse.name
            .split(' ')
            .filter(w => w.length > 2)
            .map(w => w[0].toUpperCase())
            .join('');

        // Get joining year from batch — "2024-2027" ? "24"
        const joiningYear = form.batch.split('-')[0]?.slice(-2) || '';

        // Combine ? BCA-24A
        const autoClass = `${code}-${joiningYear}${form.section}`;
        setForm(f => ({ ...f, className: autoClass }));
      }
    } else if (!form.section) {
      setForm(f => ({ ...f, className: '' }));
    }
  }, [form.course, form.batch, form.section, courses]);

  // -- Check class strength when className changes ---------------------------
  useEffect(() => {
    if (!form.className || !form.course) {
      setClassStrength(null);
      return;
    }

    // Only check in edit mode when enrollment section is visible
    if (!isEdit) {
      setClassStrength(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingStrength(true);
      try {
        const r = await api.get(
          `/students/class-strength/${form.className}`,
          { params: { courseId: form.course } }
        );
        setClassStrength(r.data);
      } catch {
        setClassStrength(null);
      } finally {
        setCheckingStrength(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [form.className, form.course, isEdit]);

  // Load student data for edit
  useEffect(() => {
    if (!isEdit) return;
    api.get(`/students/${id}`)
      .then(r => {
        const s = r.data.student;
        setForm(f => ({
          ...f,
          firstName:    s.firstName    || '',
          lastName:     s.lastName     || '',
          dob:          s.dob
            ? new Date(s.dob).toISOString().slice(0, 10) : '',
          gender:       s.gender       || '',
          bloodGroup:   s.bloodGroup   || '',
          phone:        s.phone        || '',
          email:        s.email        || '',
          aadharNo:     s.aadharNo     || '',
          religion:     s.religion     || '',
          category:     s.category     || '',
          'address.street':    s.address?.street    || '',
          'address.city':      s.address?.city      || '',
          'address.state':     s.address?.state     || '',
          'address.pincode':   s.address?.pincode   || '',
          'father.name':       s.father?.name       || '',
          'father.phone':      s.father?.phone      || '',
          'father.occupation': s.father?.occupation || '',
          'mother.name':       s.mother?.name       || '',
          'mother.phone':      s.mother?.phone      || '',
          'mother.occupation': s.mother?.occupation || '',
          'guardian.name':     s.guardian?.name     || '',
          'guardian.relation': s.guardian?.relation || '',
          'guardian.phone':    s.guardian?.phone    || '',
          annualIncome:   s.annualIncome   || '',
          course:         s.course?._id    || s.course || '',
          academicYear:   s.academicYear   || '',
          batch:          s.batch          || '',
          semester:       s.semester       || '',
          admissionDate:  s.admissionDate
            ? new Date(s.admissionDate).toISOString().slice(0, 10) : '',
          admissionType:  s.admissionType  || 'management',
          regNo:          s.regNo          || '',
          rollNo:         s.rollNo         || '',
          section:        s.section        || '',
          className:      s.className      || '',
          isHosteler:     Boolean(s.isHosteler),
          hostelRoom:     s.hostelRoom     || '',
        }));
        if (s.photo) setPhotoPreview(s.photo);
      })
      .catch(() => {
        toast.error('Failed to load student');
        navigate('/admin/students');
      })
      .finally(() => setPageLoading(false));
  }, [id, isEdit, navigate]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({
      ...f,
      [name]: type === 'checkbox'
        ? checked
        : name.toLowerCase().includes('phone')
          ? sanitizePhoneField(value)
          : value,
    }));
  };

  const handlePhotoChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async e => {
    e.preventDefault();

    const phoneFields = [
      ['Student phone number', form.phone],
      ['Father phone number', form['father.phone']],
      ['Mother phone number', form['mother.phone']],
      ['Guardian phone number', form['guardian.phone']],
    ];

    for (const [label, value] of phoneFields) {
      if (value && !isValidIndianPhone(value)) {
        toast.error(`${label} must be a valid 10-digit Indian mobile number`);
        return;
      }
    }

    setLoading(true);
    try {
      const fd     = new FormData();
      const nested = {};

      Object.entries(form).forEach(([k, v]) => {
        if (k.includes('.')) {
          const [a, b] = k.split('.');
          if (!nested[a]) nested[a] = {};
          nested[a][b] = v;
        } else {
          nested[k] = v;
        }
      });

      Object.entries(nested).forEach(([k, v]) => {
        if (typeof v === 'object' && v !== null && !(v instanceof File)) {
          fd.append(k, JSON.stringify(v));
        } else {
          fd.append(k, v);
        }
      });

      if (photo) fd.append('photo', photo);

      if (isEdit) {
        await api.put(`/students/${id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Student updated successfully!');
        navigate(`/admin/students/${id}`);
      } else {
        await api.post('/students', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Student added successfully!');
        navigate('/admin/students');
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        `Failed to ${isEdit ? 'update' : 'add'} student`
      );
    } finally {
      setLoading(false);
    }
  };

  const genders     = ['Male', 'Female', 'Other'];
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  const courseOpts  = courses.map(c => ({ value: c._id, label: c.name }));
  const enrollmentDone = isEdit && form.regNo && !form.regNo.startsWith('TEMP');

  if (pageLoading) {
    return (
      <div className="card text-center py-10 text-gray-400">Loading...</div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Student' : 'Add Student'}
        subtitle={
          isEdit
            ? 'Update student profile'
            : 'Fill admission details. Register No is added after university enrollment.'
        }
        action={
          <button onClick={() => navigate(-1)}
            className="btn-secondary flex items-center gap-2">
            <FiArrowLeft /> Back
          </button>
        }
      />

      <form onSubmit={handleSubmit}>

        {/* -- Admission Day Divider -- */}
        {!isEdit && (
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs font-bold text-gray-400 uppercase
              tracking-widest whitespace-nowrap">
              Fill on Admission Day
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
        )}

        {/* -- Personal Details -- */}
        <Section title={
          <span className="flex items-center gap-2">
            <FiClipboard /> Personal Details
          </span>
        }>
          <Field label="First Name"    name="firstName"  value={form.firstName}  onChange={handleChange} required />
          <Field label="Last Name"     name="lastName"   value={form.lastName}   onChange={handleChange} required />
          <Field label="Date of Birth" name="dob" type="date" value={form.dob}  onChange={handleChange} />
          <Field label="Gender"        name="gender"     value={form.gender}     onChange={handleChange} options={genders} />
          <Field label="Blood Group"   name="bloodGroup" value={form.bloodGroup} onChange={handleChange} options={bloodGroups} />
          <Field label="Phone"         name="phone"      value={form.phone}      onChange={handleChange} required />
          <Field label="Email"         name="email" type="email" value={form.email} onChange={handleChange} />
          <Field label="Aadhar No"     name="aadharNo"   value={form.aadharNo}   onChange={handleChange} />
          <Field label="Religion"      name="religion"   value={form.religion}   onChange={handleChange} />
          <Field label="Category"      name="category"   value={form.category}   onChange={handleChange}
            options={['General', 'OBC', 'SC', 'ST', 'EWS']} />
        </Section>

        {/* -- Address -- */}
        <Section title={
          <span className="flex items-center gap-2">
            <FiHome /> Address
          </span>
        }>
          <Field label="Street"  name="address.street"  value={form['address.street']}  onChange={handleChange} />
          <Field label="City"    name="address.city"    value={form['address.city']}    onChange={handleChange} />
          <Field label="State"   name="address.state"   value={form['address.state']}   onChange={handleChange} />
          <Field label="Pincode" name="address.pincode" value={form['address.pincode']} onChange={handleChange} />
        </Section>

        {/* -- Parent Details -- */}
        <div className="card mb-4">
          <h3 className="section-title border-b border-gray-100 pb-3 mb-4
            flex items-center gap-2">
            <FiUsers /> Parent / Guardian Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase
                tracking-wider pb-1 border-b border-gray-100">Father</p>
              <Field label="Father Name"       name="father.name"
                value={form['father.name']}       onChange={handleChange} />
              <Field label="Father Phone"      name="father.phone"
                value={form['father.phone']}      onChange={handleChange} required />
              <Field label="Father Occupation" name="father.occupation"
                value={form['father.occupation']} onChange={handleChange} />
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase
                tracking-wider pb-1 border-b border-gray-100">Mother</p>
              <Field label="Mother Name"       name="mother.name"
                value={form['mother.name']}       onChange={handleChange} />
              <Field label="Mother Phone"      name="mother.phone"
                value={form['mother.phone']}      onChange={handleChange} />
              <Field label="Mother Occupation" name="mother.occupation"
                value={form['mother.occupation']} onChange={handleChange} />
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase
                tracking-wider pb-1 border-b border-gray-100">Guardian</p>
              <Field label="Guardian Name"  name="guardian.name"
                value={form['guardian.name']}     onChange={handleChange} />
              <Field label="Relation"       name="guardian.relation"
                value={form['guardian.relation']} onChange={handleChange} />
              <Field label="Guardian Phone" name="guardian.phone"
                value={form['guardian.phone']}    onChange={handleChange} />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="w-full sm:w-64">
              <label className="label">Annual Family Income</label>
              <select className="input" name="annualIncome"
                value={form.annualIncome} onChange={handleChange}>
                <option value="">Select range</option>
                <option value="below_1L">Below 1 Lakh</option>
                <option value="1L_3L">1 - 3 Lakhs</option>
                <option value="3L_6L">3 - 6 Lakhs</option>
                <option value="6L_10L">6 - 10 Lakhs</option>
                <option value="above_10L">Above 10 Lakhs</option>
              </select>
            </div>
          </div>
        </div>

        {/* -- Academic Details -- */}
        <div className="card mb-4">
          <h3 className="section-title border-b border-gray-100 pb-3 mb-4
            flex items-center gap-2">
            <FiAward /> Academic Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Course"         name="course"       value={form.course}       onChange={handleChange} options={courseOpts} required />
            <Field label="Academic Year"  name="academicYear" value={form.academicYear} onChange={handleChange} required />
            <Field label="Batch"          name="batch"        value={form.batch}        onChange={handleChange} required />
            <Field label="Semester"       name="semester"     value={form.semester}     onChange={handleChange} required
              options={[1,2,3,4,5,6,7,8].map(s => ({
                value: s, label: `Semester ${s}`,
              }))} />
            <Field label="Admission Date" name="admissionDate" type="date"
              value={form.admissionDate} onChange={handleChange} required />
            <Field label="Admission Type" name="admissionType"
              value={form.admissionType} onChange={handleChange}
              options={[
                { value: 'management', label: 'Management Quota' },
                { value: 'government', label: 'Government Quota' },
                { value: 'nri',        label: 'NRI Quota'        },
                { value: 'lateral',    label: 'Lateral Entry'    },
              ]} />
          </div>
        </div>

        {/* -- Photo & Hostel -- */}
        <div className="card mb-4">
          <h3 className="section-title border-b border-gray-100 pb-3 mb-4
            flex items-center gap-2">
            <FiCamera /> Photo & Hostel
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Student Photo</label>
              <input type="file" accept="image/*"
                onChange={handlePhotoChange} className="input" />
              {photoPreview && (
                <img src={photoPreview} alt="Preview"
                  className="mt-2 w-16 h-16 rounded-xl object-cover
                    border border-gray-100" />
              )}
            </div>
            <div>
              <label className="label">Hostel</label>
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" id="hostel" name="isHosteler"
                  checked={form.isHosteler} onChange={handleChange}
                  className="rounded w-4 h-4 cursor-pointer" />
                <label htmlFor="hostel"
                  className="text-sm text-gray-700 cursor-pointer">
                  Is Hostel Student?
                </label>
              </div>
              {form.isHosteler && (
                <div className="mt-3">
                  <label className="label">Hostel Room</label>
                  <input className="input" name="hostelRoom"
                    placeholder="e.g. A-101"
                    value={form.hostelRoom} onChange={handleChange} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --------------------------------------------------------------
            SECTION 2 — FILL AFTER UNIVERSITY ENROLLMENT (Edit only)
        -------------------------------------------------------------- */}
        {isEdit && (
          <>
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs font-bold text-gray-400 uppercase
                tracking-widest whitespace-nowrap">
                Fill After University Enrollment
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div className="card mb-4 border-2 border-dashed border-gray-200">

              {/* Card Header */}
              <div className="flex items-start gap-3 mb-4 pb-4
                border-b border-gray-100">
                <FiAward className="text-xl text-primary-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    University Enrollment Details
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Fill Register Number after university enrollment.
                    Roll No, Section and Class are assigned automatically
                    when admin generates roll numbers.
                  </p>
                </div>
                {enrollmentDone && (
                  <span className="ml-auto inline-flex items-center gap-1
                    px-2.5 py-1 bg-green-50 text-green-700 text-xs
                    font-semibold rounded-full border border-green-200
                    shrink-0">
                    <FiCheckCircle className="shrink-0" />
                    Enrollment Complete
                  </span>
                )}
              </div>

              {/* Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Register No */}
                <div>
                  <label className="label">
                    Register No
                    {!enrollmentDone && (
                      <span className="ml-2 text-xs text-orange-500 font-normal">
                        (not assigned yet)
                      </span>
                    )}
                  </label>
                  <input
                    className={`input font-mono ${enrollmentDone
                      ? 'bg-green-50 text-green-800 border-green-200' : ''}`}
                    name="regNo"
                    placeholder="e.g. REG0000000001"
                    value={form.regNo}
                    onChange={handleChange}
                  />
                </div>
              </div>

            </div>
          </>
        )}

        {/* -- Submit Buttons -- */}
        <div className="flex gap-3 justify-end mb-6">
          <button type="button" onClick={() => navigate(-1)}
            className="btn-secondary">
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary px-8"
          >
            {loading
              ? 'Saving...'
              : isEdit ? 'Update Student' : 'Create Student'}
          </button>
        </div>

      </form>
    </div>
  );
}
