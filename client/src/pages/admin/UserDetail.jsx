import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const r = await axios.get(`/api/admin/users/${id}`);
      setData(r.data);
    } catch { toast.error('Failed to load user'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const handleBan = async () => {
    try {
      await axios.post(`/api/admin/users/${id}/ban`);
      toast.success('User status updated');
      load();
    } catch { toast.error('Failed to update'); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Permanently delete this user and all their messages?')) return;
    try {
      await axios.delete(`/api/admin/users/${id}`);
      toast.success('User deleted');
      navigate('/admin/users');
    } catch { toast.error('Failed to delete'); }
  };

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', padding:80 }}>
      <div style={{ width:28, height:28, border:'2px solid #7c3aed', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const { user, stats, recentMessages } = data || {};

  return (
    <div className="animate-in">
      <button className="btn-admin-secondary" style={{ marginBottom:20 }} onClick={() => navigate('/admin/users')}>
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 19l-7-7 7-7" />
        </svg>
        Back to Users
      </button>

      <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:20 }}>
        {/* Left column */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Profile card */}
          <div className="admin-card" style={{ textAlign:'center', padding:28 }}>
            <div style={{ width:72, height:72, borderRadius:'50%', background:'rgba(124,58,237,0.2)', border:'2px solid rgba(124,58,237,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:800, color:'#a78bfa', margin:'0 auto 16px' }}>
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:800, color:'white', margin:'0 0 4px' }}>{user?.username}</h2>
            <p style={{ fontSize:13, color:'#64748b', margin:'0 0 12px' }}>{user?.email}</p>
            <div style={{ display:'flex', justifyContent:'center', gap:8, marginBottom:16 }}>
              <span className={`badge ${user?.isOnline ? 'badge-active' : 'badge-inactive'}`}>
                {user?.isOnline ? '● Online' : 'Offline'}
              </span>
              {user?.isBanned && <span className="badge badge-danger">Banned</span>}
            </div>
            {user?.bio && <p style={{ fontSize:13, color:'#94a3b8', fontStyle:'italic', marginBottom:12 }}>"{user.bio}"</p>}
            <p style={{ fontSize:11, color:'#475569', margin:0 }}>Joined {new Date(user?.createdAt).toLocaleDateString()}</p>
          </div>

          {/* Stats */}
          <div className="admin-card">
            <h3 style={{ fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:700, color:'white', margin:'0 0 14px' }}>Activity Stats</h3>
            {[
              { l:'Messages Sent', v: stats?.messageCount || 0, c:'#a78bfa' },
              { l:'Chat Rooms',    v: stats?.roomCount    || 0, c:'#34d399' },
              { l:'Paid Chats',    v: stats?.paidRooms    || 0, c:'#fb923c' },
            ].map(s => (
              <div key={s.l} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid rgba(30,41,59,0.4)' }}>
                <span style={{ fontSize:13, color:'#64748b' }}>{s.l}</span>
                <span style={{ fontSize:18, fontWeight:800, color:s.c, fontFamily:'Syne,sans-serif' }}>{s.v}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="admin-card" style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <h3 style={{ fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:700, color:'white', margin:'0 0 8px' }}>Actions</h3>
            <button className={user?.isBanned ? 'btn-success' : 'btn-danger'}
              style={{ justifyContent:'center', padding:'10px' }} onClick={handleBan}>
              {user?.isBanned ? '✓ Unban User' : '⊘ Ban User'}
            </button>
            <button className="btn-danger"
              style={{ justifyContent:'center', padding:'10px', background:'rgba(239,68,68,0.15)' }}
              onClick={handleDelete}>
              🗑 Delete Account
            </button>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Recent messages */}
          <div className="admin-card">
            <h3 style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'white', margin:'0 0 16px' }}>Recent Messages</h3>
            {!recentMessages?.length
              ? <p style={{ color:'#475569', fontSize:13 }}>No messages yet.</p>
              : (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {recentMessages.map(msg => (
                    <div key={msg._id} style={{ background:'rgba(15,23,42,0.5)', borderRadius:10, padding:'10px 14px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                        <span className={`badge ${msg.room === 'general' ? 'badge-active' : 'badge-paid'}`} style={{ fontSize:10 }}>
                          {msg.room === 'general' ? 'General' : 'Private'}
                        </span>
                        <span style={{ fontSize:11, color:'#475569' }}>{new Date(msg.createdAt).toLocaleString()}</span>
                      </div>
                      <p style={{ fontSize:13, color:'#cbd5e1', margin:0, lineHeight:1.5 }}>{msg.content}</p>
                    </div>
                  ))}
                </div>
              )
            }
          </div>

          {/* Account info */}
          <div className="admin-card">
            <h3 style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'white', margin:'0 0 16px' }}>Account Info</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[
                { l:'User ID',   v: user?._id },
                { l:'Email',     v: user?.email },
                { l:'Username',  v: user?.username },
                { l:'Status',    v: user?.isOnline ? 'Online' : 'Offline' },
                { l:'Banned',    v: user?.isBanned ? 'Yes' : 'No' },
                { l:'Last Seen', v: user?.lastSeen ? new Date(user.lastSeen).toLocaleString() : 'N/A' },
                { l:'Created',   v: new Date(user?.createdAt).toLocaleString() },
                { l:'Updated',   v: new Date(user?.updatedAt).toLocaleString() },
              ].map(i => (
                <div key={i.l} style={{ background:'rgba(15,23,42,0.5)', borderRadius:8, padding:'10px 12px' }}>
                  <p style={{ fontSize:10, color:'#475569', margin:'0 0 3px', textTransform:'uppercase', letterSpacing:'0.05em' }}>{i.l}</p>
                  <p style={{ fontSize:12, color:'#e2e8f0', margin:0, wordBreak:'break-all', fontFamily: i.l === 'User ID' ? 'monospace' : 'inherit' }}>{i.v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}