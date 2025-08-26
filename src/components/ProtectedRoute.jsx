// src/components/ProtectedRoute.jsx  (keep this one)
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;                 // AuthProvider shows the boot screen
  return user ? children : <Navigate to="/login" replace />;
}
