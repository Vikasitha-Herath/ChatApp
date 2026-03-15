import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AdminAuthContext = createContext(null);
export const useAdminAuth = () => useContext(AdminAuthContext);

const BASE_URL = process.env.REACT_APP_SERVER_URL || '';
if (BASE_URL) axios.defaults.baseURL = BASE_URL;

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken]     = useState(() => localStorage.getItem('sync_admin_token'));

  useEffect(() => {
    if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    else delete axios.defaults.headers.common['Authorization'];
  }, [token]);

  useEffect(() => {
    const load = async () => {
      if (!token) { setLoading(false); return; }
      try {
        const { data } = await axios.get('/api/admin/auth/me');
        if (data.success) setAdmin(data.admin);
      } catch {
        localStorage.removeItem('sync_admin_token');
        setToken(null);
      } finally { setLoading(false); }
    };
    load();
  }, [token]);

  const loginAdmin = useCallback((adminData, authToken) => {
    localStorage.setItem('sync_admin_token', authToken);
    setToken(authToken);
    setAdmin(adminData);
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
  }, []);

  const logoutAdmin = useCallback(() => {
    localStorage.removeItem('sync_admin_token');
    setToken(null);
    setAdmin(null);
    delete axios.defaults.headers.common['Authorization'];
  }, []);

  return (
    <AdminAuthContext.Provider value={{ admin, token, loading, loginAdmin, logoutAdmin }}>
      {children}
    </AdminAuthContext.Provider>
  );
};