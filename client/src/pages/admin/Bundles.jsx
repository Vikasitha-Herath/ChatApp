import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const emptyForm = { name:'', description:'', messageCount:'', price:'', isPopular:false, isActive:true, color:'#7c3aed', icon:'⚡', validityDays:30 };

export default function Bundles() {
  const [bundles, setBundles]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState(emptyForm);
  const [editing, setEditing]     = useState(null);
  const [saving, setSaving]       = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/admin/bundles');
      setBundles(data.bundles);
    } catch { toast.error('Failed to load bundles'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditing(null); setShowModal(true); };
  const openEdit   = (b)  => { setForm(b); setEditing(b._id); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.messageCount || !form.price) return toast.error('Please fill required fields');
    setSaving(true);
    try {
      if (editing) {
        await axios.put(`/api/admin/bundles/${editing}`, form);
        toast.success('Bundle updated!');
      } else {
        await axios.post('/api/admin/bundles', form);
        toast.success('Bundle created!');
      }
      setShowModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this bundle?')) return;
    try { await axios.delete(`/api/admin/bundles/${id}`); toast.success('Deleted!'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  const handleToggle = async (id, isActive) => {
    try { await axios.put(`/api/admin/bundles/${id}`, { isActive: !isActive }); toast.success('Updated!'); load(); }
    catch { toast.error('Failed to update'); }
  };

  return (
    <div className="animate-in">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:800, color:'white', margin:0 }}>Message Bundles</h1>
          <p style={{ color:'#64748b', fontSize:13, margin:'4px 0 0' }}>Create and manage paid message packages</p>
        </div>
        <button className="btn-admin-primary" onClick={openCreate}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v16m8-8H4" /></svg>
          New Bundle
        </button>
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
          <div style={{ width:24, height:24, border:'2px solid #7c3aed', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:16 }}>
          {bundles.length === 0 && (
            <div style={{ gridColumn:'1/-1', textAlign:'center', padding:60 }}>
              <p style={{ fontSize:40, marginBottom:12 }}>📦</p>
              <p style={{ color:'#475569', fontSize:14 }}>No bundles yet. Create your first message bundle!</p>
            </div>
          )}
          {bundles.map(b => (
            <div key={b._id} className="admin-card" style={{ padding:24, position:'relative', border: b.isPopular ? '1px solid rgba(124,58,237,0.4)' : undefined }}>
              {b.isPopular && (
                <div style={{ position:'absolute', top:-10, left:'50%', transform:'translateX(-50%)', background:'#7c3aed', color:'white', fontSize:10, fontWeight:700, padding:'2px 10px', borderRadius:20, whiteSpace:'nowrap' }}>
                  ⭐ MOST POPULAR
                </div>
              )}

              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                <div style={{ width:48, height:48, borderRadius:14, background:`${b.color}20`, border:`1px solid ${b.color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>
                  {b.icon}
                </div>
                <div>
                  <h3 style={{ fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:700, color:'white', margin:0 }}>{b.name}</h3>
                  <span className={`badge ${b.isActive ? 'badge-active' : 'badge-inactive'}`}>{b.isActive ? 'Active' : 'Inactive'}</span>
                </div>
              </div>

              {b.description && <p style={{ fontSize:13, color:'#64748b', margin:'0 0 16px', lineHeight:1.5 }}>{b.description}</p>}

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
                {[
                  { l:'Messages', v: b.messageCount?.toLocaleString(), c:'#a78bfa' },
                  { l:'Price',    v: `$${(b.price / 100).toFixed(2)}`,  c:'#34d399' },
                  { l:'Valid',    v: `${b.validityDays} days`,           c:'#fb923c' },
                  { l:'Sold',     v: b.totalPurchases || 0,              c:'#60a5fa' },
                ].map(i => (
                  <div key={i.l} style={{ background:'rgba(15,23,42,0.6)', borderRadius:8, padding:'8px 10px' }}>
                    <p style={{ fontSize:10, color:'#475569', margin:0, textTransform:'uppercase', letterSpacing:'0.05em' }}>{i.l}</p>
                    <p style={{ fontSize:16, color:i.c, margin:0, fontWeight:700, fontFamily:'Syne,sans-serif' }}>{i.v}</p>
                  </div>
                ))}
              </div>

              <p style={{ fontSize:12, color:'#475569', marginBottom:14 }}>
                Total Revenue: <span style={{ color:'#34d399', fontWeight:700 }}>${((b.totalRevenue || 0) / 100).toFixed(2)}</span>
              </p>

              <div style={{ display:'flex', gap:8 }}>
                <button className="btn-admin-secondary" style={{ flex:1, justifyContent:'center', padding:'6px' }} onClick={() => openEdit(b)}>Edit</button>
                <button className={b.isActive ? 'btn-danger' : 'btn-success'} style={{ flex:1, justifyContent:'center' }} onClick={() => handleToggle(b._id, b.isActive)}>
                  {b.isActive ? 'Disable' : 'Enable'}
                </button>
                <button className="btn-danger" onClick={() => handleDelete(b._id)}>
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="admin-modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="admin-modal" style={{ maxHeight:'85vh', overflowY:'auto' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:800, color:'white', margin:0 }}>
                {editing ? 'Edit Bundle' : 'New Bundle'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:20 }}>×</button>
            </div>

            <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={{ display:'block', fontSize:12, color:'#94a3b8', marginBottom:5, fontWeight:500 }}>Bundle Name *</label>
                <input type="text" className="admin-input" placeholder="Starter Pack" value={form.name} onChange={e => setForm({...form, name:e.target.value})} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:12, color:'#94a3b8', marginBottom:5, fontWeight:500 }}>Description</label>
                <textarea className="admin-input" rows={2} placeholder="Perfect for casual chatters" value={form.description} onChange={e => setForm({...form, description:e.target.value})} />
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={{ display:'block', fontSize:12, color:'#94a3b8', marginBottom:5, fontWeight:500 }}>Message Count *</label>
                  <input type="number" className="admin-input" placeholder="50" min="1" value={form.messageCount} onChange={e => setForm({...form, messageCount:e.target.value})} />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:12, color:'#94a3b8', marginBottom:5, fontWeight:500 }}>Price (cents) *</label>
                  <input type="number" className="admin-input" placeholder="299" min="1" value={form.price} onChange={e => setForm({...form, price:e.target.value})} />
                  <p style={{ fontSize:11, color:'#475569', margin:'3px 0 0' }}>= ${form.price ? (form.price / 100).toFixed(2) : '0.00'}</p>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:12, color:'#94a3b8', marginBottom:5, fontWeight:500 }}>Validity (days)</label>
                  <input type="number" className="admin-input" placeholder="30" min="1" value={form.validityDays} onChange={e => setForm({...form, validityDays:e.target.value})} />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:12, color:'#94a3b8', marginBottom:5, fontWeight:500 }}>Icon (emoji)</label>
                  <input type="text" className="admin-input" placeholder="⚡" value={form.icon} onChange={e => setForm({...form, icon:e.target.value})} />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:12, color:'#94a3b8', marginBottom:5, fontWeight:500 }}>Color</label>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <input type="color" value={form.color} onChange={e => setForm({...form, color:e.target.value})}
                      style={{ width:40, height:36, borderRadius:8, border:'1px solid #334155', background:'none', cursor:'pointer', padding:2 }} />
                    <input type="text" className="admin-input" value={form.color} onChange={e => setForm({...form, color:e.target.value})} />
                  </div>
                </div>
              </div>

              <div style={{ display:'flex', gap:16 }}>
                <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                  <input type="checkbox" checked={form.isPopular} onChange={e => setForm({...form, isPopular:e.target.checked})}
                    style={{ width:16, height:16, accentColor:'#7c3aed' }} />
                  <span style={{ fontSize:13, color:'#94a3b8' }}>Mark as Popular</span>
                </label>
                <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive:e.target.checked})}
                    style={{ width:16, height:16, accentColor:'#7c3aed' }} />
                  <span style={{ fontSize:13, color:'#94a3b8' }}>Active</span>
                </label>
              </div>

              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button type="submit" className="btn-admin-primary" disabled={saving} style={{ flex:1, justifyContent:'center', padding:'10px' }}>
                  {saving ? 'Saving...' : editing ? 'Update Bundle' : 'Create Bundle'}
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