import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { isValidIndianPhone, normalizeIdentifierInput, sanitizePhoneField } from '../utils/phone';
import PortalCopyright from '../components/common/PortalCopyright';
import {
  FiAward,
  FiBookOpen,
  FiCheckCircle,
  FiClipboard,
  FiCreditCard,
  FiLock,
  FiPhone,
  FiShield,
  FiUser,
} from '../components/common/icons';

const INVALID_LOGIN_MESSAGE = 'Invalid email, phone number, or password';

const InputIcon = ({ icon: Icon }) => (
  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-text-secondary">
    <Icon className="text-base" />
  </span>
);

const FeaturePill = ({ icon: Icon, label }) => (
  <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-white/90 backdrop-blur-md">
    <Icon className="text-sm text-white" />
    <span>{label}</span>
  </div>
);

function StudentLoginShowcase() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-dark to-sidebar px-6 py-8 sm:px-8 lg:min-h-[680px] lg:px-10 lg:py-10">
      <div className="absolute -left-16 top-24 h-44 w-44 rounded-full bg-white/10 blur-sm" />
      <div className="absolute right-10 top-10 h-36 w-36 rounded-[2rem] border border-white/10 bg-white/10 backdrop-blur-sm" />
      <div className="absolute bottom-6 left-10 h-28 w-28 rounded-full bg-white/10" />
      <div className="absolute -right-10 bottom-8 h-40 w-40 rounded-full bg-white/10" />

      <div className="relative z-10 flex h-full flex-col">
        <div className="max-w-md">
          <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/85 backdrop-blur-md">
            Campus Access
          </span>
          <h2 className="mt-8 text-4xl font-bold leading-none text-white sm:text-5xl lg:text-[3.7rem]">
            <span className="block">Welcome to</span>
            <span className="block font-medium text-white/90">student portal</span>
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-7 text-white/80 sm:text-base">
            Login to access your fees, ledger, wallet, leave requests, outpass status, and academic notices in one place.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <FeaturePill icon={FiBookOpen} label="Academics" />
          <FeaturePill icon={FiCreditCard} label="Fees" />
          <FeaturePill icon={FiClipboard} label="Services" />
        </div>

        <div className="relative z-10 mt-8 flex-1">
          <div className="mx-auto flex h-full max-w-2xl items-end justify-center lg:justify-end">
            <div className="relative w-full max-w-xl">
              <div className="absolute -left-3 top-8 hidden rounded-2xl border border-white/20 bg-white/12 p-4 text-white shadow-lg backdrop-blur-md sm:block">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-primary-600 shadow-sm">
                    <FiAward className="text-xl" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Academic Progress</p>
                    <p className="text-xs text-white/75">Track student milestones</p>
                  </div>
                </div>
              </div>

              <div className="absolute right-3 top-0 hidden rounded-2xl border border-white/20 bg-white/12 p-4 text-white shadow-lg backdrop-blur-md sm:block">
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="text-base text-white" />
                  <div>
                    <p className="text-sm font-semibold">Daily Updates</p>
                    <p className="text-xs text-white/75">Secure access</p>
                  </div>
                </div>
              </div>

              <div className="relative rounded-[2rem] border border-white/20 bg-white/12 p-4 shadow-[0_30px_80px_-35px_rgba(15,23,42,0.65)] backdrop-blur-xl sm:p-6">
                <div className="grid gap-4 rounded-[1.75rem] bg-white p-5 text-text-primary shadow-lg sm:grid-cols-[1.15fr_0.85fr] sm:p-6">
                  <div className="rounded-[1.5rem] bg-slate-50 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                        <FiBookOpen className="text-xl" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">Student Services</p>
                        <p className="text-xs text-text-secondary">Everything in one dashboard</p>
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      <div className="rounded-2xl bg-white p-3 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-primary-50" />
                          <div className="flex-1">
                            <div className="h-2.5 w-24 rounded-full bg-slate-200" />
                            <div className="mt-2 h-2.5 w-16 rounded-full bg-slate-100" />
                          </div>
                        </div>
                      </div>
                      <div className="rounded-2xl bg-white p-3 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-primary-100" />
                          <div className="flex-1">
                            <div className="h-2.5 w-28 rounded-full bg-slate-200" />
                            <div className="mt-2 h-2.5 w-20 rounded-full bg-slate-100" />
                          </div>
                        </div>
                      </div>
                      <div className="rounded-2xl bg-white p-3 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-blue-100" />
                          <div className="flex-1">
                            <div className="h-2.5 w-24 rounded-full bg-slate-200" />
                            <div className="mt-2 h-2.5 w-14 rounded-full bg-slate-100" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="rounded-[1.5rem] bg-primary-50 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-primary-600 shadow-sm">
                          <FiCreditCard className="text-lg" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-text-primary">Fee Status</p>
                          <p className="text-xs text-text-secondary">Quick glance</p>
                        </div>
                      </div>
                      <div className="mt-4 h-2.5 rounded-full bg-white/80" />
                      <div className="mt-2 h-2.5 w-4/5 rounded-full bg-white/60" />
                    </div>

                    <div className="rounded-[1.5rem] bg-slate-900 px-4 py-5 text-white">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/60">
                        Secure Login
                      </p>
                      <p className="mt-3 text-lg font-semibold">Academic access</p>
                      <p className="mt-2 text-xs leading-5 text-white/70">
                        Use password or OTP based sign-in for fast access to your portal.
                      </p>
                    </div>

                    <div className="rounded-[1.5rem] bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
                          <FiClipboard className="text-lg" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-text-primary">Tasks & Notices</p>
                          <p className="text-xs text-text-secondary">Stay updated daily</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-5 right-10 hidden rounded-2xl border border-white/20 bg-white/12 px-4 py-3 text-white shadow-lg backdrop-blur-md sm:block">
                <p className="text-xs uppercase tracking-[0.18em] text-white/70">Student Portal</p>
                <p className="mt-1 text-sm font-semibold">Branded for your campus</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function StudentLogin() {
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
      const identifier = normalizeIdentifierInput(form.phone);
      const data = await login(identifier, form.password);

      if (data.user.role !== 'student') {
        setLoginFailed(true);
        toast.error(INVALID_LOGIN_MESSAGE);
        return;
      }

      const user = completeLogin(data);
      toast.success(`Welcome, ${user.name}!`);

      if (user.isFirstLogin) {
        navigate('/student/set-password');
        return;
      }

      navigate('/student');
    } catch (err) {
      setLoginFailed(err.response?.status === 401);
      toast.error(INVALID_LOGIN_MESSAGE);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    const phone = sanitizePhoneField(form.phone);
    if (!phone) {
      toast.error('Enter a phone number first');
      return;
    }
    if (!isValidIndianPhone(phone)) {
      toast.error('Enter a valid 10-digit Indian mobile number');
      return;
    }
    setSendingOTP(true);
    try {
      await api.post('/auth/send-otp', { phone });
      setForm(prev => ({ ...prev, phone }));
      setOtpSent(true);
      toast.success(`OTP sent to ${phone}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSendingOTP(false);
    }
  };

  const handleOTPLogin = async e => {
    e.preventDefault();
    const phone = sanitizePhoneField(form.phone);
    if (!isValidIndianPhone(phone)) {
      toast.error('Enter a valid 10-digit Indian mobile number');
      return;
    }
    setLoading(true);
    try {
      const r = await api.post('/auth/verify-otp', {
        phone,
        otp: form.otp,
      });

      if (r.data.user.role !== 'student') {
        toast.error(INVALID_LOGIN_MESSAGE);
        return;
      }

      const user = completeLogin(r.data);
      toast.success(`Welcome, ${user.name}!`);

      if (user.isFirstLogin) {
        navigate('/student/set-password');
        return;
      }

      navigate('/student');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1120] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#0f172a] shadow-[0_28px_90px_-30px_rgba(2,6,23,0.9)]">
          <div className="grid lg:grid-cols-[0.84fr_1.16fr]">
            <section className="flex flex-col justify-between bg-slate-950/80 px-6 py-8 sm:px-8 lg:min-h-[680px] lg:px-10 lg:py-10">
              <div>
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-200">
                  Student Login
                </span>
                <h1 className="mt-12 text-4xl font-bold tracking-tight text-white">Login</h1>
                <p className="mt-3 max-w-xs text-sm leading-6 text-slate-400">
                  Enter your account details to access your student dashboard.
                </p>

                <div className="mt-10">
                  {!showOTP ? (
                    <form onSubmit={handlePasswordLogin} className="space-y-5">
                      <div>
                        <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                          Email or Phone
                        </label>
                        <div className="relative border-b border-white/15 pb-1">
                          <InputIcon icon={FiUser} />
                          <input
                            type="text"
                            name="identifier"
                            autoComplete="username"
                            className="w-full bg-transparent py-3 pl-11 pr-3 text-sm text-white outline-none placeholder:text-slate-500"
                            placeholder="Enter your email or phone number"
                            value={form.phone}
                            onChange={e => {
                              setForm(prev => ({ ...prev, phone: e.target.value }));
                              setLoginFailed(false);
                            }}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                          Password
                        </label>
                        <div className="relative border-b border-white/15 pb-1">
                          <InputIcon icon={FiLock} />
                          <input
                            type="password"
                            name="password"
                            autoComplete="current-password"
                            className="w-full bg-transparent py-3 pl-11 pr-3 text-sm text-white outline-none placeholder:text-slate-500"
                            placeholder="Enter password"
                            value={form.password}
                            onChange={e => {
                              setForm(prev => ({ ...prev, password: e.target.value }));
                              setLoginFailed(false);
                            }}
                            required
                          />
                        </div>
                      </div>

                      <p className="text-xs text-slate-500">
                        First-time login password is your Admission No.
                      </p>

                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex w-full items-center justify-center rounded-xl bg-primary-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-950/30 transition duration-200 hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loading ? 'Signing in...' : 'Login'}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleOTPLogin} className="space-y-5">
                      <div>
                        <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                          Phone Number
                        </label>
                        <div className="flex gap-3">
                          <div className="relative flex-1 border-b border-white/15 pb-1">
                            <InputIcon icon={FiPhone} />
                            <input
                              type="tel"
                              className="w-full bg-transparent py-3 pl-11 pr-3 text-sm text-white outline-none placeholder:text-slate-500"
                              placeholder="Enter your phone number"
                              value={form.phone}
                              onChange={e => setForm({ ...form, phone: sanitizePhoneField(e.target.value) })}
                              inputMode="numeric"
                              maxLength={10}
                              required
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleSendOTP}
                            disabled={sendingOTP || otpSent}
                            className="rounded-xl border border-primary-400/40 bg-primary-500/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-primary-100 transition hover:bg-primary-500/20 disabled:opacity-50"
                          >
                            {sendingOTP ? 'Sending...' : otpSent ? 'Sent' : 'Send OTP'}
                          </button>
                        </div>
                      </div>

                      {otpSent && (
                        <div>
                          <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                            Enter OTP
                          </label>
                          <div className="relative border-b border-white/15 pb-1">
                            <InputIcon icon={FiShield} />
                            <input
                              type="text"
                              className="w-full bg-transparent py-3 pl-11 pr-3 text-center text-xl font-semibold tracking-[0.5em] text-white outline-none placeholder:text-slate-500"
                              placeholder="------"
                              maxLength={6}
                              value={form.otp}
                              onChange={e => setForm({ ...form, otp: e.target.value })}
                              required
                            />
                          </div>
                          <p className="mt-2 text-xs text-slate-500">
                            Valid for 10 minutes.{` `}
                            <button
                              type="button"
                              onClick={handleSendOTP}
                              className="text-primary-200 hover:underline"
                            >
                              Resend
                            </button>
                          </p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={loading || !otpSent}
                        className="inline-flex w-full items-center justify-center rounded-xl bg-primary-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-950/30 transition duration-200 hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loading ? 'Verifying...' : 'Verify & Login'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowOTP(false);
                          setOtpSent(false);
                        }}
                        className="w-full text-sm text-slate-400 transition hover:text-white"
                      >
                        Back to Password Login
                      </button>
                    </form>
                  )}

                  {loginFailed && !showOTP && (
                    <div className="mt-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
                      <div className="flex items-start gap-2">
                        <span className="text-yellow-300">Warning</span>
                        <div>
                          <p className="text-sm font-semibold text-yellow-100">
                            Wrong password?
                          </p>
                          <p className="mt-1 text-xs leading-5 text-yellow-200/80">
                            Default password is your Admission No. After first login, set your own password. Forgot it? Use OTP to login.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setShowOTP(true);
                          setLoginFailed(false);
                          setForm(f => ({ ...f, password: '' }));
                        }}
                        className="mt-4 w-full rounded-xl border border-yellow-400/30 bg-yellow-400/10 py-2.5 text-sm font-semibold text-yellow-100 transition hover:bg-yellow-400/20"
                      >
                        Login with OTP instead
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-10 space-y-4 border-t border-white/10 pt-6">
                <p className="text-xs leading-6 text-slate-500">
                  Use your registered student credentials only. OTP login is available if your password does not work.
                </p>
                <PortalCopyright variant="full" className="text-left text-white/60" />
              </div>
            </section>

            <StudentLoginShowcase />
          </div>
        </div>
      </div>
    </div>
  );
}
