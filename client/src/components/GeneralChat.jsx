import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import { format } from 'date-fns';

export default function GeneralChat() {
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState('');
  const [loading, setLoading]         = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const { socket } = useSocket();
  const { user }   = useAuth();
  const messagesEndRef  = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load history
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axios.get('/api/chat/general/messages?limit=50');
        setMessages(data.messages || []);
        setTimeout(scrollToBottom, 100);
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    load();
  }, [scrollToBottom]);

  // Socket events
  useEffect(() => {
    if (!socket) return;

    socket.on('newGeneralMessage', (msg) => {
      setMessages(prev => [...prev, msg]);
      setTimeout(scrollToBottom, 50);
    });

    socket.on('userTyping', ({ username, isTyping, room }) => {
      if (room !== 'general') return;
      setTypingUsers(prev =>
        isTyping ? (prev.includes(username) ? prev : [...prev, username]) : prev.filter(u => u !== username)
      );
    });

    return () => {
      socket.off('newGeneralMessage');
      socket.off('userTyping');
    };
  }, [socket, scrollToBottom]);

  const handleTyping = () => {
    if (!socket) return;
    socket.emit('typing', { room: 'general', isTyping: true });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { room: 'general', isTyping: false });
    }, 1500);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;
    socket.emit('generalMessage', { content: input.trim() });
    socket.emit('typing', { room: 'general', isTyping: false });
    setInput('');
    clearTimeout(typingTimeoutRef.current);
  };

  const isConsecutive = (msgs, i) => {
    if (i === 0) return false;
    return msgs[i - 1].sender?._id === msgs[i].sender?._id &&
      new Date(msgs[i].createdAt) - new Date(msgs[i - 1].createdAt) < 60000;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 glass flex items-center gap-3" style={{ borderBottom: '1px solid rgba(6,182,212,0.1)' }}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-teal-600 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <h2 className="font-bold text-white" style={{ fontFamily: 'Syne,sans-serif' }}>General Chat</h2>
          <p className="text-xs text-slate-500">Open to everyone · Messages are public</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-slate-400 font-medium">Be the first to say hi!</p>
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
                <span className="text-xs text-slate-400 ml-1">
                  {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-4 glass" style={{ borderTop: '1px solid rgba(6,182,212,0.1)' }}>
        <form onSubmit={sendMessage} className="flex items-center gap-3">
          <Avatar user={user} size="sm" />
          <div className="flex-1 relative">
            <input type="text" className="input-field pr-12 py-2.5 text-sm"
              placeholder="Message everyone..." value={input}
              onChange={e => { setInput(e.target.value); handleTyping(); }} maxLength={2000} />
            <button type="submit" disabled={!input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90">
              <svg className="w-4 h-4 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
