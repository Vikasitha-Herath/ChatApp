import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import PaymentModal from './PaymentModal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const FREE_LIMIT = 3;

export default function PrivateChat({ room, onRoomUpdate }) {
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState('');
  const [loading, setLoading]         = useState(true);
  const [roomData, setRoomData]       = useState(room);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showPayment, setShowPayment] = useState(false);
  const { socket } = useSocket();
  const { user }   = useAuth();
  const messagesEndRef   = useRef(null);
  const typingTimeoutRef = useRef(null);

  const otherUser = roomData?.participants?.find(p => p._id !== user?._id);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load messages
  useEffect(() => {
    if (!room?.roomId) return;
    setLoading(true);
    const load = async () => {
      try {
        const { data } = await axios.get(`/api/chat/private/${room.roomId}/messages`);
        setMessages(data.messages || []);
        setRoomData(data.room);
        setTimeout(scrollToBottom, 100);
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    load();
  }, [room?.roomId, scrollToBottom]);

  // Socket events
  useEffect(() => {
    if (!socket || !room?.roomId) return;

    socket.emit('joinPrivateRoom', { roomId: room.roomId });

    socket.on('newPrivateMessage', (msg) => {
      if (msg.room === room.roomId) {
        setMessages(prev => [...prev, msg]);
        setTimeout(scrollToBottom, 50);
      }
    });

    socket.on('messageLimitReached', ({ roomId }) => {
      if (roomId === room.roomId) setShowPayment(true);
    });

    socket.on('paymentRequired', ({ roomId }) => {
      if (roomId === room.roomId) setShowPayment(true);
    });

    socket.on('chatUnlocked', ({ roomId }) => {
      if (roomId === room.roomId) setRoomData(prev => ({ ...prev, isPaid: true }));
    });

    socket.on('roomUpdated', ({ roomId, lastMessage }) => {
      if (roomId === room.roomId) {
        setRoomData(prev => ({ ...prev, lastMessage }));
        onRoomUpdate?.();
      }
    });

    socket.on('userTyping', ({ username, isTyping, room: typingRoom }) => {
      if (typingRoom !== room.roomId) return;
      setTypingUsers(prev =>
        isTyping ? (prev.includes(username) ? prev : [...prev, username]) : prev.filter(u => u !== username)
      );
    });

    return () => {
      socket.off('newPrivateMessage');
      socket.off('messageLimitReached');
      socket.off('paymentRequired');
      socket.off('chatUnlocked');
      socket.off('roomUpdated');
      socket.off('userTyping');
    };
  }, [socket, room?.roomId, scrollToBottom, onRoomUpdate]);

  const handleTyping = () => {
    if (!socket) return;
    socket.emit('typing', { room: room.roomId, isTyping: true });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { room: room.roomId, isTyping: false });
    }, 1500);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;
    const currentCount = roomData?.messageCount || 0;
    if (!roomData?.isPaid && currentCount >= FREE_LIMIT) {
      setShowPayment(true);
      return;
    }
    socket.emit('privateMessage', { roomId: room.roomId, content: input.trim() });
    setRoomData(prev => ({ ...prev, messageCount: (prev?.messageCount || 0) + 1 }));
    socket.emit('typing', { room: room.roomId, isTyping: false });
    setInput('');
    clearTimeout(typingTimeoutRef.current);
  };

  const handlePaymentSuccess = async () => {
    try {
      await axios.post('/api/payment/confirm', {
        roomId: room.roomId,
        paymentIntentId: 'demo_' + Date.now()
      });
      setRoomData(prev => ({ ...prev, isPaid: true }));
      socket?.emit('paymentConfirmed', { roomId: room.roomId });
    } catch { /* silent */ }
  };

  const isConsecutive = (msgs, i) => {
    if (i === 0) return false;
    return msgs[i - 1].sender?._id === msgs[i].sender?._id &&
      new Date(msgs[i].createdAt) - new Date(msgs[i - 1].createdAt) < 60000;
  };

  const messageCount  = roomData?.messageCount || 0;
  const isPaid        = roomData?.isPaid || false;
  const remainingFree = Math.max(0, FREE_LIMIT - messageCount);
  const isLocked      = !isPaid && messageCount >= FREE_LIMIT;

  // Pending state
  if (roomData?.status === 'pending') {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Syne,sans-serif' }}>Request Pending</h3>
        <p className="text-slate-400 text-sm">
          Waiting for <strong className="text-white">{otherUser?.username}</strong> to accept your chat request
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 glass flex items-center gap-3" style={{ borderBottom: '1px solid rgba(6,182,212,0.1)' }}>
        <Avatar user={otherUser} size="md" showStatus />
        <div className="flex-1">
          <h2 className="font-bold text-white" style={{ fontFamily: 'Syne,sans-serif' }}>{otherUser?.username}</h2>
          <p className="text-xs text-slate-500">{otherUser?.isOnline ? <span className="text-emerald-400">● Online</span> : 'Offline'}</p>
        </div>
        {/* Lock badge */}
        {isPaid ? (
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
            <span className="text-xs text-emerald-400 font-semibold">Unlocked</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1">
            <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            <span className="text-xs text-amber-400 font-semibold">{remainingFree} free left</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Avatar user={otherUser} size="xl" />
            <p className="text-white font-bold mt-4" style={{ fontFamily: 'Syne,sans-serif' }}>{otherUser?.username}</p>
            <p className="text-slate-500 text-sm mt-1">Say hello! First {FREE_LIMIT} messages are free.</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isSelf = msg.sender?._id === user?._id;
            const consec = isConsecutive(messages, i);
            return (
              <div key={msg._id} className={`flex gap-3 animate-message ${isSelf ? 'flex-row-reverse' : ''} ${consec ? 'mt-0.5' : 'mt-3'}`}>
                {!consec ? <Avatar user={msg.sender} size="sm" /> : <div className="w-8 flex-shrink-0" />}
                <div className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} max-w-xs lg:max-w-md xl:max-w-lg`}>
                  {!consec && (
                    <div className={`flex items-baseline gap-2 mb-1 ${isSelf ? 'flex-row-reverse' : ''}`}>
                      <span className="text-xs font-semibold text-slate-300" style={{ fontFamily: 'Syne,sans-serif' }}>
                        {isSelf ? 'You' : msg.sender?.username}
                      </span>
                      <span className="text-xs text-slate-600">{format(new Date(msg.createdAt), 'h:mm a')}</span>
                    </div>
                  )}
                  <div className={isSelf ? 'message-bubble-self' : 'message-bubble-other'}>
                    <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 mt-2 animate-fade-in">
            <div className="message-bubble-other py-2 px-3">
              <div className="flex items-center gap-1.5">
                <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Locked banner */}
      {isLocked && (
        <div className="px-4 py-3 bg-amber-500/10 border-t border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            <span className="text-sm text-amber-400 font-medium">3 free messages used. Unlock to continue!</span>
          </div>
          <button onClick={() => setShowPayment(true)} className="text-xs bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-3 py-1.5 rounded-lg transition-all">
            Unlock $0.99
          </button>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-4 glass" style={{ borderTop: '1px solid rgba(6,182,212,0.1)' }}>
        <form onSubmit={sendMessage} className="flex items-center gap-3">
          <Avatar user={user} size="sm" />
          <div className="flex-1 relative">
            <input type="text"
              className={`input-field pr-12 py-2.5 text-sm ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
              placeholder={isLocked ? 'Unlock to send more messages...' : `Message ${otherUser?.username}...`}
              value={input}
              onChange={e => { setInput(e.target.value); handleTyping(); }}
              disabled={isLocked} maxLength={2000} />
            <button type="submit" disabled={!input.trim() || isLocked}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90">
              <svg className="w-4 h-4 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </form>
        {!isPaid && !isLocked && (
          <p className="text-xs text-slate-600 mt-1.5 text-center">
            {remainingFree} free message{remainingFree !== 1 ? 's' : ''} remaining · Unlock for $0.99
          </p>
        )}
      </div>

      {showPayment && (
        <PaymentModal roomId={room.roomId} onSuccess={handlePaymentSuccess} onClose={() => setShowPayment(false)} />
      )}
    </div>
  );
}
