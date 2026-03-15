import React, { useState } from 'react';
import Avatar from './Avatar';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function LeftSidebar({ privateRooms, activeRoom, onSelectRoom, onSelectGeneral, pendingRequests, onAcceptRequest, onRejectRequest }) {
  const { user, logout, updateUser } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [editMode, setEditMode]       = useState(false);
  const [profileForm, setProfileForm] = useState({ username: user?.username || '', bio: user?.bio || '', avatar: user?.avatar || '' });
  const [saving, setSaving]           = useState(false);
  const [activeTab, setActiveTab]     = useState('chats');

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await axios.put('/api/auth/profile', profileForm);
      updateUser(data.user);
      toast.success('Profile updated!');
      setEditMode(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const getOtherParticipant = (room) =>
    room.participants?.find(p => p._id !== user?._id) || room.participants?.[0];

  const incomingRequests = pendingRequests?.filter(r => r.requestedBy?._id !== user?._id) || [];

  return (
    <div className="flex flex-col h-full glass neon-border" style={{ borderRight: '1px solid rgba(6,182,212,0.1)' }}>
      {/* Profile section */}
      <div className="p-4 border-b border-slate-800/60">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setShowProfile(!showProfile)}>
          <Avatar user={user} size="md" showStatus />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm truncate" style={{ fontFamily: 'Syne,sans-serif' }}>{user?.username}</p>
            <p className="text-xs text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" style={{ boxShadow: '0 0 4px rgba(52,211,153,0.6)' }} />
              Online
            </p>
          </div>
          <button onClick={e => { e.stopPropagation(); logout(); }}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
            title="Logout">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>

        {showProfile && (
          <div className="mt-3 animate-fade-in">
            {editMode ? (
              <div className="space-y-2">
                <input className="input-field text-sm py-2" placeholder="Username" value={profileForm.username} onChange={e => setProfileForm({ ...profileForm, username: e.target.value })} />
                <textarea className="input-field text-sm py-2 resize-none" rows={2} placeholder="Bio (optional)" value={profileForm.bio} onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })} />
                <input className="input-field text-sm py-2" placeholder="Avatar URL (optional)" value={profileForm.avatar} onChange={e => setProfileForm({ ...profileForm, avatar: e.target.value })} />
                <div className="flex gap-2">
                  <button onClick={handleSaveProfile} disabled={saving} className="flex-1 text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold py-1.5 rounded-lg transition-all">
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => setEditMode(false)} className="flex-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded-lg transition-all">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {user?.bio && <p className="text-xs text-slate-400 italic">"{user.bio}"</p>}
                <p className="text-xs text-slate-500">{user?.email}</p>
                <button onClick={() => setEditMode(true)} className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800/60">
        {['chats', 'requests'].map(tab => (
          <button key={tab}
            className={`flex-1 py-2.5 text-xs font-semibold transition-all relative capitalize ${activeTab === tab ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
            style={{ fontFamily: 'Syne,sans-serif' }}
            onClick={() => setActiveTab(tab)}>
            {tab}
            {tab === 'requests' && incomingRequests.length > 0 && (
              <span className="absolute top-1 right-3 w-4 h-4 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center">
                {incomingRequests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'chats' ? (
          <div className="p-2 space-y-1">
            {/* General room */}
            <div className={`sidebar-item ${activeRoom === 'general' ? 'active' : ''}`} onClick={onSelectGeneral}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-teal-600 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-white truncate" style={{ fontFamily: 'Syne,sans-serif' }}>General Chat</p>
                <p className="text-xs text-slate-500 truncate">Everyone can join</p>
              </div>
            </div>

            {/* Private rooms */}
            {privateRooms?.filter(r => r.status === 'accepted').map(room => {
              const other = getOtherParticipant(room);
              return (
                <div key={room.roomId} className={`sidebar-item ${activeRoom === room.roomId ? 'active' : ''}`} onClick={() => onSelectRoom(room)}>
                  <Avatar user={other} size="md" showStatus />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-white truncate" style={{ fontFamily: 'Syne,sans-serif' }}>{other?.username || 'Unknown'}</p>
                    <p className="text-xs text-slate-500 truncate">{room.lastMessage?.content || 'Start chatting'}</p>
                  </div>
                  {!room.isPaid && room.messageCount >= 3 && (
                    <svg className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                </div>
              );
            })}

            {(!privateRooms || privateRooms.filter(r => r.status === 'accepted').length === 0) && (
              <p className="text-xs text-slate-600 text-center py-4 px-2">Click on an online user to start a private chat</p>
            )}
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {incomingRequests.length === 0
              ? <p className="text-xs text-slate-600 text-center py-8 px-2">No pending chat requests</p>
              : incomingRequests.map(room => (
                <div key={room.roomId} className="bg-slate-800/40 rounded-xl p-3 space-y-2 border border-slate-700/40">
                  <div className="flex items-center gap-2">
                    <Avatar user={room.requestedBy} size="sm" showStatus />
                    <div>
                      <p className="text-sm font-semibold text-white">{room.requestedBy?.username}</p>
                      <p className="text-xs text-slate-500">wants to chat</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => onAcceptRequest(room.roomId)}
                      className="flex-1 text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 py-1.5 rounded-lg transition-all font-semibold">
                      Accept
                    </button>
                    <button onClick={() => onRejectRequest(room.roomId)}
                      className="flex-1 text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 py-1.5 rounded-lg transition-all font-semibold">
                      Decline
                    </button>
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
}
