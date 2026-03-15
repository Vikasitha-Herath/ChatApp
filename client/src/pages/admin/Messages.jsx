import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function Messages() {
  const [messages, setMessages]   = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [roomFilter, setRoomFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/admin/messages', {
        params: { page, limit: 30, room: roomFilter }
      });
      setMessages(data.messages);
      setTotal(data.total);
    } catch { toast.error('Failed to load messages'); }
    finally { setLoading(false); }
  }, [page, roomFilter]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await axios.delete(`/api/admin/messages/${id}`);
      toast.success('Message deleted');
      load();
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="animate-in">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:800, color:'white', margin:0 }}>Messages</h1>
          <p style={{ color:'#64748b', fontSize:13, margin:'4px 0 0' }}>{total.toLocaleString()} total messages</p>
        </div>
        <select className="admin-select" value={roomFilter} onChange={e => { setRoomFilter(e.target.value); setPage(1); }}>
          <option value="">All Rooms</option>
          <option value="general">General Only</option>
        </select>
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
                <th>Sender</th>
                <th>Message</th>
                <th>Room</th>
                <th>Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {messages.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign:'center', color:'#475569', padding:40 }}>No messages found</td></tr>
              )}
              {messages.map(msg => (
                <tr key={msg._id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:28, height:28, borderRadius:'50%', background:'rgba(124,58,237,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#a78bfa', flexShrink:0 }}>
                        {msg.sender?.username?.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontSize:13, color:'#e2e8f0', fontWeight:500 }}>{msg.sender?.username}</span>
                    </div>
                  </td>
                  <td style={{ maxWidth:320 }}>
                    <p style={{ fontSize:13, color:'#94a3b8', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{msg.content}</p>
                  </td>
                  <td>
                    <span className={`badge ${msg.room === 'general' ? 'badge-active' : 'badge-paid'}`}>
                      {msg.room === 'general' ? 'General' : 'Private'}
                    </span>
                  </td>
                  <td style={{ color:'#475569', fontSize:12, whiteSpace:'nowrap' }}>
                    {new Date(msg.createdAt).toLocaleString()}
                  </td>
                  <td>
                    <button className="btn-danger" onClick={() => handleDelete(msg._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {total > 30 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderTop:'1px solid rgba(30,41,59,0.6)' }}>
            <span style={{ fontSize:13, color:'#64748b' }}>Page {page} of {Math.ceil(total / 30)}</span>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn-admin-secondary" style={{ padding:'4px 12px' }} disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
              <button className="btn-admin-secondary" style={{ padding:'4px 12px' }} disabled={page * 30 >= total} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}