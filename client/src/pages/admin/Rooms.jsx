import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function Rooms() {
  const [rooms, setRooms]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [filter, setFilter]   = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/admin/rooms', { params: { page, limit: 20, filter } });
      setRooms(data.rooms);
      setTotal(data.total);
    } catch { toast.error('Failed to load rooms'); }
    finally { setLoading(false); }
  }, [page, filter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="animate-in">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:800, color:'white', margin:0 }}>Chat Rooms</h1>
          <p style={{ color:'#64748b', fontSize:13, margin:'4px 0 0' }}>{total.toLocaleString()} private rooms</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {['all','active','pending','paid'].map(f => (
            <button key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={filter === f ? 'btn-admin-primary' : 'btn-admin-secondary'}
              style={{ padding:'6px 14px', fontSize:12, textTransform:'capitalize' }}>
              {f}
            </button>
          ))}
        </div>
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
                <th>Participants</th>
                <th>Status</th>
                <th>Messages</th>
                <th>Payment</th>
                <th>Revenue</th>
                <th>Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {rooms.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign:'center', color:'#475569', padding:40 }}>No rooms found</td></tr>
              )}
              {rooms.map(room => {
                const [p1, p2] = room.participants || [];
                return (
                  <tr key={room._id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        {[p1, p2].filter(Boolean).map((p, i) => (
                          <React.Fragment key={i}>
                            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                              <div style={{ width:24, height:24, borderRadius:'50%', background:'rgba(124,58,237,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#a78bfa' }}>
                                {p.username?.charAt(0).toUpperCase()}
                              </div>
                              <span style={{ fontSize:12, color:'#e2e8f0' }}>{p.username}</span>
                            </div>
                            {i === 0 && p2 && <span style={{ color:'#334155', fontSize:12, margin:'0 2px' }}>↔</span>}
                          </React.Fragment>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${room.status === 'accepted' ? 'badge-active' : room.status === 'pending' ? 'badge-pending' : 'badge-inactive'}`}>
                        {room.status}
                      </span>
                    </td>
                    <td style={{ color:'#94a3b8', fontSize:13 }}>{room.messageCount || 0}</td>
                    <td>
                      {room.isPaid
                        ? <span className="badge badge-paid">💜 Paid</span>
                        : <span className="badge badge-inactive">Free</span>
                      }
                    </td>
                    <td style={{ color:'#34d399', fontSize:13, fontWeight:600 }}>
                      {room.isPaid ? `$${((room.paymentInfo?.amount || 0) / 100).toFixed(2)}` : '—'}
                    </td>
                    <td style={{ color:'#475569', fontSize:12 }}>
                      {room.updatedAt ? new Date(room.updatedAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {total > 20 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderTop:'1px solid rgba(30,41,59,0.6)' }}>
            <span style={{ fontSize:13, color:'#64748b' }}>Page {page} of {Math.ceil(total / 20)}</span>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn-admin-secondary" style={{ padding:'4px 12px' }} disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
              <button className="btn-admin-secondary" style={{ padding:'4px 12px' }} disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}