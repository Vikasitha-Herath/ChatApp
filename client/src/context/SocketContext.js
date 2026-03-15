import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket]       = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setConnected(false);
        setOnlineUsers([]);
      }
      return;
    }

    // Use env var in production, fallback to same host in local dev
    const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';

    const newSocket = io(SERVER_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    newSocket.on('connect', () => {
      setConnected(true);
      console.log('✅ Socket connected');
    });

    newSocket.on('disconnect', (reason) => {
      setConnected(false);
      console.log('❌ Socket disconnected:', reason);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      setConnected(false);
    });

    newSocket.on('onlineUsers', (users) => {
      setOnlineUsers(users);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [token, user]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, connected }}>
      {children}
    </SocketContext.Provider>
  );
};
