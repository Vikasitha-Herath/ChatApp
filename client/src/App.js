import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Login          from './pages/Login';
import Register       from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ChatPage       from './pages/ChatPage';
import './index.css';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center mesh-bg">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={
        <PrivateRoute>
          <SocketProvider>
            <ChatPage />
          </SocketProvider>
        </PrivateRoute>
      } />
      <Route path="/login"           element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register"        element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="*"                element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#e2e8f0',
              border: '1px solid rgba(6,182,212,0.2)',
              borderRadius: '12px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px'
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#1e293b' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#1e293b' } }
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
