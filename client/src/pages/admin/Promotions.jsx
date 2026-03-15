import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const emptyForm = { title:'', description:'', type:'banner', status:'inactive', startDate:'', endDate:'', targetAudience:'all', discountPercent:'', promoCode:'', ctaText:'', ctaUrl:'' };
const typeColors = { banner:'#7c3aed', popup:'#06b6d4', notification:'#f59e0b', discount:'#10b981' };

export default function Promotions() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]             = useState(emptyForm);
  const [editing, setEditing]       = useState(null);
  const [saving, setSaving]         = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/admin/promotions');
      setPromotions(data.promotions);
    } catch { toast.error('Failed to load promotions'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditing(null); setShowModal(true); };
  const openEdit   = (p)  => {
    setForm({ ...p, startDate: p.startDate?.slice(0, 16), endDate: p.endDate?.slice(0, 16) });
    setEditing(p._id);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title || !form.startDate || !form.endDate) return toast.error('Please fill required fields');
    setSaving(true);
    try {
      if (editing) {
        await axios.put(`/api/admin/promotions/${editing}`, form);
        toast.success('Promotion updated!');
      } else {
        await axios.post('/api/admin/promotions', form);
        toast.success('Promotion created!');
      }
      setShowModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (id) => {
    try { await axios.post(`/api/admin/promotions/${id}/toggle`); load(); toast.success('Status updated!'); }
    catch { toast.error('Failed to toggle'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this promotion?')) return;
    try { await axios.delete(`/api/admin/promotions/${id}`); toast.success('Deleted!'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="animate-in">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:800, color:'white', margin:0 }}>Promotions</h1>
          <p style={{ color:'#64748b', fontSize:13, margin:'4px 0 0' }}>Manage banners, popups and discount campaigns</p>
        </div>
        <button className="btn-admin-primary" onClick={openCreate}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v16m8-8H4" /></svg>
          New Promotion
        </button>
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
          <div style={{ width:24, height:24, border:'2px solid #7c3aed', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:16 }}>
          {promotions.length === 0 && (
            <div style={{ gridColumn:'1/-1', textAlign:'center', padding:60 }}>
              <p style={{ fontSize:40, marginBottom:12 }}>📢</p>
              <p style={{ color:'#475569', fontSize:14 }}>No promotions yet. Create your first one!</p>
            </div>
          )}
          {promotions.map(p => (
            <div key={p._id} className="admin-card" style={{ padding:20 }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ background:`${typeColors[p.type]}20`, color:typeColors[p.type], border:`1px solid ${typeColors[p.type]}30`, padding:'2px 8px', borderRadius:6, fontSize:11, fontWeight:600, textTransform:'uppercase' }}>{p.type}</span>
                  <span className={`badge ${p.status === 'active' ? 'badge-active' : 'badge-inactive'}`}>{p.status}</span>
                </div>
                <button onClick={() => handleToggle(p._id)} className={p.status === 'active' ? 'btn-danger' : 'btn-success'} style={{ padding:'3px 8px', fontSize:11 }}>
                  {p.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
              </div>

              <h3 style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'white', margin:'0 0 6px' }}>{p.title}</h3>
              <p style={{ fontSize:13, color:'#64748b', margin:'0 0 12px', lineHeight:1.5 }}>{p.description}</p>

              {p.promoCode && (
                <div style={{ background:'rgba(124,58,237,0.1)', border:'1px dashed rgba(124,58,237,0.3)', borderRadius:8, padding:'6px 10px', marginBottom:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:12, color:'#94a3b8' }}>Promo Code</span>
                  <span style={{ fontSize:13, fontWeight:700, color:'#a78bfa', letterSpacing:2 }}>{p.promoCode}</span>
                </div>
              )}

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:14 }}>
                {[
                  { l:'Start',   v: new Date(p.startDate).toLocaleDateString() },
                  { l:'End',     v: new Date(p.endDate).toLocaleDateString() },
                  { l:'Target',  v: p.targetAudience },
                  { l:'Views',   v: p.viewCount || 0 },
                ].map(i => (
                  <div key={i.l} style={{ background:'rgba(15,23,42,0.5)', borderRadius:8, padding:'6px 10px' }}>
                    <p style={{ fontSize:10, color:'#475569', margin:0, textTransform:'uppercase', letterSpacing:'0.05em' }}>{i.l}</p>
                    <p style={{ fontSize:13, color:'#cbd5e1', margin:0, fontWeight:500 }}>{i.v}</p>
                  </div>
                ))}
              </div>

              <div style={{ display:'flex', gap:8 }}>
                <button className="btn-admin-secondary" style={{ flex:1, justifyContent:'center', padding:'6px' }} onClick={() => openEdit(p)}>Edit</button>
                <button className="btn-danger" style={{ flex:1, justifyContent:'center' }} onClick={() => handleDelete(p._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="admin-modal" style={{ maxHeight:'85vh', overflowY:'auto' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:800, color:'white', margin:0 }}>
                {editing ? 'Edit Promotion' : 'New Promotion'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:20 }}>×</button>
            </div>

            <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={{ display:'block', fontSize:12, color:'#94a3b8', marginBottom:5, fontWeight:500 }}>Title *</label>
                <input type="text" className="admin-input" placeholder="Summer Sale!" value={form.title} onChange={e => setForm({...form, title:e.target.value})} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:12, color:'#94a3b8', marginBottom:5, fontWeight:500 }}>Description *</label>
                <textarea className="admin-input" rows={3} style={{ resize:'vertical' }} value={form.description} onChange={e => setForm({...form, description:e.target.value})} />
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={{ display:'block', fontSize:12, color:'#94a3b8', marginBottom:5, fontWeight:500 }}>Type</label>
                  <select className="admin-select" style={{ width:'100%' }} value={form.type} onChange={e => setForm({...form, type:e.target.value})}>
                    {['banner','popup','notification','discount'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:12, color:'#94a3b8', marginBottom:5, fontWeight:500 }}>Target Audience</label>
                  <select className="admin-select" style={{ width:'100%' }} value={form.targetAudience} onChange={e => setForm({...form, targetAudience:e.target.value})}>
                    {['all','new_users','free_users','paid_users'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:12, color:'#94a3b8', marginBottom:5, fontWeight:500 }}>Start Date *</label>
                  <input type="datetime-local" className="admin-input" value={form.startDate} onChange={e => setForm({...form, startDate:e.target.value})} />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:12, color:'#94a3b8', marginBottom:5, fontWeight:500 }}>End Date *</label>
                  <input type="datetime-local" className="admin-input" value={form.endDate} onChange={e => setForm({...form, endDate:e.target.value})} />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:12, color:'#94a3b8', marginBottom:5, fontWeight:500 }}>Promo Code</label>
                  <input type="text" className="admin-input" placeholder="SYNC50" value={form.promoCode} onChange={e => setForm({...form, promoCode:e.target.value.toUpperCase()})} />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:12, color:'#94a3b8', marginBottom:5, fontWeight:500 }}>Discount %</label>
                  <input type="number" className="admin-input" placeholder="20" min="0" max="100" value={form.discountPercent} onChange={e => setForm({...form, discountPercent:e.target.value})} />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:12, color:'#94a3b8', marginBottom:5, fontWeight:500 }}>CTA Text</label>
                  <input type="text" className="admin-input" placeholder="Get Discount" value={form.ctaText} onChange={e => setForm({...form, ctaText:e.target.value})} />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:12, color:'#94a3b8', marginBottom:5, fontWeight:500 }}>Status</label>
                  <select className="admin-select" style={{ width:'100%' }} value={form.status} onChange={e => setForm({...form, status:e.target.value})}>
                    {['inactive','active','scheduled'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button type="submit" className="btn-admin-primary" disabled={saving} style={{ flex:1, justifyContent:'center', padding:'10px' }}>
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create Promotion'}
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