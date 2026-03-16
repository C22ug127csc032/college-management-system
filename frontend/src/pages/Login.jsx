import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const TABS = ['Password', 'OTP'];

export default function Login() {
  const { login }       = useAuth();
  const navigate        = useNavigate();
  const [tab, setTab]   = useState('Password');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [form, setForm] = useState({ phone: '', password: '', otp: '' });

  // ── Password Login ──────────────────────────────────────────────────────────
  const handlePasswordLogin = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.phone, form.password);
      toast.success(`Welcome, ${user.name}!`);
      if (user.role === 'student')      navigate('/student');
      else if (user.role === 'parent')  navigate('/parent');
      else                              navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  // ── Send OTP ────────────────────────────────────────────────────────────────
  const handleSendOTP = async () => {
    if (!form.phone) { toast.error('Enter phone number'); return; }
    setLoading(true);
    try {
      await api.post('/auth/send-otp', { phone: form.phone });
      setOtpSent(true);
      toast.success('OTP sent to ' + form.phone);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  // ── OTP Login ───────────────────────────────────────────────────────────────
  const handleOTPLogin = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await api.post('/auth/verify-otp', {
        phone: form.phone,
        otp:   form.otp,
      });
      localStorage.setItem('token', r.data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${r.data.token}`;
      toast.success(`Welcome, ${r.data.user.name}!`);
      const role = r.data.user.role;
      if (role === 'student')     navigate('/student');
      else if (role === 'parent') navigate('/parent');
      else                        navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800
      to-primary-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center
            text-primary-700 text-3xl font-bold mx-auto mb-4 shadow-xl">C</div>
          <h1 className="text-3xl font-bold text-white">College Management</h1>
          <p className="text-primary-300 mt-2">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6">
            {TABS.map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setOtpSent(false); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors
                  ${tab === t
                    ? 'bg-white shadow-sm text-primary-700'
                    : 'text-gray-500 hover:text-gray-700'}`}
              >
                {t} Login
              </button>
            ))}
          </div>

          {/* Password Login Form */}
          {tab === 'Password' ? (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="label">Phone Number</label>
                <input
                  type="tel"
                  className="input"
                  placeholder="Enter registered phone"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-base font-semibold"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (

          /* OTP Login Form */
            <form onSubmit={handleOTPLogin} className="space-y-4">
              <div>
                <label className="label">Phone Number</label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    className="input flex-1"
                    placeholder="Enter registered phone"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={loading || otpSent}
                    className="btn-secondary text-sm px-4 whitespace-nowrap"
                  >
                    {otpSent ? 'Sent ✓' : 'Send OTP'}
                  </button>
                </div>
              </div>

              {otpSent && (
                <div>
                  <label className="label">Enter OTP</label>
                  <input
                    type="text"
                    className="input text-center text-2xl tracking-widest"
                    placeholder="------"
                    maxLength={6}
                    value={form.otp}
                    onChange={e => setForm({ ...form, otp: e.target.value })}
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    OTP valid for 10 minutes.{' '}
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      className="text-primary-600 hover:underline"
                    >
                      Resend
                    </button>
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !otpSent}
                className="btn-primary w-full py-3 text-base font-semibold"
              >
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>
            </form>
          )}

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
            <p className="font-semibold mb-1">Demo Credentials</p>
            <p>
              Admin:{' '}
              <code className="bg-blue-100 px-1 rounded">9999999999</code> /{' '}
              <code className="bg-blue-100 px-1 rounded">admin123</code>
            </p>
            <p className="mt-1 text-xs text-blue-500">
              Student default password = their phone number
            </p>
          </div>

          {/* Parent Register Link */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Parent?{' '}
              <a href="/parent/register"
                className="text-primary-600 hover:underline font-medium">
                Register here
              </a>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}