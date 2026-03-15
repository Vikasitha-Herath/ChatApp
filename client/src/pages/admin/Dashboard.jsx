import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StatCard = ({ label, value, sub, color, icon }) => (
  <div className="stat-card">
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
      <div style={{ width:40, height:40, borderRadius:10, background:`${color}20`, border:`1px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
      </div>
      <span style={{ fontSize:11, color:'#64748b', fontWeight:500 }}>{sub}</span>
    </div>
    <p style={{ fontSize:28, fontWeight:800, color:'white', margin:'0 0 4px', fontFamily:'Syne,sans-serif' }}>{value}</p>
    <p style={{ fontSize:13, color:'#64748b', margin:0 }}>{label}</p>
  </div>
);

const MiniChart = ({ data, color, label }) => {
  if (!data?.length) return <div style={{ height:60, display:'flex', alignItems:'center', justifyContent:'center' }}><p style={{ color:'#475569', fontSize:12 }}>No data yet</p></div>;
  const max = Math.max(...data.map(d => d.count || d.revenue || 0), 1);
  return (
    <div>
      <p style={{ fontSize:12, color:'#64748b', marginBottom:8 }}>{label}</p>
      <div style={{ display:'flex', alignItems:'flex-end', gap:3, height:60 }}>
        {data.map((d, i) => {
          const val = d.count || d.revenue || 0;
          const h   = Math.max((val / max) * 60, 2);
          return (
            <div key={i} title={`${d._id}: ${val}`}
              style={{ flex:1, height:h, background:color, borderRadius:'3px 3px 0 0', opacity:0.7, cursor:'default', minWidth:4, transition:'opacity 0.2s' }}
              onMouseEnter={e => e.target.style.opacity = 1}
              onMouseLeave={e => e.target.style.opacity = 0.7}
            />
          );
        })}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
        <span style={{ fontSize:10, color:'#475569' }}>{data[0]?._id?.slice(5)}</span>
        <span style={{ fontSize:10, color:'#475569' }}>{data[data.length - 1]?._id?.slice(5)}</span>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/admin/dashboard')
      .then(r => setData(r.data))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:400 }}>
      <div style={{ width:32, height:32, border:'2px solid #7c3aed', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const { stats, charts } = data || {};

  return (
    <div className="animate-in">
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontFamily:'Syne,sans-serif', fontSize:24, fontWeight:800, color:'white', margin:0 }}>Dashboard</h1>
        <p style={{ color:'#64748b', fontSize:13, marginTop:4 }}>Welcome back! Here's what's happening with Sync.</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:16, marginBottom:24 }}>
        <StatCard label="Total Users"     value={stats?.users?.total?.toLocaleString() || 0}     sub={`+${stats?.users?.today || 0} today`}   color="#7c3aed" icon={<path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />} />
        <StatCard label="Online Now"      value={stats?.users?.online || 0}                       sub="live users"                              color="#10b981" icon={<><circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></>} />
        <StatCard label="Total Messages"  value={stats?.messages?.total?.toLocaleString() || 0}  sub={`${stats?.messages?.today || 0} today`}  color="#06b6d4" icon={<path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />} />
        <StatCard label="Active Rooms"    value={stats?.rooms?.total || 0}                        sub={`${stats?.rooms?.pending || 0} pending`} color="#f59e0b" icon={<path d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />} />
        <StatCard label="Total Revenue"   value={`$${stats?.revenue?.total?.toFixed(2) || '0.00'}`} sub={`${stats?.rooms?.paid || 0} paid rooms`} color="#ec4899" icon={<path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />} />
        <StatCard label="New This Week"   value={stats?.users?.week || 0}                         sub="new signups"                             color="#8b5cf6" icon={<path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:16, marginBottom:24 }}>
        <div className="admin-card">
          <h3 style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'white', margin:'0 0 16px' }}>User Signups — Last 7 Days</h3>
          <MiniChart data={charts?.signups} color="#7c3aed" label="Daily new users" />
        </div>
        <div className="admin-card">
          <h3 style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'white', margin:'0 0 16px' }}>Messages — Last 7 Days</h3>
          <MiniChart data={charts?.messages} color="#06b6d4" label="Daily messages sent" />
        </div>
        <div className="admin-card">
          <h3 style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'white', margin:'0 0 16px' }}>Revenue — Last 7 Days</h3>
          <MiniChart data={charts?.revenue?.map(r => ({...r, count: r.revenue / 100}))} color="#10b981" label="Daily revenue ($)" />
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:12 }}>
        {[
          { label:'Paid Rooms',      value: stats?.rooms?.paid    || 0, color:'#7c3aed' },
          { label:'Monthly Signups', value: stats?.users?.month   || 0, color:'#06b6d4' },
          { label:'Weekly Messages', value: stats?.messages?.week || 0, color:'#f59e0b' },
          { label:'Banned Users',    value: 0,                          color:'#ef4444' },
        ].map(item => (
          <div key={item.label} style={{ background:'rgba(15,23,42,0.6)', border:`1px solid ${item.color}20`, borderRadius:12, padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:13, color:'#64748b' }}>{item.label}</span>
            <span style={{ fontSize:20, fontWeight:800, color:item.color, fontFamily:'Syne,sans-serif' }}>{item.value?.toLocaleString()}</span>
          </div>
        ))}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}