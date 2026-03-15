import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const STEPS = { EMAIL: 'email', OTP: 'otp', RESET: 'reset', DONE: 'done' };

export default function ForgotPassword() {
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email');
    setLoading(true);
    try {
      await axios.post('/api/auth/forgot-password', { email });
      toast.success('OTP sent to your email!');
      setStep(STEPS.OTP);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const handleOTPChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus();
  };

  const handleOTPKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0)
      document.getElementById(`otp-${index - 1}`)?.focus();
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const otpStr = otp.join('');
    if (otpStr.length !== 6) return toast.error('Please enter the complete 6-digit OTP');
    setLoading(true);
    try {
      await axios.post('/api/auth/verify-otp', { email, otp: otpStr });
      toast.success('OTP verified!');
      setStep(STEPS.RESET);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP');
    } finally { setLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await axios.post('/api/auth/reset-password', { email, otp: otp.join(''), newPassword });
      toast.success('Password reset successfully!');
      setStep(STEPS.DONE);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally { setLoading(false); }
  };

  const stepIndex = [STEPS.EMAIL, STEPS.OTP, STEPS.RESET, STEPS.DONE].indexOf(step);

  return (
    <div className="auth-container">
      <div className="auth-card animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 mb-3 animate-pulse-glow">
            {step === STEPS.DONE
              ? <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              : <svg className="w-7 h-7 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
            }
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {step === STEPS.EMAIL && 'Forgot Password'}
            {step === STEPS.OTP && 'Enter OTP'}
            {step === STEPS.RESET && 'New Password'}
            {step === STEPS.DONE && 'All Done!'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {step === STEPS.EMAIL && 'Enter your email to receive an OTP'}
            {step === STEPS.OTP && `OTP sent to ${email}`}
            {step === STEPS.RESET && 'Create your new password'}
            {step === STEPS.DONE && 'Your password has been reset'}
          </p>
        </div>

        <div className="flex justify-center gap-2 mb-8">
          {[0,1,2,3].map(i => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${stepIndex >= i ? 'bg-violet-500 w-8' : 'bg-slate-700 w-4'}`} />
          ))}
        </div>

        {step === STEPS.EMAIL && (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Email Address</label>
              <div className="relative">
                <input type="email" className="input-field pl-10" placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={loading}>
              {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</> : 'Send OTP'}
            </button>
          </form>
        )}

        {step === STEPS.OTP && (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-4 text-center">Enter 6-digit OTP</label>
              <div className="flex gap-2 justify-center">
                {otp.map((digit, i) => (
                  <input key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1}
                    className="w-11 h-12 text-center text-xl font-bold bg-slate-900/80 border border-slate-700 focus:border-violet-500 text-white rounded-xl outline-none transition-all duration-200"
                    value={digit} onChange={e => handleOTPChange(i, e.target.value)} onKeyDown={e => handleOTPKeyDown(i, e)} />
                ))}
              </div>
            </div>
            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={loading}>
              {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Verifying...</> : 'Verify OTP'}
            </button>
            <button type="button" className="w-full text-sm text-slate-400 hover:text-violet-400 transition-colors"
              onClick={() => handleSendOTP({ preventDefault: () => {} })}>Resend OTP</button>
          </form>
        )}

        {step === STEPS.RESET && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">New Password</label>
              <div className="relative">
                <input type="password" className="input-field pl-10" placeholder="Min 6 characters"
                  value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Confirm Password</label>
              <div className="relative">
                <input type="password" className="input-field pl-10" placeholder="Repeat password"
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={loading}>
              {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Resetting...</> : 'Reset Password'}
            </button>
          </form>
        )}

        {step === STEPS.DONE && (
          <div className="text-center space-y-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-emerald-400">
              Your password has been reset successfully!
            </div>
            <button onClick={() => navigate('/login')} className="btn-primary w-full">Back to Sign In</button>
          </div>
        )}

        {step === STEPS.EMAIL && (
          <p className="text-center text-slate-500 text-sm mt-6">
            Remember it?{' '}
            <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">Sign in</Link>
          </p>
        )}
      </div>
    </div>
  );
}