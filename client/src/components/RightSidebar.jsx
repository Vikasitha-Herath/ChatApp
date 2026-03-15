import React, { useState } from 'react';
import Avatar from './Avatar';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function RightSidebar({ onStartPrivateChat, existingRooms }) {
  const { onlineUsers } = useSocket();
  const { user } = useAuth();
  const [requesting, setRequesting] = useState(null);

  const handleStartChat = async (targetUser) => {
    const existingRoom = existingRooms?.find(r => r.participants.some(p => p._id === targetUser.userId));
    if (existingRoom?.status === 'accepted') { onStartPrivateChat(existingRoom); return; }
    setRequesting(targetUser.userId);
    try {
      const { data } = await axios.post('/api/chat/private/request', { targetUserId: targetUser.userId });
      toast.success(`Sync request sent to ${targetUser.username}!`);
      onStartPrivateChat(data.room, true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    } finally { setRequesting(null); }
  };

  const getRoomStatus = (targetUserId) =>
    existingRooms?.find(r => r.participants.some(p => p._id === targetUserId))?.status;

  const otherOnline = onlineUsers.filter(u => u.userId !== user?._id);

  return (
    <div className="flex flex-col h-full"
      style={{ background: 'rgba(15,23,42,0.85)', borderLeft: '1px solid rgba(124,58,237,0.1)' }}>

      {/* Header */}
      <div className="p-4 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.8)' }} />
          <h2 className="font-bold text-white text-sm" style={{ fontFamily: 'Syne,sans-serif' }}>Online Now</h2>
          <span className="ml-auto bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-semibold border border-emerald-500/20">
            {otherOnline.length + 1}
          </span>
        </div>
      </div>

      {/* Users list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {otherOnline.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-slate-600 text-xs">No one else online</p>
          </div>
        ) : (
          otherOnline.map(onlineUser => {
            const roomStatus = getRoomStatus(onlineUser.userId);
            const isPending  = roomStatus === 'pending';
            const isAccepted = roomStatus === 'accepted';
            const isLoading  = requesting === onlineUser.userId;
            return (
              <div key={onlineUser.userId}
                className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800/50 transition-all duration-200">
                <Avatar user={{ username: onlineUser.username, avatar: onlineUser.avatar, isOnline: true }} size="sm" showStatus />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{onlineUser.username}</p>
                  {onlineUser.bio && <p className="text-xs text-slate-500 truncate">{onlineUser.bio}</p>}
                </div>
                <button onClick={() => handleStartChat(onlineUser)} disabled={isLoading || isPending}
                  className={`opacity-0 group-hover:opacity-100 flex-shrink-0 p-1.5 rounded-lg transition-all duration-200 ${
                    isAccepted ? 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 border border-violet-500/20'
                    : isPending ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20 cursor-default'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
                  }`}
                  title={isAccepted ? 'Open chat' : isPending ? 'Request pending' : 'Start sync'}>
                  {isLoading
                    ? <div className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
                    : isAccepted
                      ? <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                      : isPending
                        ? <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        : <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  }
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Stats footer */}
      <div className="p-4 border-t border-slate-800/60">
        <div className="bg-slate-900/60 rounded-xl p-3 space-y-2">
          <p className="text-xs font-semibold text-slate-400" style={{ fontFamily: 'Syne,sans-serif' }}>Sync Stats</p>
          <div className="flex justify-between text-xs"><span className="text-slate-500">Online now</span><span className="text-emerald-400 font-semibold">{otherOnline.length + 1}</span></div>
          <div className="flex justify-between text-xs"><span className="text-slate-500">Free messages</span><span className="text-violet-400 font-semibold">3 per chat</span></div>
          <div className="flex justify-between text-xs"><span className="text-slate-500">Unlock price</span><span className="text-amber-400 font-semibold">$0.99</span></div>
        </div>
      </div>
    </div>
  );
}