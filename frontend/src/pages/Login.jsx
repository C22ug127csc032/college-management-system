import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { getHomePathForRole } from '../utils/authRedirect';

const INVALID_LOGIN_MESSAGE = 'Invalid email or password';

export default function Login() {
  const { login, completeLogin } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ phone: '', password: '', otp: '' });
  const [loading, setLoading] = useState(false);
  const [loginFailed, setLoginFailed] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);

  const handlePasswordLogin = async e => {
    e.preventDefault();
    setLoading(true);
    setLoginFailed(false);
    try {
      const data = await login(form.phone, form.password);

      if (
        data.user.role === 'student' ||
        data.user.role === 'parent' ||
        data.user.role === 'shop_operator'
      ) {
        setLoginFailed(true);
        toast.error(INVALID_LOGIN_MESSAGE);
        return;
      }

      const user = completeLogin(data);
      toast.success(`Welcome, ${user.name}!`);
      navigate(getHomePathForRole(user.role));
    } catch (err) {
      setLoginFailed(err.response?.status === 401);
      toast.error(INVALID_LOGIN_MESSAGE);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!form.phone) {
      toast.error('Enter phone number first');
      return;
    }
    setSendingOTP(true);
    try {
      await api.post('/auth/send-otp', { phone: form.phone });
      setOtpSent(true);
      toast.success('OTP sent to ' + form.phone);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSendingOTP(false);
    }
  };

  const handleOTPLogin = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await api.post('/auth/verify-otp', {
        phone: form.phone,
        otp: form.otp,
      });

      if (
        r.data.user.role === 'student' ||
        r.data.user.role === 'parent' ||
        r.data.user.role === 'shop_operator'
      ) {
        toast.error(INVALID_LOGIN_MESSAGE);
        return;
      }

      const user = completeLogin(r.data);
      toast.success(`Welcome, ${user.name}!`);
      navigate(getHomePathForRole(user.role));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-primary-700 text-3xl font-bold mx-auto mb-4 shadow-xl">
            C
          </div>
          <h1 className="text-3xl font-bold text-white">College Management</h1>
          <p className="text-primary-300 mt-2">Admin Portal Login</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex justify-center mb-6">
            <span className="px-4 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm font-medium border border-primary-200">
              Admin Portal
            </span>
          </div>

          {!showOTP ? (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="label">Email or Phone Number</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Enter your email or phone number"
                  value={form.phone}
                  onChange={e => {
                    setForm({ ...form, phone: e.target.value });
                    setLoginFailed(false);
                  }}
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
                  onChange={e => {
                    setForm({ ...form, password: e.target.value });
                    setLoginFailed(false);
                  }}
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
            <form onSubmit={handleOTPLogin} className="space-y-4">
              <div>
                <label className="label">Phone Number</label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    className="input flex-1"
                    placeholder="Enter phone number"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={sendingOTP || otpSent}
                    className="btn-secondary text-sm px-4 whitespace-nowrap disabled:opacity-50"
                  >
                    {sendingOTP ? 'Sending...' : otpSent ? 'Sent' : 'Send OTP'}
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
                    Valid for 10 minutes.{` `}
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
                className="btn-primary w-full py-3 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowOTP(false);
                  setOtpSent(false);
                }}
                className="w-full text-sm text-gray-500 hover:underline"
              >
                Back to Password Login
              </button>
            </form>
          )}

          {loginFailed && !showOTP && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-start gap-2 mb-2">
                <span className="text-yellow-500">Warning</span>
                <div>
                  <p className="text-sm font-semibold text-yellow-800">
                    Wrong password?
                  </p>
                  <p className="text-xs text-yellow-600 mt-0.5">
                    Use OTP to login instead.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowOTP(true);
                  setLoginFailed(false);
                  setForm(f => ({ ...f, password: '' }));
                }}
                className="w-full py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border border-yellow-300 rounded-lg text-sm font-semibold transition-colors"
              >
                Login with OTP instead
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
