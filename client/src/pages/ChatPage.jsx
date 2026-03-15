import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import LeftSidebar  from '../components/LeftSidebar';
import RightSidebar from '../components/RightSidebar';
import GeneralChat  from '../components/GeneralChat';
import PrivateChat  from '../components/PrivateChat';

export default function ChatPage() {
  const [activeRoom, setActiveRoom]       = useState('general');
  const [activeRoomData, setActiveRoomData] = useState(null);
  const [privateRooms, setPrivateRooms]   = useState([]);
  const [loadingRooms, setLoadingRooms]   = useState(true);
  const { socket, connected } = useSocket();
  const { user } = useAuth();

  const loadPrivateRooms = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/chat/private/rooms');
      setPrivateRooms(data.rooms || []);
    } catch (err) {
      console.error('Failed to load rooms');
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  useEffect(() => { loadPrivateRooms(); }, [loadPrivateRooms]);

  // Socket events for chat requests
  useEffect(() => {
    if (!socket) return;

    socket.on('chatRequest', ({ room }) => {
      toast((t) => (
        <div className="flex items-center gap-3">
          <span className="text-sm">
            <strong>{room.requestedBy?.username}</strong> wants to chat with you
          </span>
          <button onClick={() => toast.dismiss(t.id)}
            className="text-xs bg-cyan-500 text-slate-900 px-2 py-1 rounded font-bold">
            View
          </button>
        </div>
      ), { duration: 6000 });
      loadPrivateRooms();
    });

    socket.on('chatRequestUpdated', ({ room, action }) => {
      loadPrivateRooms();
      if (action === 'accept' && activeRoomData?.roomId === room.roomId) {
        setActiveRoomData(room);
      }
    });

    return () => {
      socket.off('chatRequest');
      socket.off('chatRequestUpdated');
    };
  }, [socket, loadPrivateRooms, activeRoomData]);

  const handleSelectRoom = (room) => {
    setActiveRoom(room.roomId);
    setActiveRoomData(room);
  };

  const handleSelectGeneral = () => {
    setActiveRoom('general');
    setActiveRoomData(null);
  };

  const handleStartPrivateChat = (room, isNew = false) => {
    loadPrivateRooms();
    if (room.status === 'accepted') {
      handleSelectRoom(room);
    } else {
      if (isNew) toast.success('Chat request sent! Waiting for acceptance.');
    }
    if (socket) {
      const other = room.participants?.find(p => p._id !== user?._id);
      if (other && isNew) {
        socket.emit('chatRequestSent', { roomId: room.roomId, targetUserId: other._id });
      }
    }
  };

  const handleAcceptRequest = async (roomId) => {
    try {
      const { data } = await axios.put('/api/chat/private/respond', { roomId, action: 'accept' });
      toast.success('Chat request accepted!');
      socket?.emit('chatRequestResponse', { roomId, action: 'accept' });
      loadPrivateRooms();
      handleSelectRoom(data.room);
    } catch {
      toast.error('Failed to accept request');
    }
  };

  const handleRejectRequest = async (roomId) => {
    try {
      await axios.put('/api/chat/private/respond', { roomId, action: 'reject' });
      toast.success('Request declined');
      socket?.emit('chatRequestResponse', { roomId, action: 'reject' });
      loadPrivateRooms();
    } catch {
      toast.error('Failed to decline request');
    }
  };

  const pendingRequests = privateRooms.filter(r => r.status === 'pending');

  return (
    <div className="h-screen mesh-bg flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 glass" style={{ borderBottom: '1px solid rgba(6,182,212,0.1)', zIndex: 10 }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <span className="font-black text-white text-lg" style={{ fontFamily: 'Syne,sans-serif' }}>ChatApp</span>
        </div>

        <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${connected ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
          {connected ? 'Connected' : 'Connecting...'}
        </div>
      </div>

      {/* Main 3-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div className="w-64 xl:w-72 flex-shrink-0 overflow-hidden">
          <LeftSidebar
            privateRooms={privateRooms}
            activeRoom={activeRoom}
            onSelectRoom={handleSelectRoom}
            onSelectGeneral={handleSelectGeneral}
            pendingRequests={pendingRequests}
            onAcceptRequest={handleAcceptRequest}
            onRejectRequest={handleRejectRequest}
          />
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-hidden border-x border-slate-800/40">
          {activeRoom === 'general'
            ? <GeneralChat />
            : activeRoomData
              ? <PrivateChat room={activeRoomData} onRoomUpdate={loadPrivateRooms} />
              : null
          }
        </div>

        {/* Right sidebar */}
        <div className="w-56 xl:w-64 flex-shrink-0 overflow-hidden">
          <RightSidebar
            onStartPrivateChat={handleStartPrivateChat}
            existingRooms={privateRooms}
          />
        </div>
      </div>
    </div>
  );
}
