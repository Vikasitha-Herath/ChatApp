import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminLogin() {
  const [form, setForm]       = useState({ email:'', password:'' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const { loginAdmin } = useAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill in all fields');
    setLoading(true);
    try {
      const { data } = await axios.post('/api/admin/auth/login', form);
      loginAdmin(data.admin, data.token);
      toast.success(`Welcome back, ${data.admin.username}!`);
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'radial-gradient(ellipse at 30% 40%, rgba(124,58,237,0.1) 0%, transparent 60%), #0a0f1e' }}>
      <div style={{ background:'rgba(15,23,42,0.9)', border:'1px solid rgba(124,58,237,0.2)', borderRadius:24, padding:48, width:'100%', maxWidth:420, boxShadow:'0 25px 50px rgba(0,0,0,0.5)' }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:60, height:60, borderRadius:16, background:'rgba(124,58,237,0.15)', border:'1px solid rgba(124,58,237,0.3)', marginBottom:12 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 style={{ fontFamily:'Syne,sans-serif', fontSize:28, fontWeight:900, color:'white', margin:0 }}>Sync</h1>
          <p style={{ color:'#64748b', fontSize:13, margin:'4px 0 0' }}>Admin Panel</p>
        </div>

        <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:700, color:'white', marginBottom:20 }}>Sign In</h2>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={{ display:'block', fontSize:13, fontWeight:500, color:'#94a3b8', marginBottom:6 }}>Email</label>
            <input type="email" className="admin-input" placeholder="admin@sync.app"
              value={form.email} onChange={e => setForm({...form, email:e.target.value})} />
          </div>
          <div>
            <label style={{ display:'block', fontSize:13, fontWeight:500, color:'#94a3b8', marginBottom:6 }}>Password</label>
            <div style={{ position:'relative' }}>
              <input type={showPw ? 'text' : 'password'} className="admin-input" placeholder="••••••••"
                style={{ paddingRight:40 }}
                value={form.password} onChange={e => setForm({...form, password:e.target.value})} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#64748b', cursor:'pointer' }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {showPw
                    ? <><path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></>
                    : <><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                  }
                </svg>
              </button>
            </div>
          </div>

          <button type="submit" className="btn-admin-primary" disabled={loading}
            style={{ justifyContent:'center', padding:'12px', marginTop:6, fontSize:15 }}>
            {loading
              ? <><div style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />Signing in...</>
              : 'Sign In to Admin'
            }
          </button>
        </form>

        <p style={{ textAlign:'center', color:'#475569', fontSize:12, marginTop:20 }}>
          First time?{' '}
          <Link to="/admin/setup" style={{ color:'#7c3aed' }}>Setup superadmin</Link>
        </p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}