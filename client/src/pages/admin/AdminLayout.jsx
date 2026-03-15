import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import toast from 'react-hot-toast';

const NAV = [
  { to:'/admin',            label:'Dashboard',   end:true,  d:'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { to:'/admin/users',      label:'Users',            d:'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { to:'/admin/messages',   label:'Messages',         d:'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  { to:'/admin/rooms',      label:'Chat Rooms',       d:'M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z' },
  { to:'/admin/promotions', label:'Promotions',       d:'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
  { to:'/admin/bundles',    label:'Msg Bundles',      d:'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { to:'/admin/settings',   label:'Settings',         d:'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  { to:'/admin/admins',     label:'Admins',           d:'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
];

export default function AdminLayout() {
  const { admin, logoutAdmin } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logoutAdmin(); toast.success('Logged out'); navigate('/admin/login'); };

  return (
    <div className="admin-body" style={{ display:'flex' }}>
      <aside className="admin-sidebar">
        <div style={{ padding:'20px', borderBottom:'1px solid rgba(124,58,237,0.1)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:10, background:'#7c3aed', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p style={{ fontFamily:'Syne,sans-serif', fontWeight:900, color:'white', fontSize:16, margin:0 }}>Sync</p>
              <p style={{ color:'#475569', fontSize:11, margin:0 }}>Admin Panel</p>
            </div>
          </div>
        </div>

        <nav style={{ flex:1, padding:'8px 0', overflowY:'auto' }}>
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) => `admin-sidebar-item${isActive ? ' active' : ''}`}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.d} />
              </svg>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding:'16px', borderTop:'1px solid rgba(124,58,237,0.1)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(124,58,237,0.2)', border:'1px solid rgba(124,58,237,0.3)', display:'flex', alignItems:'center', justifyContent:'center', color:'#a78bfa', fontWeight:700, fontSize:13 }}>
              {admin?.username?.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:13, fontWeight:600, color:'white', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{admin?.username}</p>
              <p style={{ fontSize:11, color:'#475569', margin:0, textTransform:'capitalize' }}>{admin?.role}</p>
            </div>
            <button onClick={handleLogout} title="Logout"
              style={{ background:'none', border:'none', color:'#475569', cursor:'pointer', padding:4, borderRadius:6, transition:'color 0.2s' }}
              onMouseEnter={e => e.target.style.color='#f87171'}
              onMouseLeave={e => e.target.style.color='#475569'}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <main className="admin-main" style={{ flex:1 }}>
        <div className="admin-topbar">
          <div style={{ flex:1 }} />
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#34d399', background:'rgba(16,185,129,0.1)', padding:'4px 10px', borderRadius:20 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#34d399', display:'inline-block' }} />
              Live
            </div>
            <span style={{ fontSize:13, color:'#64748b' }}>{admin?.email}</span>
          </div>
        </div>
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}