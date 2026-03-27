import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getHomePathForRole, OPERATOR_ROLES } from '../utils/authRedirect';
import { normalizeIdentifierInput } from '../utils/phone';
import PortalCopyright from '../components/common/PortalCopyright';

const INVALID_LOGIN_MESSAGE = 'Use a shop or canteen operator account for this portal.';

export default function OperatorLogin() {
  const { login, completeLogin } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ phone: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await login(normalizeIdentifierInput(form.phone), form.password);

      if (!OPERATOR_ROLES.includes(data.user.role)) {
        toast.error(INVALID_LOGIN_MESSAGE);
        return;
      }

      const user = completeLogin(data);
      toast.success(`Welcome, ${user.name}!`);
      navigate(getHomePathForRole(user.role));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid login credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 via-orange-50 to-white px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
        <div className="w-full">
          <div className="rounded-3xl border border-amber-200 bg-white p-8 shadow-xl shadow-amber-100/70">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
                Operator Login
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">Sign in</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email or Phone Number</label>
                <input
                  type="text"
                  name="identifier"
                  autoComplete="username"
                  className="input"
                  placeholder="Enter your email or phone number"
                  value={form.phone}
                  onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  className="input"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-amber-500 px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
          <PortalCopyright className="mt-6 px-4 text-slate-700" />
        </div>
      </div>
    </div>
  );
}
