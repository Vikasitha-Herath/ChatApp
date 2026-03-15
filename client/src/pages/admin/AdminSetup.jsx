import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminSetup() {
  const [form, setForm]       = useState({ username:'', email:'', password:'', confirmPassword:'' });
  const [loading, setLoading] = useState(false);
  const { loginAdmin } = useAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password) return toast.error('Please fill in all fields');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      const { data } = await axios.post('/api/admin/auth/setup', { username:form.username, email:form.email, password:form.password });
      loginAdmin(data.admin, data.token);
      toast.success('Superadmin created! Welcome to Sync Admin.');
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Setup failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'radial-gradient(ellipse at 30% 40%, rgba(124,58,237,0.1) 0%, transparent 60%), #0a0f1e' }}>
      <div style={{ background:'rgba(15,23,42,0.9)', border:'1px solid rgba(124,58,237,0.2)', borderRadius:24, padding:48, width:'100%', maxWidth:440, boxShadow:'0 25px 50px rgba(0,0,0,0.5)' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:56, height:56, borderRadius:16, background:'rgba(124,58,237,0.15)', border:'1px solid rgba(124,58,237,0.3)', marginBottom:12 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 style={{ fontFamily:'Syne,sans-serif', fontSize:24, fontWeight:900, color:'white', margin:0 }}>Admin Setup</h1>
          <p style={{ color:'#64748b', fontSize:13, marginTop:4 }}>Create your superadmin account</p>
        </div>

        <div style={{ background:'rgba(124,58,237,0.08)', border:'1px solid rgba(124,58,237,0.2)', borderRadius:10, padding:'10px 14px', marginBottom:20 }}>
          <p style={{ color:'#a78bfa', fontSize:12, margin:0 }}>⚡ This page only works once. After creating the first admin it will be disabled.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {[
            { label:'Username', field:'username', type:'text',     placeholder:'superadmin' },
            { label:'Email',    field:'email',    type:'email',    placeholder:'admin@sync.app' },
            { label:'Password (min 8 chars)', field:'password', type:'password', placeholder:'••••••••' },
            { label:'Confirm Password',       field:'confirmPassword', type:'password', placeholder:'••••••••' },
          ].map(f => (
            <div key={f.field}>
              <label style={{ display:'block', fontSize:13, fontWeight:500, color:'#94a3b8', marginBottom:5 }}>{f.label}</label>
              <input type={f.type} className="admin-input" placeholder={f.placeholder}
                value={form[f.field]} onChange={e => setForm({...form, [f.field]:e.target.value})} />
            </div>
          ))}

          <button type="submit" className="btn-admin-primary" disabled={loading}
            style={{ justifyContent:'center', padding:'12px', marginTop:6, fontSize:15 }}>
            {loading
              ? <><div style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />Creating...</>
              : 'Create Superadmin'
            }
          </button>
        </form>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}