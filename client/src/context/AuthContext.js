import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

// Set axios baseURL from env var (production) — local dev uses CRA proxy
const BASE_URL = process.env.REACT_APP_SERVER_URL || '';
if (BASE_URL) {
  axios.defaults.baseURL = BASE_URL;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken]   = useState(() => localStorage.getItem('chatapp_token'));

  // Sync token to axios headers
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      if (!token) { setLoading(false); return; }
      try {
        const { data } = await axios.get('/api/auth/me');
        if (data.success) setUser(data.user);
      } catch {
        localStorage.removeItem('chatapp_token');
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [token]);

  const login = useCallback((userData, authToken) => {
    localStorage.setItem('chatapp_token', authToken);
    setToken(authToken);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try { await axios.post('/api/auth/logout'); } catch {}
    localStorage.removeItem('chatapp_token');
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((u) => setUser(u), []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
