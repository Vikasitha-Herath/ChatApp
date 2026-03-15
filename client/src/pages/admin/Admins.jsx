import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const emptyForm = { username:'', email:'', password:'', role:'admin' };
const roleColors = { superadmin:'#f59e0b', admin:'#7c3aed', moderator:'#06b6d4' };

export default function Admins() {
  const [admins, setAdmins]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/admin/admins');
      setAdmins(data.admins);
    } catch { toast.error('Failed to load admins'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password) return toast.error('Please fill all fields');
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    setSaving(true);
    try {
      await axios.post('/api/admin/admins', form);
      toast.success('Admin created!');
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create admin'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (id) => {
    try { await axios.post(`/api/admin/admins/${id}/toggle`); toast.success('Admin status updated'); load(); }
    catch { toast.error('Failed to update'); }
  };

  return (
    <div className="animate-in">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:800, color:'white', margin:0 }}>Admin Accounts</h1>
          <p style={{ color:'#64748b', fontSize:13, margin:'4px 0 0' }}>Manage admin users and permissions</p>
        </div>
        <button className="btn-admin-primary" onClick={() => setShowModal(true)}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v16m8-8H4" /></svg>
          New Admin
        </button>
      </div>

      <div className="admin-card" style={{ padding:0, overflow:'hidden' }}>
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
            <div style={{ width:24, height:24, border:'2px solid #7c3aed', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Admin</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Permissions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign:'center', color:'#475569', padding:40 }}>No admins found</td></tr>
              )}
              {admins.map(admin => (
                <tr key={admin._id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:34, height:34, borderRadius:'50%', background:`${roleColors[admin.role]}25`, border:`1px solid ${roleColors[admin.role]}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:roleColors[admin.role] }}>
                        {admin.username?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize:13, fontWeight:600, color:'white', margin:0 }}>{admin.username}</p>
                        <p style={{ fontSize:11, color:'#64748b', margin:0 }}>{admin.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ background:`${roleColors[admin.role]}15`, color:roleColors[admin.role], border:`1px solid ${roleColors[admin.role]}30`, padding:'2px 8px', borderRadius:6, fontSize:11, fontWeight:700, textTransform:'uppercase' }}>
                      {admin.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${admin.isActive ? 'badge-active' : 'badge-inactive'}`}>
                      {admin.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ fontSize:12, color:'#64748b' }}>
                    {admin.lastLogin ? new Date(admin.lastLogin).toLocaleDateString() : 'Never'}
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:3, flexWrap:'wrap', maxWidth:200 }}>
                      {Object.entries(admin.permissions || {}).filter(([, v]) => v).map(([k]) => (
                        <span key={k} style={{ fontSize:9, background:'rgba(124,58,237,0.1)', color:'#a78bfa', border:'1px solid rgba(124,58,237,0.2)', padding:'1px 5px', borderRadius:4, textTransform:'uppercase', letterSpacing:'0.04em' }}>
                          {k.replace('manage','').replace('view','').toLowerCase()}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <button className={admin.isActive ? 'btn-danger' : 'btn-success'} onClick={() => handleToggle(admin._id)}>
                      {admin.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="admin-modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="admin-modal">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:800, color:'white', margin:0 }}>Create Admin</h2>
              <button onClick={() => setShowModal(false)} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:20 }}>×</button>
            </div>

            <form onSubmit={handleCreate} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {[
                { label:'Username', field:'username', type:'text',     placeholder:'adminuser' },
                { label:'Email',    field:'email',    type:'email',    placeholder:'admin@sync.app' },
                { label:'Password (min 8 chars)', field:'password', type:'password', placeholder:'••••••••' },
              ].map(f => (
                <div key={f.field}>
                  <label style={{ display:'block', fontSize:12, color:'#94a3b8', marginBottom:5, fontWeight:500 }}>{f.label}</label>
                  <input type={f.type} className="admin-input" placeholder={f.placeholder}
                    value={form[f.field]} onChange={e => setForm({...form, [f.field]:e.target.value})} />
                </div>
              ))}

              <div>
                <label style={{ display:'block', fontSize:12, color:'#94a3b8', marginBottom:5, fontWeight:500 }}>Role</label>
                <select className="admin-select" style={{ width:'100%' }} value={form.role} onChange={e => setForm({...form, role:e.target.value})}>
                  <option value="moderator">Moderator — view & moderate only</option>
                  <option value="admin">Admin — full management</option>
                  <option value="superadmin">Superadmin — everything</option>
                </select>
              </div>

              <div style={{ background:'rgba(124,58,237,0.08)', border:'1px solid rgba(124,58,237,0.2)', borderRadius:8, padding:'10px 12px' }}>
                <p style={{ color:'#a78bfa', fontSize:12, margin:0 }}>
                  ⚡ The new admin can log in at <strong>/admin/login</strong>
                </p>
              </div>

              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button type="submit" className="btn-admin-primary" disabled={saving} style={{ flex:1, justifyContent:'center', padding:'10px' }}>
                  {saving ? 'Creating...' : 'Create Admin'}
                </button>
                <button type="button" className="btn-admin-secondary" onClick={() => setShowModal(false)} style={{ flex:1, justifyContent:'center', padding:'10px' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}