import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function Users() {
  const [users, setUsers]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('all');
  const [page, setPage]       = useState(1);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/admin/users', {
        params: { page, search, filter, limit: 20 }
      });
      setUsers(data.users);
      setTotal(data.total);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [page, search, filter]);

  useEffect(() => { load(); }, [load]);

  const handleBan = async (id, isBanned) => {
    try {
      await axios.post(`/api/admin/users/${id}/ban`);
      toast.success(isBanned ? 'User unbanned' : 'User banned');
      load();
    } catch { toast.error('Failed to update user'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    try {
      await axios.delete(`/api/admin/users/${id}`);
      toast.success('User deleted');
      load();
    } catch { toast.error('Failed to delete user'); }
  };

  return (
    <div className="animate-in">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:800, color:'white', margin:0 }}>Users</h1>
          <p style={{ color:'#64748b', fontSize:13, margin:'4px 0 0' }}>{total.toLocaleString()} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <input className="admin-input" placeholder="Search by username or email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ paddingLeft:36 }}
          />
          <svg style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#64748b' }}
            width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <select className="admin-select" value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}>
          <option value="all">All Users</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      {/* Table */}
      <div className="admin-card" style={{ padding:0, overflow:'hidden' }}>
        {loading ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200 }}>
            <div style={{ width:24, height:24, border:'2px solid #7c3aed', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign:'center', color:'#475569', padding:40 }}>No users found</td></tr>
              )}
              {users.map(user => (
                <tr key={user._id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(124,58,237,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#a78bfa', flexShrink:0 }}>
                        {user.username?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize:13, fontWeight:600, color:'white', margin:0 }}>{user.username}</p>
                        {user.isBanned && <span className="badge badge-danger" style={{ fontSize:10 }}>Banned</span>}
                      </div>
                    </div>
                  </td>
                  <td style={{ color:'#94a3b8', fontSize:13 }}>{user.email}</td>
                  <td>
                    <span className={`badge ${user.isOnline ? 'badge-active' : 'badge-inactive'}`}>
                      {user.isOnline ? '● Online' : 'Offline'}
                    </span>
                  </td>
                  <td style={{ color:'#64748b', fontSize:12 }}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:6 }}>
                      <button className="btn-admin-secondary" style={{ padding:'4px 10px', fontSize:12 }}
                        onClick={() => navigate(`/admin/users/${user._id}`)}>
                        View
                      </button>
                      <button className={user.isBanned ? 'btn-success' : 'btn-danger'}
                        onClick={() => handleBan(user._id, user.isBanned)}>
                        {user.isBanned ? 'Unban' : 'Ban'}
                      </button>
                      <button className="btn-danger" onClick={() => handleDelete(user._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderTop:'1px solid rgba(30,41,59,0.6)' }}>
            <span style={{ fontSize:13, color:'#64748b' }}>
              Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, total)} of {total}
            </span>
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