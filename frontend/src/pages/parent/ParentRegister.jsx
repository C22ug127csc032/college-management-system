import React, { useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const STEPS = ['Find Student', 'Verify OTP', 'Create Account'];

export default function ParentRegister() {
  const [step, setStep]               = useState(1);
  const [loading, setLoading]         = useState(false);
  const [admissionNo, setAdmissionNo] = useState('');
  const [otp, setOtp]                 = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId]     = useState('');
  const [course, setCourse]           = useState('');
  const [form, setForm]               = useState({
    name:     '',
    phone:    '',
    email:    '',
    password: '',
    confirmPassword: '',
    relation: 'father',
  });

  // ── STEP 1 — Send OTP ─────────────────────────────────────────────────────
  const handleSendOTP = async e => {
    e.preventDefault();
    if (!admissionNo.trim()) {
      toast.error('Enter Admission No');
      return;
    }
    setLoading(true);
    try {
      const r = await api.post('/parent/request-register-otp', {
        admissionNo: admissionNo.trim().toUpperCase(),
      });
      setMaskedPhone(r.data.maskedPhone);
      setStudentName(r.data.studentName);
      setCourse(r.data.course || '');
      toast.success(`OTP sent to ${r.data.maskedPhone}`);
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 2 — Verify OTP ───────────────────────────────────────────────────
  const handleVerifyOTP = async e => {
    e.preventDefault();
    if (!otp.trim()) {
      toast.error('Enter OTP');
      return;
    }
    setLoading(true);
    try {
      const r = await api.post('/parent/verify-register-otp', {
        admissionNo: admissionNo.trim().toUpperCase(),
        otp:         otp.trim(),
      });
      setStudentId(r.data.studentId);
      // Pre-fill name from student record
      const prefillName =
        r.data.fatherName || r.data.motherName || '';
      setForm(f => ({ ...f, name: prefillName }));
      toast.success('OTP verified! Complete your registration.');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 3 — Register ─────────────────────────────────────────────────────
  const handleRegister = async e => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const r = await api.post('/parent/register', {
        name:        form.name,
        phone:       form.phone,
        email:       form.email || undefined,
        password:    form.password,
        admissionNo: admissionNo.trim().toUpperCase(),
        relation:    form.relation,
      });
      localStorage.setItem('token', r.data.token);
      api.defaults.headers.common['Authorization'] =
        `Bearer ${r.data.token}`;
      toast.success('Registered successfully!');
      window.location.href = '/parent';
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────────────────────
  const handleResendOTP = async () => {
    setLoading(true);
    try {
      const r = await api.post('/parent/request-register-otp', {
        admissionNo: admissionNo.trim().toUpperCase(),
      });
      toast.success(`OTP resent to ${r.data.maskedPhone}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 to-green-700
      flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center
            justify-center text-green-700 text-2xl font-bold mx-auto mb-3
            shadow-xl">
            👨‍👩
          </div>
          <h1 className="text-2xl font-bold text-white">Parent Registration</h1>
          <p className="text-green-300 text-sm mt-1">
            Secure registration with OTP verification
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-6">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              {/* Step circle */}
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center
                  justify-center text-sm font-bold transition-all ${
                  step > i + 1
                    ? 'bg-green-400 text-white'
                    : step === i + 1
                      ? 'bg-white text-green-700 ring-2 ring-green-300'
                      : 'bg-green-800 text-green-400'
                }`}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span className={`text-xs hidden sm:block ${
                  step === i + 1 ? 'text-white font-medium' : 'text-green-400'
                }`}>
                  {s}
                </span>
              </div>
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-12 mx-1 mb-4 transition-all ${
                  step > i + 1 ? 'bg-green-400' : 'bg-green-800'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6">

          {/* ── STEP 1 — Find Student ── */}
          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-2xl mb-2">🔍</p>
                <h2 className="font-bold text-gray-800">Find Your Child</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Enter your child's Admission Number.
                  OTP will be sent to the parent phone saved in college records.
                </p>
              </div>

              {/* Security note */}
              <div className="flex items-start gap-2 p-3 bg-blue-50
                border border-blue-200 rounded-xl">
                <span className="text-blue-500 shrink-0 mt-0.5">🔒</span>
                <p className="text-xs text-blue-700">
                  OTP is sent only to the phone number the admin has saved
                  for your child. This prevents unauthorized access.
                </p>
              </div>

              <div>
                <label className="label">
                  Admission Number <span className="text-red-500">*</span>
                </label>
                <input
                  className="input font-mono text-center text-lg
                    tracking-wider uppercase"
                  placeholder="e.g. ADM2024001"
                  value={admissionNo}
                  onChange={e => setAdmissionNo(e.target.value.toUpperCase())}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-green-600 hover:bg-green-700
                  text-white font-semibold rounded-lg transition-colors
                  disabled:opacity-50"
              >
                {loading ? 'Sending OTP...' : 'Send OTP →'}
              </button>

              <p className="text-center text-sm text-gray-500">
                Already registered?{' '}
                <a href="/parent/login"
                  className="text-green-600 hover:underline font-medium">
                  Login here
                </a>
              </p>
            </form>
          )}

          {/* ── STEP 2 — Verify OTP ── */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-2xl mb-2">📱</p>
                <h2 className="font-bold text-gray-800">Verify OTP</h2>
                <p className="text-sm text-gray-500 mt-1">
                  OTP sent to <strong>{maskedPhone}</strong>
                </p>
              </div>

              {/* Student found card */}
              <div className="p-3 bg-green-50 border border-green-200
                rounded-xl">
                <p className="text-xs text-green-600 font-medium mb-0.5">
                  Student Found ✓
                </p>
                <p className="text-sm font-bold text-green-800">
                  {studentName}
                </p>
                {course && (
                  <p className="text-xs text-green-600 mt-0.5">{course}</p>
                )}
                <p className="text-xs text-green-500 mt-0.5 font-mono">
                  {admissionNo}
                </p>
              </div>

              <div>
                <label className="label">
                  Enter 6-digit OTP <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="input text-center text-3xl tracking-widest
                    font-bold"
                  placeholder="------"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                />
                <p className="text-xs text-gray-400 mt-1 text-center">
                  OTP valid for 10 minutes.{' '}
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={loading}
                    className="text-green-600 hover:underline font-medium"
                  >
                    Resend OTP
                  </button>
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-3 bg-green-600 hover:bg-green-700
                  text-white font-semibold rounded-lg transition-colors
                  disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify OTP →'}
              </button>

              <button
                type="button"
                onClick={() => { setStep(1); setOtp(''); }}
                className="w-full text-sm text-gray-500 hover:underline"
              >
                ← Back
              </button>
            </form>
          )}

          {/* ── STEP 3 — Create Account ── */}
          {step === 3 && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-2xl mb-2">✅</p>
                <h2 className="font-bold text-gray-800">Create Your Account</h2>
                <p className="text-sm text-gray-500 mt-1">
                  OTP verified! Complete registration for{' '}
                  <strong>{studentName}</strong>
                </p>
              </div>

              <div>
                <label className="label">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  className="input"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="label">
                  Your Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  className="input"
                  placeholder="Your phone — used to login"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="label">Email (optional)</label>
                <input
                  type="email"
                  className="input"
                  placeholder="Your email address"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>

              <div>
                <label className="label">Relation</label>
                <select
                  className="input"
                  value={form.relation}
                  onChange={e => setForm(f => ({
                    ...f, relation: e.target.value,
                  }))}
                >
                  <option value="father">Father</option>
                  <option value="mother">Mother</option>
                  <option value="guardian">Guardian</option>
                </select>
              </div>

              <div>
                <label className="label">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  className="input"
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={e => setForm(f => ({
                    ...f, password: e.target.value,
                  }))}
                  required
                />
              </div>

              <div>
                <label className="label">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  className="input"
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={e => setForm(f => ({
                    ...f, confirmPassword: e.target.value,
                  }))}
                  required
                />
                {/* Password match indicator */}
                {form.confirmPassword && (
                  <p className={`text-xs mt-1 ${
                    form.password === form.confirmPassword
                      ? 'text-green-500'
                      : 'text-red-500'
                  }`}>
                    {form.password === form.confirmPassword
                      ? '✓ Passwords match'
                      : '✗ Passwords do not match'}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={
                  loading ||
                  form.password !== form.confirmPassword ||
                  form.password.length < 6
                }
                className="w-full py-3 bg-green-600 hover:bg-green-700
                  text-white font-semibold rounded-lg transition-colors
                  disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Create Account ✓'}
              </button>
            </form>
          )}

        </div>

        {/* Security footer */}
        <p className="text-center text-xs text-green-400 mt-4">
          🔒 Secured with OTP — only verified parents can register
        </p>

      </div>
    </div>
  );
}