import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm]               = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading]         = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password)
      return toast.error('Please fill in all fields');
    if (form.password !== form.confirmPassword)
      return toast.error('Passwords do not match');
    if (form.password.length < 6)
      return toast.error('Password must be at least 6 characters');

    setLoading(true);
    try {
      // NOTE: No hardcoded URL — axios baseURL is set in AuthContext from REACT_APP_SERVER_URL
      const { data } = await axios.post('/api/auth/register', {
        username: form.username,
        email:    form.email,
        password: form.password
      });
      login(data.user, data.token);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 mb-3 animate-pulse-glow">
            <svg className="w-7 h-7 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-white">ChatApp</h1>
        </div>

        <h2 className="text-xl font-bold text-white mb-6">Create Account</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Username</label>
            <div className="relative">
              <input type="text" className="input-field pl-10" placeholder="cooluser123"
                value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Email</label>
            <div className="relative">
              <input type="email" className="input-field pl-10" placeholder="you@example.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Password</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} className="input-field pl-10 pr-10"
                placeholder="Min 6 characters" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                {showPassword
                  ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                }
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Confirm Password</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} className="input-field pl-10"
                placeholder="Repeat password" value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })} />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>

          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 mt-2" disabled={loading}>
            {loading ? <><div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />Creating...</> : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-slate-500 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
