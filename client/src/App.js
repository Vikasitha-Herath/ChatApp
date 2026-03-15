import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth }           from './context/AuthContext';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { SocketProvider }                  from './context/SocketContext';
import Login          from './pages/Login';
import Register       from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ChatPage       from './pages/ChatPage';
import AdminLogin     from './pages/admin/AdminLogin';
import AdminSetup     from './pages/admin/AdminSetup';
import AdminLayout    from './components/admin/AdminLayout';
import Dashboard      from './pages/admin/Dashboard';
import Users          from './pages/admin/Users';
import UserDetail     from './pages/admin/UserDetail';
import Messages       from './pages/admin/Messages';
import Rooms          from './pages/admin/Rooms';
import Promotions     from './pages/admin/Promotions';
import Bundles        from './pages/admin/Bundles';
import Settings       from './pages/admin/Settings';
import Admins         from './pages/admin/Admins';
import './index.css';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="h-screen flex items-center justify-center mesh-bg">
      <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : children;
}

function AdminPrivateRoute({ children }) {
  const { admin, loading } = useAdminAuth();
  if (loading) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0a0f1e' }}>
      <div style={{ width:32, height:32, border:'2px solid #7c3aed', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  return admin ? children : <Navigate to="/admin/login" replace />;
}

function AdminPublicRoute({ children }) {
  const { admin, loading } = useAdminAuth();
  if (loading) return null;
  return admin ? <Navigate to="/admin" replace /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* User routes */}
      <Route path="/" element={<PrivateRoute><SocketProvider><ChatPage /></SocketProvider></PrivateRoute>} />
      <Route path="/login"           element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register"        element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

      {/* Admin routes */}
      <Route path="/admin/login" element={<AdminPublicRoute><AdminLogin /></AdminPublicRoute>} />
      <Route path="/admin/setup" element={<AdminSetup />} />
      <Route path="/admin" element={<AdminPrivateRoute><AdminLayout /></AdminPrivateRoute>}>
        <Route index             element={<Dashboard />} />
        <Route path="users"      element={<Users />} />
        <Route path="users/:id"  element={<UserDetail />} />
        <Route path="messages"   element={<Messages />} />
        <Route path="rooms"      element={<Rooms />} />
        <Route path="promotions" element={<Promotions />} />
        <Route path="bundles"    element={<Bundles />} />
        <Route path="settings"   element={<Settings />} />
        <Route path="admins"     element={<Admins />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AdminAuthProvider>
          <AppRoutes />
          <Toaster position="top-right" toastOptions={{
            style: { background:'#1e293b', color:'#e2e8f0', border:'1px solid rgba(124,58,237,0.2)', borderRadius:'12px', fontSize:'14px' },
            success: { iconTheme: { primary:'#10b981', secondary:'#1e293b' } },
            error:   { iconTheme: { primary:'#ef4444', secondary:'#1e293b' } }
          }} />
        </AdminAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}