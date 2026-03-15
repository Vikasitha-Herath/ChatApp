import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const DEFAULT_SETTINGS = [
  { key:'free_message_limit',  value:'3',     label:'Free Message Limit',      description:'Messages allowed before payment required', category:'chat' },
  { key:'private_chat_price',  value:'99',    label:'Private Chat Price (¢)',  description:'Price in cents to unlock private chat', category:'payment' },
  { key:'app_name',            value:'Sync',  label:'App Name',                description:'Display name of the application', category:'general' },
  { key:'maintenance_mode',    value:'false', label:'Maintenance Mode',        description:'Put app in maintenance mode', category:'general' },
  { key:'allow_registration',  value:'true',  label:'Allow Registration',      description:'Allow new users to register', category:'general' },
  { key:'max_message_length',  value:'2000',  label:'Max Message Length',      description:'Maximum characters per message', category:'chat' },
  { key:'otp_expiry_minutes',  value:'10',    label:'OTP Expiry (minutes)',    description:'How long OTP codes are valid', category:'email' },
  { key:'session_expiry_days', value:'7',     label:'Session Expiry (days)',   description:'How long JWT tokens are valid', category:'security' },
];

const CATEGORY_COLORS = { general:'#7c3aed', payment:'#10b981', chat:'#06b6d4', email:'#f59e0b', security:'#ef4444' };

export default function Settings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saving, setSaving]     = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const updateValue = (key, value) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put('/api/admin/settings', { settings });
      toast.success('Settings saved successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally { setSaving(false); }
  };

  const categories = [...new Set(DEFAULT_SETTINGS.map(s => s.category))];
  const filtered   = settings.filter(s => s.category === activeTab);

  return (
    <div className="animate-in">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:800, color:'white', margin:0 }}>App Settings</h1>
          <p style={{ color:'#64748b', fontSize:13, margin:'4px 0 0' }}>Configure application behaviour and limits</p>
        </div>
        <button className="btn-admin-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : '💾 Save All Settings'}
        </button>
      </div>

      {/* Category tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:24, flexWrap:'wrap' }}>
        {categories.map(cat => {
          const color = CATEGORY_COLORS[cat];
          return (
            <button key={cat} onClick={() => setActiveTab(cat)}
              style={{
                padding:'8px 16px', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:500,
                border:`1px solid ${activeTab === cat ? color : 'rgba(51,65,85,0.6)'}`,
                background: activeTab === cat ? `${color}15` : 'transparent',
                color: activeTab === cat ? color : '#64748b',
                transition:'all 0.2s', textTransform:'capitalize'
              }}>
              {cat}
            </button>
          );
        })}
      </div>

      {/* Settings cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:16 }}>
        {filtered.map(setting => {
          const color  = CATEGORY_COLORS[setting.category];
          const isBool = setting.value === 'true' || setting.value === 'false';
          return (
            <div key={setting.key} className="admin-card" style={{ padding:20 }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:14, fontWeight:600, color:'white', margin:'0 0 4px', fontFamily:'Syne,sans-serif' }}>{setting.label}</p>
                  <p style={{ fontSize:12, color:'#64748b', margin:0, lineHeight:1.4 }}>{setting.description}</p>
                </div>
                <span style={{ fontSize:10, color, background:`${color}15`, border:`1px solid ${color}25`, padding:'2px 8px', borderRadius:6, fontWeight:600, textTransform:'uppercase', marginLeft:8, whiteSpace:'nowrap' }}>
                  {setting.category}
                </span>
              </div>

              <div style={{ background:'rgba(15,23,42,0.5)', borderRadius:8, padding:4 }}>
                {isBool ? (
                  <div style={{ display:'flex', background:'rgba(15,23,42,0.8)', borderRadius:6, overflow:'hidden' }}>
                    {['true','false'].map(opt => (
                      <button key={opt} onClick={() => updateValue(setting.key, opt)}
                        style={{
                          flex:1, padding:'8px', border:'none', cursor:'pointer',
                          background: setting.value === opt ? (opt === 'true' ? '#10b981' : '#ef4444') : 'transparent',
                          color: setting.value === opt ? 'white' : '#64748b',
                          fontSize:13, fontWeight:600, transition:'all 0.2s'
                        }}>
                        {opt === 'true' ? '✓ Enabled' : '✗ Disabled'}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input type="text" className="admin-input"
                    value={setting.value}
                    onChange={e => updateValue(setting.key, e.target.value)}
                    style={{ border:'none', background:'transparent', padding:'8px 10px' }}
                  />
                )}
              </div>

              <div style={{ marginTop:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <code style={{ fontSize:10, color:'#334155', fontFamily:'monospace' }}>{setting.key}</code>
                <span style={{ fontSize:11, color }}>{setting.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Warning */}
      <div style={{ marginTop:24, background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:12, padding:'14px 18px', display:'flex', gap:10, alignItems:'flex-start' }}>
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, marginTop:1 }}>
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <p style={{ fontSize:13, fontWeight:600, color:'#f59e0b', margin:'0 0 3px' }}>Important</p>
          <p style={{ fontSize:12, color:'#92400e', margin:0 }}>
            Payment and chat limits take effect immediately. For server-side variables like MONGODB_URI and EMAIL settings, update them directly in your Railway Variables dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}